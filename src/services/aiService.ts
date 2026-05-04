import { supabase } from '../lib/supabase';
import type { BlueprintData } from '../types';
import type { GenerationPayload, QuestionCategory } from '../types/generation';
import type { ChatMessage } from '../types/blueprint';
import type { Tier } from '../utils/tierLimits';
import { validateBlueprintData } from '../utils/blueprintValidation';
import { toAppError } from '../types/AppError';

export interface UserPreferences {
  user_id: string;
  building_type: string | null;
  style_id: string | null;
  plot_size: number | null;
  plot_unit: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  has_pool: boolean | null;
  has_garden: boolean | null;
  has_garage: boolean | null;
  has_home_office: boolean | null;
  has_utility_room: boolean | null;
  last_used_at: string | null;
  created_at: string | null;
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const aiService = {
  async generateFloorPlan(params: Partial<GenerationPayload> & {
    prompt?: string;
    buildingType: string;
    style?: string;
    roomCount?: number;
  }): Promise<BlueprintData> {
    const headers = await getAuthHeader();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 503) {
        const body = await response.json() as { error?: string };
        if (body.error === 'AI_NOT_CONFIGURED') {
          throw Object.assign(new Error('AI features coming soon'), {
            code: 'AI_NOT_CONFIGURED',
            status: 503,
          });
        }
      }

      if (!response.ok) {
        const err = await response.json() as { error: string; code?: string };
        throw Object.assign(new Error(err.error), { code: err.code, status: response.status });
      }

      const raw = await response.json();
      // Support both old edge function (raw BlueprintData) and new ({ blueprint: BlueprintData })
      const rawBlueprint = (raw && typeof raw === 'object' && 'blueprint' in raw)
        ? (raw as { blueprint: BlueprintData }).blueprint
        : (raw as BlueprintData);

      // Validate AI-generated blueprint against schema to prevent malformed/injected data
      const validation = validateBlueprintData(rawBlueprint);
      if (!validation.valid || !validation.data) {
        console.error('[aiService] Blueprint validation failed:', validation.errors);
        throw Object.assign(new Error('Invalid response from AI'), {
          code: 'INVALID_RESPONSE',
          details: validation.errors,
        });
      }
      return validation.data as BlueprintData;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        const e = new Error('Request timed out') as Error & { code: string };
        e.code = 'TIMEOUT';
        throw e;
      }
      if (err instanceof TypeError && (err.message.includes('Network request failed') || err.message.includes('Failed to fetch'))) {
        const e = new Error('Network error') as Error & { code: string };
        e.code = 'NETWORK';
        throw e;
      }
      throw toAppError(err, 'GENERATION_FAILED');
    }
  },

  async editBlueprint(params: {
    prompt: string;
    blueprint: BlueprintData;
  }): Promise<{ message: string; blueprint?: BlueprintData }> {
    const headers = await getAuthHeader();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-edit-blueprint`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 503) {
        const body = await response.json() as { error?: string };
        if (body.error === 'AI_NOT_CONFIGURED') {
          throw Object.assign(new Error('AI features coming soon'), { code: 'AI_NOT_CONFIGURED', status: 503 });
        }
      }

      if (!response.ok) {
        const err = await response.json() as { error: string; code?: string };
        const e = new Error(err.error ?? 'AI blueprint edit failed') as Error & { code?: string; status?: number };
        e.code = 'AI_EDIT_FAILED';
        e.status = response.status;
        throw e;
      }

      return response.json() as Promise<{ message: string; blueprint?: BlueprintData }>;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        const e = new Error('Request timed out') as Error & { code: string };
        e.code = 'TIMEOUT';
        throw e;
      }
      throw toAppError(err, 'AI_EDIT_FAILED');
    }
  },

  async refineSketch(blueprintId: string): Promise<BlueprintData> {
    const headers = await getAuthHeader();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-sketch-refine`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ blueprintId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response.json() as { error: string; code?: string };
        const e = new Error(err.error ?? 'Sketch refinement failed') as Error & { code?: string; status?: number };
        e.code = 'REFINE_FAILED';
        e.status = response.status;
        throw e;
      }

      const { refined } = await response.json() as { refined: BlueprintData };
      return refined;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        const e = new Error('Request timed out') as Error & { code: string };
        e.code = 'TIMEOUT';
        throw e;
      }
      throw toAppError(err, 'REFINE_FAILED');
    }
  },

  async upsertUserPreferences(userId: string, payload: Partial<GenerationPayload>): Promise<void> {
    try {
      await supabase.from('user_ai_preferences').upsert({
        user_id: userId,
        building_type: payload.buildingType,
        style_id: payload.style,
        plot_size: payload.plotSize,
        plot_unit: payload.plotUnit ?? 'm2',
        bedrooms: payload.bedrooms,
        bathrooms: payload.bathrooms,
        has_pool: payload.hasPool ?? false,
        has_garden: payload.hasGarden ?? false,
        has_garage: payload.hasGarage ?? false,
        has_home_office: payload.hasHomeOffice ?? false,
        has_utility_room: payload.hasUtilityRoom ?? false,
        last_used_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (err: unknown) {
      throw toAppError(err, 'PREFERENCES_FAILED');
    }
  },

  async fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data } = await supabase
      .from('user_ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return data;
  },

  async uploadReferenceImage(userId: string, uri: string): Promise<string | null> {
    try {
      const path = `${userId}/${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('reference-images').upload(path, blob, {
        upsert: true,
        contentType: 'image/jpeg',
      });
      if (error) return null;
      const { data } = supabase.storage.from('reference-images').getPublicUrl(path);
      return data.publicUrl;
    } catch (err: unknown) {
      throw toAppError(err, 'IMAGE_UPLOAD_FAILED');
    }
  },

  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      const headers = await getAuthHeader();
      delete headers['Content-Type']; // FormData sets its own

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as unknown as Blob);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/transcribe`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, Authorization: headers.Authorization ?? '' },
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json() as { transcript?: string; fallback?: string };

      if (data.fallback === 'device_speech') {
        throw Object.assign(new Error('device_speech'), { code: 'DEVICE_SPEECH_FALLBACK' });
      }

      return data.transcript ?? '';
    } catch (err) {
      throw toAppError(err, 'TRANSCRIPTION_FAILED');
    }
  },

  /** Create a generation session row for Realtime progress tracking. Returns the session ID. */
  async createGenerationSession(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('generation_sessions')
      .insert({ user_id: userId, status: 'pending', iteration: 0, total_iterations: 3 })
      .select('id')
      .single();
    if (error || !data) throw toAppError(error, 'SESSION_FAILED');
    return (data as { id: string }).id;
  },

  /**
   * Iterative optimal generation:
   * 1. Subscribes to Realtime on the session row
   * 2. Calls ai-generate-optimal (which does up to 3 generate→score→refine loops)
   * 3. Calls onProgress with each session update
   * 4. Returns the highest-scoring blueprint
   */
  async generateOptimal(
    payload: Partial<GenerationPayload> & { buildingType: string; style?: string },
    sessionId: string,
    onProgress?: (update: {
      status: string;
      iteration: number;
      message: string;
      scores: Array<{ n: number; score: number; keyChange: string }>;
    }) => void,
  ): Promise<BlueprintData> {
    // Subscribe to session progress via Realtime
    const channel = supabase
      .channel(`gen-session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'generation_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (event) => {
          const row = event.new as Record<string, unknown>;
          onProgress?.({
            status:    (row.status as string) ?? 'generating',
            iteration: (row.iteration as number) ?? 1,
            message:   (row.current_message as string) ?? '',
            scores:    (row.iteration_scores as Array<{ n: number; score: number; keyChange: string }>) ?? [],
          });
        },
      )
      .subscribe();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate-optimal`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...payload, sessionId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 503) {
        const body = await response.json() as { error?: string };
        if (body.error === 'AI_NOT_CONFIGURED') {
          throw Object.assign(new Error('AI features coming soon'), { code: 'AI_NOT_CONFIGURED', status: 503 });
        }
        throw Object.assign(new Error('Service unavailable'), { code: body.error ?? 'UNAVAILABLE' });
      }

      if (!response.ok) {
        const err = await response.json() as { error: string; code?: string };
        throw Object.assign(new Error(err.error), { code: err.code, status: response.status });
      }

      const raw = await response.json();
      const rawBlueprint = (raw && typeof raw === 'object' && 'blueprint' in raw)
        ? (raw as { blueprint: BlueprintData }).blueprint
        : (raw as BlueprintData);

      // Validate AI-generated blueprint against schema
      const validation = validateBlueprintData(rawBlueprint);
      if (!validation.valid || !validation.data) {
        console.error('[aiService] generateOptimal validation failed:', validation.errors);
        throw Object.assign(new Error('Invalid response from AI'), {
          code: 'INVALID_RESPONSE',
          details: validation.errors,
        });
      }
      return validation.data as BlueprintData;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        const e = new Error('Request timed out') as Error & { code: string };
        e.code = 'TIMEOUT';
        throw e;
      }
      if (err instanceof TypeError && err.message.includes('Network')) {
        const e = new Error('Network error') as Error & { code: string };
        e.code = 'NETWORK';
        throw e;
      }
      throw toAppError(err, 'GENERATION_FAILED');
    } finally {
      await supabase.removeChannel(channel);
    }
  },

  async consultWithArchitect(params: {
    tier: Tier;
    architectId: string | null;
    conversationHistory: ChatMessage[];
    currentPayload: Partial<GenerationPayload>;
    sessionId?: string;
  }): Promise<{
    message: string;
    suggestedReplies: string[];
    updatedPayload: Partial<GenerationPayload>;
    isComplete: boolean;
    nextCategory: QuestionCategory;
    sessionId: string;
  }> {
    const headers = await getAuthHeader();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-architect-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tier: params.tier,
          architectId: params.architectId,
          conversationHistory: params.conversationHistory,
          currentPayload: params.currentPayload,
          sessionId: params.sessionId,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 503) {
        const body = await response.json() as { error?: string };
        if (body.error === 'AI_NOT_CONFIGURED') {
          throw Object.assign(new Error('AI features coming soon'), {
            code: 'AI_NOT_CONFIGURED',
            status: 503,
          });
        }
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Consultation failed' })) as { error: string };
        const e = new Error(err.error ?? 'Consultation failed') as Error & { code?: string; status?: number };
        e.code = 'CONSULT_FAILED';
        e.status = response.status;
        throw e;
      }

      return response.json() as Promise<{
        message: string;
        suggestedReplies: string[];
        updatedPayload: Partial<GenerationPayload>;
        isComplete: boolean;
        nextCategory: QuestionCategory;
        sessionId: string;
      }>;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        const e = new Error('Request timed out') as Error & { code: string };
        e.code = 'TIMEOUT';
        throw e;
      }
      if (err instanceof TypeError && (err.message.includes('Network request failed') || err.message.includes('Failed to fetch'))) {
        const e = new Error('Network error') as Error & { code: string };
        e.code = 'NETWORK';
        throw e;
      }
      throw toAppError(err, 'CONSULT_FAILED');
    }
  },
};

// Named export matching the spec's generateBlueprint signature.
// Placed after aiService to avoid temporal dead zone reference.
export const generateBlueprint = async (params: {
  prompt:       string;
  buildingType: GenerationPayload['buildingType'];
  style:        string;
}): Promise<BlueprintData> => aiService.generateFloorPlan(params);
