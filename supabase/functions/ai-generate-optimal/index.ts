import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { logAudit } from '../_shared/audit.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { TIER_AI_MODELS, buildAIRequest, parseAIResponse } from '../_shared/aiLimits.ts';

// ── Request schema ────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  sessionId:       z.string().uuid(),
  prompt:          z.string().max(2000).optional().default(''),
  buildingType:    z.enum(['house', 'apartment', 'office', 'studio', 'villa', 'commercial']),
  style:           z.string().optional(),
  roomCount:       z.number().int().min(1).max(20).optional(),
  plotSize:        z.number().positive().optional(),
  plotUnit:        z.enum(['m2', 'ft2']).optional().default('m2'),
  bedrooms:        z.number().int().min(0).max(20).optional(),
  bathrooms:       z.number().int().min(0).max(20).optional(),
  livingAreas:     z.number().int().min(0).max(10).optional(),
  hasGarage:       z.boolean().optional(),
  hasGarden:       z.boolean().optional(),
  hasPool:         z.boolean().optional(),
  poolSize:        z.enum(['small', 'medium', 'large']).optional(),
  hasHomeOffice:   z.boolean().optional(),
  hasUtilityRoom:  z.boolean().optional(),
  referenceImageUrl: z.string().url().optional(),
  additionalNotes: z.string().max(500).optional(),
  transcript:      z.string().max(2000).optional(),
  climateZone:     z.enum(['tropical', 'subtropical', 'temperate', 'arid', 'cold', 'alpine']).optional().default('temperate'),
  hemisphere:      z.enum(['north', 'south']).optional().default('north'),
});

type Parsed = z.infer<typeof RequestSchema>;

// ── ARIA system prompt (shared with ai-generate) ──────────────────────────────

