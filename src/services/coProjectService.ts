import { supabase } from '../lib/supabase';
import { toAppError } from '../types/AppError';

export interface CoProject {
  id: string;
  name: string;
  description?: string;
  blueprintId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  yourRole?: 'owner' | 'editor' | 'viewer';
}

export interface CoProjectMember {
  id: string;
  projectId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
}

export interface ActivityEntry {
  id: string;
  projectId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entitySnapshot?: any;
  architectInsights?: string[];
  createdAt: string;
}

async function getCoProjects(): Promise<CoProject[]> {
  const { data, error } = await supabase
    .from('co_projects')
    .select('*, member_count:auto_project_members(count)')
    .order('updated_at', { ascending: false });
  if (error) throw toAppError(error, 'DB_ERROR');
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    blueprintId: row.blueprint_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    memberCount: row.member_count?.[0]?.count ?? 0,
    yourRole: row.your_role,
  }));
}

async function getCoProject(projectId: string): Promise<CoProject | null> {
  const { data, error } = await supabase
    .from('co_projects')
    .select('*, member_count:auto_project_members(count)')
    .eq('id', projectId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw toAppError(error, 'DB_ERROR');
  }
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    blueprintId: data.blueprint_id,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    memberCount: data.member_count?.[0]?.count ?? 0,
    yourRole: data.your_role,
  };
}

async function createCoProject(name: string, blueprintId?: string): Promise<CoProject> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('co_projects')
    .insert({ name, blueprint_id: blueprintId, created_by: user.id })
    .select()
    .single();
  if (error) throw toAppError(error, 'DB_ERROR');

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    blueprintId: data.blueprint_id,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    memberCount: 1,
    yourRole: 'owner',
  };
}

async function updateCoProject(
  projectId: string,
  updates: { name?: string; description?: string },
): Promise<void> {
  const { error } = await supabase
    .from('co_projects')
    .update({ name: updates.name, description: updates.description, updated_at: new Date().toISOString() })
    .eq('id', projectId);
  if (error) throw toAppError(error, 'DB_ERROR');
}

async function deleteCoProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('co_projects')
    .delete()
    .eq('id', projectId);
  if (error) throw toAppError(error, 'DB_ERROR');
}

async function getCoProjectMembers(projectId: string): Promise<CoProjectMember[]> {
  const { data, error } = await supabase
    .from('co_project_members')
    .select('*, profiles(display_name, avatar_url)')
    .eq('project_id', projectId)
    .order('joined_at', { ascending: true });
  if (error) throw toAppError(error, 'DB_ERROR');
  return (data ?? []).map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    displayName: row.profiles?.display_name ?? 'Unknown',
    avatarUrl: row.profiles?.avatar_url,
    role: row.role,
    joinedAt: row.joined_at,
  }));
}

async function inviteToCoProject(
  projectId: string,
  email: string,
  role: 'editor' | 'viewer',
): Promise<void> {
  // Look up user by email
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .single();
  if (profileError) throw new Error('User not found');

  const { error } = await supabase
    .from('co_project_members')
    .insert({ project_id: projectId, user_id: profileData.user_id, role });
  if (error) throw toAppError(error, 'DB_ERROR');
}

async function removeFromCoProject(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('co_project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (error) throw toAppError(error, 'DB_ERROR');
}

async function getActivityFeed(projectId: string, limit = 20): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from('co_project_activity')
    .select('*, profiles(display_name, avatar_url)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw toAppError(error, 'DB_ERROR');
  return (data ?? []).map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    displayName: row.profiles?.display_name ?? 'Unknown',
    avatarUrl: row.profiles?.avatar_url,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entitySnapshot: row.entity_snapshot,
    architectInsights: row.architect_insights,
    createdAt: row.created_at,
  }));
}

async function addActivityEntry(
  projectId: string,
  action: string,
  entity?: { type: string; id: string; snapshot?: any },
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('co_project_activity')
    .insert({
      project_id: projectId,
      user_id: user.id,
      action,
      entity_type: entity?.type,
      entity_id: entity?.id,
      entity_snapshot: entity?.snapshot,
    });
  if (error) throw toAppError(error, 'DB_ERROR');
}

export const coProjectService = {
  getCoProjects,
  getCoProject,
  createCoProject,
  updateCoProject,
  deleteCoProject,
  getCoProjectMembers,
  inviteToCoProject,
  removeFromCoProject,
  getActivityFeed,
  addActivityEntry,
};
