import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  prompt: z.string().min(3).max(1000),
  buildingType: z.enum(['house', 'apartment', 'office', 'studio', 'villa']),
  style: z.string().optional(),
  roomCount: z.number().int().min(1).max(20).optional(),
});

const SYSTEM_PROMPT = `You are an expert architectural design AI. Your role is to generate complete, accurate floor plans from user descriptions.

BUILDING CODE MINIMUMS (always enforce):
- Bedroom: minimum 2.8m × 3.0m
- Bathroom: minimum 1.5m × 2.0m
- Kitchen: minimum 2.4m wide
- Hallway: minimum 0.9m wide
- Ceiling height: minimum 2.4m
- Door width: minimum 0.8m
- Wall thickness: 0.2m standard

OUTPUT FORMAT: Return ONLY valid JSON matching this exact TypeScript interface. No markdown, no explanation:

interface BlueprintData {
  id: string; // UUID
  version: number; // 1
  metadata: {
    style: string;
    buildingType: string;
    totalArea: number;
    roomCount: number;
    generatedFrom: string;
    enrichedPrompt: string;
  };
  walls: Array<{
    id: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
    thickness: number;
    height: number;
  }>;
  rooms: Array<{
    id: string;
    name: string;
    type: string;
    wallIds: string[];
    floorMaterial: string;
    ceilingHeight: number;
    area: number;
    centroid: { x: number; y: number };
  }>;
  openings: Array<{
    id: string;
    wallId: string;
    type: string;
    position: number;
    width: number;
    height: number;
    sillHeight: number;
  }>;
  furniture: Array<{
    id: string;
    name: string;
    roomId: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    dimensions: { x: number; y: number; z: number };
    procedural: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

RULES:
- All coordinates in metres. (0,0) is bottom-left of building
- Walls form closed rooms. Every room must be fully enclosed
- Generate realistic room sizes and proportions
- Include appropriate furniture for each room type
- Style the building according to the requested architectural style
- Add windows on exterior walls, doors between rooms`;

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const user = await getAuthUser(req);
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

    // Rate limit: 10 AI requests per hour
    const rateLimitOk = await checkRateLimit(`ai:${user.id}`, 10, 3600);
    if (!rateLimitOk) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.', code: 'RATE_LIMITED' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Quota check (atomic, race-condition safe)
    const quotaOk = await checkQuota(user.id, 'ai_generation');
    if (!quotaOk) {
      return new Response(JSON.stringify({ error: 'Monthly AI generation quota reached.', code: 'QUOTA_EXCEEDED' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.issues }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, buildingType, style, roomCount } = parsed.data;

    const userMessage = `Design a ${buildingType} with the following description: "${prompt}"
${style ? `Architectural style: ${style}` : ''}
${roomCount ? `Target room count: ${roomCount}` : ''}

Generate a complete, realistic floor plan with proper room sizes, realistic furniture placement, and appropriate openings.`;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const rawText = claudeData.content[0]?.text ?? '';

    let blueprintData: unknown;
    try {
      blueprintData = JSON.parse(rawText);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Claude returned invalid JSON');
      blueprintData = JSON.parse(jsonMatch[0]);
    }

    // Log to ai_generations table
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await supabase.from('ai_generations').insert({
      user_id: user.id,
      prompt,
      type: 'floor_plan',
      model: 'claude-sonnet-4-6',
    });

    return new Response(JSON.stringify({ blueprint: blueprintData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI generate error:', error);
    return new Response(JSON.stringify({ error: 'Generation failed', message: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
