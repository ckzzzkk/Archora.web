import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { logAudit } from '../_shared/audit.ts';
import { Errors } from '../_shared/errors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  prompt: z.string().max(2000).optional().default(''),
  buildingType: z.enum(['house', 'apartment', 'office', 'studio', 'villa', 'commercial']),
  style: z.string().optional(),
  roomCount: z.number().int().min(1).max(20).optional(),
  plotSize: z.number().positive().optional(),
  plotUnit: z.enum(['m2', 'ft2']).optional().default('m2'),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  livingAreas: z.number().int().min(0).max(10).optional(),
  hasGarage: z.boolean().optional(),
  hasGarden: z.boolean().optional(),
  hasPool: z.boolean().optional(),
  poolSize: z.enum(['small', 'medium', 'large']).optional(),
  hasHomeOffice: z.boolean().optional(),
  hasUtilityRoom: z.boolean().optional(),
  referenceImageUrl: z.string().url().optional(),
  additionalNotes: z.string().max(500).optional(),
  transcript: z.string().max(2000).optional(),
});

const SYSTEM_PROMPT = `You are an expert architectural design AI. Your role is to generate complete, accurate floor plans from user descriptions.

ARCHITECTURAL KNOWLEDGE BASE:
- Building code minimums: bedroom min 9m², master 12m², bathroom 4m², kitchen 10m², living 15m²
- Ceiling height: 2.4m minimum, 2.7m standard
- Passage width: 0.9m minimum doorways, 1.2m hallways
- Structural: load-bearing walls on exterior perimeter, interior load-bearing walls every 4-6m span
- Room placement: bedrooms away from street-facing walls, kitchen adjacent to dining, bathrooms accessible from bedrooms, living room toward garden/best light
- Windows on exterior walls only, never on interior walls
- Doors centred on walls where possible
- Self-alignment: all walls snap to 0.5m grid, rooms must not overlap, minimum room dimensions respected
- Outdoor elements: when hasGarden=true generate lawn area, garden beds, boundary; when hasPool=true add pool with decking; when hasGarage=true add driveway and garage
- Services: mark electrical sockets every 3m on walls, water outlets near kitchen/bathrooms, light fitting at room centre
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
- Add windows on exterior walls, doors between rooms
- Output only valid JSON matching the BlueprintData schema`;

/** Adds CORS headers to any Response returned by Errors.* helpers. */
function addCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const user = await getAuthUser(req);

    // Rate limit: 10 AI requests per hour
    const rateLimitOk = await checkRateLimit(`ai:${user.id}`, 10, 3600);
    if (!rateLimitOk) {
      return addCors(Errors.rateLimited('Rate limit exceeded. Try again later.'));
    }

    // Quota check (atomic, race-condition safe)
    const quotaOk = await checkQuota(user.id, 'ai_generation');
    if (!quotaOk) {
      return addCors(Errors.quotaExceeded('Monthly AI generation quota reached.'));
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return addCors(Errors.validation('Invalid request', parsed.error.issues));
    }

    const {
      prompt, buildingType, style, roomCount,
      plotSize, plotUnit, bedrooms, bathrooms, livingAreas,
      hasGarage, hasGarden, hasPool, poolSize,
      hasHomeOffice, hasUtilityRoom, referenceImageUrl, additionalNotes, transcript,
    } = parsed.data;

    const details: string[] = [];
    if (plotSize) details.push(`Plot size: ${plotSize} ${plotUnit === 'ft2' ? 'ft²' : 'm²'}`);
    if (bedrooms != null) details.push(`Bedrooms: ${bedrooms}`);
    if (bathrooms != null) details.push(`Bathrooms: ${bathrooms}`);
    if (livingAreas != null) details.push(`Living areas: ${livingAreas}`);
    if (hasGarage) details.push('Include garage with driveway');
    if (hasGarden) details.push('Include garden/lawn area with boundary');
    if (hasPool) details.push(`Include ${poolSize ?? 'medium'} swimming pool with decking`);
    if (hasHomeOffice) details.push('Include home office');
    if (hasUtilityRoom) details.push('Include utility/laundry room');
    if (style) details.push(`Architectural style: ${style}`);
    if (roomCount) details.push(`Target room count: ${roomCount}`);

    const combinedNotes = [prompt, additionalNotes, transcript].filter(Boolean).join('\n');

    let userMessage = `Design a ${buildingType} with the following specifications:
${details.join('\n')}
${combinedNotes ? `\nAdditional notes from the user:\n${combinedNotes}` : ''}

Generate a complete, realistic floor plan with proper room sizes, realistic furniture placement, and appropriate openings.`;

    if (referenceImageUrl) {
      userMessage += `\n\nReference image URL for style/layout inspiration: ${referenceImageUrl}`;
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      // AI_NOT_CONFIGURED is a custom code not in Errors.* — kept as direct response
      return new Response(JSON.stringify({
        error: 'AI_NOT_CONFIGURED',
        message: 'AI generation coming soon — API key not yet configured',
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const startMs = Date.now();
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
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const rawText = claudeData.content[0]?.text ?? '';

    let blueprintData: unknown;
    try {
      blueprintData = JSON.parse(rawText);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return addCors(Errors.upstream('AI returned invalid JSON'));
      }
      try {
        blueprintData = JSON.parse(jsonMatch[0]);
      } catch {
        return addCors(Errors.upstream('AI returned invalid JSON'));
      }
    }

    // Log to ai_generations table
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await supabase.from('ai_generations').insert({
      user_id: user.id,
      prompt,
      generation_type: 'floor_plan',
      model:           'claude-sonnet-4-6',
      input_tokens:    claudeData.usage?.input_tokens  ?? null,
      output_tokens:   claudeData.usage?.output_tokens ?? null,
      duration_ms:     Date.now() - startMs,
      status:          'complete',
      result_data:     blueprintData as Record<string, unknown>,
    });

    await logAudit({
      user_id: user.id,
      action: 'ai_generate',
      resource_type: 'blueprint',
      metadata: { buildingType, style, tier: user.app_metadata?.subscription_tier ?? 'starter' },
    });

    return new Response(JSON.stringify({ blueprint: blueprintData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI generate error:', error);
    return addCors(Errors.internal('Generation failed'));
  }
});
