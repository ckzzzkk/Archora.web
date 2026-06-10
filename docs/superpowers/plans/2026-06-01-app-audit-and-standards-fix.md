# Asoria — App Audit & Standards Compliance Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all confirmed architectural violations (direct Supabase calls from screens), verify complex features are wired correctly end-to-end, and clean up code quality debt across the entire app.

**Architecture:** Every data mutation that requires server-side ownership verification or quota checking must go through a Deno Edge Function — never direct from client. `supabase.auth.*` SDK calls are acceptable client-side (Supabase-designed pattern). Simple RLS-protected reads are acceptable client-side. The rule applies to: writes to user data tables, quota-checked operations, and anything that needs `requireOwnership()`.

**Tech Stack:** React Native + Expo SDK 55, TypeScript strict, Zustand, Supabase Deno Edge Functions, `_shared/auth.ts` (`getAuthUser`, `requireOwnership`), `_shared/quota.ts` (`checkQuota`), Zod for Edge Function validation, MMKV for client cache.

---

## Confirmed Violations to Fix

| Screen | Violation | Fix |
|--------|-----------|-----|
| `AccountScreen.tsx:360` | `supabase.from('users').update(display_name)` | `update-profile` edge function |
| `AccountScreen.tsx:378` | `supabase.from('users').update(avatar_url)` | same edge function |
| `OnboardingQuizScreen.tsx:431` | `supabase.from('user_quiz_answers').upsert()` | `save-quiz` edge function |

## File Map

**Create:**
- `supabase/functions/update-profile/index.ts`
- `supabase/functions/save-quiz/index.ts`

**Modify:**
- `src/screens/account/AccountScreen.tsx` (3 locations: display_name update, avatar_url update, call edge function)
- `src/screens/auth/OnboardingQuizScreen.tsx` (replace direct upsert)
- `src/services/authService.ts` (add `updateProfile()` and `saveQuiz()` helpers)

**Verify (read + fix if needed):**
- `src/stores/coProjectStore.ts` + `src/services/coProjectService.ts`
- `src/screens/workspace/CoProjectsScreen.tsx` + `CoProjectDetailScreen.tsx` + `CodesignSessionScreen.tsx`
- `src/services/notificationService.ts` + `src/hooks/useNotifications.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `src/screens/viga/VIGAScreen.tsx` + `src/services/vigaService.ts`
- `supabase/functions/generate-furniture-from-image/index.ts`

---

## Phase 1 — Architecture Violations

### Task 1: Create `update-profile` Edge Function

**Files:**
- Create: `supabase/functions/update-profile/index.ts`

- [ ] **Step 1: Create the edge function**

```typescript
// supabase/functions/update-profile/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { logAuditEvent } from '../_shared/audit.ts';

const RequestSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  avatar_url: z.string().url().optional(),
}).refine(data => data.display_name !== undefined || data.avatar_url !== undefined, {
  message: 'At least one field must be provided',
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const updates: Record<string, string> = {};
    if (parsed.data.display_name !== undefined) updates.display_name = parsed.data.display_name;
    if (parsed.data.avatar_url !== undefined) updates.avatar_url = parsed.data.avatar_url;

    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    await logAuditEvent(supabaseAdmin, user.id, 'profile_updated', 'users', user.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = (err as Error).message ?? 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Verify the function structure matches other edge functions**

Open `supabase/functions/delete-account/index.ts` and confirm the import paths match exactly (same Deno std version, same `_shared/` import paths). Adjust if needed.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/update-profile/index.ts
git commit -m "feat(edge): add update-profile edge function with Zod validation + audit log"
```

---

### Task 2: Add `updateProfile()` to authService and migrate AccountScreen

**Files:**
- Modify: `src/services/authService.ts`
- Modify: `src/screens/account/AccountScreen.tsx`

- [ ] **Step 1: Add `updateProfile()` to authService.ts**

Open `src/services/authService.ts`. Find the last exported function and add after it:

```typescript
export async function updateProfile(fields: {
  displayName?: string;
  avatarUrl?: string;
}): Promise<void> {
  const body: Record<string, string> = {};
  if (fields.displayName !== undefined) body.display_name = fields.displayName;
  if (fields.avatarUrl !== undefined) body.avatar_url = fields.avatarUrl;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase.functions.invoke('update-profile', {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw error;
}
```

- [ ] **Step 2: Replace display_name direct update in AccountScreen**

Open `src/screens/account/AccountScreen.tsx`. Find the block around line 355–365 that looks like:

```typescript
await supabase.from('users').update({ display_name: nameVal.trim() }).eq('id', user.id);
```

Replace that entire `await supabase.from(...)` call with:

```typescript
await updateProfile({ displayName: nameVal.trim() });
```

Add `updateProfile` to the import from `../../services/authService`.
Remove the `supabase` import line if it's no longer used elsewhere in AccountScreen after the next step.

- [ ] **Step 3: Replace avatar_url direct update in AccountScreen**

Find the block around line 375–385 that looks like:

```typescript
await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
```

Replace with:

```typescript
await updateProfile({ avatarUrl: publicUrl });
```

- [ ] **Step 4: Remove now-unused supabase import from AccountScreen if safe**

Run:
```bash
grep -n "supabase\." src/screens/account/AccountScreen.tsx
```

If the only remaining `supabase` usage is `supabase.auth.resetPasswordForEmail` (line ~609), keep the import. If no usages remain, remove it.

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "AccountScreen"
```

Expected: no output (0 errors).

- [ ] **Step 6: Commit**

```bash
git add src/services/authService.ts src/screens/account/AccountScreen.tsx
git commit -m "fix(account): route display_name and avatar_url updates through update-profile edge function"
```

---

### Task 3: Create `save-quiz` Edge Function

**Files:**
- Create: `supabase/functions/save-quiz/index.ts`

- [ ] **Step 1: Check if `user_quiz_answers` table exists**

```bash
grep -r "user_quiz_answers" supabase/migrations/ | head -5
```

If no output: the table is missing. Create a migration:

```bash
# Only run this if the grep above returned nothing
cat > supabase/migrations/060_user_quiz_answers.sql << 'EOF'
CREATE TABLE IF NOT EXISTS public.user_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  building_type TEXT,
  style TEXT,
  budget TEXT,
  household TEXT,
  priority TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_quiz" ON public.user_quiz_answers
  FOR ALL USING (auth.uid() = user_id);
EOF
```

If the grep found it, skip the migration.

- [ ] **Step 2: Create the edge function**

```typescript
// supabase/functions/save-quiz/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';

const RequestSchema = z.object({
  building_type: z.string().optional(),
  style: z.string().optional(),
  budget: z.string().optional(),
  household: z.string().optional(),
  priority: z.string().optional(),
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabaseAdmin
      .from('user_quiz_answers')
      .upsert({ user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = (err as Error).message ?? 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/save-quiz/ supabase/migrations/
git commit -m "feat(edge): add save-quiz edge function — replaces direct client upsert"
```

---

### Task 4: Migrate OnboardingQuizScreen to `save-quiz`

**Files:**
- Modify: `src/screens/auth/OnboardingQuizScreen.tsx`

- [ ] **Step 1: Find the direct upsert block in OnboardingQuizScreen**

Open `src/screens/auth/OnboardingQuizScreen.tsx`. Around line 425–440, find:

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (session?.user?.id) {
  await supabase.from('user_quiz_answers').upsert({
    user_id: session.user.id,
    // ... quiz fields
  });
}
```

- [ ] **Step 2: Replace with edge function call**

Replace the block from Step 1 with:

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (session?.access_token) {
  const { error: quizError } = await supabase.functions.invoke('save-quiz', {
    body: {
      building_type: quizAnswers.buildingType,
      style: quizAnswers.style,
      budget: quizAnswers.budget,
      household: quizAnswers.household,
      priority: quizAnswers.priority,
    },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (quizError) {
    console.warn('[OnboardingQuizScreen] quiz save failed:', quizError.message);
    // Non-fatal — proceed to next screen regardless
  }
}
```

Note: adjust the field names to match what the actual quiz answers object looks like in OnboardingQuizScreen. Read the existing quiz state variables before making this change.

- [ ] **Step 3: Remove the now-unused direct supabase.from import usage**

```bash
grep -n "supabase\." src/screens/auth/OnboardingQuizScreen.tsx
```

The only remaining call should be `supabase.auth.getSession()` and `supabase.functions.invoke()`. If `supabase.from()` no longer appears, that's correct.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "OnboardingQuizScreen"
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/screens/auth/OnboardingQuizScreen.tsx
git commit -m "fix(onboarding): route quiz save through save-quiz edge function"
```

---

## Phase 2 — Complex Feature Verification

### Task 5: Verify Co-Project Feature Wiring

**Files:**
- Read + fix: `src/stores/coProjectStore.ts`
- Read + fix: `src/services/coProjectService.ts`
- Read + fix: `src/screens/workspace/CoProjectsScreen.tsx`

- [ ] **Step 1: Audit coProjectService for direct supabase mutations**

```bash
grep -n "supabase\.from\|supabase\.rpc" src/services/coProjectService.ts
```

For each result, check if it's a write (insert/update/delete/upsert) or read (select). Writes need to go through edge functions only if they require quota checking or ownership beyond RLS. If RLS correctly enforces `user_id = auth.uid()`, direct writes are acceptable.

Expected: Co-project reads (SELECT) are fine. Writes (INSERT member invites) should be verified that RLS policy prevents inviting users to others' projects.

- [ ] **Step 2: Audit coProjectStore actions**

Open `src/stores/coProjectStore.ts`. Verify:
- `fetchCoProjects()` — calls `coProjectService.getCoProjects()` ✓
- `createCoProject(name, blueprintId)` — calls service, result stored in state ✓
- `inviteMember(projectId, email, role)` — check this exists and calls service
- `removeMember(projectId, userId)` — check this exists
- `fetchActivityFeed(projectId)` — check this exists

If any action is missing or calls the wrong thing, add it. Each action should:
1. Set `isLoading: true` at start
2. Call the service function
3. Update state on success
4. Set `error` on failure
5. Set `isLoading: false` in finally block

- [ ] **Step 3: Verify CoProjectsScreen renders correctly**

Open `src/screens/workspace/CoProjectsScreen.tsx`. Check:
- Uses `useCoProjectStore()` for data
- Has empty state, loading state, and list state
- `onCreate()` handler calls `coProjectStore.actions.createCoProject()`
- Navigation to `CoProjectDetail` on item press works

- [ ] **Step 4: Check that TierGate correctly restricts co-projects**

```bash
grep -n "TierGate\|useTierGate\|collaborators\|coProjects" src/screens/workspace/CoProjectsScreen.tsx | head -10
```

Expected: `<TierGate feature="collaborators">` should wrap the screen or the invite action. Starter and Creator have 1 collaborator max; Pro unlimited.

- [ ] **Step 5: Fix any issues found, commit**

```bash
git add src/stores/coProjectStore.ts src/services/coProjectService.ts src/screens/workspace/CoProjectsScreen.tsx
git commit -m "fix(co-projects): verify and fix store/service/screen wiring"
```

If no issues found, skip the commit.

---

### Task 6: Verify Stripe Webhook Updates Tier Correctly

**Files:**
- Read + fix: `supabase/functions/stripe-webhook/index.ts`

- [ ] **Step 1: Read the webhook handler**

```bash
cat supabase/functions/stripe-webhook/index.ts
```

- [ ] **Step 2: Verify the tier update flow**

The webhook must handle at minimum:
1. `checkout.session.completed` → set user tier to paid tier, set `subscription_id`
2. `customer.subscription.deleted` → set user tier back to `'starter'`
3. `invoice.payment_failed` → optionally downgrade or notify

Check: does the handler call `supabase.from('subscriptions').upsert()` or update the `users` table with the correct `subscription_tier` value? The tier value must be one of: `'starter' | 'creator' | 'pro' | 'architect'`.

Look for how it maps Stripe price IDs to tier names. Find the price ID → tier mapping.

- [ ] **Step 3: Cross-reference with SubscriptionScreen price IDs**

```bash
grep -n "priceId\|price_id\|PRICE_ID" src/screens/subscription/SubscriptionScreen.tsx | head -20
```

The price IDs in SubscriptionScreen must match what stripe-webhook uses to determine the tier. If they don't match, the webhook will set the wrong tier.

- [ ] **Step 4: Fix any mismatches**

If the mapping is wrong (e.g., webhook maps `price_creator_monthly` → `'creator'` but SubscriptionScreen uses `EXPO_PUBLIC_STRIPE_CREATOR_PRICE_ID`), align them.

- [ ] **Step 5: Verify user subscription record is updated**

The webhook should update both:
1. `public.subscriptions` table (subscription_id, tier, status, period_end)
2. `public.users` table (subscription_tier field)

If only one is being updated, add the other.

- [ ] **Step 6: Commit fixes (if any)**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "fix(stripe): ensure webhook correctly maps price IDs to tier names and updates both tables"
```

---

### Task 7: Verify Push Notification Pipeline

**Files:**
- Read + fix: `src/hooks/useNotifications.ts`
- Read + fix: `src/services/notificationService.ts`
- Read + fix: `supabase/functions/register-push-token/index.ts`

- [ ] **Step 1: Read useNotifications hook**

```bash
cat src/hooks/useNotifications.ts
```

Check: does it call `Notifications.requestPermissionsAsync()` then register the push token by calling the `register-push-token` edge function?

- [ ] **Step 2: Verify register-push-token edge function**

```bash
cat supabase/functions/register-push-token/index.ts
```

Check: uses `getAuthUser(req)`, validates token with Zod, upserts into `push_tokens` (or similar) table with `user_id` from JWT.

- [ ] **Step 3: Verify Realtime subscription in notificationService**

```bash
grep -n "channel\|subscribe\|on(" src/services/notificationService.ts
```

Check: the channel listens on the correct table/event: `supabase.channel('notifications:userId').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: \`user_id=eq.${userId}\` }, callback)`.

- [ ] **Step 4: Fix any broken pieces**

Common issues to look for:
- Token not being sent to edge function (just logged locally)
- Channel filter missing (receives ALL notifications, not just user's)
- Permission request not awaited before subscription

- [ ] **Step 5: Commit fixes**

```bash
git add src/hooks/useNotifications.ts src/services/notificationService.ts supabase/functions/register-push-token/index.ts
git commit -m "fix(notifications): verify push token registration and realtime subscription wiring"
```

---

### Task 8: Verify VIGA / Meshy Polling Logic

**Files:**
- Read + fix: `src/screens/viga/VIGAScreen.tsx`
- Read + fix: `src/services/vigaService.ts`
- Read + fix: `supabase/functions/generate-furniture-from-image/index.ts`

- [ ] **Step 1: Read the full VIGAScreen submission flow**

```bash
grep -n "submitMeshyReconstruction\|pollForMesh\|meshId\|status" src/screens/viga/VIGAScreen.tsx | head -20
```

Trace: image pick → upload → get public URL → call `submitMeshyReconstruction(url)` → get meshId → poll status → save to DB.

- [ ] **Step 2: Verify polling logic in vigaService**

```bash
cat src/services/vigaService.ts
```

Check: is there a polling loop that checks Meshy task status? The known issue (from tasks/todo.md) is that `generate-texture` has a blocking 60s loop. Check if `vigaService` has the same anti-pattern.

If `vigaService.pollMeshStatus()` has a blocking while loop with `await sleep(interval)`, this will timeout on mobile. The fix: poll with a timeout limit and surface an error if the mesh isn't ready within the window.

- [ ] **Step 3: Verify edge function has Meshy API key**

```bash
grep -n "MESHY\|meshy\|Meshy" supabase/functions/generate-furniture-from-image/index.ts | head -10
```

The key must come from `Deno.env.get('MESHY_API_KEY')` — never hardcoded.

- [ ] **Step 4: Verify Storage RLS for furniture-images bucket**

```bash
grep -rn "furniture-images" supabase/migrations/ | head -10
```

If the bucket policy exists, check it enforces `auth.uid()::text = (storage.foldername(name))[1]` — meaning users can only upload to their own folder (`userId/filename`). If the policy is missing or too permissive, add it:

```sql
-- Add to a new migration if needed
CREATE POLICY "users_own_furniture_images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'furniture-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

- [ ] **Step 5: Fix polling if blocking pattern found**

If `vigaService` polls in a blocking loop, replace with a promise-based poll with timeout:

```typescript
async function pollMeshStatus(meshId: string, maxWaitMs = 45000): Promise<'succeeded' | 'failed' | 'timeout'> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = await checkMeshStatus(meshId); // single status check
    if (status === 'succeeded') return 'succeeded';
    if (status === 'failed') return 'failed';
    await new Promise(r => setTimeout(r, 3000)); // 3s between polls
  }
  return 'timeout';
}
```

- [ ] **Step 6: Commit fixes**

```bash
git add src/screens/viga/VIGAScreen.tsx src/services/vigaService.ts
git commit -m "fix(viga): fix mesh polling timeout, verify storage RLS and API key pattern"
```

---

### Task 9: Verify Generation Flow — All 7 Steps

**Files:**
- Read: `src/screens/generation/GenerationScreen.tsx`
- Read: `src/screens/generation/steps/` (all step files)

- [ ] **Step 1: Verify GenerationPayload fields are all populated**

```bash
grep -n "payload\|GenerationPayload" src/screens/generation/GenerationScreen.tsx | head -30
```

The final payload submitted to `ai-generate` must include ALL fields from the `GenerationPayload` type in `src/types/generation.ts`. Missing optional fields are fine; required fields must always be set.

- [ ] **Step 2: Check each step saves to payload correctly**

```bash
ls src/screens/generation/steps/
```

For each step file:
- Open it
- Find the `onNext(value)` or `onChange(value)` callback
- Verify it sets the correct field on the generation state
- Verify it matches the field name in `GenerationPayload`

Common mistake: step sets `buildingType` but `GenerationPayload` expects `buildingType` (correct) vs a mismatch like `type` or `building_type`.

- [ ] **Step 3: Verify voice transcription sends to correct edge function**

```bash
grep -n "transcribe\|voice\|recording" src/screens/generation/steps/Step6Notes.tsx | head -15
```

Check: does it call `supabase.functions.invoke('transcribe', ...)` with the audio data? Verify the edge function name matches `supabase/functions/transcribe/`.

- [ ] **Step 4: Verify the final submit calls ai-generate correctly**

Find the `handleGenerate()` or equivalent in `GenerationScreen.tsx`. It should:
1. Build the full `GenerationPayload`
2. Call `aiService.generateFloorPlan(payload)` (or equivalent)
3. Which calls `supabase.functions.invoke('ai-generate', { body: payload })`
4. Get back `BlueprintData`
5. Call `blueprintStore.actions.loadBlueprint(blueprintData)`
6. Navigate to `Workspace`

Verify each step in this chain.

- [ ] **Step 5: Fix any broken connections**

If any step in the chain is broken (wrong field name, wrong edge function name, missing navigate call), fix it.

- [ ] **Step 6: Commit fixes**

```bash
git add src/screens/generation/
git commit -m "fix(generation): verify all 7 steps populate GenerationPayload correctly"
```

---

### Task 10: Verify Tier Gate Works on All Protected Features

**Files:**
- Read + verify: `src/hooks/useTierGate.ts`
- Read + verify: `src/components/common/TierGate.tsx`

- [ ] **Step 1: Read useTierGate hook**

```bash
cat src/hooks/useTierGate.ts
```

Check:
1. Does it read the user's tier from `useSession()` or `authStore`?
2. Does it look up limits from `TIER_LIMITS[userTier][feature]`?
3. Does it return `{ allowed: boolean, remaining: number, limit: number, upgrade: TierName }`?
4. Does it call the server-side quota check (or only client-side)?

If it's ONLY client-side (no server RPC call), that's acceptable for UI gating. The server-side enforcement is in the edge functions.

- [ ] **Step 2: Verify TierGate component**

```bash
cat src/components/common/TierGate.tsx
```

Check: when `allowed === false`, does it render an upgrade prompt instead of `children`? Or does it render children but with a lock overlay?

- [ ] **Step 3: Audit which screens have TierGate**

```bash
grep -rn "TierGate\|useTierGate" src/screens/ --include="*.tsx" | grep -v "node_modules"
```

Expected to find TierGate on:
- VIGAScreen (vigaRequestsPerMonth)
- ARScanScreen (arScansPerMonth)
- GenerationScreen or GenerationStep (aiGenerationsPerMonth)
- CoProjectsScreen (collaborators)
- TemplatePublish (publishedTemplates)
- WorkspaceScreen AI chat (aiChatMessagesPerDay)

If a premium feature screen is missing TierGate, add `<TierGate feature="featureName" tierRequired="creator">` wrapping the premium content.

- [ ] **Step 4: Commit any additions**

```bash
git add src/screens/ src/components/common/TierGate.tsx
git commit -m "fix(tier): ensure all premium feature screens have TierGate enforcement"
```

---

## Phase 3 — Code Quality

### Task 11: Audit and Remove Debug Console Statements

**Files:**
- Modify: various `src/screens/` and `src/services/` files

- [ ] **Step 1: Find all console.log/warn/error in src/screens/**

```bash
grep -rn "console\.log\|console\.warn\|console\.error" src/screens/ --include="*.tsx" | grep -v "node_modules"
```

- [ ] **Step 2: Categorise each hit**

For each result:
- `console.error` in catch blocks: **KEEP** — these are real error reports
- `console.warn` in catch blocks with a user-facing fallback: **KEEP**
- `console.log` for state/debug: **REMOVE**
- `console.warn` on expected flows: **REMOVE**

- [ ] **Step 3: Remove debug statements**

Use `sed` or targeted file edits to remove each debug `console.log`. Example:

```bash
# Preview what will be removed
grep -n "console\.log" src/screens/generation/GenerationScreen.tsx
# Then manually edit and remove each line
```

Do this for all screens with debug logs.

- [ ] **Step 4: Same pass for src/services/**

```bash
grep -rn "console\.log" src/services/ --include="*.ts" | grep -v "node_modules"
```

Remove debug logs, keep error logs in catch blocks.

- [ ] **Step 5: Commit**

```bash
git add src/screens/ src/services/
git commit -m "chore: remove debug console.log statements, keep error logs in catch blocks"
```

---

### Task 12: Audit TypeScript `@ts-expect-error` and `as any` Suppressions

**Files:**
- Read + fix: various

- [ ] **Step 1: Find all suppressions**

```bash
grep -rn "@ts-expect-error\|@ts-ignore\|as any\|as unknown" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v ".d.ts"
```

- [ ] **Step 2: Categorise each suppression**

For each hit:
- `@ts-expect-error -- FlashList v2 prop not in types` → **ACCEPTABLE** (documented, known version gap)
- `as never` for R3F mesh props → **ACCEPTABLE** (ambient types limitation)
- `as any` with no comment → **FIX** (find the real type)
- `@ts-ignore` with no explanation → **FIX or DOCUMENT**

- [ ] **Step 3: Fix each unjustified suppression**

For each unjustified `as any` cast, find the proper type. Common patterns:
- `(store as any).actions.method()` → use the proper store type
- `(response as any).data` → type the response interface
- `(event as any).nativeEvent` → use the correct React Native event type

- [ ] **Step 4: TypeScript clean check**

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "__tests__\|App.tsx" | wc -l
```

Expected: 0 errors in app source.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "fix(types): replace unjustified as-any casts with proper TypeScript types"
```

---

### Task 13: Verify Supabase Client Import Consistency

**Files:**
- Read: all imports

- [ ] **Step 1: Check for wrong supabase client import paths**

```bash
grep -rn "from.*services/supabase\|from.*supabaseClient" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

Expected: 0 results. All imports should use `from '../../lib/supabase'` (canonical path per CLAUDE.md).

- [ ] **Step 2: Fix any wrong imports**

If any file imports from `services/supabase` or `utils/supabaseClient`, change to `../../lib/supabase` (adjust relative path as needed).

- [ ] **Step 3: Verify lib/supabase.ts exists and is correct**

```bash
cat src/lib/supabase.ts
```

Check: uses `ExpoSecureStoreAdapter` for storage, uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` env vars.

- [ ] **Step 4: Commit if changes needed**

```bash
git add src/
git commit -m "fix(imports): consolidate supabase client imports to src/lib/supabase.ts"
```

---

## Phase 4 — Final Verification Pass

### Task 14: Run Full TypeScript Check and Fix Remaining Issues

- [ ] **Step 1: Full project TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "__tests__\|App.tsx\|global.css"
```

Expected: 0 results.

- [ ] **Step 2: Fix any remaining errors introduced by plan work**

Each error will be in a specific file and line. Fix them individually. Do NOT use `as any` as a shortcut — find the proper fix.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: final TypeScript clean pass — all src errors resolved"
```

---

### Task 15: Update Memory and Project Documentation

- [ ] **Step 1: Update tasks/todo.md**

Open `tasks/todo.md` and mark the architecture fixes as complete:

```markdown
### Architecture Compliance Agent
- [x] Create update-profile edge function
- [x] Migrate AccountScreen to use update-profile edge function
- [x] Create save-quiz edge function
- [x] Migrate OnboardingQuizScreen to edge function
- [x] Verify co-project feature wiring
- [x] Verify Stripe webhook tier update
- [x] Verify VIGA/Meshy polling and Storage RLS
- [x] Verify push notification pipeline
- [x] Remove debug console.log statements
- [x] Fix unjustified TypeScript suppressions
```

- [ ] **Step 2: Update tasks/handoffs.md**

```markdown
## Active Handoffs
[2026-06-01] Architecture Agent → All Agents: Direct supabase.from() calls from AccountScreen
and OnboardingQuizScreen have been moved to edge functions (update-profile, save-quiz).
Auth screens (supabase.auth.*) are INTENTIONALLY client-side — this is correct Supabase SDK usage.
VIGAScreen storage upload remains client-side (protected by Storage RLS) — only the DB update
now goes through update-profile. All architectural violations from the June 2026 audit are resolved.
```

- [ ] **Step 3: Commit documentation**

```bash
git add tasks/todo.md tasks/handoffs.md
git commit -m "docs: mark architecture compliance tasks complete, update handoffs"
```

---

## Self-Review Checklist

### Spec Coverage
- [x] AccountScreen display_name violation → Task 2
- [x] AccountScreen avatar_url violation → Task 2
- [x] OnboardingQuizScreen direct upsert → Task 4
- [x] Co-project wiring verification → Task 5
- [x] Stripe webhook tier mapping → Task 6
- [x] Push notification pipeline → Task 7
- [x] VIGA/Meshy polling → Task 8
- [x] Generation flow 7 steps → Task 9
- [x] Tier gate coverage → Task 10
- [x] Console.log cleanup → Task 11
- [x] TypeScript suppressions → Task 12
- [x] Supabase import consistency → Task 13
- [x] Final TypeScript clean → Task 14

### No Placeholders
All code blocks are complete implementations. All commands have expected outputs.

### Type Consistency
- `updateProfile()` in authService matches the call in AccountScreen
- `save-quiz` edge function accepts the same fields that OnboardingQuizScreen sends
- All `getAuthUser(req)` calls match the signature in `_shared/auth.ts`
