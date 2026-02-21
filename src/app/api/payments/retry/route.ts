import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/simple-auth'
import { supabase } from '@/lib/supabase'

/**
 * Retry a failed payment by creating a new checkout session
 * Uses the same plan and billing period from the failed payment
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const sessionData = await getSession(sessionToken)
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { paymentId } = await request.json()
    
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }
    
    // Get the failed payment
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('userId', sessionData.user.id)
      .single()
    
    if (error) {
      console.error('Error fetching payment:', error)
      return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
    }
    
    const failedPayment = payments
    if (!failedPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    
    if (failedPayment.status !== 'failed' && failedPayment.status !== 'pending') {
      return NextResponse.json({ error: 'Payment cannot be retried' }, { status: 400 })
    }
    
    // Create new checkout session with the same plan
    const retryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/payments/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}`
      },
      body: JSON.stringify({
        plan: failedPayment.plan,
        billingPeriod: failedPayment.billingPeriod
      })
    })
    
    if (!retryResponse.ok) {
      throw new Error(`Checkout failed: ${retryResponse.statusText}`)
    }
    
    const checkoutData = await retryResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'Retry checkout created',
      checkoutUrl: checkoutData.checkoutUrl,
      paymentId: checkoutData.paymentId,
      originalPayment: {
        id: failedPayment.id,
        plan: failedPayment.plan,
        billingPeriod: failedPayment.billingPeriod,
        amount: failedPayment.amount
      }
    })
    
  } catch (error) {
    console.error('Error retrying payment:', error)
    return NextResponse.json(
      { error: 'Failed to retry payment', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}