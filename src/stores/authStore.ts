import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../utils/supabaseClient';
import { Storage } from '../utils/storage';
import { useUIStore } from './uiStore';
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
    signInWithGoogle: () => Promise<void>;
    deleteAccount: () => Promise<void>;
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

      // Fire-and-forget audit log — non-blocking, failure is acceptable
      void supabase.functions.invoke('log-auth-event', { body: { action: 'login_success' } });
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
      Storage.clearAll();
      await supabase.auth.signOut();
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      set({ user: null, accessToken: null, isAuthenticated: false });
    },

    signInWithGoogle: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'asoria://auth/callback',
          skipBrowserRedirect: false,
        },
      });
      if (error) throw error;
      if (data?.url) {
        const { Linking } = require('react-native');
        await Linking.openURL(data.url);
      }
    },

    deleteAccount: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not signed in');
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
      const res = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Could not delete account');
      Storage.clearAll();
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false, accessToken: null });
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
        if (error || !data.session) {
          useUIStore.getState().actions.showToast('Session expired — please sign in again', 'error');
          set({ isLoading: false }); return;
        }

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
        useUIStore.getState().actions.showToast('Could not restore session — please sign in', 'error');
        set({ isLoading: false });
      }
    },

    updateUser: (updates: Partial<User>) => {
      const { user } = get();
      if (user) set({ user: { ...user, ...updates } });
    },
  },
}));

export const clearAllUserData = async (): Promise<void> => {
  Storage.clearAll();
  await supabase.auth.signOut();
};

function mapDbUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    subscriptionTier: (row.subscription_tier as SubscriptionTier) ?? 'starter',
    aiGenerationsUsed: (row.ai_generations_used as number) ?? 0,
    arScansUsed: (row.ar_scans_used as number) ?? 0,
    quotaResetDate: (row.quota_reset_date as string) ?? new Date().toISOString(),
    stripeCustomerId: row.stripe_customer_id as string | null,
    role: row.role as 'user' | 'admin',
    pointsTotal: (row.points_total as number) ?? 0,
    streakCount: (row.streak_count as number) ?? 0,
  };
}
