import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from '../auth/useSession';
import { useUIStore } from '../stores/uiStore';

export interface StreakState {
  streakCount: number;
  didIncrease: boolean;
}

export function useStreak(): StreakState {
  const { user } = useSession();
  const showToast = useUIStore((s) => s.actions.showToast);

  const [streakCount, setStreakCount] = useState(user?.streakCount ?? 0);
  const [didIncrease, setDidIncrease] = useState(false);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!user?.id || hasRunRef.current) return;

    const updateStreak = async () => {
      try {
        const { data, error } = await supabase.rpc('update_streak', {
          p_user_id: user.id,
        });

        if (error) {
          console.warn('[useStreak] RPC error:', error);
          // Reset so retry is possible on next mount
          hasRunRef.current = false;
          return;
        }

        const result = data as { streak_count: number; increased: boolean } | null;
        if (!result) return;

        hasRunRef.current = true; // Mark success only after successful RPC

        const { streak_count, increased } = result;

        setStreakCount(streak_count);
        setDidIncrease(increased);

        // AuthProvider will re-fetch user data via onAuthStateChange
        // No manual update needed

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
        hasRunRef.current = false;
        showToast('Could not update streak', 'error');
      }
    };

    updateStreak();
    return () => {
      hasRunRef.current = false;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { streakCount, didIncrease };
}
