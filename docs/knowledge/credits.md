# Credits System

## Overview
Two credit types:
- **`subscription`**: expire at billing period end
- **`permanent`**: never expire (purchased as top-up)

Credit balance returned from `GET /api/user/me` as `{ subscription_credits, permanent_credits, total }`.

## Atomic Database Operations
All credit operations use Postgres RPC functions (atomic, race-condition-safe):

| Function | Purpose |
|---|---|
| `get_user_credits(user_id)` | Get current balance — returns `{ total, subscription_credits, permanent_credits, subscription_expire_at }` |
| `add_credits_atomic(user_id, amount, type, tx_id, desc)` | Add credits with idempotency — returns `{ duplicate: true }` if tx_id already used |
| `deduct_credits_atomic(user_id, amount, tx_id, desc)` | Deduct credits (subscription first, then permanent) |
| `expire_subscription_credits()` | Batch-expire ALL stale subscription credits (cron job) |
| `expire_user_subscription_credits(user_id)` | Zero out one user's subscription credits (Day Pass flow) |

## Idempotency
All credit additions use `transaction_id` to prevent double-allocation.
- Subscription credits: `sub_period_{dodoSubscriptionId}_{YYYY-MM-DD}` (period **end** date)
- One-time payments: Dodo `payment_id`
- Duplicate `transaction_id` → `add_credits_atomic` returns `{ duplicate: true }` — no re-credit, no error

## Credit Costs (ModelPricingEngine)
- Config: `src/lib/model-pricing-config.ts`
- Smart Upscaler 4K: 80cr | 8K: 120cr
- Skin Editor: ~80cr per run
- Edit (Synvow): varies by model, ~20-50cr
- Image generation: 20-80cr depending on model/resolution

## Server-side Deduction Pattern
```typescript
// CORRECT operation order:
// 1. Generate output (AI call)
// 2. Update DB to 'completed'
// 3. Deduct credits

const deductResult = await UnifiedCreditsService.deductCredits(
  userId, creditCost, taskId, 'Description of operation'
)
if (!deductResult.success) {
  console.error(`🚨 CRITICAL: credit deduction FAILED for user=${userId} task=${taskId} amount=${creditCost} — ${deductResult.error}`)
  // Don't throw — output was already delivered. Just log for operator visibility.
}
```
- `deductCredits()` NEVER throws — it catches internally and returns `{ success, error? }`
- Always check `.success` — silent failures are a financial bug

## Race Condition Prevention (async tasks)
For RunningHub tasks that complete in the background:
```typescript
// In poll/route.ts and process-pending/route.ts:
const { data: updated } = await supabase
  .from('history_items')
  .update({ status: 'completed', output_urls: [...] })
  .eq('id', taskId)
  .eq('status', 'processing')  // ← ATOMIC guard: only one process wins
  .select()

const won = updated && updated.length > 0
if (won) {
  // Only the winner deducts credits
  const deductResult = await UnifiedCreditsService.deductCredits(...)
}
```

## Client-side Credit Hook
```typescript
import { useCredits } from '@/lib/hooks/use-credits'

const { total: creditBalance, isLoading: creditsLoading } = useCredits()

// Always guard with !creditsLoading to avoid false positives on initial load
if (!creditsLoading && creditBalance < creditCost) {
  setError(`Not enough credits (${creditBalance} available, ${creditCost} required)`)
  return
}
```

## Auto-refresh After Task Completion
`TaskManagerProvider` (`src/components/providers/TaskManagerProvider.tsx`) watches for task status transitions and calls `mutate(APP_DATA_KEY)` automatically. No manual refresh needed in pages.

## Key Files
- `src/lib/unified-credits.ts` — `UnifiedCreditsService` (server-side)
- `src/lib/credits-service.ts` — Lower-level credit ops
- `src/lib/model-pricing-config.ts` — Per-model credit costs
- `src/lib/hooks/use-credits.ts` — Client hook
- `src/lib/hooks/use-app-data.ts` — SWR base hook (`APP_DATA_KEY = '/api/user/me'`)
- `src/components/providers/TaskManagerProvider.tsx` — Auto-refresh on completion
- `src/app/api/user/me/route.ts` — Returns `{ credits: { subscription, permanent, total } }`
