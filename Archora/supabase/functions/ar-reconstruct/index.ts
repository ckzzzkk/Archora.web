import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';

const RequestSchema = z.object({
  frameUrls: z.array(z.string().url()).min(1).max(30),
});

interface RoboflowDetection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

async function runRoboflowDetection(imageUrl: string): Promise<RoboflowDetection[]> {
  const apiKey = Deno.env.get('ROBOFLOW_API_KEY');
  const modelId = Deno.env.get('ROBOFLOW_MODEL_ID') ?? 'room-objects/1';
  const url = `https://detect.roboflow.com/${modelId}?api_key=${apiKey}&image=${encodeURIComponent(imageUrl)}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json() as { predictions?: RoboflowDetection[] };
  return data.predictions ?? [];
}

async function requestMeshyReconstruction(frameUrls: string[]): Promise<string> {
  const apiKey = Deno.env.get('MESHY_API_KEY');
  const response = await fetch('https://api.meshy.ai/v1/image-to-3d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ image_urls: frameUrls, mode: 'preview' }),
  });

  if (!response.ok) throw new Error('Meshy API error');
  const data = await response.json() as { result: string };
  return data.result; // task ID
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    const limited = await checkRateLimit(`ar:${user.id}`, 5, 3600);
    if (limited) return Errors.rateLimited('AR scan rate limit exceeded');

    const quotaOk = await checkQuota(user.id, 'ar_scan');
    if (!quotaOk) return Errors.quotaExceeded('AR scan quota exceeded');

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

    const { frameUrls } = parsed.data;

    // Run Roboflow detection on first frame
    const detections = await runRoboflowDetection(frameUrls[0]).catch(() => []);

    // Request Meshy 3D reconstruction (async — returns task ID)
    let meshTaskId: string | null = null;
    try {
      meshTaskId = await requestMeshyReconstruction(frameUrls);
    } catch {
      // Meshy failure is non-fatal — scan is still logged
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Persist scan record
    const { data: scan, error } = await supabase
      .from('ar_scans')
      .insert({
        user_id: user.id,
        frame_urls: frameUrls,
        detected_objects: detections.map((d) => ({
          label: d.class,
          confidence: d.confidence,
          boundingBox: [d.x, d.y, d.width, d.height],
        })),
        meshy_task_id: meshTaskId,
        mesh_url: null,
        room_dimensions: { width: 0, height: 0, depth: 0 },
        status: meshTaskId ? 'processing' : 'failed',
      })
      .select()
      .single();

    if (error) throw error;

    // Increment AR quota
    await supabase.rpc('increment_quota', { p_user_id: user.id, p_field: 'ar_scans_used', p_amount: 1 });

    const meta = extractRequestMeta(req);
    await logAudit({
      user_id: user.id,
      action: 'ar_reconstruct',
      resource_id: (scan as Record<string, unknown>).id as string,
      resource_type: 'ar_scan',
      metadata: { frameCount: frameUrls.length, detectionCount: detections.length },
      ip_address: meta.ip ?? undefined,
      user_agent: meta.userAgent ?? undefined,
    });

    const row = scan as Record<string, unknown>;
    return new Response(
      JSON.stringify({
        scanId: row.id,
        meshUrl: row.mesh_url,
        roomDimensions: row.room_dimensions,
        detectedObjects: row.detected_objects,
        status: row.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[ar-reconstruct]', err);
    return Errors.internal();
  }
});
