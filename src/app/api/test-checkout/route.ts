import { NextRequest, NextResponse } from 'next/server'
import { DODO_PAYMENTS_CONFIG, DODO_PRODUCT_IDS, type PlanType, type BillingPeriod } from '@/lib/dodo-payments-config'
import { PLAN_CONFIG } from '@/lib/dodo-payments-config'
import DodoPayments from 'dodopayments'

const dodo = new DodoPayments({
  bearerToken: DODO_PAYMENTS_CONFIG.apiKey,
  environment: DODO_PAYMENTS_CONFIG.environment as 'live_mode' | 'test_mode'
})

export async function POST(request: NextRequest) {
  try {
    const { plan, billingPeriod } = await request.json()
    
    console.log('🧪 [TEST-CHECKOUT] Testing checkout for plan:', plan, 'billing:', billingPeriod)
    
    // Validate plan and billing period
    if (!plan || !billingPeriod) {
      return NextResponse.json({ error: 'Plan and billing period are required' }, { status: 400 })
    }
    
    if (!['basic', 'creator', 'professional', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    
    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
    }
    
    // Get product ID for the plan
    const productId = DODO_PRODUCT_IDS[plan as PlanType][billingPeriod as BillingPeriod]
    const planConfig = PLAN_CONFIG[plan as PlanType]
    
    if (typeof productId !== 'string') {
      return NextResponse.json({ error: 'Invalid product configuration' }, { status: 400 })
    }
    
    console.log('🧪 [TEST-CHECKOUT] Product ID:', productId)
    console.log('🧪 [TEST-CHECKOUT] Plan config:', planConfig)
    
    // Mock user data
    const userId = 'test-user-123'
    const userEmail = 'test@example.com'
    const userName = 'Test User'
    
    // Create success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
    const successUrl = `${baseUrl}/app/dashboard?payment=success`
    const cancelUrl = `${baseUrl}/?payment=cancelled#pricing-section`
    
    // For subscription plans, use subscriptions API
    const subscriptionData = {
      billing: {
        city: 'Mumbai',
        country: 'IN' as const,
        state: 'Maharashtra',
        street: '123 Main St',
        zipcode: '400001'
      },
      customer: {
        email: userEmail,
        name: userName
      },
      product_id: productId as string,
      quantity: 1,
      return_url: successUrl,
      metadata: {
        userId,
        plan,
        billingPeriod,
        type: 'subscription',
        credits: planConfig.credits.toString(),
        success_url: successUrl,
        cancel_url: cancelUrl
      }
    }
    
    console.log('🧪 [TEST-CHECKOUT] Creating subscription with data:', JSON.stringify(subscriptionData, null, 2))
    const subscription = await dodo.subscriptions.create(subscriptionData)
    console.log('✅ [TEST-CHECKOUT] Created subscription:', subscription)
    
    // Create checkout URL using client_secret
    const checkoutUrl = subscription.client_secret 
      ? `https://checkout.dodopayments.com/pay/${subscription.client_secret}`
      : null
    
    return NextResponse.json({
      success: true,
      checkoutUrl,
      paymentId: subscription.payment_id,
      subscriptionId: subscription.subscription_id,
      clientSecret: subscription.client_secret,
      metadata: {
        successUrl,
        cancelUrl,
        userId,
        plan,
        billingPeriod
      }
    })
    
  } catch (error: any) {
    console.error('🧪 [TEST-CHECKOUT] Error creating subscription:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      details: {
        status: error.status,
        headers: error.headers,
        error: error.error
      }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test checkout endpoint - use POST with plan and billingPeriod'
  })
}