import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';
import { checkQuota } from '../_shared/quota.ts';

const RequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  surface: z.enum(['wall', 'floor', 'ceiling']),
  style: z.string().default('modern'),
});

function buildPrompt(prompt: string, surface: string, style: string): string {
  const base = `seamless tileable ${style} ${surface} texture, ${prompt}`;
  if (surface === 'wall') return `${base}, interior design, photorealistic, 4k, high resolution`;
  if (surface === 'floor') return `${base}, top down view, photorealistic, 4k, high resolution`;
  return `${base}, interior ceiling, photorealistic, 4k, high resolution`;
}

// Fallback textures when Replicate key is missing
const FALLBACK: Record<string, { id: string; label: string; color: string }> = {
  wall:    { id: 'plain_white', label: 'Plain White', color: '#F5F5F0' },
  floor:   { id: 'hardwood_oak', label: 'Oak Hardwood', color: '#8B6914' },
  ceiling: { id: 'plain_white', label: 'Plain White', color: '#FFFFFF' },
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    const allowed = await checkRateLimit(`texture:${user.id}`, 10, 3600);
    if (!allowed) return Errors.rateLimited('Texture generation rate limit exceeded');

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

    const { prompt, surface, style } = parsed.data;
    const falKey = Deno.env.get('FAL_KEY');

    if (!falKey) {
      // Graceful fallback — return a curated texture suggestion
      const fallback = FALLBACK[surface];
      return new Response(
        JSON.stringify({ textureUrl: null, fallbackId: fallback.id, fallbackColor: fallback.color, prompt, surface }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const fullPrompt = buildPrompt(prompt, surface, style);

    const quotaOk = await checkQuota(user.id, 'ai_generation');
    if (!quotaOk) return Errors.quotaExceeded('AI quota exceeded for texture generation');

    // Submit to fal.ai Flux Schnell (synchronous — no polling needed)
    const falResp = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: 'landscape_4_3',
        num_inference_steps: 4,
        num_images: 1,
      }),
    });

    if (!falResp.ok) {
      const err = await falResp.text();
      console.error('[generate-texture] fal.ai error:', err.slice(0, 200));
      return Errors.upstream('Texture generation service unavailable');
    }

    const falResult = await falResp.json() as { images: Array<{ url: string }> };
    const imageUrl = falResult.images[0]?.url;
    if (!imageUrl) return Errors.upstream('Texture generation returned no image');

    // Upload to Supabase Storage renders bucket
    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    const imageRes = await fetch(imageUrl);
    const imageBlob = await imageRes.arrayBuffer();
    const fileName = `textures/${user.id}/${Date.now()}_${surface}.png`;

    const { data: upload, error: uploadError } = await supabase.storage
      .from('renders')
      .upload(fileName, imageBlob, { contentType: 'image/png', upsert: false });

    let textureUrl = imageUrl; // fallback to Replicate CDN URL
    if (!uploadError && upload) {
      const { data: { publicUrl } } = supabase.storage.from('renders').getPublicUrl(fileName);
      textureUrl = publicUrl;
    }

    const { ip, userAgent } = extractRequestMeta(req);
    await logAudit({
      user_id: user.id,
      action: 'texture_generated',
      resource_type: 'texture',
      metadata: { surface, prompt: prompt.slice(0, 100) },
      ip_address: ip ?? undefined,
      user_agent: userAgent ?? undefined,
    });

    return new Response(
      JSON.stringify({ textureUrl, prompt, surface }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[generate-texture]', err);
    return Errors.internal();
  }
});
