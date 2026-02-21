import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { DODO_PAYMENTS_CONFIG } from '@/lib/dodo-payments-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value

    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const session = await getSession(token)
    if (!session?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const userId = session.user.id
    const db = (supabaseAdmin ?? supabase) as any

    let paymentRow: any | null = null
    try {
      const { data } = await db
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .or(`dodo_payment_id.eq.${paymentId},id.eq.${paymentId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      paymentRow = data ?? null
    } catch {
      paymentRow = null
    }

    const invoiceUrl =
      paymentRow?.invoice_url ||
      paymentRow?.metadata?.invoice_url ||
      paymentRow?.metadata?.invoice_pdf ||
      paymentRow?.metadata?.pdf_url ||
      paymentRow?.metadata?.receipt_url ||
      null

    if (invoiceUrl) return NextResponse.json({ url: invoiceUrl })

    const baseUrl = DODO_PAYMENTS_CONFIG.environment === 'live_mode'
      ? 'https://live.dodopayments.com'
      : 'https://test.dodopayments.com'

    const paymentRes = await fetch(`${baseUrl}/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${DODO_PAYMENTS_CONFIG.apiKey}`,
        Accept: 'application/json'
      }
    })

    if (!paymentRes.ok) {
      return NextResponse.json({ error: 'Invoice not available' }, { status: 404 })
    }

    const paymentData: any = await paymentRes.json()
    const urlFromDodo =
      paymentData?.invoice_url ||
      paymentData?.invoice_pdf ||
      paymentData?.pdf_url ||
      paymentData?.receipt_url ||
      paymentData?.invoice?.url ||
      null

    if (urlFromDodo) return NextResponse.json({ url: urlFromDodo })

    return NextResponse.json({ error: 'Invoice not available' }, { status: 404 })

  } catch (error) {
    console.error('Invoice download error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to download invoice',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
