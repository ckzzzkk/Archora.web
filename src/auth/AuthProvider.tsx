/**
 * AuthProvider — wraps the app and provides reactive auth state.
 *
 * Uses @supabase/ssr's onAuthStateChange for reactive updates.
 * Session is available synchronously on first render (no race).
 *
 * Children access via useSession() hook.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { signOut } from './signOut';
import type { User } from '../types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch app user row from users table
  const fetchUserData = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  }, []);

  // Initial session load + auth state listener
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session ?? null);
        if (data.session?.user) {
          const userData = await fetchUserData(data.session.user.id);
          if (userData) {
            setUser(mapDbUser(userData));
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Listen for auth changes reactively
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          setUser(userData ? mapDbUser(userData) : null);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

function mapDbUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    subscriptionTier: (row.subscription_tier as 'starter' | 'creator' | 'pro' | 'architect') ?? 'starter',
    aiGenerationsUsed: (row.ai_generations_used as number) ?? 0,
    arScansUsed: (row.ar_scans_used as number) ?? 0,
    quotaResetDate: (row.quota_reset_date as string) ?? new Date().toISOString(),
    stripeCustomerId: row.stripe_customer_id as string | null,
    role: row.role as 'user' | 'admin',
    pointsTotal: (row.points_total as number) ?? 0,
    streakCount: (row.streak_count as number) ?? 0,
  };
}
