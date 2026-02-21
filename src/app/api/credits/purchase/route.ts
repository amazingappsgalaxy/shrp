import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { DODO_PAYMENTS_CONFIG, DODO_PRODUCT_IDS } from '@/lib/dodo-payments-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { v4 as uuidv4 } from 'uuid'
import { dodoClient as dodo } from '@/lib/dodo-client'
import { getSession as getSimpleSession } from '@/lib/simple-auth'

// Credit packages configuration
export const CREDIT_PACKAGES = {
  starter: {
    credits: 1000,
    price: 10,
    currency: 'USD',
    description: '1,000 Credits Package',
    productId: process.env.DODO_CREDITS_STARTER_PRODUCT_ID // must be a one-time product in your Dodo account
  },
  popular: {
    credits: 2500,
    price: 20,
    currency: 'USD',
    description: '2,500 Credits Package',
    productId: process.env.DODO_CREDITS_POPULAR_PRODUCT_ID, // must be a one-time product in your Dodo account
    bonus: 500
  },
  premium: {
    credits: 5000,
    price: 35,
    currency: 'USD',
    description: '5,000 Credits Package',
    productId: process.env.DODO_CREDITS_PREMIUM_PRODUCT_ID, // must be a one-time product in your Dodo account
    bonus: 1000
  },
  ultimate: {
    credits: 10000,
    price: 60,
    currency: 'USD',
    description: '10,000 Credits Package',
    productId: process.env.DODO_CREDITS_ULTIMATE_PRODUCT_ID, // must be a one-time product in your Dodo account
    bonus: 2500
  }
} as const

export type CreditPackageType = keyof typeof CREDIT_PACKAGES

