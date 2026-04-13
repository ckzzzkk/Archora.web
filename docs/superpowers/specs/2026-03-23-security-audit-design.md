# Security Audit Design — ASORIA
Date: 2026-03-23
Status: v2 (post spec-review fixes)

## Context

Full security audit of the ASORIA app. The codebase already has strong foundations:
`getAuthUser()` in every Edge Function, Zod validation, Upstash rate limiting, SecureStore
for tokens, audit logging, RLS on all tables, no hardcoded secrets.
This audit closes the remaining gaps found during exploration.

**Excluded from this audit (logged as future concern):**
- `generate-texture` blocking poll → async job queue (tasks/todo.md)
- Server-side account lockout tracking (relying on Supabase built-in auth rate limiting)

---

## Confirmed Schema (from migrations)

Tables that exist and are relevant to this audit:

| Table | Migration | user_id cascade |
|-------|-----------|----------------|
| projects | 002 | ON DELETE CASCADE |
| project_versions | 002 | ON DELETE CASCADE (via projects + users) |
| templates | 003 | ON DELETE CASCADE |
| likes | 003 | ON DELETE CASCADE |
| saves | 003 | ON DELETE CASCADE |
| ratings | 003 | ON DELETE CASCADE |
| comments | 003 | ON DELETE CASCADE |
| ar_scans | 004 | ON DELETE CASCADE |
| subscriptions | 004 | ON DELETE CASCADE |
| ai_generations | 004 | ON DELETE CASCADE |
| audit_logs | 004 | ON DELETE **SET NULL** ← must be explicitly deleted |

Tables that do **not** exist in migrations (removed from all scope): `follows`, `usage_quotas`.

**Cascade direction (critical):**
`public.users.id REFERENCES auth.users(id) ON DELETE CASCADE`
means: deleting `auth.users` → cascades to `public.users` → cascades to all child tables.
Deleting `public.users` does NOT cascade to `auth.users`. All child tables cascade from
`public.users`, but `audit_logs` is the exception (`SET NULL`), requiring explicit deletion.

---

## Phase 1 — Server Infrastructure

### 1.1 Security Headers (`_shared/cors.ts`)

Add `securityHeaders` export that wraps `corsHeaders` with:

```ts
'Access-Control-Allow-Origin': Deno.env.get('APP_ENV') === 'production'
  ? 'https://asoria.app' : '*'
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Content-Security-Policy': "default-src 'self'"  // no-op for native; safe to add
```

All 9 deployed Edge Functions switch from `corsHeaders` → `securityHeaders`.
OPTIONS preflight responses also use `securityHeaders`.

### 1.2 `transcribe/index.ts` — File Validation

Before forwarding to Whisper (after auth + rate limit):
- `audioFile.size > 25 * 1024 * 1024` → return 413 Request Entity Too Large
- `!audioFile.type.startsWith('audio/')` → return 415 Unsupported Media Type

### 1.3 `stripe-checkout/index.ts` — Price ID Whitelist

```ts
const VALID_PRICE_IDS = new Set([
  Deno.env.get('STRIPE_PRICE_CREATOR_MONTHLY'),
  Deno.env.get('STRIPE_PRICE_CREATOR_ANNUAL'),
  Deno.env.get('STRIPE_PRICE_ARCHITECT_MONTHLY'),
  Deno.env.get('STRIPE_PRICE_ARCHITECT_ANNUAL'),
].filter(Boolean))
// Note: if ALL four env vars are missing, Set is empty and all priceIds rejected.
// The existing keys-missing guard (returns 503) fires first if STRIPE_SECRET_KEY
// is also absent, which is the common mis-configuration case.
```

`!VALID_PRICE_IDS.has(priceId)` → return `Errors.validationError('INVALID_PRICE_ID')`.
Check after auth, before Stripe API call.

### 1.4 `stripe-webhook/index.ts` — Idempotency (Atomic)

After signature verification, before processing — use atomic SET NX (not GET + SET):

```ts
// Atomic: returns 'OK' if set, null if key already exists
const result = await redis.set(
  `webhook:${event.id}`, '1',
  { nx: true, ex: 86400 }   // NX = set only if Not eXists; EX = 24h TTL
)
if (result === null) {
  // already processed — idempotent return
  return new Response('already processed', { status: 200, headers: securityHeaders })
}
// proceed to process event...
```

If Redis unavailable: fail open (log warn, process anyway). Stripe's retry will re-deliver.
The downstream DB upsert on `stripe_subscription_id` provides a secondary idempotency
layer at the DB level for the worst case (Redis outage + concurrent delivery).

### 1.5 `export-user-data/index.ts` (New Edge Function)

Auth-gated. Returns GDPR-clean JSON.

```
getAuthUser(req)
  → parallel queries (anon client, RLS restricts to own data):
      users:           id, email, display_name, avatar_url, subscription_tier,
                       ai_generations_used, created_at
      projects:        id, name, building_type, blueprint_data, thumbnail_url,
                       created_at, updated_at
      project_versions: id, project_id, version_number, blueprint_data, created_at
      templates:       id, title, description, price, is_featured, download_count,
                       building_type, style, created_at
  → shape: { exportedAt, account: {...}, projects: [...], project_versions: [...],
             templates: [...] }
  → exclude: stripe_customer_id, role, any FK IDs of other users, payment data
  → return 200 application/json
    Content-Disposition: attachment; filename="asoria-export.json"
  → logAudit(supabase, userId, 'data_exported', { resource_type: 'user_data' })
```

