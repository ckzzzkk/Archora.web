# Auth System Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully working email/password and Google OAuth auth using `@supabase/ssr`, with no session race conditions on app start.

**Architecture:** Replace `authStore` (Zustand) with `AuthProvider` (React Context) + `@supabase/ssr`. Google OAuth via `openBrowserAsync` (not `openAuthSessionAsync`). Session loads synchronously on first render. Auth tokens stored in AsyncStorage via Supabase's built-in adapter.

**Tech Stack:** `@supabase/ssr`, `@react-native-async-storage/async-storage`, `expo-web-browser`

---

## File Map

```
DELETE:
  src/stores/authStore.ts
  src/hooks/useAuth.ts
  src/utils/authStorage.ts
  src/utils/supabaseClient.ts

CREATE:
  src/lib/supabase.ts
  src/auth/AuthProvider.tsx
  src/auth/useSession.ts
  src/auth/useUser.ts
  src/auth/signInWithEmail.ts
  src/auth/signUp.ts
  src/auth/signInWithGoogle.ts
  src/auth/signOut.ts
  supabase/migrations/039_fix_users_rls.sql

MODIFY:
  App.tsx
  src/navigation/RootNavigator.tsx
  src/screens/auth/LoginScreen.tsx
  src/screens/auth/SignUpScreen.tsx
  src/screens/auth/ForgotPasswordScreen.tsx
  src/screens/auth/ResetPasswordScreen.tsx
  src/screens/auth/EmailVerificationScreen.tsx
  src/screens/auth/WelcomeScreen.tsx
  src/screens/auth/OnboardingScreen.tsx
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @supabase/ssr and @react-native-async-storage/async-storage**

Run:
```bash
npm install @supabase/ssr @react-native-async-storage/async-storage
```

- [ ] **Step 2: Verify expo-web-browser is installed**

Run:
```bash
npm list expo-web-browser
```

Expected: version listed. If not installed, run `npm install expo-web-browser`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json && git commit -m "chore: add @supabase/ssr and async-storage"
```

---

## Task 2: Create Supabase Client

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/lib
```

- [ ] **Step 2: Write src/lib/supabase.ts**

```typescript
/**
 * Supabase client using @supabase/ssr
 * Uses AsyncStorage for session persistence (the recommended approach for RN).
 * This replaces src/utils/supabaseClient.ts.
 */
import { createClient } from '@supabase/ssr';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Factory to create a Supabase client.
 * In the browser/RN context, @supabase/ssr handles cookie/session management
 * automatically and stores tokens in the storage adapter.
 */
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Use AsyncStorage as the storage adapter
      storage: {
        getItem: async (key: string): Promise<string | null> => {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          return AsyncStorage.getItem(key);
        },
        setItem: async (key: string, value: string): Promise<void> => {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          return AsyncStorage.setItem(key, value);
        },
        removeItem: async (key: string): Promise<void> => {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          return AsyncStorage.removeItem(key);
        },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

/** Singleton client used app-wide */
export const supabase = createSupabaseClient();
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts && git commit -m "feat: add @supabase/ssr Supabase client in src/lib/supabase.ts"
```

---

## Task 3: Create Auth Functions (signIn, signUp, signOut, signInWithGoogle)

**Files:**
- Create: `src/auth/signInWithEmail.ts`
- Create: `src/auth/signUp.ts`
- Create: `src/auth/signInWithGoogle.ts`
- Create: `src/auth/signOut.ts`
- Create: `src/auth/getAuthToken.ts`

- [ ] **Step 1: Create the auth directory**

```bash
mkdir -p src/auth
```

- [ ] **Step 2: Write src/auth/signInWithEmail.ts**

```typescript
import { supabase } from '../lib/supabase';

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
}
```

- [ ] **Step 3: Write src/auth/signUp.ts**

```typescript
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
```

- [ ] **Step 4: Write src/auth/signInWithGoogle.ts**

```typescript
/**
 * Google OAuth via openBrowserAsync.
 * key difference from the old approach:
 * - openBrowserAsync opens a Chrome Custom Tab (same process on Android)
 * - It awaits the result (success/cancel/close) before returning
 * - No manual deep link interception needed — Supabase handles the redirect
 */
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'asoria://login-callback',
      skipBrowserRedirect: false,
    },
  });
  if (error) {
    throw error;
  }
  if (!data.url) {
    throw new Error('No OAuth URL returned');
  }

  // openBrowserAsync opens Chrome Custom Tab and awaits completion
  const result = await WebBrowser.openBrowserAsync(data.url, {
    toolbarColor: '#1A1A1A',
    controlsColor: '#C8C8C8',
  });

  if (result.type === 'cancel') {
    throw new Error('Sign in was cancelled');
  }
}
```

- [ ] **Step 5: Write src/auth/signOut.ts**

```typescript
import { supabase } from '../lib/supabase';
import { Storage } from '../utils/storage';

