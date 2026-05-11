import { create } from 'zustand';
import { coProjectService, type CoProject, type CoProjectMember, type ActivityEntry } from '../services/coProjectService';

interface CoProjectStore {
  coProjects: CoProject[];
  activeProject: CoProject | null;
  members: CoProjectMember[];
  activityFeed: ActivityEntry[];
  isLoading: boolean;
  error: string | null;

  fetchCoProjects: () => Promise<void>;
  fetchCoProject: (projectId: string) => Promise<void>;
  createCoProject: (name: string, blueprintId?: string) => Promise<CoProject>;
  updateCoProject: (projectId: string, updates: { name?: string; description?: string }) => Promise<void>;
  deleteCoProject: (projectId: string) => Promise<void>;
  fetchMembers: (projectId: string) => Promise<void>;
  inviteMember: (projectId: string, email: string, role: 'editor' | 'viewer') => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
  fetchActivityFeed: (projectId: string) => Promise<void>;
  addActivity: (action: string, entity?: { type: string; id: string; snapshot?: any }) => Promise<void>;
  setActiveProject: (project: CoProject | null) => void;
  clearError: () => void;
}

export const useCoProjectStore = create<CoProjectStore>((set, get) => ({
  coProjects: [],
  activeProject: null,
  members: [],
  activityFeed: [],
  isLoading: false,
  error: null,

  fetchCoProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const coProjects = await coProjectService.getCoProjects();
      set({ coProjects, isLoading: false });
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to fetch co-projects', isLoading: false });
    }
  },

  fetchCoProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await coProjectService.getCoProject(projectId);
      set({ activeProject: project, isLoading: false });
    } catch (e: any) {
      set({ activeProject: null, error: e.message ?? 'Failed to fetch co-project', isLoading: false });
    }
  },

  createCoProject: async (name: string, blueprintId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await coProjectService.createCoProject(name, blueprintId);
      set((state) => ({
        coProjects: [project, ...state.coProjects],
        isLoading: false,
      }));
      return project;
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to create co-project', isLoading: false });
      throw e;
    }
  },

  updateCoProject: async (projectId: string, updates: { name?: string; description?: string }) => {
    try {
      await coProjectService.updateCoProject(projectId, updates);
      set((state) => ({
        coProjects: state.coProjects.map((p) =>
          p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
        ),
        activeProject:
          state.activeProject?.id === projectId
            ? { ...state.activeProject, ...updates, updatedAt: new Date().toISOString() }
            : state.activeProject,
      }));
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to update co-project' });
      throw e;
    }
  },

  deleteCoProject: async (projectId: string) => {
    try {
      await coProjectService.deleteCoProject(projectId);
      set((state) => ({
        coProjects: state.coProjects.filter((p) => p.id !== projectId),
        activeProject: state.activeProject?.id === projectId ? null : state.activeProject,
      }));
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to delete co-project' });
      throw e;
    }
  },

  fetchMembers: async (projectId: string) => {
    try {
      const members = await coProjectService.getCoProjectMembers(projectId);
      set({ members });
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to fetch members' });
    }
  },

  inviteMember: async (projectId: string, email: string, role: 'editor' | 'viewer') => {
    try {
      await coProjectService.inviteToCoProject(projectId, email, role);
      await get().fetchMembers(projectId);
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to invite member' });
      throw e;
    }
  },

  removeMember: async (projectId: string, userId: string) => {
    try {
      await coProjectService.removeFromCoProject(projectId, userId);
      set((state) => ({
        members: state.members.filter((m) => m.userId !== userId),
      }));
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to remove member' });
      throw e;
    }
  },

  fetchActivityFeed: async (projectId: string) => {
    try {
      const activityFeed = await coProjectService.getActivityFeed(projectId);
      set({ activityFeed });
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to fetch activity feed' });
    }
  },

  addActivity: async (action: string, entity?: { type: string; id: string; snapshot?: any }) => {
    const { activeProject } = get();
    if (!activeProject) return;
    try {
      await coProjectService.addActivityEntry(activeProject.id, action, entity);
      await get().fetchActivityFeed(activeProject.id);
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to add activity' });
    }
  },

  setActiveProject: (project: CoProject | null) => {
    set({ activeProject: project, members: [], activityFeed: [] });
  },

  clearError: () => set({ error: null }),
}));
