/**
 * ai-render — Photorealistic render generation (Pro+)
 *
 * POST body: {
 *   blueprintSummary: { buildingType, style, totalArea, roomCount, floors?, hasPool?, hasGarden?, exteriorFinish? },
 *   atmosphere: 'golden_hour'|'overcast_day'|'night_interior'|'twilight'|'rain_storm'|'snow'|'sunny_midday',
 *   viewType: 'exterior_front'|'exterior_aerial'|'interior_living'|'interior_kitchen'|'interior_bedroom'|'garden',
 *   hemisphere?: 'northern'|'southern'
 * }
 *
 * Pipeline:
 *   1. Build scene description from blueprint summary
 *   2. Claude Vision prompt engineer → SDXL prompt + negative prompt
 *   3. fal.ai Flux Schnell generates render (if FAL_KEY set)
 *   4. Store render URL in renders table
 *   5. Return { renderUrl, prompts }
 */
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit } from '../_shared/audit.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { TIER_AI_MODELS, buildAIRequest, parseAIResponse, getModelProvider } from '../_shared/aiLimits.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireEnv } from '../_shared/errors.ts';

const RequestSchema = z.object({
  blueprintSummary: z.object({
    buildingType: z.string(),
    style: z.string(),
    totalArea: z.number(),
    roomCount: z.number(),
    floors: z.number().optional(),
    hasPool: z.boolean().optional(),
    hasGarden: z.boolean().optional(),
    exteriorFinish: z.string().optional(),
  }),
  atmosphere: z.enum([
    'golden_hour', 'overcast_day', 'night_interior',
    'twilight', 'rain_storm', 'snow', 'sunny_midday',
  ]),
  viewType: z.enum([
    'exterior_front', 'exterior_aerial',
    'interior_living', 'interior_kitchen', 'interior_bedroom',
    'garden',
  ]),
  hemisphere: z.enum(['northern', 'southern']).optional(),
});

const RENDER_SYSTEM_PROMPT = `You are an architectural visualisation prompt engineer. Generate a detailed, photorealistic Stable Diffusion prompt for architectural renders.

Your prompts must:
1. Be specific about architecture style, materials, and construction details
2. Include precise lighting description from the atmosphere module
3. Reference real architectural photography techniques
4. Include quality boosters appropriate for architecture renders
5. Stay under 400 words

ATMOSPHERE REFERENCE:
- Golden Hour: "warm amber backlit sunlight at 10-degree elevation, long horizontal shadows, golden-hour photography, 2700K colour temperature, soft orange glow on facade materials, magic hour architecture photography"
- Overcast Day: "soft overcast lighting, diffuse illumination, no harsh shadows, flat 5500K daylight, studio-quality even exposure, architectural documentation photography"
- Night Interior: "warm interior lighting 2700K, glowing windows in dark exterior, atmospheric night architecture, uplighting on facade, city ambient glow on horizon"
- Twilight: "blue hour photography, purple-blue sky gradient, warm interior window glow contrasting cool exterior, twilight architecture, 20 minutes after sunset"
- Rainstorm: "dramatic stormlit sky, wet reflections on pavement, rain on glass, dark cumulus clouds, 4500K cool grey-green ambient, atmospheric moody architecture"
- Snow: "winter architecture photography, snow-covered ground and roof, soft blue shadow tones, overcast white sky, serene winter light"
- Sunny Midday: "bright direct sunlight, crisp shadows, blue sky with white clouds, vibrant colours, high-contrast architectural photography"

QUALITY BOOSTERS (always append): "ultra-detailed, photorealistic render, 8K, architectural photography, professional DSLR, sharp focus, depth of field, volumetric lighting, award-winning architecture photo"

NEGATIVE PROMPT (always include): "cartoon, illustration, low quality, blurry, distorted proportions, unrealistic, sketch, watercolour"

Return ONLY valid JSON with keys: { "positivePrompt": "...", "negativePrompt": "...", "styleNotes": "..." }`;

interface PromptResult {
  positivePrompt: string;
  negativePrompt: string;
  styleNotes: string;
}