export async function POST(request: NextRequest) {
  try {
    const { packageType, customAmount } = await request.json()

    // Validate input
    if (!packageType && !customAmount) {
      return NextResponse.json(
        { error: 'Package type or custom amount is required' },
        { status: 400 }
      )
    }

    // Get user session using better-auth (primary)
    let session: any = null
    try {
      session = await auth.api.getSession({
        headers: Object.fromEntries(request.headers) as Record<string, string>
      })
    } catch (e) {
      // ignore and try fallback
      session = null
    }

    // Fallback: support our simple session cookie/Authorization header
    let userId: string | null = null
    let userEmail: string | null = null

    if (session?.user) {
      userId = session.user.id as string
      userEmail = session.user.email as string
    } else {
      const authHeader = request.headers.get('authorization')
      const bearer = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : null
      const cookieToken = request.cookies.get('session')?.value || null
      const token = bearer || cookieToken
      if (token) {
        const simple = await getSimpleSession(token)
        if (simple?.user) {
          userId = (simple.user as any).id
          userEmail = (simple.user as any).email
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const adminDb = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey)
    const { data: subRow } = await adminDb
      .from('subscriptions')
      .select('status, next_billing_date')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    const isActiveLike = !!subRow?.status && ['active', 'trialing', 'pending', 'pending_cancellation'].includes(subRow.status)
    const isNotExpired = !subRow?.next_billing_date || new Date(subRow.next_billing_date).getTime() > Date.now()
    if (!isActiveLike || !isNotExpired) {
      return NextResponse.json(
        { error: 'An active plan is required to purchase credit top-ups' },
        { status: 403 }
      )
    }

    let credits: number
    let amount: number
    let description: string
    let productId: string

    console.log('📥 [CREDITS API] Processing request:', { packageType, customAmount })

    if (customAmount) {
      // Custom amount (minimum $5, maximum $500)
      if (customAmount < 5 || customAmount > 500) {
        return NextResponse.json(
          { error: 'Custom amount must be between $5 and $500' },
          { status: 400 }
        )
      }
      // For now, block custom amounts until a dedicated one-time Credits product is created in Dodo
      return NextResponse.json(
        {
          error: 'Custom credit purchases require a one-time product in Dodo.',
          details: {
            nextSteps: 'Create a one-time Credits product (or packages) in Dodo and set env vars DODO_CREDITS_*_PRODUCT_ID. Then remove this restriction.'
          }
        },
        { status: 400 }
      )
    } else {
      // Predefined package
      const packageConfig = CREDIT_PACKAGES[packageType as CreditPackageType]
      if (!packageConfig) {
        return NextResponse.json(
          { error: 'Invalid package type' },
          { status: 400 }
        )
      }

      credits = packageConfig.credits + ((packageConfig as any).bonus || 0)
      amount = packageConfig.price
      description = packageConfig.description
      productId = packageConfig.productId as unknown as string

      if (!productId) {
        return NextResponse.json(
          {
            error: 'Credits purchase is not configured yet.',
            details: {
              reason: 'Missing Dodo one-time product IDs for credit packages',
              nextSteps: 'Create one-time products in Dodo for each credits package and set env vars: DODO_CREDITS_STARTER_PRODUCT_ID, DODO_CREDITS_POPULAR_PRODUCT_ID, DODO_CREDITS_PREMIUM_PRODUCT_ID, DODO_CREDITS_ULTIMATE_PRODUCT_ID.'
            }
          },
          { status: 400 }
        )
      }
      console.log('📦 [CREDITS API] Package processing:', { packageType, credits, amount, description, productId })
    }

    // Create one-time payment using Dodo Payments API
    try {
      console.log('Creating credit purchase for user:', userEmail)
      console.log('Credits:', credits, 'Amount:', amount)

      const successUrl = process.env.DODO_PAYMENTS_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard?payment=success&type=credits`
      const cancelUrl = process.env.DODO_PAYMENTS_CANCEL_URL || `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard?payment=cancelled`

      const paymentData = {
        // Package payment - use product cart; amount is determined by the product in Dodo
        billing: {
          city: 'Mumbai',
          country: 'US' as const, // USD currency
          state: 'California',
          street: '123 Main St',
          zipcode: '90001'
        },
        customer: {
          email: userEmail as string,
          name: (userEmail || 'User') as string
        },
        product_cart: [
          {
            product_id: productId,
            quantity: 1
          }
        ],
        payment_link: true,
        return_url: successUrl,
        metadata: {
          userId,
          type: 'credit_purchase',
          credits: credits.toString(),
          packageType: packageType || 'custom',
          description,
          success_url: successUrl,
          cancel_url: cancelUrl
        }
      }

      console.log('Creating credit payment with data:', paymentData)
      const payment = await dodo.payments.create(paymentData)
      console.log('Created credit payment:', payment)

      // Store pending credit purchase in database
      const purchaseId = uuidv4()
      const now = new Date().toISOString()

      const { data, error } = await adminDb
        .from('credit_purchases')
        .insert({
          id: purchaseId,
          user_id: userId,
          package_type: packageType || 'custom',
          status: 'pending',
          credits,
          amount: amount * 100, // Store in cents (for our reference)
          currency: 'USD',
          description,
          dodo_payment_id: payment.payment_id,
          checkout_url: payment.payment_link,
          product_id: productId,
          custom_amount: null,
          created_at: now,
          updated_at: now
        })

      if (error) {
        console.error('❌ Error storing credit purchase:', error)
        return NextResponse.json(
          { error: 'Failed to store credit purchase' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        checkoutUrl: payment.payment_link,
        paymentId: payment.payment_id,
        credits,
        amount,
        description
      })
    } catch (err: any) {
      // Improve error clarity for common Dodo 404s
      const message = err?.status === 404
        ? 'Dodo returned 404. Likely product_id does not exist in your Dodo account or is not a one-time product.'
        : err.message || 'Unknown error'
      console.error('❌ [CREDITS API] Dodo error:', err)
      return NextResponse.json(
        {
          error: message,
          details: { status: err?.status, headers: err?.headers, error: err?.error }
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ [CREDITS API] Unexpected error:', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

// GET method to retrieve available credit packages
export async function GET() {
  return NextResponse.json({
    packages: CREDIT_PACKAGES,
    customCreditsRate: 100, // 100 credits per $1
    minCustomAmount: 5,
    maxCustomAmount: 500
  })
}
