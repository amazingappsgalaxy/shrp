# Authentication

## Overview
Custom session-based auth — NOT Supabase Auth, NOT Better-auth (disabled).

## How It Works
1. User signs up/logs in via `POST /api/auth/signup` or `POST /api/auth/login`
2. Server creates session token (`crypto.randomUUID()`) and stores in `sessions` table
3. Token set as httpOnly cookie: `session=<token>; HttpOnly; Path=/; SameSite=Lax`
4. Subsequent requests: middleware reads cookie, validates session, attaches user to request

## Key Files
- `src/lib/auth-simple.ts` — Server-side: `getSession()`, `createSession()`, `deleteSession()`
- `src/lib/auth-client-simple.ts` — Client hook: `useAuth()` — hits `GET /api/auth/session`
- `src/middleware.ts` — Protects `/app/*` routes; redirects unauthenticated to `/login`

## Password Hashing
- bcrypt with 12 rounds
- `bcrypt.hash(password, 12)` on signup
- `bcrypt.compare(password, hash)` on login

## Session Validation
```typescript
// Server-side (in any API route):
const session = await getSession(request)
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const userId = session.userId
```

## Client-side Auth
```typescript
const { user, isLoading } = useAuth()
// user is null if not logged in
// isLoading is true during initial fetch
```

## Middleware
- Protects: `/app/*` (all app pages)
- Public: everything else (landing, `/login`, `/signup`, `/api/auth/*`)
- On unauthenticated: redirects to `/login?redirect=<current-path>`

## Known Issues
1. `unified-auth.ts` returns MOCK data — not used for real auth, Better-auth is disabled
2. Auth BYPASSED in `/api/enhance-image` route (testing mode comment — not production-ready)
3. Admin page uses hardcoded credentials checked client-side only (not secure)
4. Session table has no cleanup — old sessions accumulate

## Database Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

## Password Reset Flow
- `POST /api/auth/forgot-password` — sends email with reset token
- `POST /api/auth/reset-password` — validates token, updates password
- Reset tokens stored in `users` table (or separate table)