Error: any DB failure → 500 generic, no internal detail.

### 1.6 `delete-account/index.ts` (New Edge Function)

Requires service-role client. Handles full account deletion atomically.

```
getAuthUser(req)                         // verify token, extract userId
  → supabaseAdmin.rpc('delete_user_data', { p_user_id: userId })
       // deletes: audit_logs, ratings, likes, saves, comments, ar_scans,
       //          ai_generations, subscriptions, templates, project_versions
       //          (project_versions cascade from projects), projects
       // does NOT delete public.users (let auth cascade handle it)
  → supabaseAdmin.auth.admin.deleteUser(userId)
       // removes auth.users row → CASCADE → public.users removed
  → return 200
```

Error handling:
- RPC fails → return 500, do NOT call deleteUser (leaves account intact)
- deleteUser fails → return 500 (user data already deleted — log as critical error)
- Client receives success → clears local state + navigates to auth screen

### 1.7 `log-auth-event/index.ts` (New Edge Function)

Thin Edge Function — allows client to write to `audit_logs` without an INSERT RLS policy
(which would require a schema change). Uses service_role.

```
getAuthUser(req)                         // verify token, extract userId
  → validate body: { action: 'login_success' }  // Zod: z.enum(['login_success'])
  → supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: body.action,
      resource_type: 'auth',
      metadata: {},
    })
  → return 200
```

Only `login_success` is in the whitelist for now (login_failed requires server-side
interception and is deferred to a future auth Edge Function).

### 1.8 `018_security_indexes.sql` (New Migration)

`CREATE INDEX IF NOT EXISTS` statements — safe to apply even where some already exist:

```sql
-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Templates
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_is_featured ON templates(is_featured)
  WHERE is_featured = true;

-- Social (likes/saves already have idx_likes_template_id, idx_saves_template_id in 003)
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON saves(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Notifications (from migration 011)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id, read) WHERE read = false;

-- Audit logs (idx_audit_logs_user_id already in 004)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Subscriptions (idx_subscriptions_user_id, idx_subscriptions_stripe_id already in 004)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON subscriptions(stripe_customer_id);
```

Note: `follows` and `usage_quotas` tables do not exist — removed from indexes.
`project_versions`, `ar_scans`, `ai_generations` already have indexes in their migrations.

### 1.9 `019_delete_user_data_rpc.sql` (New Migration)

Deletes in FK-safe order. Does **not** delete `public.users` (auth cascade handles that).
`audit_logs` has `ON DELETE SET NULL` so must be explicitly deleted.

```sql
CREATE OR REPLACE FUNCTION public.delete_user_data(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- audit_logs: ON DELETE SET NULL, must be explicit
  DELETE FROM audit_logs   WHERE user_id = p_user_id;
  -- social child tables (cascade from users, but delete before templates)
  DELETE FROM ratings      WHERE user_id = p_user_id;
  DELETE FROM likes        WHERE user_id = p_user_id;
  DELETE FROM saves        WHERE user_id = p_user_id;
  DELETE FROM comments     WHERE user_id = p_user_id;
  -- other user-owned data
  DELETE FROM ar_scans     WHERE user_id = p_user_id;
  DELETE FROM ai_generations WHERE user_id = p_user_id;
  DELETE FROM subscriptions WHERE user_id = p_user_id;
  -- templates before projects (templates reference projects)
  DELETE FROM templates    WHERE user_id = p_user_id;
  -- projects (project_versions cascade from projects)
  DELETE FROM projects     WHERE user_id = p_user_id;
  -- public.users NOT deleted here — auth.admin.deleteUser cascades to it
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_user_data TO authenticated;
```

### 1.10 `tasks/todo.md` Update

Log: "generate-texture Edge Function uses a blocking 60-second polling loop waiting
for Replicate to complete. Should be refactored to an async job queue pattern
(e.g., Supabase pg_cron + status polling endpoint) to prevent timeout failures under load."

---

## Phase 2 — Client Changes

### 2.1 `src/utils/validation.ts` (New File)

Pure utility — no React imports, no side effects.

```ts
validateEmail(email: string): boolean
  // RFC-5322 lite regex

validatePassword(password: string): { valid: boolean; errors: string[] }
  // min 8 chars, 1 uppercase, 1 lowercase, 1 digit

sanitiseText(text: string): string
  // strip HTML tags via /<[^>]*>/g regex, trim whitespace

validatePrompt(prompt: string): string
  // sanitiseText + truncate to 500 chars

validateDisplayName(name: string): boolean
  // trim, 1–50 chars, /^[a-zA-Z\s-]+$/ — only letters, spaces, hyphens

validatePrice(price: number): boolean
  // isFinite, >= 0, <= 999.99, max 2 decimal places
```

