import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { checkQuota } from '../_shared/quota.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { logAudit } from '../_shared/audit.ts';
import { TIER_AI_MODELS, buildAIRequest, parseAIResponse, resolveChatModel } from '../_shared/aiLimits.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RequestSchema = z.object({
  blueprintId: z.string().uuid(),
});

const SYSTEM_PROMPT = `You are ARIA — ASORIA's senior architect AI. Your task is to refine rough sketch floor plans into proper, professional architectural drawings that follow real-world building standards and conventions.

## SCALE
- 1 unit = 1 metre everywhere
- All dimensions must be realistic for actual residential use
- Minimum room sizes must comply with building standards

## ROOM MINIMUMS (UK/International standards)
- Master bedroom: 12m² (queen bed + wardrobe + circulation)
- Standard bedroom: 9m² (single bed minimum)
- Small bedroom: 7.5m² (UK minimum for a habitable room)
- Bathroom: 2.5m² minimum; 4m² standard
- Kitchen: 10m² (work surface + appliances)
- Living room: 15m²
- Dining area: 10m² (table for 4-6)
- Single garage: 15m² (standard vehicle + storage)

## DOOR SYMBOLS
- Draw a 90° arc from the hinge point (door swing arc)
- The arc radius equals the door width
- Door leaf line drawn from hinge point perpendicular to the door opening
- Standard door width: 80cm | Accessibility: 90cm | Main entry: 100cm

## WINDOW SYMBOLS
- 4 parallel lines: 2 on the wall centerline offset + 2 offset by parallel gap
- Window gap: 8cm from wall centerline
- Never place windows on interior walls

## WALL LINE WEIGHTS
- Exterior/perimeter walls: THICK (6px at standard scale)
- Interior partition walls: THIN (2px at standard scale)
- Selected walls: 4px with accent colour

## DIMENSION ANNOTATION STYLE
- Extension lines with perpendicular tick marks (NOT arrowheads)
- Dimension text in monospace below the dimension line
- Room labels in lower-right of room bounding box
- Format: "RoomName (X.Xm²)" — area on second line

## ROOM LABEL PLACEMENT
- Room name + area in lower-right corner of each room's bounding box
- NOT centred — shifted to lower-right with offset (0.35m right, 0.25m down)

## FURNITURE
- All furniture outlined (not filled) for clarity
- Furniture stays within room bounds with clearance margins

## WHAT TO OUTPUT
Return a refined BlueprintData JSON object that:
1. Classifies walls correctly: perimeter/outer walls are THICK, interior partitions are THIN
2. Adds proper door arc symbols (90° arc at hinge) and window parallel-line notation
3. Labels rooms with correct names and realistic areas in lower-right of bounding boxes
4. Adds dimension tick marks with wall length annotations in monospace font
5. Ensures all rooms meet minimum size standards
6. Places windows only on exterior walls
7. Adds a north arrow (compass rose) in the lower-right corner of the plan
8. Uses minor grid (0.5m) and major grid (2m) lines in the background

CRITICAL: Output only valid JSON. No markdown, no explanation, no code fences.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = await getAuthUser(req);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Rate limit + quota check
  const allowed = await checkRateLimit(`ai-sketch-refine:${userId}`, 10, 3600);
  if (!allowed) return Errors.rateLimited('Sketch refinement rate limit exceeded — try again later');

  // Determine quota type and model based on user tier
  const { data: tierData } = await supabase.rpc('get_user_tier', { user_id: userId });
  const tier = (tierData as string) ?? 'starter';

  let quotaType: 'ai_edit' | 'ai_chat';
  let model: string | null;
  let todayMessageCount = 0;

  if (tier === 'pro') {
    quotaType = 'ai_edit';
    model = TIER_AI_MODELS.pro.refine;
  } else if (tier === 'architect') {
    quotaType = 'ai_chat';
    // Get today's message count for soft-cap degradation
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
    todayMessageCount = count ?? 0;
    const resolved = resolveChatModel(tier, todayMessageCount);
    model = resolved.model;
  } else {
    return Errors.forbidden('Sketch refinement requires a Pro or Architect subscription');
  }

  const quotaResult = await checkQuota(userId, quotaType);
  if (!quotaResult) {
    return Errors.quotaExceeded('Monthly quota exceeded');
  }

  // Parse and validate input
  const body = await req.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Errors.badRequest('Invalid request body');
  }
  const { blueprintId } = parsed.data;

  // Fetch the existing blueprint
  const { data: blueprint, error: bpError } = await supabase
    .from('blueprints')
    .select('*')
    .eq('id', blueprintId)
    .maybeSingle();

  if (bpError || !blueprint) {
    return Errors.notFound('Blueprint not found');
  }

  // Build a concise description of the current floor plan for the AI
  const currentPlan = buildFloorPlanSummary(blueprint);

  const userPrompt = `Refine this sketch into a professional architectural floor plan following all conventions described above.\n\n${currentPlan}`;

  const aiConfig = buildAIRequest(
    model!,
    SYSTEM_PROMPT,
    [{ role: 'user', content: userPrompt }],
    4000,
  );

  let aiResponse: string;
  try {
    const aiRes = await fetch(aiConfig.url, {
      method: 'POST',
      headers: aiConfig.headers,
      body: JSON.stringify(aiConfig.body),
    });
    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      console.error('AI API error:', errBody);
      throw new Error(`AI API error: ${aiRes.status}`);
    }
    const parsedRes = await aiRes.json();
    const { content } = parseAIResponse(aiConfig.provider, parsedRes);
    aiResponse = content;
  } catch (err) {
    console.error('AI sketch refine failed:', err);
    return Errors.internal('AI refinement failed');
  }

  // Parse the AI response as BlueprintData
  let refinedBlueprint: Record<string, unknown>;
  try {
    // The AI response might have markdown fences — strip them
    const cleaned = aiResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    refinedBlueprint = JSON.parse(cleaned);
  } catch {
    return Errors.internal('AI returned invalid JSON');
  }

  // Update the blueprint in DB
  const { error: updateError } = await supabase
    .from('blueprints')
    .update({
      data: refinedBlueprint,
      updated_at: new Date().toISOString(),
    })
    .eq('id', blueprintId);

  if (updateError) {
    return Errors.internal('Failed to save refined blueprint');
  }

  await logAudit({
    user_id: userId,
    action: 'sketch_refine',
    resource_id: blueprintId,
    metadata: { model, tier },
  });

  return new Response(
    JSON.stringify({ refined: refinedBlueprint }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});

function buildFloorPlanSummary(blueprint: Record<string, unknown>): string {
  const floors = (blueprint.data as Record<string, unknown>)?.floors as Array<Record<string, unknown>> ?? [];
  const rooms = floors.flatMap((f) => (f.rooms as Array<Record<string, unknown>>) ?? []);
  const walls = floors.flatMap((f) => (f.walls as Array<Record<string, unknown>>) ?? []);

  const roomList = rooms.map((r) => {
    const area = (r.area as number)?.toFixed(1) ?? '?';
    const name = (r.name as string) ?? 'Unknown';
    const roomType = (r.type as string) ?? 'unknown';
    return `- ${name} (${area}m², type: ${roomType})`;
  }).join('\n');

  const wallCount = walls.length;

  return `FLOOR PLAN SUMMARY:
- Total rooms: ${rooms.length}
- Total walls: ${wallCount}
${roomList || '(no rooms defined yet)'}
`;
}
