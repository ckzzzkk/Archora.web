import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { securityHeaders } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { Errors } from '../_shared/errors.ts';

const RequestSchema = z.object({
  // Strict whitelist — only events the client is permitted to log
  action: z.enum(['login_success']),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: securityHeaders });
  if (req.method !== 'POST') return Errors.notFound();

  try {
    const user = await getAuthUser(req);

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid action', parsed.error.issues);

    // Write via service role — audit_logs has no client INSERT RLS policy by design
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: parsed.data.action,
      resource_type: 'auth',
      metadata: {},
    });

    return new Response(JSON.stringify({ logged: true }), {
      status: 200,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[log-auth-event]', err);
    return Errors.internal();
  }
});