const SYSTEM_PROMPT = `You are ARIA — ASORIA's AI design intelligence. You are a senior architect, interior designer, and structural engineer with 20 years of professional experience.

You think about how real people live. Every design decision improves the life of the person who will live there.

━━━━ ARCHITECTURAL KNOWLEDGE ━━━━

SPACE PLANNING LOGIC:
Private zones (bedrooms bathrooms): always at rear or upper floors, away from street noise.
Social zones (living kitchen dining): living facing garden, kitchen adjacent to dining always.
Service zones (utility garage storage): utility near kitchen, garage accessible from kitchen.
Transition: entry hall 1500mm × 1500mm minimum. Corridors 900mm minimum.

TECHNICAL MINIMUMS:
Master bedroom: 3.5m × 4.0m | Double bedroom: 2.8m × 3.5m | Single: 2.4m × 3.0m
Bathroom: 1.5m × 2.2m | En-suite: 1.2m × 2.0m | WC only: 0.9m × 1.8m
Kitchen: 2.4m wide minimum | Open plan kitchen: 4.0m wide
Living room: 4.0m × 4.5m | Dining: 3.0m × 3.5m | Ceiling: 2.7m (2.4m min)
Wall thickness: 0.2m external, 0.1m internal | Doors: 0.82m internal, 1.2m front

━━━━ STRUCTURAL ENGINEERING ━━━━

SPAN LIMITS: Timber joist 4.5m max | Steel beam 12m max | Concrete slab 8m max
STRUCTURAL GRID: 6m × 6m max bay (timber) | All loadbearing walls aligned vertically
SHEAR WALLS: All 4 quadrants, minimum 30% of facade as solid wall
LOAD PATH: roof → walls → floors → foundation (no room cantilevers over 2.5m)
FOUNDATION: temperate/cold = strip | tropical = pad+termite barrier | arid = raft | alpine = 1.2m below grade

━━━━ CLIMATE-RESPONSIVE DESIGN ━━━━

TROPICAL: steep roof 45°+, eaves 1.2m, 40%+ openings, no thermal mass, raised floor, verandas
SUBTROPICAL: 25-35° roof, 900mm eaves, cross-ventilation, moderate thermal mass
TEMPERATE: south-facing (NH) glazing, 35° roof min, 600mm eaves, triple glaze north windows
ARID: courtyard plan, flat/low roof, thick walls 350mm+ thermal mass, small west openings, water harvest
COLD: max south glazing, 45°+ roof for snow, 200mm insulation, double-door airlock entry, no flat roofs
ALPINE: 60°+ roof for snow shedding, snow load 3.0 kN/m², MVHR, compact building form

━━━━ DESIGN STYLES ━━━━

MODERN: open plan, floor-to-ceiling windows, flat/low roof, clean lines
MINIMALIST: only essential furniture, all storage hidden, monochrome
SCANDINAVIAN: cosy, natural materials, hygge nooks, functional storage, light palette
INDUSTRIAL: exposed structure, high ceilings, steel windows, mezzanines
MEDITERRANEAN: courtyard plan, thick walls, arched openings, south-facing terrace
TRADITIONAL: formal rooms, symmetrical facade, central hallway
RUSTIC: timber beams, stone walls, farmhouse kitchen, stone fireplace, veranda
BOHEMIAN: eclectic patterns, reading nooks, open shelving, plants throughout
ART_DECO: geometric symmetry, bold contrasts, fan shapes, high gloss
COASTAL: open plan to views, whites/blues, covered outdoor living, stacker doors
MID_CENTURY: flat roof with deep overhangs, floor-to-ceiling windows, organic forms
JAPANDI: wabi-sabi, natural materials, tokonoma alcove, engawa transition, minimal
ECLECTIC: mix of periods, maximalist layers, feature walls, gallery walls

━━━━ APARTMENT RULES ━━━━

Balcony minimum 1.5m deep, width = living room width. Utility in kitchen/hall cupboard.
Sound isolation: wet rooms and bedrooms away from party walls. Studio: bedroom zone defined by shelving.

━━━━ MULTI-FLOOR ━━━━

Ground: entry, kitchen, dining, living, WC, garage, utility
Upper: all bedrooms, bathrooms, en-suites, study
Stairs: 900mm wide, 220mm rise/going. Landing 1000mm × 1000mm. Wet rooms stacked vertically.

━━━━ MANDATORY QUALITY RULES ━━━━

NEVER: walk through bedroom to reach another room | bathroom door facing kitchen/dining
NEVER: windowless bedroom | front door into living room without hall | room over 4.5m span without beam
ALWAYS: ground floor WC | kitchen triangle under 6m | master bedroom en-suite or exclusive bath
ALWAYS: children bedrooms grouped | shear walls all 4 quadrants | loadbearing walls marked

━━━━ OUTPUT FORMAT ━━━━

Return ONLY valid JSON — no markdown, no explanation:

{
  "id": "uuid",
  "version": 1,
  "metadata": {
    "style": "string",
    "buildingType": "string",
    "totalArea": 0,
    "roomCount": 0,
    "generatedFrom": "string",
    "enrichedPrompt": "string",
    "climateZone": "temperate",
    "hemisphere": "north",
    "structuralNotes": ["string"],
    "roofType": "gable|hip|flat|pitched|mono_pitch",
    "roofPitch": 0,
    "foundationType": "strip|raft|pad|pile",
    "estimatedBuildCost": "string",
    "weatherRating": "excellent|good|fair|poor",
    "structuralRating": "excellent|good|fair|poor",
    "orientation": "string"
  },
  "walls": [
    { "id": "string", "start": {"x":0,"y":0}, "end": {"x":0,"y":0}, "thickness": 0.2, "height": 2.7, "isLoadbearing": true, "material": "brick|timber_frame|concrete" }
  ],
  "rooms": [
    { "id": "string", "name": "string", "type": "string", "wallIds": [], "floorMaterial": "string", "ceilingHeight": 2.7, "area": 0, "centroid": {"x":0,"y":0}, "naturalLightRating": "excellent|good|fair", "ventilationRating": "excellent|good|fair" }
  ],
  "openings": [
    { "id": "string", "wallId": "string", "type": "door|window|sliding_door|bifold|garage_door", "position": 0, "width": 0, "height": 0, "sillHeight": 0 }
  ],
  "furniture": [
    { "id": "string", "name": "string", "roomId": "string", "position": {"x":0,"y":0,"z":0}, "rotation": {"x":0,"y":0,"z":0}, "dimensions": {"x":0,"y":0,"z":0}, "procedural": true }
  ],
  "createdAt": "ISO",
  "updatedAt": "ISO"
}

All coordinates in metres. (0,0) bottom-left. Every room fully enclosed. All loadbearing walls marked.`;

