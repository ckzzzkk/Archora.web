import { supabase } from '../lib/supabase';
import { toAppError } from '../types/AppError';
import type { RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface VigaMesh {
  id: string;
  name: string;
  category: string;
  /** null while Meshy is still processing */
  meshUrl: string | null;
  thumbnailUrl: string | null;
  dimensions: { x: number; y: number; z: number };
  status: 'ready' | 'processing';
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

export interface FurnitureTaskStatus {
  taskId: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  progress: number;
  meshUrl: string | null;
  thumbnailUrl: string | null;
  customFurnitureId: string | null;
  error: string | null;
}

/**
 * Poll the async Meshy generation behind generate-furniture-from-image.
 * `taskId` is the meshTaskId returned by that function.
 */
export async function getFurnitureTaskStatus(taskId: string): Promise<FurnitureTaskStatus> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/furniture-task-status?taskId=${encodeURIComponent(taskId)}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`furniture-task-status failed (${response.status}): ${errorBody}`);
  }

  return await response.json() as FurnitureTaskStatus;
}

/**
 * Poll until the furniture task completes or fails. Resolves with the final
 * status; rejects only on network/auth errors. `onProgress` fires per poll.
 */
export async function waitForFurnitureTask(
  taskId: string,
  options: { intervalMs?: number; timeoutMs?: number; onProgress?: (s: FurnitureTaskStatus) => void } = {},
): Promise<FurnitureTaskStatus> {
  const intervalMs = options.intervalMs ?? 5000;
  const timeoutMs = options.timeoutMs ?? 5 * 60 * 1000;
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const status = await getFurnitureTaskStatus(taskId);
    options.onProgress?.(status);
    if (status.status === 'done' || status.status === 'failed') return status;
    if (Date.now() + intervalMs > deadline) return status; // still processing — caller decides
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/** Fetch all custom furniture for the current user */
export async function fetchCustomFurniture(): Promise<VigaMesh[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('custom_furniture')
    .select('id, name, category, mesh_url, thumbnail_url, dimensions_x, dimensions_y, dimensions_z')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw toAppError(error, 'DB_ERROR');

  return (data ?? []).map((row) => ({
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    category: String(row.category ?? ''),
    meshUrl: (row.mesh_url as string | null) ?? null,
    thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
    dimensions: {
      x: Number(row.dimensions_x ?? 0),
      y: Number(row.dimensions_y ?? 0),
      z: Number(row.dimensions_z ?? 0),
    },
    status: row.mesh_url ? 'ready' : 'processing',
  } as VigaMesh));
}
