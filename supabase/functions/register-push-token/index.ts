/**
 * register-push-token
 *
 * POST /functions/v1/register-push-token
 * Body: { token: string }
 * Auth: JWT required
 *
 * Registers or updates the user's Expo push token in the users table.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return Errors.notFound();

  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    user = await getAuthUser(req);
  } catch (err) {
    return err as Response;
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return Errors.validation('Invalid JSON body');
  }

  const { token } = body;
  if (!token || typeof token !== 'string' || token.length < 10) {
    return Errors.validation('A valid push token is required');
  }

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  const { error } = await supabase
    .from('users')
    .update({ push_token: token, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[register-push-token]', error);
    return Errors.internal('Could not register push token');
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
