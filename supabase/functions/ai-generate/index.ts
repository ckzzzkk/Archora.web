import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuth } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const requestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  buildingType: z.enum(['house', 'apartment', 'office', 'studio', 'villa']),
  style: z.string().min(1),
  roomCount: z.number().int().min(1).max(20).optional(),
});

const SYSTEM_PROMPT = `You are an expert architectural AI. Generate a valid BlueprintData JSON object based on the user's description.

BlueprintData structure:
{
  "metadata": {
    "buildingType": string,
    "style": string,
    "totalArea": number (m²),
    "floors": number
  },
  "floors": [
    {
      "id": string (uuid),
      "level": number (0 = ground),
      "name": string,
      "height": number (metres, default 2.7),
      "walls": [
        { "id": string, "start": {"x": number, "y": number}, "end": {"x": number, "y": number}, "thickness": number (default 0.2), "height": number }
      ],
      "rooms": [
        { "id": string, "name": string, "type": string, "color": string (hex), "area": number (m²), "centroid": {"x": number, "y": number}, "wallIds": string[] }
      ],
      "furniture": [],
      "dimensions": []
    }
  ]
}

Rules:
- All coordinates in metres (1 unit = 1 metre)
- Use realistic room sizes (bedroom 12-20m², kitchen 10-15m², etc.)
- Generate a coherent floor plan where walls form closed rooms
- Return ONLY valid JSON — no markdown, no prose`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { userId, supabase } = await requireAuth(req);
    await checkQuota(supabase, userId, 'ai_generation');

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const { prompt, buildingType, style, roomCount } = parsed.data;

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI_NOT_CONFIGURED', message: 'AI service not available' }),
        { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const userPrompt = [
      `Building type: ${buildingType}`,
      `Architectural style: ${style}`,
      roomCount ? `Target room count: ${roomCount}` : '',
      `Description: ${prompt}`,
    ].filter(Boolean).join('\n');

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[ai-generate] Claude API error:', errText);
      return new Response(
        JSON.stringify({ error: 'AI_FAILED', message: 'Generation failed' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const aiData = await aiResponse.json();
    const rawJson = aiData.content?.[0]?.text ?? '{}';

    let blueprint: unknown;
    try {
      blueprint = JSON.parse(rawJson);
    } catch {
      console.error('[ai-generate] Failed to parse Claude response as JSON');
      return new Response(
        JSON.stringify({ error: 'AI_PARSE_ERROR', message: 'Generation produced invalid output' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Log the generation
    await supabase.from('ai_generations').insert({
      user_id: userId,
      prompt,
      building_type: buildingType,
      style,
      success: true,
    });

    return new Response(JSON.stringify(blueprint), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[ai-generate] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
