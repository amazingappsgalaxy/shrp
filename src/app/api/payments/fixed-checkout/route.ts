import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { DODO_PAYMENTS_CONFIG, DODO_PRODUCT_IDS, type PlanType, type BillingPeriod } from '@/lib/dodo-payments-config'
import { PRICING_PLANS } from '@/lib/pricing-config'
import { dodoClient as dodo } from '@/lib/dodo-client'

export async function POST(request: NextRequest) {
  console.log('🚀 [FIXED CHECKOUT] Starting improved payment checkout')

  try {
    const { plan, billingPeriod } = await request.json()
    console.log('📋 [FIXED CHECKOUT] Request:', { plan, billingPeriod })

    // Validate input
    if (!plan || !billingPeriod) {
      return NextResponse.json(
        { error: 'Plan and billing period are required' },
        { status: 400 }
      )
    }

    // Get user session
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const session = await getSession(token)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get plan configuration
    const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === plan.toLowerCase())
    if (!planConfig) {
      return NextResponse.json(
        { error: `Plan not found: ${plan}` },
        { status: 400 }
      )
    }

    const amount = planConfig.price[billingPeriod as 'monthly' | 'yearly']
    const productId = DODO_PRODUCT_IDS[plan.toLowerCase() as PlanType][billingPeriod as BillingPeriod]

    console.log('💰 [FIXED CHECKOUT] Plan details:', { plan, billingPeriod, amount, productId })

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID not configured' },
        { status: 500 }
      )
    }

    // Try Method 1: Create one-time payment with payment_link
    console.log('🔄 [FIXED CHECKOUT] Method 1: Trying one-time payment...')
    try {
      const oneTimePaymentData = {
        billing: {
          city: 'San Francisco',
          country: 'US' as const,
          state: 'CA',
          street: '123 Main St',
          zipcode: '94105'
        },
        customer: {
          email: session.user.email as string,
          name: (session.user.name || session.user.email) as string
        },
        product_cart: [
          {
            product_id: productId,
            quantity: 1
          }
        ],
        amount: amount * 100, // Convert to cents
        currency: 'USD',
        payment_link: true,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/app/dashboard?payment=success`,
        metadata: {
          userId: session.user.id,
          plan,
          billingPeriod,
          type: 'one-time',
          credits: planConfig.credits.toString()
        }
      }

      console.log('📤 [FIXED CHECKOUT] Creating one-time payment:', JSON.stringify(oneTimePaymentData, null, 2))
      const oneTimePayment = await dodo.payments.create(oneTimePaymentData)
      console.log('✅ [FIXED CHECKOUT] One-time payment success:', oneTimePayment)

      if (oneTimePayment.payment_link) {
        return NextResponse.json({
          success: true,
          method: 'one-time-payment',
          checkoutUrl: oneTimePayment.payment_link,
          paymentId: oneTimePayment.payment_id,
          metadata: { plan, billingPeriod, amount }
        })
      }

    } catch (oneTimeError) {
      console.warn('⚠️ [FIXED CHECKOUT] One-time payment failed:', oneTimeError)
    }

    // Method 2: Create subscription (current method but improved)
    console.log('🔄 [FIXED CHECKOUT] Method 2: Trying subscription...')
    try {
      const subscriptionData = {
        billing: {
          city: 'San Francisco',
          country: 'US' as const,
          state: 'CA',
          street: '123 Main St',
          zipcode: '94105'
        },
        customer: {
          email: session.user.email as string,
          name: (session.user.name || session.user.email) as string
        },
        product_id: productId,
        quantity: 1,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/app/dashboard?payment=success`,
        metadata: {
          userId: session.user.id,
          plan,
          billingPeriod,
          type: 'subscription',
          credits: planConfig.credits.toString()
        }
      }

      console.log('📤 [FIXED CHECKOUT] Creating subscription:', JSON.stringify(subscriptionData, null, 2))
      const subscription = await dodo.subscriptions.create(subscriptionData)
      console.log('✅ [FIXED CHECKOUT] Subscription created:', subscription)

      // Try different URL formats
      let checkoutUrl = null

      if (subscription.payment_link) {
        checkoutUrl = subscription.payment_link
        console.log('📋 [FIXED CHECKOUT] Using payment_link:', checkoutUrl)
      } else if (subscription.client_secret) {
        // Try the URL format from your logs
        checkoutUrl = `https://checkout.dodopayments.com/pay/${subscription.client_secret}`
        console.log('📋 [FIXED CHECKOUT] Using client_secret URL:', checkoutUrl)
      } else if (subscription.payment_id) {
        // Alternative URL format
        checkoutUrl = `https://checkout.dodopayments.com/pay/${subscription.payment_id}`
        console.log('📋 [FIXED CHECKOUT] Using payment_id URL:', checkoutUrl)
      }

      if (checkoutUrl) {
        return NextResponse.json({
          success: true,
          method: 'subscription',
          checkoutUrl,
          paymentId: subscription.payment_id,
          subscriptionId: subscription.subscription_id,
          clientSecret: subscription.client_secret,
          metadata: { plan, billingPeriod, amount }
        })
      } else {
        console.error('❌ [FIXED CHECKOUT] No valid checkout URL found in subscription response')
        return NextResponse.json({
          success: false,
          error: 'No checkout URL available',
          debug: {
            hasPaymentLink: !!subscription.payment_link,
            hasClientSecret: !!subscription.client_secret,
            hasPaymentId: !!subscription.payment_id,
            subscription
          }
        }, { status: 500 })
      }

    } catch (subscriptionError) {
      console.error('❌ [FIXED CHECKOUT] Subscription failed:', subscriptionError)

      return NextResponse.json({
        success: false,
        error: 'All payment methods failed',
        details: {
          oneTimeError: 'Method not available',
          subscriptionError: subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError)
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [FIXED CHECKOUT] General error:', error)
    return NextResponse.json({
      success: false,
      error: 'Checkout failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}