// supabase/functions/render-blueprint/index.ts
// Receives blueprint JSON → submits rendering job → returns render task ID

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';

const RequestSchema = z.object({
  blueprintId: z.string().uuid(),
  referenceImageUrl: z.string().url().optional(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    const limited = await checkRateLimit(`render:${user.id}`, 3, 3600);
    if (limited) return Errors.rateLimited('Render rate limit exceeded');

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

    const { blueprintId, referenceImageUrl } = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch blueprint from projects table
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, blueprint_data')
      .eq('id', blueprintId)
      .single();

    if (projectError || !project) return Errors.notFound('Project not found');

    // Optional: generate a room/furniture mesh from reference image via Meshy
    let meshyMeshUrl: string | null = null;
    if (referenceImageUrl) {
      const meshyKey = Deno.env.get('MESHY_API_KEY') ?? '';
      if (meshyKey) {
        try {
          const createRes = await fetch('https://api.meshy.ai/v1/image-to-3d', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${meshyKey}`,
            },
            body: JSON.stringify({
              image_url: referenceImageUrl,
              enable_pbr: true,
              ai_model: 'meshy-4',
              surface_mode: 'hard',
              topology: 'quad',
              target_polycount: 30000,
            }),
          });
          if (createRes.ok) {
            const { result: taskId } = await createRes.json() as { result: string };
            // Poll Meshy for result (async, up to 2 min)
            for (let attempt = 0; attempt < 15; attempt++) {
              await new Promise((r) => setTimeout(r, 8000));
              const pollRes = await fetch(`https://api.meshy.ai/v1/image-to-3d/${taskId}`, {
                headers: { Authorization: `Bearer ${meshyKey}` },
              });
              if (!pollRes.ok) break;
              const task = await pollRes.json() as {
                status: string;
                model_urls?: { glb?: string };
              };
              if (task.status === 'SUCCEEDED' && task.model_urls?.glb) {
                meshyMeshUrl = task.model_urls.glb;
                break;
              }
              if (task.status === 'FAILED' || task.status === 'EXPIRED') break;
            }
          }
        } catch (e) {
          console.warn('[render-blueprint] Meshy reference generation failed (non-fatal):', e);
        }
      }
    }

    // Submit rendering job to Blender worker
    const workerUrl = Deno.env.get('RENDER_WORKER_URL');
    if (!workerUrl) return Errors.internal('Render worker not configured');

    const { data: renderTask, error: workerError } = await fetch(`${workerUrl}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blueprint_id: blueprintId,
        blueprint_data: project.blueprint_data,
        meshy_mesh_url: meshyMeshUrl,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/render-webhook?project_id=${blueprintId}`,
      }),
    }).then(r => r?.json()).catch(() => null) as { data?: { task_id: string } } | null;

    if (!renderTask?.data?.task_id) return Errors.internal('Failed to submit render job');

    return new Response(
      JSON.stringify({ taskId: renderTask.data.task_id, projectId: blueprintId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[render-blueprint]', err);
    return Errors.internal();
  }
});
