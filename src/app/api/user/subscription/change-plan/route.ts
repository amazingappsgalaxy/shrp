import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'
import { DODO_PRODUCT_IDS } from '@/lib/dodo-payments-config'
import { PRICING_PLANS } from '@/lib/pricing-config'
import { CreditsService } from '@/lib/credits-service'

function normalizeBillingPeriod(value: unknown): 'monthly' | 'yearly' | 'daily' {
  const v = String(value || 'monthly').toLowerCase()
  if (v === 'monthly' || v === 'yearly' || v === 'daily') return v
  if (v.startsWith('month')) return 'monthly'
  if (v.startsWith('year')) return 'yearly'
  if (v.startsWith('day')) return 'daily'
  return 'monthly'
}

function normalizePlan(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const session = await getSession(token)
    if (!session?.user?.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const body = await request.json().catch(() => ({} as any))
    const targetPlanRaw = body.plan || body.targetPlan
    const targetBillingPeriodRaw = body.billingPeriod || body.billing_period || 'monthly'

    const targetPlan = normalizePlan(targetPlanRaw)
    const targetBillingPeriod = normalizeBillingPeriod(targetBillingPeriodRaw)

    if (!targetPlan) return NextResponse.json({ error: 'plan is required' }, { status: 400 })
    if (targetBillingPeriod === 'daily') return NextResponse.json({ error: 'daily plan changes are not supported' }, { status: 400 })

    const productConfig = (DODO_PRODUCT_IDS as any)[targetPlan]
    const newProductId = productConfig?.[targetBillingPeriod]
    if (!newProductId) {
      return NextResponse.json(
        { error: `Missing product mapping for ${targetPlan} (${targetBillingPeriod})` },
        { status: 500 }
      )
    }

    if (!supabase) return NextResponse.json({ error: 'Billing system not configured' }, { status: 500 })

    const { data: current, error: subError } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .in('status', ['active', 'trialing', 'pending', 'pending_cancellation'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError || !current) return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    if (!current.dodo_subscription_id) return NextResponse.json({ error: 'Subscription ID not found' }, { status: 400 })

    const subscriptionId = current.dodo_subscription_id as string

    const providerBefore: any = await (dodo as any).subscriptions.retrieve(subscriptionId)
    const periodEndBefore = providerBefore?.next_billing_date || providerBefore?.current_period_end || current.next_billing_date || null
    const periodEndTs = periodEndBefore ? new Date(periodEndBefore).getTime() : null
    if (periodEndTs && periodEndTs <= Date.now()) {
      return NextResponse.json({ error: 'Subscription period has ended; cannot change plan' }, { status: 400 })
    }

    await (dodo as any).subscriptions.changePlan(subscriptionId, {
      product_id: newProductId,
      quantity: 1,
      proration_billing_mode: 'difference_immediately'
    })

    const providerAfter: any = await (dodo as any).subscriptions.retrieve(subscriptionId)
    const periodEnd = providerAfter?.next_billing_date || providerAfter?.current_period_end || periodEndBefore || null
    const cancelAtNextBilling = !!providerAfter?.cancel_at_next_billing_date
    const subscriptionStatus = cancelAtNextBilling ? 'pending_cancellation' : 'active'

    // Trust targetPlan/targetBillingPeriod — Dodo test mode doesn't reflect the change in providerAfter
    const updatedPlan = targetPlan
    const updatedBillingPeriod = targetBillingPeriod

    await (supabase as any).from('subscriptions').update({
      plan: updatedPlan,
      billing_period: updatedBillingPeriod,
      status: subscriptionStatus,
      next_billing_date: periodEnd,
      updated_at: new Date().toISOString(),
    }).eq('id', current.id)

    const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === updatedPlan)
    const targetCredits = planConfig?.credits?.monthly || null

    let deltaCredited = 0
    if (targetCredits && periodEnd) {
      const { data: existingCredits } = await (supabase as any)
        .from('credits')
        .select('amount')
        .eq('user_id', session.user.id)
        .eq('type', 'subscription')
        .eq('is_active', true)
        .eq('subscription_id', subscriptionId)

      const alreadyAllocated = (existingCredits || []).reduce((sum: number, row: any) => sum + (row.amount || 0), 0)
      if (alreadyAllocated < targetCredits) {
        deltaCredited = targetCredits - alreadyAllocated
        const dateStr = new Date(periodEnd).toISOString().split('T')[0]
        const txId = `sub_change_${subscriptionId}_${dateStr}_${newProductId}`
        await CreditsService.allocateSubscriptionCredits(
          session.user.id,
          updatedPlan,
          updatedBillingPeriod,
          subscriptionId,
          txId,
          {
            credits: deltaCredited,
            expiresAt: new Date(periodEnd),
            description: `Plan change adjustment (${current.plan} -> ${updatedPlan})`,
            metadata: {
              type: 'plan_change',
              from_plan: current.plan,
              to_plan: updatedPlan,
              product_id: newProductId,
            }
          }
        )
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionId,
        plan: updatedPlan,
        billing_period: updatedBillingPeriod,
        status: subscriptionStatus,
        next_billing_date: periodEnd
      },
      credits_adjustment: {
        delta_credited: deltaCredited
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to change subscription plan', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
