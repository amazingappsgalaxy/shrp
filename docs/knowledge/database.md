# Database — Supabase

## Overview
- **Provider**: Supabase (Postgres 17)
- **Project ID**: `igsyhvrctnqntqujqfif`
- **Access**: service role key bypasses RLS (custom auth means `auth.uid()` is always null)
- **Schema**: `supabase/migrations/20250101000000_initial_schema.sql`
- **Client**: `src/lib/supabase-server.ts` (service role), `src/lib/supabase-client.ts` (anon)

## Key Tables

### `users`
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE
password_hash TEXT
name TEXT
created_at TIMESTAMPTZ
```

### `sessions`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
token TEXT UNIQUE
created_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
```

### `subscriptions`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
dodo_subscription_id TEXT
plan TEXT  -- 'basic', 'creator', 'professional', 'enterprise'
status TEXT  -- 'active', 'pending_cancellation', 'cancelled', 'pending'
current_period_start TIMESTAMPTZ
next_billing_date TIMESTAMPTZ
billing_period TEXT  -- 'monthly'
created_at TIMESTAMPTZ
```

### `payments`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
dodo_payment_id TEXT UNIQUE
amount INTEGER  -- in cents
currency TEXT
status TEXT
plan TEXT
created_at TIMESTAMPTZ
```

### `credits`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
subscription_credits INTEGER DEFAULT 0
permanent_credits INTEGER DEFAULT 0
updated_at TIMESTAMPTZ
```

### `credit_transactions`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
amount INTEGER  -- positive = add, negative = deduct
type TEXT  -- 'subscription', 'permanent', 'deduction'
transaction_id TEXT UNIQUE  -- for idempotency
description TEXT
created_at TIMESTAMPTZ
```

### `history_items`
```sql
id UUID PRIMARY KEY  -- also used as task_id
user_id UUID REFERENCES users(id)
model_id TEXT
status TEXT  -- 'processing', 'completed', 'failed'
input_urls JSONB  -- [{ type, url }]
output_urls JSONB  -- [{ type, url }]
runninghub_task_id TEXT  -- null for sync tasks
credits_used INTEGER
generation_time_ms INTEGER
created_at TIMESTAMPTZ
```

### `webhook_logs`
```sql
id UUID PRIMARY KEY
event_type TEXT
payload JSONB
processed_at TIMESTAMPTZ
```

## Atomic RPC Functions
These are Postgres functions that run in a single transaction:

```sql
-- Get current balance
SELECT * FROM get_user_credits(user_id UUID)
-- Returns: { subscription_credits, permanent_credits, total }

-- Add credits (idempotent via transaction_id)
SELECT add_credits_atomic(user_id, amount, credit_type, transaction_id, description)

-- Deduct credits (subscription first, then permanent)
SELECT deduct_credits_atomic(user_id, amount, transaction_id, description)
-- Returns: { success, error? }

-- Expire subscription credits (Day Pass flow)
SELECT expire_user_subscription_credits(user_id)
```

## Important Notes
- **RLS is enabled** but bypassed via service role key — use service role for all server-side ops
- **`auth.uid()` is always null** — custom auth doesn't integrate with Supabase's auth system
- **DB column names are snake_case**, but TypeScript types in `supabase.ts` are sometimes camelCase — many `@ts-ignore` workarounds in the codebase

## Cursor Pagination (history)
History page uses cursor-based pagination:
```typescript
// GET /api/history/list?cursor=<timestamp>&limit=20
const { data } = await supabase
  .from('history_items')
  .select('*')
  .eq('user_id', userId)
  .lt('created_at', cursor)
  .order('created_at', { ascending: false })
  .limit(limit)
```

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
