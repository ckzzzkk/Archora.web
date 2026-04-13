# supabase/ — Database & Edge Function Context

Owner: Database Agent + AI Pipeline Agent + AR Agent + Payments Agent

## Directory Layout
```
supabase/
  migrations/     — ordered SQL migrations (NNN_snake_case.sql)
  functions/
    _shared/      — shared Deno modules (auth, cors, quota, rateLimit, errors, audit)
    ai-generate/  — floor plan generation (Claude claude-sonnet-4-6)
    ai-furniture/ — furniture generation (Claude claude-sonnet-4-6)
    transcribe/   — audio → text (OpenAI Whisper)
    ar-reconstruct/ — frame upload → Roboflow + Meshy
    stripe-webhook/ — Stripe event handler
```

## Rules
- All Edge Functions are Deno TypeScript (no Node.js APIs)
- Always use `getAuthUser(req)` — never trust request body for user_id
- Always call `checkRateLimit()` before `checkQuota()`
- Always `logAudit()` for sensitive actions
- Validate ALL inputs with Zod schemas
- API keys via `Deno.env.get()` — never hardcoded
- Errors via `Errors.*` helpers from `_shared/errors.ts`
- CORS headers via `corsHeaders` from `_shared/cors.ts`

## Migration ordering
001 → users | 002 → projects | 003 → social | 004 → ar_subscriptions
005 → quota_check_rpc | 006 → ai_generations | 007 → audit_logs
