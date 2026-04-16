import { useCallback, useEffect, useState } from 'react';
import { aiService } from '../services/aiService';
import type { GenerationPayload } from '../types/generation';
import type { UserPreferences } from '../services/aiService';
import { useAuth } from './useAuth';

export function useGenerationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefilledFromDb, setPrefilledFromDb] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    aiService.fetchUserPreferences(user.id).then(data => {
      if (!cancelled) {
        setPreferences(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  const save = useCallback(async (payload: Partial<GenerationPayload>) => {
    if (!user?.id) return;
    try {
      await aiService.upsertUserPreferences(user.id, payload);
      const updated = await aiService.fetchUserPreferences(user.id);
      setPreferences(updated);
    } catch (err) {
      console.error('[useGenerationPreferences] save failed:', err);
    }
  }, [user?.id]);

  return { preferences, loading, prefilledFromDb, setPrefilledFromDb, save };
}