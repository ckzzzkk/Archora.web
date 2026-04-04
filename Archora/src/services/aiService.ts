import { supabase } from '../utils/supabaseClient';
import type { BlueprintData } from '../types';
import type { GenerationPayload } from '../types/generation';

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

      const data = await response.json() as { blueprint: BlueprintData };
      if (!data.blueprint || !Array.isArray(data.blueprint.rooms)) {
        throw Object.assign(new Error('Invalid response from AI'), { code: 'INVALID_RESPONSE' });
      }
      return data.blueprint;
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
      throw err;
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
          throw Object.assign(new Error('AI features coming soon'), { code: 'AI_NOT_CONFIGURED' });
        }
      }

      if (!response.ok) {
        const err = await response.json() as { error: string };
        throw Object.assign(new Error(err.error ?? 'AI blueprint edit failed'), { status: response.status });
      }

      return response.json() as Promise<{ message: string; blueprint?: BlueprintData }>;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw Object.assign(new Error('Request timed out'), { code: 'TIMEOUT' });
      }
      throw err instanceof Error ? err : new Error('Blueprint edit failed');
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
    } catch {
      throw new Error('Failed to save preferences');
    }
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
    } catch {
      return null;
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
      throw err instanceof Error ? err : new Error('Transcription failed');
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
