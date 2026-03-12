# /reset-quota

(Admin only) Reset a user's monthly quota counters.

## Usage
```
/reset-quota [userId]
```

## What this does
1. Verifies caller has `role = 'admin'` in the `users` table
2. Sets `ai_generations_used = 0` and `ar_scans_used = 0`
3. Sets `quota_reset_date = now()`

## Key files
- `supabase/migrations/001_create_users.sql` — quota columns
- `supabase/functions/_shared/quota.ts` — quota check logic

## ⚠️ Admin only
This slash command should only be available to users with `role = 'admin'`.
