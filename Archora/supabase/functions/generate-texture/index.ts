import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';

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
    const replicateKey = Deno.env.get('REPLICATE_API_KEY');

    if (!replicateKey) {
      // Graceful fallback — return a curated texture suggestion
      const fallback = FALLBACK[surface];
      return new Response(
        JSON.stringify({ textureUrl: null, fallbackId: fallback.id, fallbackColor: fallback.color, prompt, surface }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const fullPrompt = buildPrompt(prompt, surface, style);

    // Submit prediction to Replicate SDXL
    const submitRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${replicateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
        input: {
          prompt: fullPrompt,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      console.error('[generate-texture] Replicate submit error:', err);
      return Errors.upstream('Texture generation service unavailable');
    }

    const prediction = await submitRes.json() as { id: string; status: string; output?: string[] };

    // Poll for completion (max 60s)
    let result = prediction;
    const deadline = Date.now() + 60_000;
    while (result.status !== 'succeeded' && result.status !== 'failed' && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { Authorization: `Token ${replicateKey}` },
      });
      if (pollRes.ok) {
        result = await pollRes.json() as typeof result;
      }
    }

    if (result.status !== 'succeeded' || !result.output?.[0]) {
      return Errors.upstream('Texture generation timed out or failed');
    }

    const imageUrl = result.output[0];

    // Upload to Supabase Storage renders bucket
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
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

    await logAudit({
      userId: user.id,
      action: 'texture_generated',
      resourceType: 'texture',
      meta: { surface, prompt: prompt.slice(0, 100), ...extractRequestMeta(req) },
      supabaseUrl: Deno.env.get('SUPABASE_URL')!,
      supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
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
