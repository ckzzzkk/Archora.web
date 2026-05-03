import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface VigaMesh {
  id: string;
  name: string;
  category: string;
  meshUrl: string;
  thumbnailUrl: string | null;
  dimensions: { x: number; y: number; z: number };
}

/**
 * Submit an image for Meshy AI reconstruction via generate-furniture-from-image.
 * Returns the custom_furniture record ID immediately (synchronous — no realtime needed).
 */
export async function submitMeshyReconstruction(
  imageUrl: string,
  options: { projectId?: string; name?: string; category?: string } = {},
): Promise<{ meshId: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';

  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-furniture-from-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      imageUrl,
      projectId: options.projectId,
      name: options.name,
      category: options.category,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`generate-furniture-from-image failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json() as { customAsset: { id: string } };
  return { meshId: data.customAsset.id };
}

/** Fetch all custom furniture for the current user */
export async function fetchCustomFurniture(): Promise<VigaMesh[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('custom_furniture')
    .select('id, name, category, mesh_url, thumbnail_url, dimensions_x, dimensions_y, dimensions_z')
    .eq('user_id', user.id)
    .not('mesh_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    category: String(row.category ?? ''),
    meshUrl: String(row.mesh_url ?? ''),
    thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
    dimensions: {
      x: Number(row.dimensions_x ?? 0),
      y: Number(row.dimensions_y ?? 0),
      z: Number(row.dimensions_z ?? 0),
    },
  }));
}
