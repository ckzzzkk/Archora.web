import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const actions = useAuthStore((s) => s.actions);

  return { user, isAuthenticated, isLoading, ...actions };
}
