// supabase/functions/render-webhook/index.ts
// Called by Blender worker when render completes. Updates projects table with GLTF URL.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';

const WebhookSchema = z.object({
  task_id: z.string(),
  status: z.enum(['done', 'failed']),
  gltf_url: z.string().url().optional(),
  error: z.string().optional(),
});

/** Constant-time string comparison to avoid timing side-channels on the shared secret. */
function timingSafeEqual(a: string, b: string): boolean {
  const ae = new TextEncoder().encode(a);
  const be = new TextEncoder().encode(b);
  if (ae.length !== be.length) return false;
  let diff = 0;
  for (let i = 0; i < ae.length; i++) diff |= ae[i] ^ be[i];
  return diff === 0;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Shared-secret auth — MANDATORY and fail-closed. This function uses the
  // service-role key (bypasses RLS) to write any project by id, so it must never
  // be reachable unauthenticated. If the secret is unconfigured, reject everything.
  const webhookSecret = Deno.env.get('RENDER_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('[render-webhook] RENDER_WEBHOOK_SECRET not configured — rejecting (fail closed)');
    return Errors.internal('Webhook not configured');
  }
  const provided = req.headers.get('X-Webhook-Secret') ?? '';
  if (!timingSafeEqual(provided, webhookSecret)) {
    return Errors.forbidden('Invalid webhook secret');
  }

  try {
    const body = await req.json() as unknown;
    const parsed = WebhookSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid webhook payload', parsed.error.issues);

    const { task_id, status, gltf_url, error } = parsed.data;
    const url = new URL(req.url);
    const projectId = url.searchParams.get('project_id');
    if (!projectId) return Errors.validation('Missing project_id');

    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    const updateData: Record<string, unknown> = {
      rendered_gltf_url: status === 'done' ? gltf_url : null,
      render_status: status,
      render_error: error ?? null,
      render_task_id: null,
      updated_at: new Date().toISOString(),
    };

    // Scoped update: only the project whose in-flight render_task_id matches
    // may be completed. A forged/replayed body (or a leaked secret) cannot
    // overwrite arbitrary projects' render fields.
    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('render_task_id', task_id)
      .select('id');

    if (updateError) return Errors.internal('Failed to update project');
    if (!updated || updated.length === 0) {
      console.warn('[render-webhook] No project matched id + render_task_id — stale or forged callback:', projectId, task_id);
      return Errors.notFound('No matching in-flight render');
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[render-webhook]', err);
    return Errors.internal();
  }
});
