# Auth System Rework — 2026-04-16

## Status
Approved for implementation.

## Problem Summary

The entire auth system (email/password + Google OAuth) is completely broken. Root causes:

1. `openAuthSessionAsync` for Google OAuth — opens system browser as separate Android activity; when it closes, deep link listener doesn't fire reliably
2. `authStore` does dual storage clearing (MMKV + SecureStore) leaving stale tokens; also has race conditions in `loadSession`
3. `loadSession` called inside `InteractionManager.runAfterInteractions` — renders navigator before session resolves, showing wrong screen
4. `users` table RLS update policy has circular subquery referencing itself

## Goal

Fully functional email/password and Google OAuth auth with reliable session persistence and zero race conditions on app start.

---

## Architecture

### Tech: `@supabase/ssr`

Official Supabase React Native auth library. Handles:
- Cookie-based session management (not reliant on deep link interception)
- Automatic token refresh via `supabase.auth.refreshSession()`
- Reactive auth state via `onAuthStateChange`
- PKCE OAuth flow built-in

Storage adapter: `@react-native-async-storage/async-storage` (Supabase's recommended choice for RN)

### File Changes

```
DELETE:
  src/stores/authStore.ts                    — replaced by AuthProvider
  src/hooks/useAuth.ts                       — replaced by useSession/useUser
  src/utils/authStorage.ts                   — no longer needed
  src/utils/supabaseClient.ts                — replaced by lib/supabase.ts

CREATE:
  src/lib/supabase.ts                        — @supabase/ssr client setup
  src/auth/AuthProvider.tsx                  — context provider, session listener
  src/auth/useSession.ts                      — reactive session hook
  src/auth/useUser.ts                         — user data from users table
  src/auth/signInWithEmail.ts                 — email/password sign in
  src/auth/signUp.ts                          — email/password sign up
  src/auth/signInWithGoogle.ts                — Google OAuth via openBrowserAsync
  src/auth/signOut.ts                         — clean sign out
  src/auth/getAuthToken.ts                    — get current access token

UPDATE:
  App.tsx                                     — AuthProvider wrapper, deep link for OAuth only
  src/navigation/RootNavigator.tsx            — useSession() instead of authStore
  src/screens/auth/LoginScreen.tsx            — wire to new auth lib
  src/screens/auth/SignUpScreen.tsx           — wire to new auth lib
  src/screens/auth/ForgotPasswordScreen.tsx   — use new supabase client
  src/screens/auth/ResetPasswordScreen.tsx    — use new supabase client
  src/screens/auth/EmailVerificationScreen.tsx — use new supabase client
  src/components/common/SomeComponent.tsx      — any useAuth() → useSession()
  supabase/migrations/039_fix_users_rls.sql   — fix circular RLS policy
```

---

## Detailed Design

### 1. Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/ssr';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // not needed for RN
    },
  });
}

// Singleton for use throughout the app
export const supabase = createSupabaseClient();
```

`@supabase/ssr` uses `react-native-async-storage/async-storage` as its storage adapter by default — pass it explicitly for clarity.

### 2. AuthProvider (`src/auth/AuthProvider.tsx`)

```typescript
// Wraps the entire app
// - Sets up onAuthStateChange listener on mount
// - Provides { session, user, isLoading } context
// - Children read session synchronously — no race
```

Context shape:
```typescript
interface AuthContextValue {
  session: Session | null;       // Supabase session — available on first render
  user: User | null;             // App user row from users table
  isLoading: boolean;            // Still resolving initial session
  signOut: () => Promise<void>;
}
```

### 3. useSession (`src/auth/useSession.ts`)

```typescript
// Reads session from AuthProvider context
// Also fetches user data from users table reactively
```

### 4. signInWithEmail (`src/auth/signInWithEmail.ts`)

```typescript
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error; // let caller handle UI feedback
}
```

### 5. signUp (`src/auth/signUp.ts`)

```typescript
export async function signUp(email: string, password: string, displayName: string): Promise<void> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  // Supabase SSR handles session automatically; if no session, email confirmation required
}
```

### 6. signInWithGoogle (`src/auth/signInWithGoogle.ts`)

Uses **`openBrowserAsync`** from `expo-web-browser` — this opens a Chrome Custom Tab on Android (same process) and properly awaits the result before returning.

```typescript
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
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');

  // openBrowserAsync waits for the browser to complete (success/cancel/close)
  // This is the key fix — unlike openAuthSessionAsync, this works on Android
  const result = await WebBrowser.openBrowserAsync(data.url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.POPOVER,
    toolbarColor: '#1A1A1A',
    controlsColor: '#C8C8C8',
  });

  if (result.type === 'cancel') {
    throw new Error('Sign in was cancelled');
  }
}
```

### 7. signOut (`src/auth/signOut.ts`)

```typescript
export async function signOut(): Promise<void> {
  // 1. Clear MMKV storage (preferences, onboarding flags — not tokens)
  Storage.clearAll(); // but preserve privacyPolicyAccepted

  // 2. Sign out from Supabase (clears its AsyncStorage tokens)
  await supabase.auth.signOut();
}
```

Note: `@supabase/ssr` handles token clearing automatically. Only clear MMKV for non-token data.

### 8. App.tsx Changes

```typescript
// BEFORE
const loadSession = useAuthStore((s) => s.actions.loadSession);
useEffect(() => { void loadSession(); }, [loadSession]);