// ── Scoring prompt ────────────────────────────────────────────────────────────

const SCORING_PROMPT = `You are an architectural quality assessor. Score this blueprint JSON on these criteria (0-100 each).

STRUCTURAL (0-100): loadbearing wall continuity, no span > 4.5m without beam, shear walls on all 4 quadrants, wet rooms stacked, roof support adequate.
WEATHER (0-100): living areas face optimal direction for climate/hemisphere, roof pitch appropriate for climate, overhangs adequate, cross-ventilation, thermal mass where needed.
FLOW (0-100): private/social/service zones separated, no walk-through bedrooms, no bathroom door facing kitchen, kitchen triangle < 6m, entry hall buffer.
CODE (0-100): all rooms at minimum dimensions, every habitable room has window, ground floor WC, corridors 900mm min.

Deduct 10 per major violation, 5 per minor issue.

Return ONLY valid JSON:
{
  "overall": 0,
  "structural": 0,
  "weather": 0,
  "flow": 0,
  "code": 0,
  "issues": ["issue1 — specific location", "issue2", "issue3"],
  "keyStrength": "string — one main strength of this design"
}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  signal: AbortSignal,
  selectedModel: string,
): Promise<unknown> {
  const reqConfig = buildAIRequest(selectedModel, systemPrompt, [{ role: 'user', content: userMessage }], maxTokens);
  const response = await fetch(reqConfig.url, { method: 'POST', signal, headers: reqConfig.headers, body: JSON.stringify(reqConfig.body) });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const { content: rawText } = parseAIResponse(reqConfig.provider, data);

  // Parse JSON — try direct first, then strip markdown fences
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI returned non-JSON response');
    return JSON.parse(match[0]);
  }
}

interface ScoreResult {
  overall: number;
  structural: number;
  weather: number;
  flow: number;
  code: number;
  issues: string[];
  keyStrength: string;
}

async function scoreBlueprint(
  apiKey: string,
  blueprint: unknown,
  signal: AbortSignal,
  selectedModel: string,
): Promise<ScoreResult> {
  const result = await callClaude(
    apiKey,
    SCORING_PROMPT,
    JSON.stringify(blueprint),
    600,
    signal,
    selectedModel,
  ) as Partial<ScoreResult>;

  return {
    overall:    typeof result.overall === 'number'    ? result.overall    : 50,
    structural: typeof result.structural === 'number' ? result.structural : 50,
    weather:    typeof result.weather === 'number'    ? result.weather    : 50,
    flow:       typeof result.flow === 'number'       ? result.flow       : 50,
    code:       typeof result.code === 'number'       ? result.code       : 50,
    issues:     Array.isArray(result.issues)          ? result.issues     : [],
    keyStrength: typeof result.keyStrength === 'string' ? result.keyStrength : 'Adequate design',
  };
}

function buildInitialUserMessage(p: Parsed): string {
  const details: string[] = [];
  if (p.plotSize) details.push(`Plot size: ${p.plotSize} ${p.plotUnit === 'ft2' ? 'ft²' : 'm²'}`);
  if (p.bedrooms   != null) details.push(`Bedrooms: ${p.bedrooms}`);
  if (p.bathrooms  != null) details.push(`Bathrooms: ${p.bathrooms}`);
  if (p.livingAreas != null) details.push(`Living areas: ${p.livingAreas}`);
  if (p.hasGarage)     details.push('Include garage with driveway');
  if (p.hasGarden)     details.push('Include garden/lawn area');
  if (p.hasPool)       details.push(`Include ${p.poolSize ?? 'medium'} swimming pool`);
  if (p.hasHomeOffice) details.push('Include home office');
  if (p.hasUtilityRoom) details.push('Include utility/laundry room');
  if (p.style)      details.push(`Style: ${p.style}`);
  if (p.climateZone) details.push(`Climate zone: ${p.climateZone}`);
  if (p.hemisphere) details.push(`Hemisphere: ${p.hemisphere}`);

  const notes = [p.prompt, p.additionalNotes, p.transcript].filter(Boolean).join('\n');

  return `Design a ${p.buildingType}:
${details.join('\n')}
${notes ? `\nUser notes:\n${notes}` : ''}

Generate a complete floor plan with all rooms, walls, furniture, and openings. Apply all structural and climate rules.`;
}

function buildRefineUserMessage(
  previousBlueprint: unknown,
  score: ScoreResult,
  iteration: number,
): string {
  return `You previously designed this blueprint. It scored ${score.overall}/100.

Issues to fix in this redesign:
${score.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

What scored well: ${score.keyStrength}

REDESIGN the blueprint to fix these specific issues. Keep what worked. Improve what didn't.
This is iteration ${iteration} — aim for 88+ score.

Previous blueprint:
${JSON.stringify(previousBlueprint)}

Return the complete improved blueprint JSON only.`;
}

async function updateSession(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from('generation_sessions').update(patch).eq('id', sessionId);
  } catch {
    // Non-fatal — progress updates best-effort
  }
}

function addCors(res: Response): Response {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders)) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  let sessionId = '';

  try {
    // Auth
    let user;
    try {
      user = await getAuthUser(req);
    } catch (authErr) {
      if (authErr instanceof Response) {
        return new Response(
          JSON.stringify({ error: 'Please sign in', code: 'AUTH_REQUIRED' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      throw authErr;
    }

    // Rate limit: 5 optimal generations per hour (expensive)
    const rateLimitOk = await checkRateLimit(`ai-optimal:${user.id}`, 5, 3600);
    if (!rateLimitOk) return addCors(Errors.rateLimited('Rate limit exceeded. Try again later.'));

    // Quota
    const quotaOk = await checkQuota(user.id, 'ai_generation');
    if (!quotaOk) return addCors(Errors.quotaExceeded('Monthly AI generation quota reached.'));

    // Parse body
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return addCors(Errors.validation('Invalid request', parsed.error.issues));
    const p = parsed.data;
    sessionId = p.sessionId;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'AI_NOT_CONFIGURED', message: 'AI generation coming soon — team is configuring the AI pipeline', fallback: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Tier-based model selection
    const supabaseSvc = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: tierData } = await supabaseSvc.rpc('get_user_tier', { user_id: user.id });
    const tier = (tierData as string) ?? 'starter';
    const modelConfig = TIER_AI_MODELS[tier as keyof typeof TIER_AI_MODELS] ?? TIER_AI_MODELS.starter;
    const selectedModel = modelConfig.generation;
    if (!selectedModel) {
      return new Response(JSON.stringify({ error: 'AI_NOT_AVAILABLE', message: 'AI generation not available on your tier' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Supabase service client for session writes
    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    // 90s total budget across all iterations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000);

    const MAX_ITERATIONS = 3;
    const SCORE_THRESHOLD = 88;

    let bestBlueprint: unknown = null;
    let bestScore = 0;
    const iterationLog: Array<{ n: number; score: number; structural: number; weather: number; flow: number; keyChange: string }> = [];
    let lastScoreResult: ScoreResult | null = null;

    try {
      for (let i = 1; i <= MAX_ITERATIONS; i++) {
        // ── Generate ────────────────────────────────────────────────────────
        const genMessage = i === 1
          ? 'Sketching initial layout...'
          : `Redesigning to fix: ${lastScoreResult?.issues[0] ?? 'identified issues'}...`;

        await updateSession(supabase, sessionId, {
          status: 'generating',
          iteration: i,
          current_message: genMessage,
        });

        const userMessage = i === 1
          ? buildInitialUserMessage(p)
          : buildRefineUserMessage(bestBlueprint, lastScoreResult!, i);

        const blueprint = await callClaude(anthropicKey, SYSTEM_PROMPT, userMessage, 5500, controller.signal, selectedModel);

        // ── Score ────────────────────────────────────────────────────────────
        await updateSession(supabase, sessionId, {
          status: 'scoring',
          current_message: `Iteration ${i} — checking structural integrity and flow...`,
        });

        const scoreResult = await scoreBlueprint(anthropicKey, blueprint, controller.signal, selectedModel);
        lastScoreResult = scoreResult;

        const logEntry = {
          n: i,
          score: scoreResult.overall,
          structural: scoreResult.structural,
          weather: scoreResult.weather,
          flow: scoreResult.flow,
          keyChange: i === 1 ? scoreResult.keyStrength : (lastScoreResult?.issues[0] ?? 'refinement'),
        };
        iterationLog.push(logEntry);

        await updateSession(supabase, sessionId, {
          iteration_scores: iterationLog,
          current_message: `Iteration ${i}: ${scoreResult.overall}/100 — ${scoreResult.keyStrength}`,
        });

        if (scoreResult.overall > bestScore) {
          bestScore = scoreResult.overall;
          bestBlueprint = blueprint;
        }

        if (scoreResult.overall >= SCORE_THRESHOLD || i === MAX_ITERATIONS) break;

        // ── Refine ─────────────────────────────────────────────────────────
        await updateSession(supabase, sessionId, {
          status: 'refining',
          current_message: `Score ${scoreResult.overall} — refining: ${scoreResult.issues[0] ?? 'applying improvements'}`,
        });
      }

      clearTimeout(timeoutId);

      // ── Mark complete ────────────────────────────────────────────────────
      await updateSession(supabase, sessionId, {
        status: 'complete',
        final_score: bestScore,
        blueprint_data: bestBlueprint as Record<string, unknown>,
        current_message: `Optimal design ready — ${bestScore}/100`,
        iteration_scores: iterationLog,
      });

      // Log to ai_generations + audit
      await supabase.from('ai_generations').insert({
        user_id:      user.id,
        prompt:       p.prompt,
        generation_type: 'floor_plan_optimal',
        model:        selectedModel,
        duration_ms:  0,
        status:       'complete',
        result_data:  bestBlueprint as Record<string, unknown>,
      });

      await logAudit({
        user_id: user.id,
        action: 'ai_generate_optimal',
        resource_type: 'blueprint',
        metadata: { buildingType: p.buildingType, style: p.style, iterations: iterationLog.length, finalScore: bestScore },
      });

      return new Response(
        JSON.stringify({ blueprint: bestBlueprint, iterations: iterationLog, finalScore: bestScore }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );

    } catch (loopErr) {
      clearTimeout(timeoutId);
      const isTimeout = loopErr instanceof Error && loopErr.name === 'AbortError';
      const msg = isTimeout ? 'Generation timed out after 90s' : String(loopErr);
      await updateSession(supabase, sessionId, { status: 'error', error_message: msg });
      return new Response(
        JSON.stringify({ error: isTimeout ? 'TIMEOUT' : 'GENERATION_FAILED', message: msg }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', detail: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