### 2.2 `LoginScreen.tsx` — Brute Force Countdown

```ts
const [failedAttempts, setFailedAttempts] = useState(0)
const [lockedUntil, setLockedUntil] = useState<number | null>(null)
const [countdown, setCountdown] = useState(0)

// On auth error: increment failedAttempts
// When failedAttempts reaches 5: setLockedUntil(Date.now() + 30_000)

useEffect(() => {
  if (!lockedUntil) return
  const interval = setInterval(() => {
    const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
    if (remaining <= 0) {
      setLockedUntil(null)
      setFailedAttempts(0)
      setCountdown(0)
      clearInterval(interval)
    } else {
      setCountdown(remaining)
    }
  }, 1000)
  return () => clearInterval(interval)  // cleanup on unmount
}, [lockedUntil])
```

Button disabled + shows "Too many attempts — wait {countdown}s" while locked.
`failedAttempts` resets to 0 on successful login.

### 2.3 `ForgotPasswordScreen.tsx` — Expiry Message

On confirmation screen (after reset email sent), add beneath the instructions:
> "Reset link expires in 1 hour. Check your spam folder if you don't see it."

If `supabase.auth.updateUser()` receives an `otp_expired` error (user clicked stale link):
> "This link has expired."
> [Resend reset email] button → navigates back to ForgotPasswordScreen

### 2.4 `authStore.ts` — Auth Event Logging

After successful `signIn`, call `log-auth-event` Edge Function:

```ts
// Fire-and-forget — don't await, don't let failure block sign-in
void supabase.functions.invoke('log-auth-event', {
  body: { action: 'login_success' },
})
```

Does not use `logAudit` helper (Deno-only). Uses `supabase.functions.invoke` which
automatically attaches the current session's Bearer token.

### 2.5 `AccountScreen.tsx` — Export + Delete Wiring

**Export data:**
```ts
const { data } = await supabase.functions.invoke('export-user-data')
// save via expo-file-system + expo-sharing, or Share.share(JSON.stringify(data))
```

**Delete account:**
Replace existing delete flow with:
1. Alert: "This will permanently delete your account and all data. Type DELETE to confirm."
2. TextInput requiring user to type "DELETE"
3. On confirm: call `supabase.functions.invoke('delete-account')`
4. On success: `authStore.actions.signOut()` + navigate to auth screen
5. Require password re-authentication before delete (use `supabase.auth.reauthenticate()`)

---

## Deployment Sequence

```
Phase 1:
  1. Edit _shared/cors.ts (securityHeaders)
  2. Edit all 9 existing Edge Functions (corsHeaders → securityHeaders)
  3. Edit transcribe (file size + MIME check)
  4. Edit stripe-checkout (priceId whitelist)
  5. Edit stripe-webhook (atomic idempotency)
  6. Create export-user-data/index.ts
  7. Create delete-account/index.ts
  8. Create log-auth-event/index.ts
  9. Create migrations/018_security_indexes.sql
  10. Create migrations/019_delete_user_data_rpc.sql
  11. Update tasks/todo.md
  12. supabase db push --db-url [session-mode URL]
  13. supabase functions deploy (all 12 functions)
  14. git commit "security: Phase 1 — server infrastructure"

Phase 2:
  1. Create src/utils/validation.ts
  2. Edit LoginScreen.tsx (countdown)
  3. Edit ForgotPasswordScreen.tsx (expiry message)
  4. Edit authStore.ts (log-auth-event call)
  5. Edit AccountScreen.tsx (export + delete wiring)
  6. npx tsc --noEmit
  7. git commit "security: Phase 2 — client hardening"
  8. git push origin main
```

---

## What Was Already Secure (No Changes Needed)

- `getAuthUser()` called first in every existing Edge Function ✓
- Zod validation in ai-generate, ai-furniture, generate-texture ✓
- Upstash rate limiting in all AI/AR/texture functions ✓
- SecureStore for refresh tokens in authStore ✓
- Audit logging in ai-generate, ai-furniture, stripe-webhook ✓
- Stripe webhook signature verification ✓
- RLS on all tables with default deny ✓
- No hardcoded API keys — all via Deno.env.get() ✓
- .env in .gitignore ✓
- No console.log of credentials or tokens ✓
- UUID PKs everywhere ✓
- Password hashing handled by Supabase Auth ✓

---

## Implementation Notes (Non-Blocking)

- `notifications` is omitted from migration 019 RPC because `ON DELETE CASCADE` from
  `public.users` handles it automatically. The explicit deletes in the RPC are defensive
  for other tables; notifications is safe to omit.
- `idx_notifications_user_id` in migration 018 is a strict subset of the existing
  `idx_notifications_user_unread` composite index from migration 011. It's redundant but
  harmless due to `IF NOT EXISTS`. PostgreSQL will use the composite index for user_id
  lookups anyway.

---

## Remaining Concerns (Out of Scope / Future)

- `generate-texture` blocking poll → async job queue (tasks/todo.md)
- `login_failed` server-side audit logging → requires auth Edge Function or trigger
- CORS wildcard `*` → acceptable for mobile-only; tighten if web client added
- Certificate pinning → not required for MVP