// AFTER
import { AuthProvider } from './src/auth/AuthProvider';
// Wrap <NavigationContainer> in <AuthProvider>
```

Deep link handling stays for `auth/callback` — just update to read session from `@supabase/ssr` instead of calling `exchangeCodeForSession` manually:

```typescript
// App.tsx deep link handler for Google OAuth callback
useEffect(() => {
  if (url.includes('login-callback')) {
    // @supabase/ssr handles the code exchange automatically via getSession()
    // Just reload the session
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      // AuthProvider's onAuthStateChange will fire and update context
    }
  }
}, []);
```

### 9. RootNavigator Changes

```typescript
// BEFORE
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

// AFTER
const { session } = useSession();
const isAuthenticated = !!session;
```

### 10. Migration: Fix Circular RLS Policy

```sql
-- supabase/migrations/039_fix_users_rls.sql
-- Fix the circular subquery in users update policy

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
  -- Removed circular subquery: subscription_tier and role
  -- are updated via the service layer, not directly by users
```

---

## Session Loading Flow (Before vs After)

### Before (broken)
```
App mount → RootNavigator renders → isAuthenticated=false (default)
  → loadSession() fires (async, InteractionManager)
  → 500ms later: session resolved, re-render
  → User sees auth screen flash before dashboard
```

### After (fixed)
```
App mount → AuthProvider initializes → supabase.auth.getSession() (sync from AsyncStorage)
  → Session available immediately
  → RootNavigator renders with correct session state on first render
  → No flash, no race
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Invalid credentials | Throw error → screen shows "Invalid email or password" |
| Network failure | Throw error → screen shows "Connection failed. Check your internet." |
| Google cancelled | Throw error → screen shows "Sign in was cancelled" |
| Email not confirmed | `signUp` returns no session → navigate to EmailVerificationScreen |
| OAuth error from Google | Catch `error` param in callback URL → show toast |
| Session expired | `@supabase/ssr` auto-refreshes; if refresh fails, `session = null` → show login |

---

## Testing Checklist

- [ ] Cold start: user with valid session sees dashboard (not auth screen)
- [ ] Google OAuth: pressing button → browser opens → sign in → browser closes → app shows dashboard
- [ ] Email sign up: fills form → submits → email confirmation screen appears (if email confirmation enabled)
- [ ] Email sign in: fills form → submits → app navigates to dashboard
- [ ] Sign out: clears session → user sees auth screen
- [ ] Token refresh: access token expires → silently refreshes → session continues
- [ ] Forgot password: sends email → reset link opens app → reset screen appears
- [ ] Deep link `asoria://login-callback` when app is in background (not killed)
- [ ] Deep link `asoria://login-callback` when app is killed (cold start)

---

## Dependencies to Add

```json
{
  "@supabase/ssr": "latest",
  "@react-native-async-storage/async-storage": "latest"
}
```

`expo-web-browser` is already installed (used in the existing code). Verify it's present:
```bash
npm list expo-web-browser
```

`@supabase/ssr` depends on `cookie` (Deno/cross环境) — acceptable for React Native.

---

## What Is NOT Changing

- Supabase project / auth configuration (Google OAuth provider in Supabase dashboard stays)
- Database schema (except RLS fix)
- `src/utils/storage.ts` (MMKV storage) — stays for non-auth preferences
- All screen UI and component structure stays the same — only the auth wiring changes
- Edge Functions — unchanged
