import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../utils/supabaseClient';
import { Storage } from '../utils/storage';
import { useUIStore } from './uiStore';
import type { User, SubscriptionTier } from '../types';

let sessionLoadInFlight = false;

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
      if (error) {
        // Never expose "Invalid login credentials" vs "user not found" distinction —
        // both mean the same thing to an attacker trying to enumerate accounts.
        throw new Error('Invalid email or password.');
      }

      const { session } = data;
      if (!session) throw new Error('No session returned');

      // Supabase client now handles secure token storage via secureAuthStorageAdapter
      // Manual token storage removed - rely on Supabase's built-in session management

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
      if (error) {
        // Supabase returns "user_already_exists" for taken emails.
        // Never surface this to the UI — it enables email enumeration.
        const isKnownAuthError = error.message?.includes('user_already_exists')
          || error.message?.includes('Email not confirmed')
          || error.status === 422;
        if (isKnownAuthError) {
          throw new Error('Check your email to confirm your account.');
        }
        throw error;
      }

      const { session } = data;
      if (!session) return; // email confirmation required

      // Supabase client handles secure token storage

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
      const privacyAccepted = Storage.getString('privacyPolicyAccepted');
      Storage.clearAll();
      if (privacyAccepted) {
        Storage.set('privacyPolicyAccepted', privacyAccepted);
      }
      await supabase.auth.signOut();
      // Clear any remaining secure storage keys
      await SecureStore.deleteItemAsync('sb-access-token').catch(() => {});
      await SecureStore.deleteItemAsync('sb-refresh-token').catch(() => {});
      set({ user: null, accessToken: null, isAuthenticated: false });
    },

    signInWithGoogle: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'asoria://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data?.url) {
        const WebBrowser = require('expo-web-browser').default;
        // Open browser - user completes Google login, then Google redirects to
        // asoria://auth/callback. The OS opens the app, App.tsx catches the
        // deep link, exchanges code for session, and refreshes the auth store.
        // openAuthSessionAsync will return with the result after the app
        // receives the redirect.
        await WebBrowser.openAuthSessionAsync(data.url, 'asoria://auth/callback');
      }
    },

    deleteAccount: async () => {
      // Use Supabase functions.invoke for consistency and security
      const { error } = await supabase.functions.invoke('delete-account', {});
      if (error) throw new Error(error.message ?? 'Could not delete account');
      Storage.clearAll();
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false, accessToken: null });
    },

    refreshSession: async () => {
      // Rely on Supabase client's autoRefreshToken and built-in session management
      // The secureAuthStorageAdapter handles secure token storage/retrieval
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) return false;
      set({ accessToken: data.session.access_token });
      return true;
    },

    loadSession: async () => {
      if (sessionLoadInFlight) return;
      sessionLoadInFlight = true;
      set({ isLoading: true });
      try {
        // Supabase client auto-loads session from secure storage on init
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          useUIStore.getState().actions.showToast('Session expired — please sign in again', 'error');
          sessionLoadInFlight = false;
          set({ isLoading: false }); return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        sessionLoadInFlight = false;
        set({
          accessToken: data.session.access_token,
          isAuthenticated: true,
          user: userData ? mapDbUser(userData) : null,
          isLoading: false,
        });
      } catch {
        useUIStore.getState().actions.showToast('Could not restore session — please sign in', 'error');
        sessionLoadInFlight = false;
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
