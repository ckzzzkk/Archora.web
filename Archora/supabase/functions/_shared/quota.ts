import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function checkQuota(
  userId: string,
  quotaType: 'ai_generation' | 'ar_scan',
): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await supabase.rpc('quota_check', {
    p_user_id: userId,
    p_quota_type: quotaType,
  });

  if (error) {
    console.error('Quota check error:', error);
    return false;
  }

  return data as boolean;
}
