/**
 * render-status — Poll the Meshy task behind an async blueprint render
 * (dispatched by render-blueprint).
 *
 * GET ?projectId=<uuid>
 *   → { projectId, status, progress, gltfUrl, error }
 *   status: 'idle' | 'rendering' | 'done' | 'failed'
 *
 * On completion, writes rendered_gltf_url / render_status onto the project
 * row and clears render_task_id.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAuthUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { requireRateLimit } from '../_shared/rateLimit.ts';

const MESHY_BASE = 'https://api.meshy.ai';

interface MeshyTask {
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  progress: number;
  model_urls?: { glb?: string };
  error?: { message: string };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'GET') return Errors.notFound();

  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    user = await getAuthUser(req);
  } catch (err) {
    return err as Response;
  }

  const limited = await requireRateLimit(`render-status:${user.id}`, 120, 60);
  if (limited) return limited;

  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  if (!projectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(projectId)) {
    return Errors.validation('projectId must be a valid UUID');
  }

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('id, user_id, render_status, render_task_id, rendered_gltf_url, render_error')
    .eq('id', projectId)
    .single();

  if (fetchError || !project) return Errors.notFound();

  const row = project as Record<string, unknown>;
  if (row.user_id !== user.id) return Errors.forbidden();

  let status = (row.render_status as string) ?? 'idle';
  let gltfUrl = (row.rendered_gltf_url as string | null) ?? null;
  let renderError = (row.render_error as string | null) ?? null;
  let progress = status === 'done' ? 100 : 0;

  if (status === 'rendering' && row.render_task_id) {
    const meshyKey = Deno.env.get('MESHY_API_KEY');
    if (meshyKey) {
      const meshyRes = await fetch(`${MESHY_BASE}/v1/image-to-3d/${row.render_task_id}`, {
        headers: { Authorization: `Bearer ${meshyKey}` },
      });

      if (meshyRes.ok) {
        const task = await meshyRes.json() as MeshyTask;
        progress = task.progress ?? 0;

        if (task.status === 'SUCCEEDED' && task.model_urls?.glb) {
          status = 'done';
          gltfUrl = task.model_urls.glb;
          await supabase
            .from('projects')
            .update({
              render_status: 'done',
              rendered_gltf_url: gltfUrl,
              render_error: null,
              render_task_id: null,
            })
            .eq('id', projectId)
            .eq('render_task_id', row.render_task_id);
        } else if (task.status === 'FAILED' || task.status === 'EXPIRED') {
          status = 'failed';
          renderError = task.error?.message ?? task.status;
          await supabase
            .from('projects')
            .update({
              render_status: 'failed',
              render_error: renderError,
              render_task_id: null,
            })
            .eq('id', projectId)
            .eq('render_task_id', row.render_task_id);
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ projectId: row.id, status, progress, gltfUrl, error: renderError }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
