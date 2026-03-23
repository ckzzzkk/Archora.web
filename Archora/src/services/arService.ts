import { supabase } from '../utils/supabaseClient';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ARScanResult {
  scanId: string;
  meshUrl: string | null;
  roomDimensions: { width: number; height: number; depth: number };
  detectedObjects: { label: string; confidence: number; boundingBox: number[] }[];
  status: 'processing' | 'complete' | 'failed';
}

export const arService = {
  async uploadScanFrame(frameUri: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const fileName = `ar-frames/${session.user.id}/${Date.now()}.jpg`;
    const response = await fetch(frameUri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('ar-scans')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from('ar-scans').getPublicUrl(fileName);
    return data.publicUrl;
  },

  async startReconstruction(frameUrls: string[]): Promise<ARScanResult> {
    const headers = await getAuthHeader();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ar-reconstruct`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ frameUrls }),
    });

    if (!response.ok) {
      const err = await response.json() as { error: string };
      throw new Error(err.error);
    }

    return response.json() as Promise<ARScanResult>;
  },

  async getScanStatus(scanId: string): Promise<ARScanResult> {
    const { data, error } = await supabase
      .from('ar_scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (error) throw error;
    const row = data as Record<string, unknown>;

    return {
      scanId: row.id as string,
      meshUrl: row.mesh_url as string | null,
      roomDimensions: (row.room_dimensions as ARScanResult['roomDimensions']) ?? { width: 0, height: 0, depth: 0 },
      detectedObjects: (row.detected_objects as ARScanResult['detectedObjects']) ?? [],
      status: row.status as ARScanResult['status'],
    };
  },

  async checkMeshyStatus(scanId: string): Promise<ARScanResult> {
    const headers = await getAuthHeader();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/ar-scan-status?scanId=${encodeURIComponent(scanId)}`,
      { headers },
    );

    if (!response.ok) {
      const err = await response.json() as { error: string };
      throw new Error(err.error);
    }

    return response.json() as Promise<ARScanResult>;
  },

  async listScans(): Promise<ARScanResult[]> {
    const { data, error } = await supabase
      .from('ar_scans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        scanId: r.id as string,
        meshUrl: r.mesh_url as string | null,
        roomDimensions: (r.room_dimensions as ARScanResult['roomDimensions']) ?? { width: 0, height: 0, depth: 0 },
        detectedObjects: (r.detected_objects as ARScanResult['detectedObjects']) ?? [],
        status: r.status as ARScanResult['status'],
      };
    });
  },
};
