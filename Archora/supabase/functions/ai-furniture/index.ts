import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';

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
    const limited = await checkRateLimit(user.id, 'ai', 10, 3600);
    if (limited) return Errors.rateLimited();

    // Quota check
    const quotaOk = await checkQuota(user.id, 'ai_generations_used', 1);
    if (!quotaOk) return Errors.quotaExceeded();

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

    const { roomType, roomId, style, count } = parsed.data;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

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
      model: 'claude-sonnet-4-6',
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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
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
