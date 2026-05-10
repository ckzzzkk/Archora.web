import { supabase } from '../lib/supabase';
import type { Project, BlueprintData } from '../types';
import { toAppError } from '../types/AppError';

const VALID_BUILDING_TYPES = ['house', 'apartment', 'office', 'studio', 'villa', 'commercial'] as const;

function mapRow(row: Record<string, unknown>): Project {
  const bt = String(row.building_type ?? '');
  const buildingType = VALID_BUILDING_TYPES.includes(bt as typeof VALID_BUILDING_TYPES[number])
    ? bt : 'house';
  return {
    id: String(row.id ?? ''),
    userId: String(row.user_id ?? ''),
    name: String(row.name ?? 'Untitled'),
    buildingType: buildingType as Project['buildingType'],
    blueprintData: (row.blueprint_data ?? {}) as BlueprintData,
    thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
    isPublished: Boolean(row.is_published ?? false),
    viewCount: Number(row.view_count ?? 0),
    roomCount: Number(row.room_count ?? 0),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export const projectService = {
  async list(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw toAppError(error, 'DB_ERROR');
    return (data ?? []).map(mapRow);
  },

  async create(userId: string, name: string, buildingType: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name, building_type: buildingType })
      .select()
      .single();
    if (error) throw toAppError(error, 'DB_ERROR');
    return mapRow(data as Record<string, unknown>);
  },

  async update(id: string, _userId: string, updates: Partial<{ name: string; blueprintData: BlueprintData; thumbnailUrl: string; isPublished: boolean }>): Promise<Project> {
    // RLS enforces ownership server-side — no need for redundant client pre-check
    const VALID_KEYS = ['name', 'blueprintData', 'thumbnailUrl', 'isPublished'] as const;
    const unexpected = Object.keys(updates).filter((k) => !VALID_KEYS.includes(k as typeof VALID_KEYS[number]));
    if (unexpected.length > 0) console.warn('[projectService] update received unexpected keys:', unexpected);

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.blueprintData !== undefined) dbUpdates.blueprint_data = updates.blueprintData;
    if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
    if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;

    const { data, error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw toAppError(error, 'DB_ERROR');
    return mapRow(data as Record<string, unknown>);
  },

  async delete(id: string, _userId: string): Promise<void> {
    // RLS enforces ownership server-side
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw toAppError(error, 'DB_ERROR');
  },

  async get(id: string, _userId: string): Promise<Project> {
    // RLS enforces ownership server-side
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw toAppError(error, 'DB_ERROR');
    return mapRow(data as Record<string, unknown>);
  },
};
