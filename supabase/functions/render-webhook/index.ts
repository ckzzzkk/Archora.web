// supabase/functions/render-webhook/index.ts
// Called by Blender worker when render completes. Updates projects table with GLTF URL.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';

const WebhookSchema = z.object({
  task_id: z.string(),
  status: z.enum(['done', 'failed']),
  gltf_url: z.string().url().optional(),
  error: z.string().optional(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as unknown;
    const parsed = WebhookSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid webhook payload', parsed.error.issues);

    const { task_id, status, gltf_url, error } = parsed.data;
    const url = new URL(req.url);
    const projectId = url.searchParams.get('project_id');
    if (!projectId) return Errors.validation('Missing project_id');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const updateData: Record<string, unknown> = {
      rendered_gltf_url: status === 'done' ? gltf_url : null,
      render_status: status,
      render_error: error ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) return Errors.internal('Failed to update project');

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[render-webhook]', err);
    return Errors.internal();
  }
});
