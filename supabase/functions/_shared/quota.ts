import type { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Checks whether the user has remaining quota for the given feature.
 * Calls the quota_check RPC — returns true if allowed, false/error if exceeded.
 * Throws a Response with 429 if quota is exceeded.
 */
export async function checkQuota(
  supabase: SupabaseClient,
  userId: string,
  feature: string,
): Promise<void> {
  const { data, error } = await supabase.rpc('quota_check', {
    p_user_id: userId,
    p_feature: feature,
  });

  if (error || !data) {
    throw new Response(
      JSON.stringify({ error: 'Quota exceeded', code: 'QUOTA_EXCEEDED' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
