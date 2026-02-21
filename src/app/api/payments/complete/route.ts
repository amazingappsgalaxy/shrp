import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { supabaseAdmin } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'
import { CreditsService } from '@/lib/credits-service'
import { computePeriodEnd } from '@/lib/pricing-config'

const admin = supabaseAdmin

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value

    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const session = await getSession(token)
    if (!session?.user?.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const body = await request.json().catch(() => ({} as any))
    let subscriptionId = body.subscriptionId || body.subscription_id
    const paymentId = body.paymentId || body.payment_id
    const sessionId = body.sessionId || body.session_id || body.session

    if (!subscriptionId && sessionId) {
      try {
        const checkoutSession: any = await (dodo as any).checkoutSessions.retrieve(sessionId)
        subscriptionId =
          checkoutSession?.subscription_id ||
          checkoutSession?.subscriptionId ||
          checkoutSession?.subscription?.subscription_id ||
          checkoutSession?.subscription?.id ||
          null
      } catch {
      }
    }

    if (!subscriptionId && paymentId) {
      try {
        const payment: any = await (dodo as any).payments.retrieve(paymentId)
        subscriptionId = payment?.subscription_id || null
      } catch {
      }
    }

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId, paymentId, or sessionId is required' }, { status: 400 })
    }

    let providerSubscription: any
    try {
      providerSubscription = await (dodo as any).subscriptions.retrieve(subscriptionId)
    } catch (retrieveError: any) {
      const msg = retrieveError?.message || String(retrieveError)
      const isNotFound = retrieveError?.status === 404 || retrieveError?.statusCode === 404 || /not.?found|invalid|does not exist/i.test(msg)
      return NextResponse.json(
        { error: isNotFound ? 'Subscription not found' : 'Failed to retrieve subscription', details: msg },
        { status: isNotFound ? 404 : 502 }
      )
    }

    const providerUserId =
      providerSubscription?.metadata?.userId ||
      providerSubscription?.metadata?.user_id ||
      providerSubscription?.customer?.metadata?.userId ||
      providerSubscription?.customer?.metadata?.user_id ||
      null
    const providerEmail =
      providerSubscription?.customer?.email ||
      providerSubscription?.metadata?.user_email ||
      providerSubscription?.customer?.metadata?.user_email ||
      null

    if (providerUserId && providerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!providerUserId && providerEmail && session.user.email && providerEmail !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!providerUserId && !providerEmail) {
      return NextResponse.json({ error: 'Unable to verify subscription ownership' }, { status: 403 })
    }

    const plan = providerSubscription?.metadata?.plan || providerSubscription?.plan || 'creator'
    const billingPeriodRaw = providerSubscription?.metadata?.billingPeriod || providerSubscription?.billing_period || 'monthly'
    const billingPeriod =
      billingPeriodRaw === 'daily' || billingPeriodRaw === 'monthly' || billingPeriodRaw === 'yearly'
        ? billingPeriodRaw
        : 'monthly'

    const rawPeriodEnd = providerSubscription?.next_billing_date || providerSubscription?.current_period_end || null
    // For daily plans: always recompute — Dodo returns next_billing_date as ~1 month for daily subscriptions.
    // For other plans: trust Dodo's date if it's in the future, else compute from now.
    const periodEnd =
      billingPeriod === 'daily' ||
      !rawPeriodEnd ||
      new Date(rawPeriodEnd).getTime() < Date.now() + 60_000
        ? computePeriodEnd(billingPeriod).toISOString()
        : rawPeriodEnd
    const nextBillingDate = periodEnd
    const cancelAtNextBilling = !!providerSubscription?.cancel_at_next_billing_date
    const providerStatus = String(providerSubscription?.status || '').toLowerCase()
    const subscriptionStatus =
      cancelAtNextBilling
        ? 'pending_cancellation'
        : providerStatus || 'pending'

    let paymentStatus: string | null = null
    try {
      const latestPaymentId = providerSubscription?.latest_payment_id || providerSubscription?.payment_id || null
      if (latestPaymentId) {
        const p: any = await (dodo as any).payments.retrieve(latestPaymentId)
        paymentStatus = String(p?.status || '').toLowerCase() || null
      } else {
        for await (const item of (dodo as any).payments.list({ subscription_id: subscriptionId })) {
          const p: any = item
          paymentStatus = String(p?.status || '').toLowerCase() || null
          break
        }
      }
    } catch {
    }

    // Check if subscription is already active in our DB (webhook already processed the payment)
    let isAlreadyActiveInDb = false
    if (admin) {
      const { data: existingSub } = await admin
        .from('subscriptions')
        .select('status')
        .eq('dodo_subscription_id', subscriptionId)
        .maybeSingle() as any
      isAlreadyActiveInDb = existingSub?.status === 'active'
    }

    // Confirm if: webhook already activated it in DB, payment actually succeeded,
    // or the subscription itself is active in Dodo.
    const isConfirmed =
      isAlreadyActiveInDb ||
      paymentStatus === 'succeeded' ||
      providerStatus === 'active'

    if (admin) {
      await admin.from('subscriptions').upsert(
        {
          user_id: session.user.id,
          plan,
          // If we're confirming the subscription, mark it as active in DB regardless of Dodo's transient state
          status: isConfirmed ? 'active' : subscriptionStatus,
          billing_period: billingPeriod,
          dodo_subscription_id: providerSubscription?.subscription_id || subscriptionId,
          dodo_customer_id: providerSubscription?.customer?.customer_id || providerSubscription?.customer_id || null,
          next_billing_date: nextBillingDate,
          billing_name: providerSubscription?.customer?.name || providerSubscription?.metadata?.user_name || null,
          billing_email: providerSubscription?.customer?.email || providerSubscription?.metadata?.user_email || null,
          billing_address: providerSubscription?.billing || providerSubscription?.customer?.billing || null,
          currency: providerSubscription?.currency || 'USD',
          amount: providerSubscription?.recurring_pre_tax_amount || providerSubscription?.amount || 0,
          start_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    }

    if (!isConfirmed) {
      return NextResponse.json(
        {
          success: false,
          pending: true,
          subscription: {
            id: subscriptionId,
            status: subscriptionStatus,
            plan,
            billingPeriod,
            next_billing_date: nextBillingDate,
            cancel_at_next_billing_date: cancelAtNextBilling,
          },
          payment_status: paymentStatus,
        },
        { status: 202 }
      )
    }

    let transactionId = providerSubscription?.latest_payment_id || providerSubscription?.payment_id
    if (nextBillingDate) {
      const dateStr = new Date(nextBillingDate).toISOString().split('T')[0]
      transactionId = `sub_period_${subscriptionId}_${dateStr}`
    } else {
      transactionId = transactionId || `sub-${subscriptionId}`
    }

    const creditsOverrideRaw = providerSubscription?.metadata?.credits
    let creditsOverride =
      creditsOverrideRaw !== undefined && creditsOverrideRaw !== null && !Number.isNaN(Number(creditsOverrideRaw))
        ? Number(creditsOverrideRaw)
        : undefined

    if (creditsOverride === undefined) {
      try {
        for await (const item of (dodo as any).payments.list({ subscription_id: subscriptionId })) {
          const payment: any = item
          const raw = payment?.metadata?.credits
          if (raw !== undefined && raw !== null && !Number.isNaN(Number(raw))) {
            creditsOverride = Number(raw)
          }
          break
        }
      } catch {
      }
    }

    const creditsResult = await CreditsService.allocateSubscriptionCredits(
      session.user.id,
      plan,
      billingPeriod,
      subscriptionId,
      transactionId,
      { expiresAt: periodEnd ? new Date(periodEnd) : undefined, credits: creditsOverride, metadata: { source: 'return_flow.complete' } }
    )

    if (admin) {
      try {
        let count = 0
        for await (const item of (dodo as any).payments.list({ subscription_id: subscriptionId })) {
          const payment: any = item
          const paymentId = payment.payment_id || payment.id
          if (!paymentId) continue

          const { data: existingPayment } = await admin
            .from('payments')
            .select('id')
            .eq('dodo_payment_id', paymentId)
            .limit(1)
            .maybeSingle()

          if (!existingPayment?.id) {
            await admin.from('payments').insert({
              user_id: session.user.id,
              dodo_payment_id: paymentId,
              dodo_customer_id: payment.customer?.customer_id || payment.customer_id || null,
              amount: payment.total_amount ?? payment.amount ?? 0,
              currency: payment.currency || 'USD',
              status: payment.status || 'succeeded',
              payment_method: payment.payment_method || payment.payment_method_type || null,
              plan,
              billing_period: billingPeriod,
              paid_at: payment.paid_at || payment.created_at || new Date().toISOString(),
              created_at: payment.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: payment,
            })
          }

          count += 1
          if (count >= 10) break
        }
      } catch {
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionId,
        status: subscriptionStatus,
        plan,
        billingPeriod,
        next_billing_date: nextBillingDate,
        cancel_at_next_billing_date: cancelAtNextBilling,
      },
      credits: creditsResult,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to complete subscription', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
