import { useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';
import { useAuthStore } from '../stores/authStore';
import type { Project } from '../types';

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  totalCount: number;
}

export function useProjects(): UseProjectsResult {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await projectService.list(user.id);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const deleteProject = useCallback(async (id: string) => {
    await projectService.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    projects,
    loading,
    error,
    refresh: fetch,
    deleteProject,
    totalCount: projects.length,
  };
}
