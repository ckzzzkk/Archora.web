import { supabase } from '../lib/supabase';

export async function signUp(email: string, password: string, displayName: string): Promise<{ requiresConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });
  if (error) {
    throw error;
  }
  // If no session returned, email confirmation is required
  return { requiresConfirmation: !data.session };
}