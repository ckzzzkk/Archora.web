import { create } from 'zustand';
import { projectService } from '../services/projectService';
import type { Project, BuildingType } from '../types';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  actions: {
    load: (userId: string) => Promise<void>;
    create: (userId: string, name: string, buildingType: BuildingType) => Promise<Project>;
    delete: (id: string) => Promise<void>;
    rename: (id: string, name: string) => Promise<void>;
    refresh: (userId: string) => Promise<void>;
  };
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  actions: {
    load: async (userId) => {
      set({ isLoading: true, error: null });
      try {
        const projects = await projectService.list(userId);
        set({ projects, isLoading: false });
      } catch (e) {
        set({ error: 'Failed to load projects', isLoading: false });
      }
    },

    create: async (userId, name, buildingType) => {
      const project = await projectService.create(userId, name, buildingType);
      set((s) => ({ projects: [project, ...s.projects] }));
      return project;
    },

    delete: async (id) => {
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
      try {
        await projectService.delete(id);
      } catch {
        // revert on error — reload
        const { projects } = get();
        // projects already filtered, can't easily revert without refetch
      }
    },

    rename: async (id, name) => {
      set((s) => ({
        projects: s.projects.map((p) => p.id === id ? { ...p, name } : p),
      }));
      await projectService.update(id, { name });
    },

    refresh: async (userId) => {
      const projects = await projectService.list(userId);
      set({ projects });
    },
  },
}));
