/**
 * notifications/send
 *
 * POST /functions/v1/notifications/send
 * Body: SendNotificationParams (see _shared/notifications.ts)
 * Auth: service role key (internal cross-function calls)
 *
 * Used by other Edge Functions to dispatch notifications without needing
 * the service role key directly. Authenticated via X-Service-Token header.
 */
import { sendNotification } from '../../_shared/notifications.ts';
import { corsHeaders } from '../../_shared/cors.ts';
import { Errors } from '../../_shared/errors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  userId:       z.string().uuid(),
  type:         z.string(),
  payload:      z.record(z.unknown()).default({}),
  pushTitle:    z.string().optional(),
  pushBody:     z.string().optional(),
  pushData:     z.record(z.string()).optional(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') return Errors.notFound();

  // Internal auth via service token (other Edge Functions call this)
  const serviceToken = req.headers.get('X-Service-Token');
  const expectedToken = Deno.env.get('INTERNAL_SERVICE_TOKEN');
  if (!expectedToken || serviceToken !== expectedToken) {
    return Errors.unauthorized('Internal service token required');
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Errors.validation('Invalid JSON');
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Errors.validation(`Invalid notification payload: ${parsed.error.message}`);
  }

  try {
    await sendNotification(parsed.data);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[notifications/send]', err);
    return Errors.internal('Failed to send notification');
  }
});
