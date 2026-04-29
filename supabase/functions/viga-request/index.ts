import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';

const RequestSchema = z.object({
  imageUrl: z.string().url(),
  projectId: z.string().uuid().optional(),
  mode: z.enum(['furniture', 'room']).optional().default('furniture'),
  name: z.string().optional(),
  category: z.string().optional(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    const limited = await checkRateLimit(`viga:${user.id}`, 10, 3600);
    if (limited) return Errors.rateLimited('VIGA request rate limit exceeded');

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

    const { imageUrl, projectId, mode, name, category } = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Create pending viga_tasks record
    const { data: task, error } = await supabase
      .from('viga_tasks')
      .insert({
        user_id: user.id,
        project_id: projectId ?? null,
        status: 'pending',
        source_image_url: imageUrl,
        mode,
        name: name ?? null,
        category: category ?? null,
        gltf_url: null,
        task_id: null,
        error_message: null,
      })
      .select()
      .single();

    if (error) throw error;

    // Call VIGA GPU worker
    const workerUrl = Deno.env.get('VIGA_WORKER_URL');
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/viga-webhook?task_id=${task.id}`;

    const workerResponse = await fetch(`${workerUrl}/reconstruct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        user_id: user.id,
        project_id: projectId,
        mode,
        callback_url: callbackUrl,
      }),
    });

    if (!workerResponse.ok) {
      // Update task as failed
      await supabase
        .from('viga_tasks')
        .update({ status: 'failed', error_message: 'VIGA worker request failed' })
        .eq('id', task.id);

      return Errors.upstream('VIGA worker request failed');
    }

    const workerData = await workerResponse.json() as { task_id: string };
    const workerTaskId = workerData.task_id;

    // Update task with worker task ID and processing status
    await supabase
      .from('viga_tasks')
      .update({ status: 'processing', task_id: workerTaskId })
      .eq('id', task.id);

    return new Response(
      JSON.stringify({ taskId: task.id, workerTaskId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[viga-request]', err);
    return Errors.internal();
  }
});
