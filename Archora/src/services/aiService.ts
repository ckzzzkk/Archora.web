import { supabase } from '../utils/supabaseClient';
import * as SecureStore from 'expo-secure-store';
import type { BlueprintData } from '../types';

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
  async generateFloorPlan(params: {
    prompt: string;
    buildingType: string;
    style?: string;
    roomCount?: number;
  }): Promise<BlueprintData> {
    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const err = await response.json() as { error: string; code?: string };
      throw Object.assign(new Error(err.error), { code: err.code, status: response.status });
    }

    const data = await response.json() as { blueprint: BlueprintData };
    return data.blueprint;
  },

  async transcribeAudio(audioUri: string): Promise<string> {
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

    const data = await response.json() as { transcript: string };
    return data.transcript;
  },
};
