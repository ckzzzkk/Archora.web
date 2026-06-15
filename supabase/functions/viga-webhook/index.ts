import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';

const WebhookPayloadSchema = z.object({
  task_id: z.string(),
  status: z.enum(['done', 'failed']),
  gltf_url: z.string().optional(),
  error: z.string().optional(),
  metadata: z
    .object({
      name: z.string().optional(),
      category: z.string().optional(),
      width_m: z.number().optional(),
      height_m: z.number().optional(),
      depth_m: z.number().optional(),
      thumbnail_url: z.string().optional(),
    })
    .optional(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // task_id may come as a query param or in the body itself
    const url = new URL(req.url);
    const taskIdFromQuery = url.searchParams.get('task_id');

    const body = await req.json() as unknown;
    const parsed = WebhookPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validation('Invalid webhook payload', parsed.error.issues);
    }

    const payload = parsed.data;
    const taskId = taskIdFromQuery ?? payload.task_id;

    if (!taskId) {
      return Errors.validation('task_id is required (query param or body)');
    }

    // Admin client to read viga_tasks and write custom_furniture
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find the viga_tasks row by the GPU worker's task_id
    const { data: task, error: taskError } = await supabase
      .from('viga_tasks')
      .select('id, user_id, project_id, mode')
      .or(`task_id.eq.${taskId},id.eq.${taskId}`)
      .single();

    if (taskError || !task) {
      return Errors.notFound('VIGA task not found');
    }

    // Build the update payload
    const updatePayload: Record<string, unknown> = {
      status: payload.status,
      updated_at: new Date().toISOString(),
    };

    if (payload.status === 'done' && payload.gltf_url) {
      updatePayload.gltf_url = payload.gltf_url;
    }

    if (payload.status === 'failed' && payload.error) {
      updatePayload.error_message = payload.error;
    }

    const { error: updateError } = await supabase
      .from('viga_tasks')
      .update(updatePayload)
      .eq('id', task.id);

    if (updateError) throw updateError;

    // If reconstruction succeeded and this is a furniture task, persist to custom_furniture
    if (payload.status === 'done' && payload.gltf_url && task.mode === 'furniture') {
      const meta = payload.metadata ?? {};
      const { error: insertError } = await supabase.from('custom_furniture').insert({
        user_id: task.user_id,
        project_id: task.project_id ?? null,
        name: meta.name ?? 'Custom Furniture',
        category: meta.category ?? 'living',
        mesh_url: payload.gltf_url,
        thumbnail_url: meta.thumbnail_url ?? null,
        source_image_url: null,
        dimensions: {
          x: meta.width_m ?? 1,
          y: meta.height_m ?? 1,
          z: meta.depth_m ?? 1,
        },
        viga_task_id: task.id,
      });

      // Insert failure is non-fatal to the webhook response
      if (insertError) console.error('Failed to insert custom_furniture:', insertError.message);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('viga-webhook error:', err);
    return Errors.internal();
  }
});
