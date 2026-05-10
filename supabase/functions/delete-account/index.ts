import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { securityHeaders } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { logAudit } from '../_shared/audit.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: securityHeaders });
  if (req.method !== 'POST') return Errors.notFound();

  try {
    const user = await getAuthUser(req);

    // Strict limit — account deletion is irreversible
    const allowed = await checkRateLimit(`delete-account:${user.id}`, 3, 3600);
    if (!allowed) return Errors.rateLimited('Too many requests');

    const supabaseAdmin = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    // Step 1: Delete all user data via SECURITY DEFINER RPC.
    // Order inside RPC: audit_logs → ratings/likes/saves/comments → ar_scans →
    //   ai_generations → subscriptions → templates → projects
    // public.users is NOT deleted here — auth.admin.deleteUser cascades to it.
    const { error: rpcError } = await supabaseAdmin.rpc('delete_user_data', {
      p_user_id: user.id,
    });

    if (rpcError) {
      console.error('[delete-account] delete_user_data RPC failed:', rpcError.message);
      // Do NOT proceed to deleteUser if data deletion failed — leave account intact
      return Errors.internal();
    }

    // Step 2: Remove from auth.users — cascades to public.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authError) {
      // Data is already deleted but auth entry remains — log as critical
      console.error('[delete-account] auth.admin.deleteUser failed after data deletion:', authError.message);
      return Errors.internal();
    }

    await logAudit({
      user_id: user.id,
      action: 'account_deleted',
      resource_type: 'user',
      metadata: { email: user.email },
    }).catch(() => {
      // Best-effort — user row is already gone so this may fail
    });

    return new Response(JSON.stringify({ deleted: true }), {
      status: 200,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[delete-account]', err);
    return Errors.internal();
  }
});
