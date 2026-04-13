import { supabase } from '../utils/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export const PointEvents = {
  DAILY_LOGIN: 10,
  CREATE_PROJECT: 25,
  FIRST_AI_GENERATION: 50,
  ONBOARDING_COMPLETE: 100,
  SHARE_DESIGN: 15,
  RECEIVE_LIKE: 5,
  COMPLETE_PROFILE: 30,
  FIRST_AR_SCAN: 40,
  EXPORT_DESIGN: 10,
  STREAK_MILESTONE: 75,
  PUBLISH_TEMPLATE: 20,
  TEMPLATE_SALE: 50,
  REFER_FRIEND: 100,
} as const;

export type PointEventKey = keyof typeof PointEvents;

export async function awardPoints(event: PointEventKey): Promise<number> {
  const user = useAuthStore.getState().user;
  if (!user?.id) return 0;

  const delta = PointEvents[event];

  try {
    const { data, error } = await supabase.rpc('award_points', {
      p_user_id: user.id,
      p_event: event,
      p_delta: delta,
    });

    if (error) {
      console.warn('[pointsService] award_points error:', error);
      return 0;
    }

    const newTotal = (data as { total: number } | null)?.total ?? 0;

    // Update authStore
    useAuthStore.getState().actions.updateUser({ pointsTotal: newTotal });

    // Show points toast
    useUIStore.getState().actions.showToast(`+${delta} points`, 'success');

    return newTotal;
  } catch (err) {
    console.warn('[pointsService] error:', err);
    return 0;
  }
}

export async function getPointsTotal(): Promise<number> {
  const user = useAuthStore.getState().user;
  if (!user?.id) return 0;

  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('total')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return 0;

    return data.total ?? 0;
  } catch (err) {
    console.warn('[pointsService] getPointsTotal error:', err);
    return 0;
  }
}
