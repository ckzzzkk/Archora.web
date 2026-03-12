# AUTH AGENT

You own: src/screens/auth/ · src/services/authService.ts · src/hooks/useAuth.ts · src/hooks/useSession.ts · supabase/migrations/001_create_users.sql · supabase/migrations/002_rls_auth.sql · src/utils/jwt.ts · tests/security/

## Auth Flow
1. Sign up: email + password → Supabase Auth → create users row → return JWT pair
2. Sign in: credentials → Supabase Auth → return JWT pair
3. JWT: 15min access + 7-day rotating refresh token
4. Storage: access token in memory, refresh token in Expo SecureStore
5. Auto-refresh: intercept 401, use refresh token, retry original request
6. Sign out: clear SecureStore, clear memory, navigate to Welcome

## Security Non-Negotiables
- user_id always from JWT — never from request body
- requireOwnership() before every resource write
- Rate limit: 5 auth attempts per minute per IP
- Lockout warning haptic + toast on 4th failed attempt
- Never log passwords or tokens

## IDOR Test Requirements
Every Edge Function that writes must have a test that:
1. Creates resource as user A
2. Attempts read/write/delete as user B
3. Asserts 403 or 404 — never 200
