# Payments — DodoPayments Integration

## Overview
- Payment processor: **DodoPayments** (NOT Stripe)
- SDK: `@dodopayments/node` via `src/lib/dodo-client.ts`
- Config: `src/lib/dodo-payments-config.ts`

## Pricing Plans
| Plan | Monthly | Annual | Credits/mo |
|---|---|---|---|
| Basic | $9/mo | $96/yr | 16,200 |
| Creator | $25/mo | $252/yr | 44,400 |
| Professional | $39/mo | $408/yr | 73,800 |
| Enterprise | $99/mo | $1,008/yr | 187,800 |
| Day Pass | $10/day | — | 9,900 (24h) |

**Rules:**
- Only one active subscription per user at a time
- Annual plan credits still allocated monthly (30-day rolling expiry per batch)
- Top-up (permanent) credits require an active plan to purchase

Product IDs come from env vars: `DODO_BASIC_MONTHLY_PRODUCT_ID`, `DODO_CREATOR_MONTHLY_PRODUCT_ID`, etc.

**Known test-mode product IDs:**
- Creator Monthly: `pdt_0NYlpIymBOLG7VGKUM3pF`
- Creator Yearly: `pdt_WNr5iJDaFOiDCXWKZWjX2`
- Day Pass: `pdt_0NYhE3lLB1AVBQ1IF1NzS` (hardcoded in code)

## Checkout Flow
```
User clicks "Subscribe"
  → POST /api/payments/checkout
  → Dodo checkout URL (redirect)
  → User pays on Dodo
  → Redirect to /payment-success?paymentId=...
  → POST /api/payments/complete (client-side call)
  → Credits allocated, subscription stored in DB
```

### `/api/payments/checkout` (route.ts)
- Validates user session
- Calls `dodoClient.subscriptions.create()` or one-time for Day Pass
- Returns `{ checkoutUrl }` to client

### `/api/payments/complete` (route.ts)
- Accepts any non-cancelled pending subscription (not just `active`)
- Stores `status: 'active'` in `subscriptions` table
- Computes `next_billing_date = now + billingPeriod` when Dodo returns a past date (known Dodo issue)
- Calls `CreditsService.allocateSubscriptionCredits()` to add credits

## Webhook
**Endpoint**: `POST /api/payments/webhook`
**Signature**: verified via `DODO_WEBHOOK_SECRET`
**Events handled**:
- `payment.succeeded` — one-time payments
- `subscription.active` — new subscription activated
- `subscription.renewed` — renewal (credits re-added)
- `subscription.updated` — plan changes
- `payment.processing` — Dodo test mode only (never fires `subscription.active` in test)

All events logged to `webhook_logs` table.

## Subscription Cancellation
**Endpoint**: `POST /api/user/subscription/cancel`
- Calls Dodo with `cancel_at_next_billing_date: true`
- Sets `status: 'pending_cancellation'` in DB
- Preserves existing `next_billing_date` (Dodo sometimes returns a past date — bug in their API)
- User retains access until `next_billing_date`

## Known Dodo Issues (Test Mode)
- Only fires `payment.processing` in test; `subscription.active` never fires
- HyperSwitch internal error on all INR test payments
- `/api/payments/complete` client call is the reliable fallback for test mode

## Key Files
- `src/lib/dodo-client.ts` — Dodo SDK singleton
- `src/lib/dodo-payments-config.ts` — Product IDs and plan config
- `src/lib/pricing-config.ts` — Plan definitions (credits, features)
- `src/app/api/payments/webhook/route.ts` — Webhook handler
- `src/app/api/payments/checkout/route.ts` — Checkout initiation
- `src/app/api/payments/complete/route.ts` — Post-payment completion
- `src/app/api/user/subscription/cancel/route.ts` — Cancellation
