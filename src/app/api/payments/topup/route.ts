import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { dodoClient as dodo } from '@/lib/dodo-client'
import { DODO_PRODUCT_IDS, TOPUP_PACKAGES } from '@/lib/dodo-payments-config'
import { PaymentUtils } from '@/lib/payment-utils'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const session = await getSession(token)
    if (!session?.user?.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const credits = Number(body.credits)

    const validPackage = TOPUP_PACKAGES.find(p => p.credits === credits)
    if (!validPackage) {
      return NextResponse.json({ error: 'Invalid top-up package. Valid options: 500, 1000, 2500, 5000' }, { status: 400 })
    }

    // Require an active subscription
    if (supabase) {
      const { data: sub } = await (supabase as any)
        .from('subscriptions')
        .select('status')
        .eq('user_id', session.user.id)
        .in('status', ['active', 'trialing', 'pending', 'pending_cancellation'])
        .limit(1)
        .maybeSingle()

      if (!sub) {
        return NextResponse.json({ error: 'An active subscription is required for top-ups' }, { status: 403 })
      }
    }

    const productId = (DODO_PRODUCT_IDS as any).topup?.[credits]
    if (!productId) {
      return NextResponse.json({
        error: 'Top-up product not configured',
        message: `Set the DODO_TOPUP_${credits}_PRODUCT_ID environment variable to enable this package.`,
      }, { status: 500 })
    }

    // Derive base URL from request origin (works with Cloudflare tunnel)
    const requestOrigin = new URL(request.url).origin
    const isLocalhost = requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')
    const baseUrl = (isLocalhost
      ? (process.env.NEXT_PUBLIC_APP_URL || requestOrigin)
      : requestOrigin
    ).replace(/\/$/, '')
    const successUrl = `${baseUrl}/payment-success`

    const checkoutSession: any = await (dodo as any).checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: session.user.email as string,
        name: (session.user.name || session.user.email) as string,
      },
      return_url: successUrl,
      metadata: {
        userId: session.user.id,
        type: 'topup',
        credits: credits.toString(),
        user_email: session.user.email as string,
        user_name: (session.user.name || session.user.email) as string,
      }
    })

    const checkoutUrl = checkoutSession.checkout_url || checkoutSession.url
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Payment service error: missing checkout URL' }, { status: 500 })
    }

    try {
      await PaymentUtils.storeMapping(checkoutSession.session_id || checkoutSession.id, {
        userId: session.user.id,
        plan: 'topup',
        billingPeriod: 'monthly',
        userEmail: session.user.email as string,
        userName: (session.user.name || session.user.email) as string,
        paymentId: checkoutSession.payment_id,
      })
    } catch {
      // Non-fatal — webhook will handle credit allocation
    }

    return NextResponse.json({ success: true, checkoutUrl })
  } catch (error: any) {
    console.error('❌ Top-up checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create top-up checkout', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