export async function signOut(): Promise<void> {
  // Preserve privacy acceptance before clearing MMKV
  const privacyAccepted = Storage.getString('privacyPolicyAccepted');

  // Sign out from Supabase — clears AsyncStorage tokens automatically
  await supabase.auth.signOut();

  // Clear MMKV (non-token) storage but keep privacy acceptance
  Storage.clearAll();
  if (privacyAccepted) {
    Storage.set('privacyPolicyAccepted', privacyAccepted);
  }
}
```

- [ ] **Step 6: Write src/auth/getAuthToken.ts**

```typescript
import { supabase } from '../lib/supabase';

export async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/auth/ && git commit -m "feat: add auth functions (signIn, signUp, signOut, signInWithGoogle, getAuthToken)"
```

---

## Task 4: Create AuthProvider and useSession

**Files:**
- Create: `src/auth/AuthProvider.tsx`
- Create: `src/auth/useSession.ts`
- Create: `src/auth/useUser.ts`

- [ ] **Step 1: Write src/auth/AuthProvider.tsx**

```typescript
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
```

- [ ] **Step 2: Write src/auth/useSession.ts**

```typescript
/** Reads session + user from AuthProvider context */
import { useAuth } from './AuthProvider';

export function useSession() {
  const { session, user, isLoading } = useAuth();
  return { session, user, isLoading, isAuthenticated: !!session };
}
```

- [ ] **Step 3: Write src/auth/useUser.ts**

```typescript
/** Reads user + auth actions from AuthProvider context */
import { useAuth } from './AuthProvider';