async function generatePrompts(
  buildingType: string,
  style: string,
  totalArea: number,
  roomCount: number,
  exteriorFinish: string | undefined,
  hasPool: boolean | undefined,
  hasGarden: boolean | undefined,
  atmosphere: string,
  viewType: string,
  hemisphere: string,
  apiKey: string,
  selectedModel: string,
  maxTokens = 1024,
): Promise<PromptResult> {
  const features = [
    hasPool ? 'swimming pool' : '',
    hasGarden ? 'landscaped garden' : '',
  ].filter(Boolean).join(', ') || 'none';

  const userPrompt = `Generate an architectural render prompt for a ${buildingType}.
Style: ${style}
Floor area: ${totalArea}m² across approximately ${roomCount} rooms.
Exterior finish: ${exteriorFinish ?? 'render/plaster'}
Hemisphere: ${hemisphere}
Features present: ${features}
Atmosphere requested: ${atmosphere.replace(/_/g, ' ')}
View requested: ${viewType.replace(/_/g, ' ')}

Generate a highly detailed positive prompt and appropriate negative prompt for Stable Diffusion. Focus on the architectural photography quality, lighting, and materials.`;

  const reqConfig = buildAIRequest(selectedModel, RENDER_SYSTEM_PROMPT, [{ role: 'user', content: userPrompt }], maxTokens);
  const resp = await fetch(reqConfig.url, { method: 'POST', headers: reqConfig.headers, body: JSON.stringify(reqConfig.body) });

  if (!resp.ok) {
    throw new Error(`Claude API error: ${resp.status}`);
  }

  const data = await resp.json();
  const { content: rawText } = parseAIResponse(reqConfig.provider, data);

  const cleaned = rawText
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse prompt JSON: ${cleaned.slice(0, 200)}`);
  }
}

async function generateFalRender(
  positivePrompt: string,
  negativePrompt: string,
  apiKey: string,
): Promise<string | null> {
  const resp = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: positivePrompt,
      image_size: 'landscape_4_3',
      num_inference_steps: 4,
      num_images: 1,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error('[ai-render] fal.ai error:', errBody.slice(0, 200));
    return null;
  }

  const result = await resp.json() as { images: Array<{ url: string }> };
  return result.images[0]?.url ?? null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await getAuthUser(req);

    // Rate limit: 10 render requests per hour
    const allowed = await checkRateLimit(`render:${user.id}`, 10, 3600);
    if (!allowed) {
      return Errors.rateLimited('Render rate limit exceeded — try again later');
    }

    // Quota check for renders
    const quotaOk = await checkQuota(user.id, 'render');
    if (!quotaOk) {
      return Errors.quotaExceeded('Monthly render quota reached.');
    }

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validation('Invalid request', parsed.error.issues);
    }

    const { blueprintSummary, atmosphere, viewType, hemisphere } = parsed.data;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const falKey = Deno.env.get('FAL_KEY');

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'AI_NOT_CONFIGURED', message: 'AI service not available' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
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

    // Step 1: Generate SDXL prompts via Claude
    let prompts: PromptResult;
    try {
      prompts = await generatePrompts(
        blueprintSummary.buildingType,
        blueprintSummary.style,
        blueprintSummary.totalArea,
        blueprintSummary.roomCount,
        blueprintSummary.exteriorFinish,
        blueprintSummary.hasPool,
        blueprintSummary.hasGarden,
        atmosphere,
        viewType,
        hemisphere ?? 'northern',
        selectedModel,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Prompt generation failed';
      return new Response(
        JSON.stringify({ error: 'PROMPT_GENERATION_FAILED', message: msg }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 2: Generate render via Replicate (if key available)
    let renderUrl: string | null = null;
    if (falKey) {
      renderUrl = await generateFalRender(prompts.positivePrompt, prompts.negativePrompt, falKey);
    }

    // Step 3: Store render if URL obtained
    if (renderUrl) {
      // Fire-and-forget — don't block response on DB write
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(supabaseUrl, supabaseKey);
        try {
          await supabase.rpc('increment_quota', { p_user_id: user.id, p_field: 'renders_used', p_amount: 1 });
        } catch (e) {
          console.warn('Failed to increment renders_used quota:', e);
        }
        supabase.from('renders').insert({
          user_id: user.id,
          render_url: renderUrl,
          atmosphere,
          view_type: viewType,
          created_at: new Date().toISOString(),
        }).then(() => {}).catch(() => {});
      }
    }

    await logAudit({
      user_id: user.id,
      action: 'ai_render',
      resource_type: 'project',
      resource_id: null,
      meta: { atmosphere, viewType, hasRender: !!renderUrl },
    });

    return new Response(
      JSON.stringify({
        renderUrl,
        prompts,
        message: falKey
          ? (renderUrl ? 'Render generated successfully' : 'Prompt generated — render pending')
          : 'fal.ai not configured — prompt generated only',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[ai-render]', err);
    return Errors.internal();
  }
});