/** Reads session + user from AuthProvider context */
import { useAuth } from './AuthProvider';

export function useSession() {
  const { session, user, isLoading } = useAuth();
  return { session, user, isLoading, isAuthenticated: !!session };
}
