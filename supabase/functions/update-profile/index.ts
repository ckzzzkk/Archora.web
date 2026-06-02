import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { securityHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { logAudit } from '../_shared/audit.ts';

const RequestSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  avatar_url: z.string().url().optional(),
}).refine(
  (data) => data.display_name !== undefined || data.avatar_url !== undefined,
  { message: 'At least one field must be provided' },
);

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: securityHeaders });
  if (req.method !== 'POST') return Errors.notFound();

  try {
    const user = await getAuthUser(req);

    const allowed = await checkRateLimit(`update-profile:${user.id}`, 20, 60);
    if (!allowed) return Errors.rateLimited('Too many profile update requests');

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request body', parsed.error.flatten());

    const supabaseAdmin = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    const updates: Record<string, string> = {};
    if (parsed.data.display_name !== undefined) updates.display_name = parsed.data.display_name;
    if (parsed.data.avatar_url !== undefined) updates.avatar_url = parsed.data.avatar_url;

    const { error } = await supabaseAdmin.from('users').update(updates).eq('id', user.id);
    if (error) {
      console.error('[update-profile] DB update failed:', error.message);
      return Errors.internal();
    }

    await logAudit({
      user_id: user.id,
      action: 'profile_update',
      resource_type: 'user',
      metadata: { fields_updated: Object.keys(updates) },
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[update-profile]', err);
    return Errors.internal();
  }
});
