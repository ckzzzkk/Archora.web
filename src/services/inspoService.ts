import { supabase } from '../lib/supabase';
import type { Template, Comment } from '../types';

function mapTemplate(row: Record<string, unknown>): Template {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: row.description as string | null,
    thumbnailUrl: row.thumbnail_url as string | null,
    price: row.price as number,
    isFeatured: row.is_featured as boolean,
    downloadCount: row.download_count as number,
    buildingType: row.building_type as string,
    style: row.style as string | null,
    likeCount: (row.like_count as number) ?? 0,
    saveCount: (row.save_count as number) ?? 0,
    avgRating: (row.avg_rating as number) ?? 0,
    ratingCount: (row.rating_count as number) ?? 0,
    authorDisplayName: (row.author_display_name as string) ?? 'Unknown',
    authorAvatarUrl: row.author_avatar_url as string | null,
    isLiked: (row.is_liked as boolean) ?? false,
    isSaved: (row.is_saved as boolean) ?? false,
    userRating: row.user_rating as number | null,
    createdAt: row.created_at as string,
  };
}

function mapComment(row: Record<string, unknown>): Comment {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    templateId: row.template_id as string,
    parentId: row.parent_id as string | null,
    body: row.body as string,
    isDeleted: (row.is_deleted as boolean) ?? false,
    authorDisplayName: (row.author_display_name as string) ?? 'Unknown',
    authorAvatarUrl: row.author_avatar_url as string | null,
    replies: [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function buildCommentTree(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  const roots: Comment[] = [];
  map.forEach((c) => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

export const inspoService = {
  async getFeed(params: { page?: number; limit?: number; buildingType?: string; style?: string } = {}): Promise<Template[]> {
    const { page = 0, limit = 20, buildingType, style } = params;
    let query = supabase
      .from('templates_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (buildingType) query = query.eq('building_type', buildingType);
    if (style) query = query.eq('style', style);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r) => mapTemplate(r as Record<string, unknown>));
  },

  async getFeatured(): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates_feed')
      .select('*')
      .eq('is_featured', true)
      .limit(10);
    if (error) throw error;
    return (data ?? []).map((r) => mapTemplate(r as Record<string, unknown>));
  },

  async getTemplate(id: string): Promise<Template> {
    const { data, error } = await supabase
      .from('templates_feed')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapTemplate(data as Record<string, unknown>);
  },

  async getComments(templateId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments_with_author')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const flat = (data ?? []).map((r) => mapComment(r as Record<string, unknown>));
    return buildCommentTree(flat);
  },

  async likeTemplate(templateId: string, userId: string): Promise<void> {
    await supabase.from('likes').upsert({ template_id: templateId, user_id: userId }, { onConflict: 'user_id,template_id' });
  },

  async unlikeTemplate(templateId: string, userId: string): Promise<void> {
    await supabase.from('likes').delete().eq('template_id', templateId).eq('user_id', userId);
  },

  async rateTemplate(templateId: string, userId: string, score: number): Promise<void> {
    await supabase.from('ratings').upsert(
      { template_id: templateId, user_id: userId, score },
      { onConflict: 'user_id,template_id' },
    );
  },

  async postComment(templateId: string, userId: string, content: string): Promise<void> {
    await supabase.from('comments').insert({ template_id: templateId, user_id: userId, body: content });
  },

  async saveTemplate(templateId: string, userId: string): Promise<void> {
    await supabase.from('saves').upsert({ template_id: templateId, user_id: userId }, { onConflict: 'user_id,template_id' });
  },

  async unsaveTemplate(templateId: string, userId: string): Promise<void> {
    await supabase.from('saves').delete().eq('template_id', templateId).eq('user_id', userId);
  },

  async getSavedTemplates(userId: string): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates_feed')
      .select('*, saves!inner(user_id)')
      .eq('saves.user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => mapTemplate(r as Record<string, unknown>));
  },

  async getMyTemplates(userId: string): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates_feed')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => mapTemplate(r as Record<string, unknown>));
  },

  async publishTemplate(params: {
    userId: string;
    projectId: string;
    name: string;
    description?: string;
    price?: number;
    buildingType?: string;
    style?: string;
    thumbnailUrl?: string;
    blueprintData?: Record<string, unknown>;
  }): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: params.userId,
        project_id: params.projectId,
        title: params.name,
        description: params.description ?? null,
        price: params.price ?? 0,
        building_type: params.buildingType ?? 'house',
        style: params.style ?? null,
        thumbnail_url: params.thumbnailUrl ?? null,
        blueprint_data: params.blueprintData ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    // Fresh fetch from view to get aggregated fields
    return inspoService.getTemplate((data as { id: string }).id);
  },

  async incrementDownload(templateId: string): Promise<void> {
    await supabase.rpc('increment_template_download', { p_template_id: templateId });
  },
};
