import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export interface StreakState {
  streakCount: number;
  didIncrease: boolean;
}

export function useStreak(): StreakState {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.actions.updateUser);
  const showToast = useUIStore((s) => s.actions.showToast);

  const [streakCount, setStreakCount] = useState(user?.streakCount ?? 0);
  const [didIncrease, setDidIncrease] = useState(false);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!user?.id || hasRunRef.current) return;
    hasRunRef.current = true;

    const updateStreak = async () => {
      try {
        const { data, error } = await supabase.rpc('update_streak', {
          p_user_id: user.id,
        });

        if (error) {
          console.warn('[useStreak] RPC error:', error);
          return;
        }

        const result = data as { streak_count: number; increased: boolean } | null;
        if (!result) return;

        const { streak_count, increased } = result;

        setStreakCount(streak_count);
        setDidIncrease(increased);

        // Update authStore so other screens see latest streak
        updateUser({ streakCount: streak_count });

        if (increased && streak_count > 1) {
          showToast(`🔥 ${streak_count} day streak!`, 'success');

          // Award bonus points at milestones
          if (streak_count === 7 || streak_count === 30 || streak_count === 100) {
            // Import lazily to avoid circular deps
            const { awardPoints } = await import('../services/pointsService');
            await awardPoints('STREAK_MILESTONE');
          }
        }
      } catch (err) {
        console.warn('[useStreak] error:', err);
        showToast('Could not update streak', 'error');
      }
    };

    updateStreak();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { streakCount, didIncrease };
}
