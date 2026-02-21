import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const session = await getSession(token)
    if (!session?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const userId = session.user.id
    const db = (supabaseAdmin ?? supabase) as any

    const { data: paymentRows, error } = await db
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Billing payments query error:', error)
      return NextResponse.json({ success: true, payments: [], total: 0, completed: 0, totalAmount: 0 })
    }

    let payments = (paymentRows || []).map((p: any) => ({
      id: p.id,
      dodoPaymentId: p.dodo_payment_id || p.id,
      amount: p.amount || 0,
      currency: (p.currency || 'USD').toLowerCase(),
      status: p.status || 'pending',
      plan: p.plan || null,
      billingPeriod: p.billing_period || null,
      creditsGranted: p.credits_granted || 0,
      createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
      paidAt: p.paid_at ? new Date(p.paid_at).getTime() : (p.created_at ? new Date(p.created_at).getTime() : Date.now()),
      invoiceUrl: p.metadata?.invoice_url || p.metadata?.receipt_url || null
    }))

    if (payments.length === 0) {
      try {
        const { data: subscription } = await db
          .from('subscriptions')
          .select('dodo_subscription_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const dodoSubscriptionId = subscription?.dodo_subscription_id
        if (dodoSubscriptionId) {
          const dodoPayments: any[] = []
          for await (const item of (dodo as any).payments.list({ subscription_id: dodoSubscriptionId })) {
            dodoPayments.push(item)
            if (dodoPayments.length >= 50) break
          }
          payments = dodoPayments.map((p: any) => ({
            id: p.payment_id,
            dodoPaymentId: p.payment_id,
            amount: p.total_amount ?? 0,
            currency: (p.currency || 'USD').toLowerCase(),
            status: p.status || 'pending',
            plan: p.metadata?.plan || null,
            billingPeriod: p.metadata?.billingPeriod || null,
            creditsGranted: 0,
            createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
            paidAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
            invoiceUrl: p.invoice_url || null
          }))
        }
      } catch (dodoError) {
        console.error('Billing payments Dodo fallback error:', dodoError)
      }
    }

    return NextResponse.json({
      success: true,
      payments,
      total: payments.length,
      completed: payments.filter((p: any) => p.status === 'completed' || p.status === 'succeeded' || p.status === 'paid').length,
      totalAmount: payments
        .filter((p: any) => p.status === 'completed' || p.status === 'succeeded' || p.status === 'paid')
        .reduce((sum: number, p: any) => sum + p.amount, 0)
    })

  } catch (error) {
    console.error('Billing payments error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get payment history',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
