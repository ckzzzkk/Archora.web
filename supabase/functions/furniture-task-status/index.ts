/**
 * furniture-task-status — Poll the Meshy image-to-3D task behind an async
 * furniture generation (created by generate-furniture-from-image).
 *
 * GET ?taskId=<viga_tasks.id uuid>
 *   → { taskId, status, progress, meshUrl, thumbnailUrl, customFurnitureId }
 *   status: 'pending' | 'processing' | 'done' | 'failed'
 *
 * On completion, writes mesh_url/thumbnail_url onto the linked
 * custom_furniture row so the library flips from 'processing' to 'ready'.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAuthUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { requireRateLimit } from '../_shared/rateLimit.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';

const MESHY_BASE = 'https://api.meshy.ai';

interface MeshyTask {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  progress: number;
  model_urls?: { glb?: string; fbx?: string; usdz?: string };
  thumbnail_url?: string;
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

  const limited = await requireRateLimit(`furniture-task-status:${user.id}`, 120, 60);
  if (limited) return limited;

  const url = new URL(req.url);
  const taskId = url.searchParams.get('taskId');
  if (!taskId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(taskId)) {
    return Errors.validation('taskId must be a valid UUID');
  }

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  const { data: task, error: fetchError } = await supabase
    .from('viga_tasks')
    .select('id, user_id, task_id, status, gltf_url, error_message, custom_furniture_id')
    .eq('id', taskId)
    .single();

  if (fetchError || !task) return Errors.notFound();

  const row = task as Record<string, unknown>;
  if (row.user_id !== user.id) return Errors.forbidden();

  let status = row.status as string;
  let meshUrl = (row.gltf_url as string | null) ?? null;
  let thumbnailUrl: string | null = null;
  let progress = status === 'done' ? 100 : 0;

  // If still in flight and we hold a Meshy task ID, poll it once
  if ((status === 'pending' || status === 'processing') && row.task_id) {
    const meshyKey = Deno.env.get('MESHY_API_KEY');
    if (meshyKey) {
      const meshyRes = await fetch(`${MESHY_BASE}/v1/image-to-3d/${row.task_id}`, {
        headers: { Authorization: `Bearer ${meshyKey}` },
      });

      if (meshyRes.ok) {
        const meshyTask = await meshyRes.json() as MeshyTask;
        progress = meshyTask.progress ?? 0;

        if (meshyTask.status === 'SUCCEEDED' && meshyTask.model_urls?.glb) {
          status = 'done';
          meshUrl = meshyTask.model_urls.glb;
          thumbnailUrl = meshyTask.thumbnail_url ?? null;
          await supabase
            .from('viga_tasks')
            .update({ status: 'done', gltf_url: meshUrl, updated_at: new Date().toISOString() })
            .eq('id', taskId);
          if (row.custom_furniture_id) {
            await supabase
              .from('custom_furniture')
              .update({ mesh_url: meshUrl, thumbnail_url: thumbnailUrl })
              .eq('id', row.custom_furniture_id);
          }
        } else if (meshyTask.status === 'FAILED' || meshyTask.status === 'EXPIRED') {
          status = 'failed';
          await supabase
            .from('viga_tasks')
            .update({
              status: 'failed',
              error_message: meshyTask.error?.message ?? meshyTask.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', taskId);
        } else if (status === 'pending') {
          status = 'processing';
        }
      }
    }
  }

  if (status === 'done') {
    const { ip, userAgent } = extractRequestMeta(req);
    await logAudit({
      user_id: user.id,
      action: 'furniture_task_completed',
      resource_type: 'custom_furniture',
      resource_id: (row.custom_furniture_id as string | null) ?? undefined,
      metadata: { vigaTaskId: taskId },
      ip_address: ip ?? undefined,
      user_agent: userAgent ?? undefined,
    });
  }

  return new Response(
    JSON.stringify({
      taskId: row.id,
      status,
      progress,
      meshUrl,
      thumbnailUrl,
      customFurnitureId: (row.custom_furniture_id as string | null) ?? null,
      error: (row.error_message as string | null) ?? null,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
