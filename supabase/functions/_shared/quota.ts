import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireEnv } from './errors.ts';
import { getArchitectMultiplier } from './aiLimits.ts';

export type QuotaType = 'ai_generation' | 'ai_edit' | 'render' | 'ar_scan' | 'viga';

export async function checkQuota(
  userId: string,
  quotaType: QuotaType,
  options?: { architectId?: string },
): Promise<boolean> {
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  // Token multiplier for architect complexity
  const multiplier = options?.architectId ? getArchitectMultiplier(options.architectId) : 1;

  const { data, error } = await supabase.rpc('quota_check', {
    p_user_id: userId,
    p_quota_type: quotaType,
    p_multiplier: multiplier,
  });

  if (error) {
    console.error('Quota check error:', error);
    return false;
  }

  return data as boolean;
}