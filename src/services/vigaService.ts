import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface VigaTaskStatus {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  gltfUrl: string | null;
  errorMessage: string | null;
}

export interface VigaMesh {
  id: string;
  name: string;
  category: string;
  meshUrl: string;
  thumbnailUrl: string | null;
  dimensions: { x: number; y: number; z: number };
}

/** Submit an image URL for VIGA reconstruction */
export async function submitVigaReconstruction(
  imageUrl: string,
  options: { projectId?: string; name?: string; category?: string } = {},
): Promise<{ taskId: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';

  const response = await fetch(`${SUPABASE_URL}/functions/v1/viga-request`, {
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
    throw new Error(`viga-request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json() as { taskId: string };
  return { taskId: data.taskId };
}

/** Subscribe to Realtime channel for VIGA task status updates */
export function subscribeToVigaTask(
  taskId: string,
  onUpdate: (status: VigaTaskStatus) => void,
): RealtimeChannel {
  const channel = supabase.channel(`viga_task:${taskId}`);

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'viga_tasks',
      filter: `id=eq.${taskId}`,
    },
    (payload) => {
      const row = payload.new as Record<string, unknown>;
      onUpdate({
        id: String(row.id ?? ''),
        status: (row.status as VigaTaskStatus['status']) ?? 'pending',
        gltfUrl: (row.gltf_url as string | null) ?? null,
        errorMessage: (row.error_message as string | null) ?? null,
      });
    },
  );

  channel.subscribe();

  return channel;
}

/** Unsubscribe from a VIGA task Realtime channel */
export function unsubscribeFromVigaTask(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
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
