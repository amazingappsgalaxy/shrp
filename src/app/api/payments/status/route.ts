import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import DodoPayments from 'dodopayments'
import { DODO_PAYMENTS_CONFIG } from '@/lib/dodo-payments-config'

const dodo = new DodoPayments({
  bearerToken: DODO_PAYMENTS_CONFIG.apiKey,
  environment: DODO_PAYMENTS_CONFIG.environment as 'live_mode' | 'test_mode'
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // First check our database
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('dodoPaymentId', paymentId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching payment:', error)
    }

    const localPayment = payments

    try {
      // Also check with Dodo Payments API for latest status
      const dodoPayment = await dodo.payments.retrieve(paymentId)
      
      console.log('Dodo payment response:', dodoPayment)
      
      // Return combined data
      return NextResponse.json({
        payment_id: paymentId,
        status: (dodoPayment as any).status || localPayment?.status || 'unknown',
        amount: (dodoPayment as any).total_amount || localPayment?.amount || 0,
        currency: (dodoPayment as any).currency || localPayment?.currency || 'INR',
        created_at: (dodoPayment as any).created_at || localPayment?.createdAt,
        local_payment: localPayment ? {
          id: localPayment.id,
          status: localPayment.status,
          plan: localPayment.plan,
          credits_granted: localPayment.creditsGranted
        } : null,
        dodo_payment: {
          status: (dodoPayment as any).status,
          amount: (dodoPayment as any).total_amount,
          currency: (dodoPayment as any).currency,
          raw_response: dodoPayment // For debugging
        }
      })
    } catch (dodoError) {
      console.error('Error fetching from Dodo API:', dodoError)
      
      // Fallback to local data if Dodo API fails
      if (localPayment) {
        return NextResponse.json({
          payment_id: paymentId,
          status: localPayment.status,
          amount: localPayment.amount,
          currency: localPayment.currency,
          created_at: localPayment.createdAt,
          local_payment: {
            id: localPayment.id,
            status: localPayment.status,
            plan: localPayment.plan,
            credits_granted: localPayment.creditsGranted
          },
          note: 'Retrieved from local database (Dodo API unavailable)'
        })
      }
      
      return NextResponse.json(
        { 
          error: 'Payment not found',
          payment_id: paymentId
        },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}