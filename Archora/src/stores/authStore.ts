import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../utils/supabaseClient';
import type { User, SubscriptionTier } from '../types';

const REFRESH_TOKEN_KEY = 'asoria_refresh_token';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  actions: {
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<boolean>;
    loadSession: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  actions: {
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { session } = data;
      if (!session) throw new Error('No session returned');

      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refresh_token);

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      set({
        accessToken: session.access_token,
        isAuthenticated: true,
        user: userData ? mapDbUser(userData) : null,
      });
    },

    signUp: async (email: string, password: string, displayName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;

      const { session } = data;
      if (!session) return; // email confirmation required

      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refresh_token);

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      set({
        accessToken: session.access_token,
        isAuthenticated: true,
        user: userData ? mapDbUser(userData) : null,
      });
    },

    signOut: async () => {
      await supabase.auth.signOut();
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      set({ user: null, accessToken: null, isAuthenticated: false });
    },

    refreshSession: async () => {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data.session) return false;

      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.session.refresh_token);
      set({ accessToken: data.session.access_token });
      return true;
    },

    loadSession: async () => {
      set({ isLoading: true });
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!refreshToken) { set({ isLoading: false }); return; }

        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
        if (error || !data.session) { set({ isLoading: false }); return; }

        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.session.refresh_token);

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        set({
          accessToken: data.session.access_token,
          isAuthenticated: true,
          user: userData ? mapDbUser(userData) : null,
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
      }
    },

    updateUser: (updates: Partial<User>) => {
      const { user } = get();
      if (user) set({ user: { ...user, ...updates } });
    },
  },
}));

function mapDbUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    subscriptionTier: row.subscription_tier as SubscriptionTier,
    aiGenerationsUsed: row.ai_generations_used as number,
    arScansUsed: row.ar_scans_used as number,
    quotaResetDate: row.quota_reset_date as string,
    stripeCustomerId: row.stripe_customer_id as string | null,
    role: row.role as 'user' | 'admin',
  };
}
