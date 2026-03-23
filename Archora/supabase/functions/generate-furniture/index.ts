/**
 * generate-furniture — Meshy text-to-3D furniture generation (Architect tier only)
 *
 * POST  body: { prompt, artStyle?, negativePrompt? }
 *   → Creates a Meshy text-to-3D task; returns { taskId }
 *
 * GET   ?taskId=<id>
 *   → Polls Meshy for task status; returns { status, progress, meshUrl?, thumbnailUrl? }
 *   status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit } from '../_shared/audit.ts';

const MESHY_BASE = 'https://api.meshy.ai';

const CreateSchema = z.object({
  prompt: z.string().min(3).max(300),
  artStyle: z.enum(['realistic', 'cartoon', 'low-poly', 'sculpture']).optional().default('realistic'),
  negativePrompt: z.string().max(200).optional(),
});

interface MeshyTask {
  id: string;
  status: string;
  progress: number;
  model_urls?: { glb?: string; fbx?: string; usdz?: string };
  thumbnail_url?: string;
  error?: { message: string };
}

async function getMeshyKey(): Promise<string | null> {
  return Deno.env.get('MESHY_API_KEY') ?? null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST' && req.method !== 'GET') return Errors.notFound();

  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    user = await getAuthUser(req);
  } catch (err) {
    return err as Response;
  }

  // Verify Architect tier — custom AI furniture is Architect-only
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: userData } = await supabase
    .from('users')
    .select('tier')
    .eq('id', user.id)
    .single();

  const tier = (userData as { tier?: string } | null)?.tier ?? 'starter';
  if (tier !== 'architect') {
    return new Response(
      JSON.stringify({ error: 'Custom AI furniture requires an Architect subscription', code: 'QUOTA_EXCEEDED' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const meshyKey = await getMeshyKey();
  if (!meshyKey) {
    console.warn('[generate-furniture] MESHY_API_KEY not configured');
    return new Response(
      JSON.stringify({ error: '3D generation not configured', code: 'UPSTREAM_ERROR' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // ── GET: poll task status ─────────────────────────────────────────────────
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');
    if (!taskId || !/^[a-zA-Z0-9_-]+$/.test(taskId)) {
      return Errors.validation('taskId is required and must be alphanumeric');
    }

    const meshyRes = await fetch(`${MESHY_BASE}/v1/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${meshyKey}` },
    });

    if (!meshyRes.ok) {
      return Errors.upstream('Failed to fetch task status from Meshy');
    }

    const task = await meshyRes.json() as MeshyTask;

    return new Response(
      JSON.stringify({
        taskId: task.id,
        status: task.status,
        progress: task.progress,
        meshUrl: task.model_urls?.glb ?? null,
        thumbnailUrl: task.thumbnail_url ?? null,
        error: task.error?.message ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // ── POST: create a text-to-3D task ───────────────────────────────────────
  const limited = await checkRateLimit(`generate_furniture:${user.id}`, 5, 3600);
  if (limited) return Errors.rateLimited('Furniture generation rate limit exceeded (5/hr)');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Errors.validation('Invalid JSON body');
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

  const { prompt, artStyle, negativePrompt } = parsed.data;

  const meshyBody: Record<string, unknown> = {
    mode: 'preview',
    prompt,
    art_style: artStyle,
    should_remesh: true,
  };
  if (negativePrompt) meshyBody.negative_prompt = negativePrompt;

  const meshyRes = await fetch(`${MESHY_BASE}/v1/text-to-3d`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${meshyKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meshyBody),
  });

  if (!meshyRes.ok) {
    const errText = await meshyRes.text();
    console.error('[generate-furniture] Meshy error:', errText);
    return Errors.upstream('3D generation service error');
  }

  const result = await meshyRes.json() as { result: string };
  const taskId = result.result;

  await logAudit({
    user_id: user.id,
    action: 'ai_generate',
    metadata: { type: 'furniture_3d', prompt: prompt.slice(0, 100), task_id: taskId },
  });

  return new Response(
    JSON.stringify({ taskId }),
    { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
