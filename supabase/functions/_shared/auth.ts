import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getArchitectMultiplier } from './aiLimits.ts';
import { requireEnv } from './errors.ts';

export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Response(
      JSON.stringify({ error: 'Invalid token', code: 'AUTH_INVALID' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return user;
}

export async function requireOwnership(
  supabaseAdmin: ReturnType<typeof createClient>,
  table: string,
  resourceId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('user_id')
    .eq('id', resourceId)
    .single();

  if (error || !data) {
    throw new Response(
      JSON.stringify({ error: 'Not found', code: 'NOT_FOUND' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if ((data as { user_id: string }).user_id !== userId) {
    throw new Response(
      JSON.stringify({ error: 'Forbidden', code: 'FORBIDDEN' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