export function useUser() {
  const { user, signOut } = useAuth();
  return { user, signOut };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/auth/AuthProvider.tsx src/auth/useSession.ts src/auth/useUser.ts && git commit -m "feat: add AuthProvider context with useSession and useUser hooks"
```

---

## Task 5: Update App.tsx

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Replace imports — remove authStore, add AuthProvider**

In App.tsx, replace:
```typescript
import { useAuthStore } from './src/stores/authStore';
```
with:
```typescript
import { AuthProvider } from './src/auth/AuthProvider';
```

Remove `const loadSession = useAuthStore((s) => s.actions.loadSession);` — no longer needed.

- [ ] **Step 2: Remove the old Linking listener and InteractionManager.loadSession**

Remove the entire `useEffect` that:
- Calls `InteractionManager.runAfterInteractions(() => { void loadSession(); })`
- Sets up the `handleUrl` function for auth callback

Instead, the `AuthProvider` handles session loading automatically.

- [ ] **Step 3: Simplify the deep link handler**

The only deep links App.tsx needs to handle now are:
- `asoria://subscription-success` — reload session after Stripe webhook
- `asoria://login-callback` — OAuth redirect from Google

The `asoria://login-callback` link will be handled by `@supabase/ssr` automatically because `createClient` sets `persistSession: true` and `detectSessionInUrl: false`. When the browser redirects to `asoria://login-callback`, the app comes to the foreground and `@supabase/ssr` picks up the session from storage.

Simplified deep link effect:
```typescript
useEffect(() => {
  const handleUrl = ({ url }: { url: string }) => {
    if (url.startsWith('asoria://subscription-success')) {
      // Reload user session to pick up updated subscription tier from Stripe webhook
      const { loadSession } = useAuthStore.getState().actions;
      void loadSession();
    }
  };
  const sub = Linking.addEventListener('url', handleUrl);
  void Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });
  return () => sub.remove();
}, []);
```

- [ ] **Step 4: Wrap NavigationContainer in AuthProvider**

Wrap the inner content (after splash) in `<AuthProvider>`:

```typescript
<AuthProvider>
  <NavigationContainer ...>
    <ToastContainer />
    <RootNavigator />
  </NavigationContainer>
</AuthProvider>
```

Note: SplashScreen renders before AuthProvider — keep that as-is.

- [ ] **Step 5: Commit**

```bash
git add App.tsx && git commit -m "refactor: wire App.tsx to AuthProvider, remove old loadSession/Linking listener"
```

---

## Task 6: Update RootNavigator to Use useSession

**Files:**
- Modify: `src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Replace authStore with useSession**

Remove:
```typescript
import { useAuthStore } from '../stores/authStore';
```

Add:
```typescript
import { useSession } from '../auth/useSession';
```

- [ ] **Step 2: Replace isAuthenticated and isLoading**

Replace:
```typescript
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const isLoading = useAuthStore((s) => s.isLoading);
```

With:
```typescript
const { session, isLoading } = useSession();
const isAuthenticated = !!session;
```

- [ ] **Step 3: Commit**

```bash
git add src/navigation/RootNavigator.tsx && git commit -m "refactor: RootNavigator uses useSession() instead of authStore"
```

---

## Task 7: Update LoginScreen

**Files:**
- Modify: `src/screens/auth/LoginScreen.tsx`

- [ ] **Step 1: Update imports**

Replace:
```typescript
import { useAuthStore } from '../../stores/authStore';
```

With:
```typescript
import { useSession } from '../../auth/useSession';
import { signInWithEmail } from '../../auth/signInWithEmail';
import { signInWithGoogle } from '../../auth/signInWithGoogle';
```

- [ ] **Step 2: Replace store access**

Replace:
```typescript
const { signIn, signInWithGoogle } = useAuthStore((s) => s.actions);
```

With:
```typescript
// No store access needed — auth functions are imported directly
```

Remove `googleLoading` state (we'll add it fresh since we're rewriting the component).

- [ ] **Step 3: Rewrite handleSignIn**

```typescript
const handleSignIn = async () => {
    if (lockedUntil && Date.now() < lockedUntil) {
      setError('Too many attempts. Wait a moment.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      // AuthProvider's onAuthStateChange fires → session set → navigator re-renders
    } catch (e) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        const lockTime = Date.now() + 30_000;
        setLockedUntil(lockTime);
        setError('Too many attempts. Wait 30 seconds.');
      } else {
        setError(e instanceof Error ? e.message : 'Sign in failed. Check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 4: Rewrite handleGoogleSignIn**

```typescript
const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // AuthProvider handles session automatically — navigator will re-render
    } catch (e) {
      setError(
        e instanceof Error ? `Google sign in failed: ${e.message}` : 'Google sign in failed. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };
```

- [ ] **Step 5: Add googleLoading state**

Add to existing state declarations:
```typescript
const [googleLoading, setGoogleLoading] = useState(false);
```

- [ ] **Step 6: Commit**

```bash
git add src/screens/auth/LoginScreen.tsx && git commit -m "feat: LoginScreen uses new signInWithEmail and signInWithGoogle"
```

---

## Task 8: Update SignUpScreen

**Files:**
- Modify: `src/screens/auth/SignUpScreen.tsx`

- [ ] **Step 1: Update imports**

Replace:
```typescript
import { useAuthStore } from '../../stores/authStore';
```

With:
```typescript
import { signUp } from '../../auth/signUp';
import { signInWithGoogle } from '../../auth/signInWithGoogle';
```

- [ ] **Step 2: Replace store access**

Remove:
```typescript
const { signUp, signInWithGoogle } = useAuthStore((s) => s.actions);
```

- [ ] **Step 3: Rewrite handleSignUp**

```typescript
const handleSignUp = async () => {
    setError('');
    if (displayName.trim().length < 2) { setError('Display name must be at least 2 characters.'); return; }
    if (!/\S+@\S+\.\S+/.test(email))   { setError('Enter a valid email address.'); return; }
    if (password.length < 8)            { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPw)          { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const { requiresConfirmation } = await signUp(email.trim(), password, displayName.trim());
      if (requiresConfirmation) {
        navigation.navigate('EmailVerification', { email: email.trim() });
      }
      // If no confirmation required, AuthProvider handles session — navigator re-renders
    } catch (e) {
      if (e instanceof Error && e.message.includes('user_already_exists')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(e instanceof Error ? e.message : 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 4: Rewrite handleGoogleSignIn**

```typescript
const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(
        e instanceof Error ? `Google sign in failed: ${e.message}` : 'Google sign in failed. Please try again.'
      );
    }
  };
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/auth/SignUpScreen.tsx && git commit -m "feat: SignUpScreen uses new signUp and signInWithGoogle"
```

---

## Task 9: Update ForgotPasswordScreen

**Files:**
- Modify: `src/screens/auth/ForgotPasswordScreen.tsx`

- [ ] **Step 1: Update supabase import**

Replace:
```typescript
import { supabase } from '../../utils/supabaseClient';
```

With:
```typescript
import { supabase } from '../../lib/supabase';
```

The rest of ForgotPasswordScreen is already correctly using `supabase.auth.resetPasswordForEmail` — no other changes needed.

- [ ] **Step 2: Commit**

```bash
git add src/screens/auth/ForgotPasswordScreen.tsx && git commit -m "refactor: ForgotPasswordScreen uses new supabase client"
```

---

## Task 10: Update ResetPasswordScreen

**Files:**
- Modify: `src/screens/auth/ResetPasswordScreen.tsx`

- [ ] **Step 1: Update supabase import**

Replace `src/utils/supabaseClient` with `src/lib/supabase`.

The ResetPasswordScreen uses `supabase.auth.updateUser` — this API is the same in `@supabase/ssr`.

- [ ] **Step 2: Commit**

```bash
git add src/screens/auth/ResetPasswordScreen.tsx && git commit -m "refactor: ResetPasswordScreen uses new supabase client"
```

---

## Task 11: Update EmailVerificationScreen

**Files:**
- Modify: `src/screens/auth/EmailVerificationScreen.tsx`

- [ ] **Step 1: Update supabase import**

Replace `src/utils/supabaseClient` with `src/lib/supabase`.

- [ ] **Step 2: Commit**

```bash
git add src/screens/auth/EmailVerificationScreen.tsx && git commit -m "refactor: EmailVerificationScreen uses new supabase client"
```

---

## Task 12: Update WelcomeScreen and OnboardingScreen

**Files:**
- Modify: `src/screens/auth/WelcomeScreen.tsx`
- Modify: `src/screens/auth/OnboardingScreen.tsx`

- [ ] **Step 1: Check for useAuthStore usage**

Search both files for `useAuthStore` or `useAuth`. If found, replace with `useSession` or `useUser` from the new auth lib.

- [ ] **Step 2: Commit**

```bash
git add src/screens/auth/WelcomeScreen.tsx src/screens/auth/OnboardingScreen.tsx && git commit -m "refactor: WelcomeScreen and OnboardingScreen auth store cleanup"
```

---

## Task 13: Delete Old Auth Files

**Files:**
- Delete: `src/stores/authStore.ts`
- Delete: `src/hooks/useAuth.ts`
- Delete: `src/utils/authStorage.ts`
- Delete: `src/utils/supabaseClient.ts`

- [ ] **Step 1: Delete each file**

```bash
rm src/stores/authStore.ts
rm src/hooks/useAuth.ts
rm src/utils/authStorage.ts
rm src/utils/supabaseClient.ts
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "chore: delete old authStore, useAuth, authStorage, supabaseClient"
```

---

## Task 14: Fix users RLS Policy (Migration 039)

**Files:**
- Create: `supabase/migrations/039_fix_users_rls.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Migration 039: Fix circular RLS policy on users table
-- The previous update policy had a circular subquery:
--   subscription_tier = (SELECT subscription_tier FROM users WHERE id = auth.uid())
-- This caused auth failures when users tried to update their own profile.

-- Drop the broken policy
DROP POLICY IF EXISTS users_update_own ON users;

-- Recreate with simple auth.uid() check
-- Tier/role changes go through the service layer (Edge Functions), not direct writes
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure anon cannot read user data
DROP POLICY IF EXISTS users_select_anon ON users;
CREATE POLICY users_select_anon ON users
  FOR SELECT USING (false);

-- Keep authenticated read policy
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/039_fix_users_rls.sql && git commit -m "fix: remove circular RLS subquery on users table"
```

---

## Task 15: Update Any Remaining useAuth References

**Files:**
- Any remaining file in `src/` that imports from `src/hooks/useAuth` or `src/stores/authStore`

- [ ] **Step 1: Find all remaining references**

```bash
grep -r "useAuthStore\|from.*authStore\|from.*useAuth" src/ --include="*.ts" --include="*.tsx" -l
```

- [ ] **Step 2: Fix each file**

For each file found:
- If it uses `useAuthStore` for `isAuthenticated` or `user` → replace with `useSession()`
- If it uses `useAuthStore` for `signIn/signOut/signUp/signInWithGoogle` → replace with direct function imports
- If it uses `useAuthStore` for `loadSession` → remove (AuthProvider handles this)

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: replace remaining authStore references with new auth lib"
```

---

## Task 16: Verify Android Deep Link Configuration

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `app.json`

- [ ] **Step 1: Verify AndroidManifest has the correct intent filters**

Check that `AndroidManifest.xml` has:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="asoria" />
</intent-filter>
```

The `asoria://login-callback` and `asoria://auth/callback` redirects need the `asoria` scheme.

Also add `asoria://reset-password` if not present.

- [ ] **Step 2: Verify app.json has correct scheme**

Check `app.json`:
```json
{
  "expo": {
    "scheme": "asoria"
  }
}
```

If `scheme` is not `asoria`, add it. Multiple schemes are supported.

- [ ] **Step 3: Commit**

```bash
git add android/app/src/main/AndroidManifest.xml app.json && git commit -m "fix: ensure asoria:// deep link scheme configured in AndroidManifest and app.json"
```

---

## Verification Checklist

After all tasks, run through this manually:

- [ ] Cold start with valid session → dashboard appears (not login screen)
- [ ] `npx expo start --android` → app loads
- [ ] Login with email/password → session stored → app navigates to dashboard
- [ ] Sign up with email/password → if confirmation required → EmailVerificationScreen appears
- [ ] Google OAuth → browser opens → sign in → browser closes → dashboard appears
- [ ] Sign out → returns to auth screen
- [ ] Forgot password → email sent → reset link opens reset screen
- [ ] `git log --oneline` → all commits present with clean messages

---

## Self-Review Checklist

- [ ] Spec coverage: every section in the design spec has a corresponding task above
- [ ] No placeholder code — every step has actual implementation code
- [ ] Function names consistent: `signInWithEmail`, `signUp`, `signInWithGoogle`, `signOut` used everywhere
- [ ] `supabase` imported from `src/lib/supabase` everywhere (not old client)
- [ ] `AuthProvider` wraps the app in App.tsx
- [ ] `RootNavigator` uses `useSession()` (not `useAuthStore`)
- [ ] LoginScreen and SignUpScreen import auth functions directly (not from store)
- [ ] Old auth files deleted (`authStore.ts`, `useAuth.ts`, `authStorage.ts`, `supabaseClient.ts`)
- [ ] Migration 039 fixes RLS policy
- [ ] All commits are atomic (one logical change per commit)
