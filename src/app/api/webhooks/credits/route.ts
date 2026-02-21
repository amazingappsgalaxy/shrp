import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { CreditManager } from '@/lib/credits'

const supabase = createClient(config.database.supabaseUrl!, config.database.supabaseServiceKey!)

// Credit amounts by plan
const SUBSCRIPTION_CREDITS = {
  basic: 1000,
  creator: 2500,
  professional: 5000,
  enterprise: 10000
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log('Credit webhook received:', { type, data })

    if (type === 'subscription.created' || type === 'subscription.renewed') {
      await handleSubscriptionCredits(data)
    } else if (type === 'payment.completed') {
      await handleCreditPurchase(data)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Credit webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionCredits(subscriptionData: any) {
  const { customer_id, plan, subscription_id, amount } = subscriptionData

  // Find user by customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customer_id)
    .or(`dodo_customer_id.eq.${customer_id}`)
    .single()

  if (!user) {
    console.error('User not found for customer:', customer_id)
    return
  }

  const planName = plan?.toLowerCase() || 'creator'
  const creditAmount = SUBSCRIPTION_CREDITS[planName as keyof typeof SUBSCRIPTION_CREDITS] || SUBSCRIPTION_CREDITS.creator

  // Grant subscription credits
  const result = await CreditManager.grantSubscriptionCredits({
    userId: user.id,
    amount: creditAmount,
    plan: plan || 'Creator',
    subscriptionId: subscription_id,
    transactionId: `sub_${subscription_id}`
  })

  // Update subscription record in database
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      plan: planName,
      status: 'active',
      billing_period: 'monthly',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      dodo_subscription_id: subscription_id,
      amount: amount || 0,
      currency: 'USD'
    })

  console.log('Subscription credits granted:', result)
}

async function handleCreditPurchase(paymentData: any) {
  const { customer_id, amount, metadata, payment_id } = paymentData

  // Find user by customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customer_id)
    .or(`dodo_customer_id.eq.${customer_id}`)
    .single()

  if (!user) {
    console.error('User not found for customer:', customer_id)
    return
  }

  // Extract credit amount from metadata or use default calculation
  const creditAmount = metadata?.credits || Math.floor((amount / 100) * 10) // $1 = 10 credits default
  const packageType = metadata?.package_type || 'custom'

  // Grant permanent credits
  const result = await CreditManager.grantPermanentCredits({
    userId: user.id,
    amount: creditAmount,
    packageType,
    transactionId: payment_id,
    description: `${creditAmount} permanent credits purchase`
  })

  // Update payment record
  await supabase
    .from('payments')
    .upsert({
      user_id: user.id,
      dodo_payment_id: payment_id,
      amount: amount || 0,
      currency: 'USD',
      status: 'completed',
      plan: 'credit_purchase',
      credits_granted: creditAmount,
      paid_at: new Date().toISOString()
    })

  console.log('Permanent credits granted:', result)
}