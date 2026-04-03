/**
 * ar-scan-status — Poll Meshy image-to-3D task for a completed AR scan
 *
 * GET ?scanId=<uuid>
 *   → { scanId, status, progress, meshUrl, detectedObjects }
 *   status: 'processing' | 'complete' | 'failed'
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAuthUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';

const MESHY_BASE = 'https://api.meshy.ai';

interface MeshyTask {
  id: string;
  status: string;
  progress: number;
  model_urls?: { glb?: string; fbx?: string; usdz?: string };
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

  const rateLimitOk = await checkRateLimit(`ar-scan-status:${user.id}`, 120, 60);
  if (!rateLimitOk) return Errors.rateLimited('Rate limit exceeded');

  const url = new URL(req.url);
  const scanId = url.searchParams.get('scanId');
  // Validate UUID format
  if (!scanId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(scanId)) {
    return Errors.validation('scanId must be a valid UUID');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: scan, error: fetchError } = await supabase
    .from('ar_scans')
    .select('id, user_id, status, meshy_task_id, mesh_url, detected_objects, room_dimensions')
    .eq('id', scanId)
    .single();

  if (fetchError || !scan) return Errors.notFound();

  const row = scan as Record<string, unknown>;
  if (row.user_id !== user.id) return Errors.forbidden();

  let status = row.status as string;
  let meshUrl = row.mesh_url as string | null;
  let progress = 0;

  // If still processing and we have a Meshy task ID, poll for completion
  if (status === 'processing' && row.meshy_task_id) {
    const meshyKey = Deno.env.get('MESHY_API_KEY');
    if (meshyKey) {
      const meshyRes = await fetch(`${MESHY_BASE}/v1/image-to-3d/${row.meshy_task_id}`, {
        headers: { Authorization: `Bearer ${meshyKey}` },
      });

      if (meshyRes.ok) {
        const task = await meshyRes.json() as MeshyTask;
        progress = task.progress ?? 0;

        if (task.status === 'SUCCEEDED' && task.model_urls?.glb) {
          meshUrl = task.model_urls.glb;
          status = 'complete';
          await supabase
            .from('ar_scans')
            .update({ mesh_url: meshUrl, status: 'complete' })
            .eq('id', scanId);
        } else if (task.status === 'FAILED' || task.status === 'EXPIRED') {
          status = 'failed';
          await supabase
            .from('ar_scans')
            .update({ status: 'failed' })
            .eq('id', scanId);
        }
      }
    }
  }

  await logAudit({
    userId: user.id,
    action: 'ar_scan_status_polled',
    resourceType: 'ar_scan',
    resourceId: scanId,
    meta: { status, ...extractRequestMeta(req) },
    supabaseUrl: Deno.env.get('SUPABASE_URL')!,
    supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  });

  return new Response(
    JSON.stringify({
      scanId: row.id,
      status,
      progress,
      meshUrl,
      detectedObjects: (row.detected_objects as unknown[]) ?? [],
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
