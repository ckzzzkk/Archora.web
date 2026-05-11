import { create } from 'zustand';
import { projectService } from '../services/projectService';
import { cacheService } from '../services/cacheService';
import type { Project, BuildingType } from '../types';

const projectsCacheKey = (userId: string) => `projects:${userId}`;

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  actions: {
    load: (userId: string) => Promise<void>;
    create: (userId: string, name: string, buildingType: BuildingType) => Promise<Project>;
    delete: (id: string, userId: string) => Promise<void>;
    rename: (id: string, userId: string, name: string) => Promise<void>;
    refresh: (userId: string) => Promise<void>;
  };
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  actions: {
    /**
     * Load projects using stale-while-revalidate:
     * 1. Immediately hydrate from cache (no loading spinner if cache exists)
     * 2. Fetch fresh data in the background
     * 3. Update state + cache when fresh data arrives
     */
    load: async (userId) => {
      let mounted = true;
      const key = projectsCacheKey(userId);
      const cached = cacheService.getStale<Project[]>(key);

      if (cached) {
        // Instant render from cache — no loading flash
        if (!mounted) return;
        set({ projects: cached, isLoading: false, error: null });
        // Revalidate silently in background
        try {
          const fresh = await projectService.list(userId);
          if (!mounted) return;
          cacheService.setAndRegister(key, fresh);
          set({ projects: fresh });
        } catch {
          // Keep stale data — don't show error if we already have something
        }
      } else {
        // Cold start — show skeleton loader while fetching
        set({ isLoading: true, error: null });
        try {
          const projects = await projectService.list(userId);
          if (!mounted) return;
          cacheService.setAndRegister(key, projects);
          set({ projects, isLoading: false });
        } catch {
          if (!mounted) return;
          set({ error: 'Failed to load projects', isLoading: false });
        }
      }
    },

    create: async (userId, name, buildingType) => {
      const project = await projectService.create(userId, name, buildingType);
      set((s) => {
        const updated = [project, ...s.projects];
        cacheService.set(projectsCacheKey(userId), updated);
        return { projects: updated };
      });
      return project;
    },

    delete: async (id, userId) => {
      const { projects } = get();
      const snapshot = projects.find((p) => p.id === id);
      const updated = projects.filter((p) => p.id !== id);
      set({ projects: updated });
      // Update cache optimistically
      if (userId) cacheService.set(projectsCacheKey(userId), updated);
      try {
        await projectService.delete(id, userId);
      } catch {
        if (snapshot) {
          set((s) => ({ projects: [snapshot, ...s.projects] }));
          if (userId) cacheService.set(projectsCacheKey(userId), [snapshot, ...updated]);
        }
      }
    },

    rename: async (id, userId, name) => {
      set((s) => {
        const updated = s.projects.map((p) => p.id === id ? { ...p, name } : p);
        if (userId) cacheService.set(projectsCacheKey(userId), updated);
        return { projects: updated };
      });
      await projectService.update(id, userId, { name });
    },

    refresh: async (userId) => {
      const projects = await projectService.list(userId);
      cacheService.setAndRegister(projectsCacheKey(userId), projects);
      set({ projects });
    },
  },
}));
