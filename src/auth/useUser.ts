/** Reads user + auth actions from AuthProvider context */
import { useAuth } from './AuthProvider';

export function useUser() {
  const { user, signOut } = useAuth();
  return { user, signOut };
}
