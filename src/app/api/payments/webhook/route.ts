import { NextRequest, NextResponse } from 'next/server'
import { CreditsService } from '@/lib/credits-service'
import { supabaseAdmin } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'
import { computePeriodEnd } from '@/lib/pricing-config'
import crypto from 'crypto'

const admin = supabaseAdmin as any

function normalizeBillingPeriod(value: unknown): 'monthly' | 'yearly' | 'daily' {
  const v = String(value || 'monthly').toLowerCase()
  if (v === 'monthly' || v === 'yearly' || v === 'daily') return v
  if (v.startsWith('month')) return 'monthly'
  if (v.startsWith('year')) return 'yearly'
  if (v.startsWith('day')) return 'daily'
  return 'monthly'
}

/**
 * Verify Dodo webhook signature following the Standard Webhooks specification.
 * https://docs.dodopayments.com/developer-resources/webhooks#verifying-signatures
 *
 * Standard Webhooks format:
 *   message  = "{webhook-id}.{webhook-timestamp}.{raw-body}"
 *   signature = HMAC-SHA256(message, secret)
 *   header   = "webhook-signature: v1,<base64-encoded-signature>"
 */
function verifyDodoSignature(
  body: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string
): boolean {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET || process.env.DODO_PAYMENTS_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('⚠️ Webhook secret not set (DODO_WEBHOOK_SECRET / DODO_PAYMENTS_WEBHOOK_SECRET)')
    return false
  }

  try {
    // Strip the "whsec_" prefix if present (Dodo uses base64-encoded secret)
    const secretBase64 = webhookSecret.startsWith('whsec_')
      ? webhookSecret.slice('whsec_'.length)
      : webhookSecret
    const secretBytes = Buffer.from(secretBase64, 'base64')

    // Build the signed message per Standard Webhooks spec
    const message = `${webhookId}.${webhookTimestamp}.${body}`
    const hmac = crypto.createHmac('sha256', secretBytes)
    const computedB64 = hmac.update(message).digest('base64')
    const computedSig = `v1,${computedB64}`

    // webhook-signature header may contain multiple signatures separated by spaces
    const providedSigs = webhookSignature.split(' ')
    return providedSigs.some(sig => sig === computedSig)
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log('🔔 Webhook received at:', timestamp)

  // Log to DB for debugging
  try {
    const bodyText = await request.clone().text()
    const headerObj = Object.fromEntries(request.headers.entries())

    if (admin) {
      await admin.from('webhook_logs').insert({
        method: request.method,
        url: request.url,
        headers: headerObj,
        body: bodyText
      })
    }
  } catch (logError) {
    console.error('Failed to log webhook:', logError)
  }

  try {
    const body = await request.text()

    // Dodo uses Standard Webhooks headers
    const webhookId = request.headers.get('webhook-id') || ''
    const webhookTimestamp = request.headers.get('webhook-timestamp') || ''
    const webhookSignature = request.headers.get('webhook-signature') || ''

    // Always require valid webhook signature – no unauthenticated webhooks allowed
    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error('❌ Webhook signature headers missing')
      return NextResponse.json({ error: 'Webhook signature required' }, { status: 401 })
    }

    const isValid = verifyDodoSignature(body, webhookId, webhookTimestamp, webhookSignature)
    if (!isValid) {
      console.error('❌ Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    console.log('✅ Webhook signature verified')

    const event = JSON.parse(body)
    console.log('📋 Event type:', event.type)

    // Route to appropriate handler
    switch (event.type) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(event.data)
        break

      case 'payment.processing':
        await handlePaymentProcessing(event.data)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.data)
        break

      case 'subscription.active':
        await handleSubscriptionActive(event.data)
        break

      case 'subscription.renewed':
        await handleSubscriptionRenewed(event.data)
        break

      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data)
        break

      case 'subscription.plan_changed':
        await handleSubscriptionPlanChanged(event.data)
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Handle payment.succeeded event
 * This is the ONLY place where we allocate credits for one-time payments
 */
async function handlePaymentSucceeded(payment: any) {
  console.log('💳 Processing payment.succeeded:', payment.payment_id || payment.id)

  try {
    // Extract user and plan info
    let userId = payment.metadata?.userId || payment.customer?.metadata?.userId
    const plan = payment.metadata?.plan || 'creator'
    const billingPeriod = normalizeBillingPeriod(payment.metadata?.billingPeriod || 'monthly')
    const paymentId = payment.payment_id || payment.id
    const subscriptionId = payment.subscription_id

    if (!userId) {
      console.log('⚠️ No userId found in payment metadata, attempting lookup by customer_id')
      if (admin && payment.customer_id) {
        // @ts-ignore
        const { data: subData } = await admin
          .from('subscriptions')
          .select('user_id')
          .eq('dodo_customer_id', payment.customer?.customer_id || payment.customer_id)
          .maybeSingle()

        // @ts-ignore
        if (subData?.user_id) {
          // @ts-ignore
          userId = subData.user_id
          console.log('✅ Found userId from customer_id lookup:', userId)
        } else {
          console.error('❌ Could not find user for payment:', paymentId)
          return
        }
      } else {
        console.error('❌ No userId found and admin/customer_id missing')
        return
      }
    }

    console.log(`👤 User: ${userId}, Plan: ${plan}, Period: ${billingPeriod}`)

    // Handle top-up payments — allocate permanent credits and return early
    if (payment.metadata?.type === 'topup') {
      const creditsAmount = parseInt(payment.metadata?.credits || '0', 10)
      if (creditsAmount > 0 && userId) {
        console.log(`🎁 Top-up: allocating ${creditsAmount} permanent credits to user ${userId}`)
        await CreditsService.allocatePermanentCredits(
          userId,
          creditsAmount,
          paymentId,
          `Top-up: ${creditsAmount} credits`
        )
        // Record payment in DB
        if (admin) {
          const { data: existingPayment } = await admin
            .from('payments')
            .select('id')
            .eq('dodo_payment_id', paymentId)
            .limit(1)
            .maybeSingle()
          if (!existingPayment?.id) {
            await admin.from('payments').insert({
              user_id: userId,
              dodo_payment_id: paymentId,
              dodo_customer_id: payment.customer?.customer_id || payment.customer_id,
              amount: payment.amount || payment.total_amount || 0,
              currency: payment.currency || 'USD',
              status: 'succeeded',
              payment_method: payment.payment_method || 'card',
              plan: 'topup',
              billing_period: 'monthly',
              paid_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: payment
            })
          }
        }
      }
      return
    }

    // For subscription payments, look up the current plan from our DB
    // (the change-plan route updates the subscription before Dodo fires the webhook)
    let recordPlan = plan
    let recordBillingPeriod = billingPeriod
    if (subscriptionId && admin) {
      const { data: currentSub } = await admin
        .from('subscriptions')
        .select('plan, billing_period')
        .eq('dodo_subscription_id', subscriptionId)
        .limit(1)
        .maybeSingle()
      if (currentSub?.plan) {
        recordPlan = currentSub.plan
        recordBillingPeriod = currentSub.billing_period || billingPeriod
        console.log(`📋 Using DB plan for payment record: ${recordPlan} (metadata had: ${plan})`)
      }
    }

    // Record payment in database — if a 'processing' record already exists, upgrade it to 'succeeded'
    if (admin) {
      const { data: existingPayment } = await admin
        .from('payments')
        .select('id, status')
        .eq('dodo_payment_id', paymentId)
        .limit(1)
        .maybeSingle()

      if (existingPayment?.id) {
        if (existingPayment.status !== 'succeeded') {
          // Upgrade processing → succeeded
          await admin.from('payments').update({
            status: 'succeeded',
            plan: recordPlan,
            billing_period: recordBillingPeriod,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: payment
          }).eq('id', existingPayment.id)
          console.log('✅ Payment upgraded from processing → succeeded:', paymentId)
        } else {
          console.log('ℹ️ Payment already recorded as succeeded:', paymentId)
        }
      } else {
        // @ts-ignore - Supabase type definitions are camelCase but DB is snake_case
        const { error: insertError } = await admin.from('payments').insert({
          user_id: userId,
          dodo_payment_id: paymentId,
          dodo_customer_id: payment.customer?.customer_id || payment.customer_id,
          amount: payment.amount || payment.total_amount || 0,
          currency: payment.currency || 'INR',
          status: 'succeeded',
          payment_method: payment.payment_method || 'card',
          plan: recordPlan,
          billing_period: recordBillingPeriod,
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: payment
        })
        if (insertError) {
          console.error('❌ Failed to insert payment:', insertError)
        }
      }
    }

    if (subscriptionId) {
      try {
        const creditsOverrideRaw = payment.metadata?.credits
        const creditsOverride =
          creditsOverrideRaw !== undefined && creditsOverrideRaw !== null && !Number.isNaN(Number(creditsOverrideRaw))
            ? Number(creditsOverrideRaw)
            : undefined

        const providerSubscription: any = await (dodo as any).subscriptions.retrieve(subscriptionId)
        const resolvedUserId =
          providerSubscription?.metadata?.userId ||
          providerSubscription?.metadata?.user_id ||
          providerSubscription?.customer?.metadata?.userId ||
          providerSubscription?.customer?.metadata?.user_id ||
          userId
        const resolvedPlan = providerSubscription?.metadata?.plan || providerSubscription?.plan || plan
        const resolvedBillingPeriod = normalizeBillingPeriod(
          providerSubscription?.metadata?.billingPeriod ||
            providerSubscription?.billing_period ||
            billingPeriod ||
            'monthly'
        )

        if (!resolvedUserId) return

        // For daily plans: always recompute — Dodo returns next_billing_date as ~1 month for daily subscriptions.
        // For other plans: trust Dodo's date if it's in the future, else compute from now.
        const rawPeriodEnd = providerSubscription?.next_billing_date || providerSubscription?.current_period_end || null
        const periodEnd =
          resolvedBillingPeriod === 'daily' ||
          !rawPeriodEnd ||
          new Date(rawPeriodEnd).getTime() < Date.now() + 60_000
            ? computePeriodEnd(resolvedBillingPeriod).toISOString()
            : rawPeriodEnd

        const dateStr = new Date(periodEnd).toISOString().split('T')[0]
        const transactionId = `sub_period_${subscriptionId}_${dateStr}`

        // Update subscription to active in DB (important for test mode where subscription.active never fires)
        if (admin) {
          await admin.from('subscriptions').update({
            status: 'active',
            next_billing_date: periodEnd,
            updated_at: new Date().toISOString()
          }).eq('dodo_subscription_id', subscriptionId)
          console.log('✅ Subscription status updated to active via payment webhook')
        }

        await CreditsService.allocateSubscriptionCredits(
          resolvedUserId,
          resolvedPlan,
          resolvedBillingPeriod,
          subscriptionId,
          transactionId,
          {
            expiresAt: new Date(periodEnd),
            credits: creditsOverride,
            metadata: { source: 'webhook.payment_succeeded' }
          }
        )
      } catch (e) {
        console.error('❌ Error processing subscription payment webhook:', e)
      }
      return
    }

    // Allocate credits (with idempotency built-in)
    const result = await CreditsService.allocateSubscriptionCredits(
      userId,
      plan,
      billingPeriod as 'monthly' | 'yearly',
      null, // No subscription ID for one-time payment
      paymentId
    )

    if (result.duplicate) {
      console.log('⚠️ Duplicate payment detected, credits already allocated')
    } else {
      console.log('✅ Credits allocated successfully')
    }
  } catch (error) {
    console.error('❌ Error handling payment.succeeded:', error)
  }
}

/**
 * Handle subscription.active event
 * This is the ONLY place where we allocate credits for subscriptions
 */
async function handleSubscriptionActive(subscription: any) {
  console.log('✅ Processing subscription.active:', subscription.subscription_id || subscription.id)

  try {
    let userId =
      subscription.metadata?.userId ||
      subscription.metadata?.user_id ||
      subscription.customer?.metadata?.userId ||
      subscription.customer?.metadata?.user_id ||
      null
    const plan = subscription.metadata?.plan || subscription.plan || 'creator'
    const billingPeriod = normalizeBillingPeriod(subscription.metadata?.billingPeriod || subscription.billing_period || 'monthly')
    const subscriptionId = subscription.subscription_id || subscription.id
    // Generate a deterministic transaction ID based on the period end date
    // This allows identifying duplicate events (e.g. Active + Renewed firing together for the same period)
    const periodEnd = subscription.next_billing_date || subscription.current_period_end
    let paymentId = subscription.latest_payment_id || subscription.payment_id

    if (periodEnd) {
      // Create a unique ID for this billing period
      // Format: sub_period_{subscriptionId}_{periodEnd}
      const dateStr = new Date(periodEnd).toISOString().split('T')[0]
      paymentId = `sub_period_${subscriptionId}_${dateStr}`
    } else {
      paymentId = paymentId || `sub-${subscriptionId}`
    }

    console.log(`🔍 [Active] Processing Transaction ID: ${paymentId}`)

    if (!userId && admin) {
      const customerId = subscription.customer?.customer_id || subscription.customer_id || null
      if (customerId) {
        const { data: subRow } = await admin
          .from('subscriptions')
          .select('user_id')
          .eq('dodo_customer_id', customerId)
          .limit(1)
          .maybeSingle()
        if ((subRow as any)?.user_id) userId = (subRow as any).user_id
      }
    }

    if (!userId) return

    console.log(`👤 User: ${userId}, Plan: ${plan}, Period: ${billingPeriod}`)

    // Update subscription in database
    if (admin) {
      console.log('📝 Attempting to upsert subscription:', subscriptionId)
      // @ts-ignore - Supabase type definitions are camelCase but DB is snake_case
      const { error: upsertError } = await admin.from('subscriptions').upsert({
        user_id: userId,
        plan,
        status: 'active',
        billing_period: billingPeriod,
        dodo_subscription_id: subscriptionId,
        dodo_customer_id: subscription.customer?.customer_id || subscription.customer_id,
        next_billing_date: subscription.next_billing_date || subscription.current_period_end,
        billing_name: subscription.customer?.name || subscription.metadata?.user_name,
        billing_email: subscription.customer?.email || subscription.metadata?.user_email,
        billing_address: subscription.billing || subscription.customer?.billing,
        currency: subscription.currency || 'USD',
        amount: subscription.recurring_pre_tax_amount || subscription.amount || 0,
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

      if (upsertError) {
        console.error('❌ database upsert error:', upsertError)
        console.error('❌ upsert error details:', JSON.stringify(upsertError))
      } else {
        console.log('✅ Subscription upserted successfully')
      }
    } else {
      console.error('❌ Admin client not available for subscription upsert')
    }

    // Allocate credits (with idempotency built-in)
    const result = await CreditsService.allocateSubscriptionCredits(
      userId,
      plan,
      billingPeriod,
      subscriptionId,
      paymentId,
      { expiresAt: periodEnd ? new Date(periodEnd) : undefined }
    )

    if (result.duplicate) {
      console.log('⚠️ Duplicate subscription activation detected, credits already allocated')
    } else {
      console.log('✅ Subscription credits allocated successfully')
    }
  } catch (error) {
    console.error('❌ Error handling subscription.active:', error)
  }
}

/**
 * Handle subscription.renewed event
 * Allocate new credits for the renewal period
 */
async function handleSubscriptionRenewed(subscription: any) {
  console.log('🔄 Processing subscription.renewed:', subscription.subscription_id || subscription.id)

  try {
    let userId =
      subscription.metadata?.userId ||
      subscription.metadata?.user_id ||
      subscription.customer?.metadata?.userId ||
      subscription.customer?.metadata?.user_id ||
      null
    const plan = subscription.metadata?.plan || subscription.plan || 'creator'
    const billingPeriod = normalizeBillingPeriod(subscription.metadata?.billingPeriod || subscription.billing_period || 'monthly')
    const subscriptionId = subscription.subscription_id || subscription.id
    // Generate a deterministic transaction ID based on the period end date
    // This allows identifying duplicate events (e.g. Active + Renewed firing together for the same period)
    const periodEnd = subscription.next_billing_date || subscription.current_period_end
    let paymentId = subscription.latest_payment_id || subscription.payment_id

    if (periodEnd) {
      // Create a unique ID for this billing period
      // Format: sub_period_{subscriptionId}_{periodEnd}
      // This ensures both "Active" and "Renewed" events for the same period generate the same ID
      const dateStr = new Date(periodEnd).toISOString().split('T')[0]
      paymentId = `sub_period_${subscriptionId}_${dateStr}`
    } else {
      // Fallback if no date available
      paymentId = paymentId || `renewal-${subscriptionId}-${Date.now()}`
    }

    console.log(`🔍 [Renewed] Processing Transaction ID: ${paymentId}`)

    if (!userId && admin) {
      const customerId = subscription.customer?.customer_id || subscription.customer_id || null
      if (customerId) {
        const { data: subRow } = await admin
          .from('subscriptions')
          .select('user_id')
          .eq('dodo_customer_id', customerId)
          .limit(1)
          .maybeSingle()
        if ((subRow as any)?.user_id) userId = (subRow as any).user_id
      }
    }

    if (!userId) return

    console.log(`👤 User: ${userId}, Plan: ${plan}, Period: ${billingPeriod}`)

    // Update subscription in database
    if (admin) {
      // @ts-ignore - Supabase type definitions are camelCase but DB is snake_case
      await admin.from('subscriptions').update({
        status: 'active',
        next_billing_date: subscription.next_billing_date || subscription.current_period_end,
        updated_at: new Date().toISOString()
      }).eq('dodo_subscription_id', subscriptionId)
    }

    // Allocate credits (with idempotency built-in)
    const result = await CreditsService.allocateSubscriptionCredits(
      userId,
      plan,
      billingPeriod,
      subscriptionId,
      paymentId,
      { expiresAt: periodEnd ? new Date(periodEnd) : undefined }
    )

    if (result.duplicate) {
      console.log('⚠️ Duplicate renewal detected, credits already allocated')
    } else {
      console.log('✅ Renewal credits allocated successfully')
    }
  } catch (error) {
    console.error('❌ Error handling subscription.renewed:', error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const subscriptionId = subscription.subscription_id || subscription.id
    if (!admin || !subscriptionId) return
    const nextBillingDate = subscription.next_billing_date || subscription.current_period_end || null
    const cancelAtNextBilling = !!subscription.cancel_at_next_billing_date
    const subscriptionStatus = cancelAtNextBilling ? 'pending_cancellation' : subscription.status || 'active'
    const customerId = subscription.customer?.customer_id || subscription.customer_id || null

    let userId =
      subscription.metadata?.userId ||
      subscription.metadata?.user_id ||
      subscription.customer?.metadata?.userId ||
      subscription.customer?.metadata?.user_id ||
      null

    if (!userId && customerId) {
      const { data: subRow } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('dodo_customer_id', customerId)
        .limit(1)
        .maybeSingle()
      if ((subRow as any)?.user_id) userId = (subRow as any).user_id
    }

    if (!userId) return

    await admin.from('subscriptions').upsert(
      {
        user_id: userId,
        plan: subscription.metadata?.plan || subscription.plan || 'creator',
        status: subscriptionStatus,
        billing_period: normalizeBillingPeriod(subscription.metadata?.billingPeriod || subscription.billing_period || 'monthly'),
        dodo_subscription_id: subscriptionId,
        dodo_customer_id: customerId,
        next_billing_date: nextBillingDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  } catch (error) {
    console.error('❌ Error handling subscription.updated:', error)
  }
}

/**
 * Handle payment.processing event
 * Records the payment with status 'processing'. Does NOT activate subscription or allocate credits.
 * If payment.succeeded fires later for the same ID, that handler will upgrade the record.
 */
async function handlePaymentProcessing(payment: any) {
  const paymentId = payment.payment_id || payment.id
  console.log('⏳ Processing payment.processing:', paymentId)

  if (!admin || !paymentId) return

  try {
    let userId = payment.metadata?.userId || payment.customer?.metadata?.userId

    if (!userId && payment.customer_id) {
      const { data: subRow } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('dodo_customer_id', payment.customer?.customer_id || payment.customer_id)
        .limit(1)
        .maybeSingle()
      if (subRow?.user_id) userId = subRow.user_id
    }

    if (!userId) {
      console.log('⚠️ payment.processing: no userId found, skipping record')
      return
    }

    const plan = payment.metadata?.plan || 'unknown'
    const billingPeriod = normalizeBillingPeriod(payment.metadata?.billingPeriod || 'monthly')

    // Only insert if not already recorded
    const { data: existing } = await admin
      .from('payments')
      .select('id')
      .eq('dodo_payment_id', paymentId)
      .limit(1)
      .maybeSingle()

    if (!existing?.id) {
      await admin.from('payments').insert({
        user_id: userId,
        dodo_payment_id: paymentId,
        dodo_customer_id: payment.customer?.customer_id || payment.customer_id,
        amount: payment.amount || payment.total_amount || 0,
        currency: payment.currency || 'INR',
        status: 'processing',
        payment_method: payment.payment_method || 'card',
        plan,
        billing_period: billingPeriod,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: payment
      })
      console.log('✅ Recorded payment as processing:', paymentId)
    }
  } catch (error) {
    console.error('❌ Error handling payment.processing:', error)
  }
}

/**
 * Handle payment.failed event
 * Records or updates the payment with status 'failed'.
 */
async function handlePaymentFailed(payment: any) {
  const paymentId = payment.payment_id || payment.id
  console.log('❌ Processing payment.failed:', paymentId)

  if (!admin || !paymentId) return

  try {
    const { data: existing } = await admin
      .from('payments')
      .select('id')
      .eq('dodo_payment_id', paymentId)
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      await admin.from('payments').update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        metadata: payment
      }).eq('id', existing.id)
      console.log('✅ Payment marked as failed:', paymentId)
    }
  } catch (error) {
    console.error('❌ Error handling payment.failed:', error)
  }
}

/**
 * Handle subscription.plan_changed event
 * Updates the subscription plan in DB. The change-plan route already does this,
 * but this acts as a safety net if Dodo fires the event after our DB update.
 */
async function handleSubscriptionPlanChanged(subscription: any) {
  const subscriptionId = subscription.subscription_id || subscription.id
  console.log('🔄 Processing subscription.plan_changed:', subscriptionId)

  if (!admin || !subscriptionId) return

  try {
    // Only update plan/billing_period if the subscription exists in our DB
    // We trust the change-plan route as source of truth; this is just a safety net
    const newPlan = subscription.metadata?.plan || subscription.plan
    const newBillingPeriod = normalizeBillingPeriod(subscription.metadata?.billingPeriod || subscription.billing_period || 'monthly')

    if (!newPlan) {
      console.log('ℹ️ subscription.plan_changed: no plan in event, skipping')
      return
    }

    await admin.from('subscriptions').update({
      plan: newPlan,
      billing_period: newBillingPeriod,
      updated_at: new Date().toISOString()
    }).eq('dodo_subscription_id', subscriptionId)

    console.log(`✅ Subscription plan updated to ${newPlan} (${newBillingPeriod}) via plan_changed event`)
  } catch (error) {
    console.error('❌ Error handling subscription.plan_changed:', error)
  }
}
