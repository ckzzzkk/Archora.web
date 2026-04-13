import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../utils/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { TIER_LIMITS } from '../utils/tierLimits';

const SYNC_INTERVAL_MS = 60_000; // sync to Supabase every 60s
const STARTER_DAILY_LIMIT_SECONDS = TIER_LIMITS.starter.dailyEditTimeSeconds; // 2700 (45 min)

export function useEditTimer() {
  const user = useAuthStore((s) => s.user);
  const openModal = useUIStore((s) => s.actions.openModal);

  const accumulatedRef = useRef(0); // seconds accumulated this session
  const sessionStartRef = useRef<number | null>(null);
  const totalTodayRef = useRef(0); // total seconds today (from DB + accumulated)
  const limitReachedRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const tier = user?.subscriptionTier ?? 'starter';

  // Only track time for Starter tier
  const shouldTrack = tier === 'starter';

  const getAccumulatedSeconds = useCallback(() => {
    if (sessionStartRef.current === null) return 0;
    return Math.floor((Date.now() - sessionStartRef.current) / 1000);
  }, []);

  const syncToSupabase = useCallback(async (additionalSeconds: number) => {
    if (!user?.id || additionalSeconds <= 0) return;
    try {
      await supabase.rpc('update_edit_time', {
        p_user_id: user.id,
        p_seconds: additionalSeconds,
      });
    } catch (err) {
      console.warn('[useEditTimer] sync error:', err);
    }
  }, [user?.id]);

  const checkLimit = useCallback(() => {
    if (limitReachedRef.current) return;
    if (STARTER_DAILY_LIMIT_SECONDS < 0) return; // unlimited

    const total = totalTodayRef.current + getAccumulatedSeconds();
    if (total >= STARTER_DAILY_LIMIT_SECONDS) {
      limitReachedRef.current = true;
      openModal('edit_limit_reached');
    }
  }, [getAccumulatedSeconds, openModal]);

  const startSession = useCallback(() => {
    if (!shouldTrack) return;
    sessionStartRef.current = Date.now();
  }, [shouldTrack]);

  const pauseSession = useCallback(async () => {
    if (!shouldTrack || sessionStartRef.current === null) return;
    const elapsed = getAccumulatedSeconds();
    accumulatedRef.current += elapsed;
    totalTodayRef.current += elapsed;
    sessionStartRef.current = null;

    await syncToSupabase(elapsed);
  }, [shouldTrack, getAccumulatedSeconds, syncToSupabase]);

  // Load today's accumulated time from Supabase on mount
  useEffect(() => {
    if (!shouldTrack || !user?.id) return;

    const loadTodayTime = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('daily_edit_seconds_today, edit_date')
          .eq('id', user.id)
          .single();

        if (data) {
          const today = new Date().toISOString().split('T')[0];
          if (data.edit_date === today) {
            totalTodayRef.current = data.daily_edit_seconds_today ?? 0;
          } else {
            totalTodayRef.current = 0;
          }
        }
      } catch (err) {
        console.warn('[useEditTimer] load error:', err);
      }
    };

    loadTodayTime();
    startSession();
  }, [shouldTrack, user?.id, startSession]);

  // AppState listener to track foreground/background
  useEffect(() => {
    if (!shouldTrack) return;

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active' && prevState !== 'active') {
        startSession();
      } else if (nextState !== 'active' && prevState === 'active') {
        await pauseSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [shouldTrack, startSession, pauseSession]);

  // Periodic sync + limit check
  useEffect(() => {
    if (!shouldTrack) return;

    syncTimerRef.current = setInterval(async () => {
      if (sessionStartRef.current !== null) {
        const elapsed = getAccumulatedSeconds();
        // Only sync incremental seconds since last sync
        const sinceLastSync = elapsed - accumulatedRef.current;
        if (sinceLastSync > 0) {
          totalTodayRef.current += sinceLastSync;
          accumulatedRef.current = elapsed;
          await syncToSupabase(sinceLastSync);
        }
      }
      checkLimit();
    }, SYNC_INTERVAL_MS);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [shouldTrack, getAccumulatedSeconds, syncToSupabase, checkLimit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (shouldTrack) {
        pauseSession();
      }
    };
  }, [shouldTrack, pauseSession]);

  const getTotalSecondsToday = useCallback(() => {
    return totalTodayRef.current + getAccumulatedSeconds();
  }, [getAccumulatedSeconds]);

  const getRemainingSeconds = useCallback(() => {
    if (STARTER_DAILY_LIMIT_SECONDS < 0) return -1; // unlimited
    return Math.max(0, STARTER_DAILY_LIMIT_SECONDS - getTotalSecondsToday());
  }, [getTotalSecondsToday]);

  return {
    isTracking: shouldTrack,
    getTotalSecondsToday,
    getRemainingSeconds,
    limitReached: limitReachedRef.current,
  };
}
