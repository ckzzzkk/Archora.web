import { supabase } from '../lib/supabase';
import type { Project, BlueprintData } from '../types';

function mapRow(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    buildingType: row.building_type as Project['buildingType'],
    blueprintData: (row.blueprint_data ?? {}) as BlueprintData,
    thumbnailUrl: row.thumbnail_url as string | null,
    isPublished: row.is_published as boolean,
    viewCount: row.view_count as number,
    roomCount: row.room_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const projectService = {
  async list(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async create(userId: string, name: string, buildingType: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name, building_type: buildingType })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },

  async update(id: string, userId: string, updates: Partial<{ name: string; blueprintData: BlueprintData; thumbnailUrl: string; isPublished: boolean }>): Promise<Project> {
    // Ownership verification — user must own this project
    const { data: existing } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();
    if (!existing || existing.user_id !== userId) {
      throw new Error('Not authorized to update this project');
    }

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
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },

  async delete(id: string, userId: string): Promise<void> {
    // Ownership verification — user must own this project
    const { data: existing } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();
    if (!existing || existing.user_id !== userId) {
      throw new Error('Not authorized to delete this project');
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  async get(id: string, userId: string): Promise<Project> {
    // Ownership verification — user must own this project
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },
};
