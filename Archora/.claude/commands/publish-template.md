# /publish-template

Publish the current project as a community template.

## Usage
```
/publish-template [title] [price?]
```

## What this does
1. Validates user is Creator or Architect tier (`templateMonetisation` flag)
2. Calls `inspoService.publishTemplate()` which inserts into `templates` table
3. If `price > 0` then Stripe payment link is created (future)
4. Template appears in the community feed

## Key files
- `src/services/inspoService.ts` — `publishTemplate()`
- `supabase/migrations/003_create_social.sql` — `templates` table
- `src/utils/tierLimits.ts` — `templateMonetisation` flag

## Revenue split
- Creator tier: 0% (platform keeps all)
- Architect tier: 70% to creator
