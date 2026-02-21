import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { DODO_PAYMENTS_CONFIG, DODO_PRODUCT_IDS, type PlanType, type BillingPeriod } from '@/lib/dodo-payments-config'
import { PRICING_PLANS } from '@/lib/pricing-config'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'
import { PaymentUtils } from '@/lib/payment-utils'

export async function POST(request: NextRequest) {
  console.log('🚀 [CHECKOUT API] Starting payment checkout request')

  try {
    const { plan, billingPeriod } = await request.json()
    console.log('📋 [CHECKOUT API] Request data:', { plan, billingPeriod })

    // Validate input
    if (!plan || !billingPeriod) {
      return NextResponse.json(
        { error: 'Plan and billing period are required' },
        { status: 400 }
      )
    }

    // Validate plan exists in PRICING_PLANS
    const validPlans = ['basic', 'creator', 'professional', 'enterprise', 'day pass']
    if (!validPlans.includes(plan.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    if (!['monthly', 'yearly', 'daily'].includes(billingPeriod)) {
      return NextResponse.json(
        { error: 'Invalid billing period' },
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

    const userId = session.user.id

    // Get plan configuration from PRICING_PLANS
    const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === plan.toLowerCase())
    if (!planConfig) {
      return NextResponse.json(
        { error: `Plan configuration not found for plan: ${plan}` },
        { status: 400 }
      )
    }

    let amount = 0
    if (billingPeriod === 'monthly' || billingPeriod === 'yearly') {
      amount = planConfig.price[billingPeriod]
    } else if (billingPeriod === 'daily' && plan.toLowerCase() === 'day pass') {
      // Manual override for day pass price if not in types properly yet
      amount = 10
    }

    // For Day Pass, the amount is already set above to 10 manually if needed
    // Look up the product ID
    let productId = ''
    try {
      // Use any for flexible access since we validated plan and billingPeriod above
      const productConfig = (DODO_PRODUCT_IDS as any)[plan.toLowerCase()]
      if (productConfig) {
        productId = productConfig[billingPeriod]
      }
    } catch (e) {
      console.error('Error looking up product ID:', e)
    }

    console.log('DEBUG - Plan:', plan, 'Period:', billingPeriod, 'Amount:', amount, 'Amount in cents:', amount * 100)
    console.log('🛍️ [CHECKOUT API] Using product ID:', productId)

    // Validate amount
    if (!amount || amount <= 0) {
      console.error('❌ [CHECKOUT API] Invalid amount:', amount)
      return NextResponse.json(
        { error: `Invalid plan amount: ${amount}` },
        { status: 400 }
      )
    }

    // Validate product mapping to avoid broken checkout links
    if (!productId) {
      console.error('❌ [CHECKOUT API] Missing Dodo product ID mapping for', { plan, billingPeriod })
      return NextResponse.json(
        {
          error: 'Payment configuration error',
          message: `Missing Dodo product ID for ${plan} (${billingPeriod}).`,
          nextSteps: [
            'Create Subscription products in your Dodo dashboard for each plan/period',
            'Set DODO_*_PRODUCT_ID environment variables (e.g., DODO_CREATOR_MONTHLY_PRODUCT_ID)',
            'Restart the server and try again'
          ],
          debug: {
            plan,
            billingPeriod
          }
        },
        { status: 500 }
      )
    }

    // Create subscription with metadata and generate custom checkout URL
    try {
      console.log('🚀 [CHECKOUT API] Creating subscription with metadata')
      console.log('📋 [CHECKOUT API] Request data:', { plan, billingPeriod })
      console.log('💰 [CHECKOUT API] Plan amount:', amount, 'cents:', amount * 100)

      // Always derive the base URL from the incoming request origin so that
      // cloudflare tunnel URL changes never break the return redirect.
      // NEXT_PUBLIC_APP_URL is only used as a last-resort localhost fallback.
      const requestOrigin = new URL(request.url).origin
      const isLocalhost = requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')
      const baseUrlRaw = isLocalhost
        ? (process.env.NEXT_PUBLIC_APP_URL || requestOrigin)
        : requestOrigin
      const baseUrl = baseUrlRaw.replace(/\/$/, '')
      const successUrl = `${baseUrl}/payment-success`
      const cancelUrl = `${baseUrl}/?payment=cancelled#pricing-section`

      const checkoutSessionData = {
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: {
          email: session.user.email as string,
          name: (session.user.name || session.user.email) as string
        },
        return_url: successUrl,
        metadata: {
          userId,
          plan,
          billingPeriod,
          type: 'subscription',
          credits: planConfig.credits.monthly?.toString() || '0',
          success_url: successUrl,
          cancel_url: cancelUrl,
          user_email: session.user.email as string,
          user_name: (session.user.name || session.user.email) as string
        }
      }

      console.log('📤 [CHECKOUT API] Creating checkout session with data:', JSON.stringify(checkoutSessionData, null, 2))

      const createCheckoutSessionWithTimeout = () => {
        return Promise.race([
          (dodo as any).checkoutSessions.create(checkoutSessionData),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Dodo API call timed out after 15 seconds')), 15000)
          )
        ])
      }

      const checkoutSession: any = await createCheckoutSessionWithTimeout()
      console.log('✅ [CHECKOUT API] Created checkout session:', checkoutSession)

      const checkoutUrl = checkoutSession.checkout_url || checkoutSession.url
      if (!checkoutUrl) {
        return NextResponse.json(
          { error: 'Payment service error: missing checkout URL' },
          { status: 500 }
        )
      }

      try {
        await PaymentUtils.storeMapping(checkoutSession.session_id || checkoutSession.id, {
          userId: userId,
          plan: plan,
          billingPeriod: billingPeriod,
          userEmail: session.user.email as string,
          userName: (session.user.name || session.user.email) as string,
          paymentId: checkoutSession.payment_id
        })
      } catch (mappingError) {
        console.error('❌ Error storing user mapping:', mappingError)
      }

      console.log('🔗 [CHECKOUT API] Checkout URL:', checkoutUrl)

      return NextResponse.json({
        success: true,
        checkoutUrl,
        sessionId: checkoutSession.session_id || checkoutSession.id,
        paymentId: checkoutSession.payment_id,
        metadata: {
          successUrl,
          cancelUrl,
          userId,
          plan,
          billingPeriod
        }
      })

    } catch (error: any) {
      console.error('❌ [CHECKOUT API] Error creating subscription:', error)
      try { console.error('Error details:', JSON.stringify(error, null, 2)) } catch { }

      if (error?.status === 401) {
        return NextResponse.json(
          {
            error: 'Payment system configuration error',
            message: 'Invalid Dodo Payments API key. Please contact support or check the API configuration.'
          },
          { status: 500 }
        )
      }

      if (error?.status === 404) {
        return NextResponse.json(
          {
            error: 'Payment configuration error',
            message: 'Dodo Payments product not found (404).',
            details:
              'Verify DODO_*_PRODUCT_ID env vars map to valid test-mode products in your Dodo dashboard, or update fallbacks in dodo-payments-config.ts. Also ensure the currency matches the product configuration.'
          },
          { status: 500 }
        )
      }

      // Handle timeout error specifically
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('timed out')) {
        return NextResponse.json(
          {
            error: 'Payment service timeout',
            message: 'The payment service is currently slow to respond. Please try again in a moment.',
            details: errorMessage
          },
          { status: 408 }
        )
      }

      return NextResponse.json(
        { error: `Failed to create subscription: ${errorMessage}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method to retrieve checkout session status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
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

    // Query our database for the checkout session
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('dodoSubscriptionId', sessionId)
        .eq('userId', session.user.id)

      if (error) {
        console.error('Error querying subscriptions:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 })
      }

      const subscription = subscriptions?.[0]
      if (!subscription) {
        return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 })
      }

      return NextResponse.json({
        status: subscription.status,
        sessionId: subscription.dodoSubscriptionId,
        customerId: subscription.dodoCustomerId,
        subscriptionId: subscription.id
      })

    } catch (error) {
      console.error('Error retrieving checkout session:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve checkout session' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Checkout status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
