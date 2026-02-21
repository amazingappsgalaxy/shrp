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

    const { data: payments, error } = await db
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Billing invoices payments query error:', error)
      return NextResponse.json({ success: true, invoices: [], total: 0, totalAmount: 0 })
    }

    let invoices = (payments || []).map((p: any) => {
      const paymentId = p.dodo_payment_id || p.id
      return {
        id: paymentId,
        paymentId,
        invoiceNumber: p.metadata?.invoice_id ? `INV-${p.metadata.invoice_id}` : `INV-${String(paymentId).slice(-8).toUpperCase()}`,
        amount: p.amount || 0,
        currency: p.currency || 'USD',
        status: p.status === 'succeeded' ? 'paid' : p.status,
        issuedAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
        dueAt: p.paid_at ? new Date(p.paid_at).getTime() : (p.created_at ? new Date(p.created_at).getTime() : Date.now()),
        downloadUrl: `/api/billing/invoice/${paymentId}/download`,
        plan: p.plan,
        billingPeriod: p.billing_period,
        userEmail: session.user.email
      }
    })

    if (invoices.length === 0) {
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
          invoices = dodoPayments.map((p: any) => ({
            id: p.payment_id,
            paymentId: p.payment_id,
            invoiceNumber: p.invoice_id ? `INV-${p.invoice_id}` : `INV-${String(p.payment_id).slice(-8).toUpperCase()}`,
            amount: p.total_amount ?? 0,
            currency: p.currency || 'USD',
            status: p.status === 'succeeded' ? 'paid' : p.status,
            issuedAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
            dueAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
            downloadUrl: `/api/billing/invoice/${p.payment_id}/download`,
            plan: p.metadata?.plan || null,
            billingPeriod: p.metadata?.billingPeriod || null,
            userEmail: session.user.email
          }))
        }
      } catch (dodoError) {
        console.error('Billing invoices Dodo fallback error:', dodoError)
      }
    }

    return NextResponse.json({
      success: true,
      invoices,
      total: invoices.length,
      totalAmount: invoices.reduce((sum: number, invoice: any) => sum + invoice.amount, 0)
    })

  } catch (error) {
    console.error('Billing invoices error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get invoices',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
