import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser, requireOwnership } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';
import { TIER_AI_MODELS } from '../_shared/aiLimits.ts';

const RequestSchema = z.object({
  roomType: z.string().min(1),
  roomId: z.string().uuid(),
  style: z.string().optional(),
  count: z.number().int().min(1).max(10).default(5),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    // Rate limit: AI tier
    const rateLimitOk = await checkRateLimit(`ai:${user.id}`, 10, 3600);
    if (!rateLimitOk) return Errors.rateLimited();

    // Quota check is read-only (checkQuota only verifies, does not increment).
    // Increment after successful generation (handled by checkQuota internally).
    const quotaOk = await checkQuota(user.id, 'ai_generation');
    if (!quotaOk) return Errors.quotaExceeded();

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

    const { roomType, roomId, style, count } = parsed.data;

    // Verify user owns the room before returning furniture for it
    const supabaseAdmin = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );
    await requireOwnership(supabaseAdmin, 'rooms', roomId, user.id);

    // Tier-based model selection
    const { data: tierData } = await supabaseAdmin.rpc('get_user_tier', { user_id: user.id });
    const tier = (tierData as string) ?? 'starter';
    const modelConfig = TIER_AI_MODELS[tier as keyof typeof TIER_AI_MODELS] ?? TIER_AI_MODELS.starter;
    const selectedModel = modelConfig.generation;
    if (!selectedModel) {
      return new Response(JSON.stringify({ furniture: [], source: 'procedural', error: 'AI_NOT_AVAILABLE', message: 'AI generation not available on your tier' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      // Inlined procedural fallback data (mirrors src/utils/procedural/furniture.ts)
      const ROOM_SUGGESTIONS: Record<string, string[]> = {
        living_room:    ['sofa', 'coffee_table', 'tv_media_unit', 'chair', 'bookshelf'],
        bedroom:        ['bed_double', 'wardrobe', 'desk', 'chair'],
        master_bedroom: ['king_bed', 'walk_in_wardrobe', 'vanity_desk', 'chair'],
        kitchen:        ['kitchen_counter', 'kitchen_island', 'dining_table', 'dining_chair'],
        dining_room:    ['dining_table', 'dining_chair'],
        bathroom:       ['bathroom_sink', 'toilet', 'bathtub'],
        office:         ['home_office_desk', 'chair', 'bookshelf', 'modular_shelving'],
      };
      const FURNITURE_DIMS: Record<string, { w: number; h: number; d: number }> = {
        sofa:             { w: 2.0,  h: 0.85, d: 0.9  },
        chair:            { w: 0.7,  h: 0.95, d: 0.7  },
        coffee_table:     { w: 1.1,  h: 0.4,  d: 0.6  },
        tv_media_unit:    { w: 1.8,  h: 0.55, d: 0.45 },
        bookshelf:        { w: 0.9,  h: 1.8,  d: 0.3  },
        bed_double:       { w: 1.6,  h: 0.5,  d: 2.0  },
        wardrobe:         { w: 1.8,  h: 2.2,  d: 0.6  },
        desk:             { w: 1.4,  h: 0.75, d: 0.6  },
        king_bed:         { w: 1.8,  h: 0.5,  d: 2.0  },
        walk_in_wardrobe: { w: 2.4,  h: 2.2,  d: 0.6  },
        vanity_desk:      { w: 1.2,  h: 0.75, d: 0.5  },
        kitchen_counter:  { w: 2.4,  h: 0.9,  d: 0.6  },
        kitchen_island:   { w: 1.2,  h: 0.9,  d: 0.8  },
        dining_table:     { w: 1.6,  h: 0.75, d: 0.9  },
        dining_chair:     { w: 0.5,  h: 0.9,  d: 0.5  },
        bathroom_sink:    { w: 0.6,  h: 0.85, d: 0.5  },
        toilet:           { w: 0.4,  h: 0.8,  d: 0.65 },
        bathtub:          { w: 0.75, h: 0.6,  d: 1.7  },
        home_office_desk: { w: 1.6,  h: 0.75, d: 0.7  },
        modular_shelving: { w: 1.8,  h: 1.8,  d: 0.35 },
      };
      const suggestions = (ROOM_SUGGESTIONS[roomType] ?? ['sofa', 'chair', 'coffee_table'])
        .slice(0, count)
        .map((type: string, i: number) => {
          const dims = FURNITURE_DIMS[type] ?? { w: 1, h: 1, d: 1 };
          return {
            id: crypto.randomUUID(),
            name: type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            roomId,
            position: { x: i * 2, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            dimensions: { x: dims.w, y: dims.h, z: dims.d },
            procedural: true,
            materialOverride: '#8B6914',
          };
        });
      return new Response(JSON.stringify({ furniture: suggestions, source: 'procedural' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const prompt = `Generate a JSON array of exactly ${count} furniture pieces for a ${roomType} room${style ? ` in ${style} style` : ''}.
Each item must have:
- id: UUID v4
- name: string (human-readable furniture name)
- roomId: "${roomId}"
- position: { x: number, y: number, z: number } (in metres, y is up, reasonable placement)
- rotation: { x: 0, y: number, z: 0 } (y rotation in radians)
- dimensions: { x: number, y: number, z: number } (width, height, depth in metres — realistic)
- procedural: true
- materialOverride: string (hex color like "#8B5E3C")

Return ONLY the JSON array. No markdown. No explanation.`;

    const message = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    let furniture: unknown[];
    try {
      furniture = JSON.parse(text) as unknown[];
    } catch {
      return Errors.upstream('AI returned malformed JSON');
    }

    // Increment quota
    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );
    await supabase.rpc('increment_quota', { p_user_id: user.id, p_field: 'ai_generations_used', p_amount: 1 });

    const meta = extractRequestMeta(req);
    await logAudit({
      user_id: user.id,
      action: 'ai_furniture',
      resource_id: roomId,
      resource_type: 'room',
      metadata: { roomType, style, count },
      ip_address: meta.ip ?? undefined,
      user_agent: meta.userAgent ?? undefined,
    });

    return new Response(JSON.stringify({ furniture }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[ai-furniture]', err);
    return Errors.internal();
  }
});
