import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/simple-auth'
import { DODO_PAYMENTS_CONFIG } from '@/lib/dodo-payments-config'
import DodoPayments from 'dodopayments'

const dodo = new DodoPayments({
  bearerToken: DODO_PAYMENTS_CONFIG.apiKey,
  environment: DODO_PAYMENTS_CONFIG.environment as 'live_mode' | 'test_mode'
})

export async function POST(request: NextRequest) {
  try {
    const { plan, billingPeriod } = await request.json()
    
    // Get user session
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const sessionData = await getSession(token)
    if (!sessionData?.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    console.log('Creating test payment for user:', sessionData.user.email)
    
    try {
      // Use your actual test product ID for one-time payment
      const productId = 'pdt_mYcKtEdhWQVomTRUdfu0H'
      
      // Create a one-time payment using product_id (required by SDK types)
      const planAmounts = {
        basic: { monthly: 9, yearly: 108 },
        creator: { monthly: 25, yearly: 252 },
        professional: { monthly: 39, yearly: 408 },
        enterprise: { monthly: 99, yearly: 1008 }
      }

      const planName = (plan || 'creator').toLowerCase()
      const period = (billingPeriod || 'monthly').toLowerCase() as 'monthly' | 'yearly'
      const amount = planAmounts[planName as keyof typeof planAmounts]?.[period] || 25

      const paymentData = {
        billing: {
          city: 'San Francisco',
          country: 'US' as const,
          state: 'CA',
          street: '123 Main St',
          zipcode: '94105'
        },
        customer: {
          email: sessionData.user.email,
          name: sessionData.user.name || sessionData.user.email
        },
        product_cart: [
          {
            product_id: productId,
            quantity: 1
          }
        ],
        payment_link: true,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/app/dashboard?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/?payment=cancelled#pricing-section`,
        metadata: {
          userId: sessionData.user.id,
          plan: planName,
          billingPeriod: period,
          testPayment: 'true',
          amount: amount.toString()
        }
      }
      
      console.log('Creating payment with data:', paymentData)
      
      // Create one-time payment
      const payment = await dodo.payments.create(paymentData)
      console.log('Created payment:', payment)
      
      return NextResponse.json({
        success: true,
        checkoutUrl: payment.payment_link,
        paymentId: payment.payment_id,
        amount: (payment as any).amount,
        currency: (payment as any).currency
      })
      
    } catch (error: any) {
      console.error('Error creating payment:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      if (error.status === 401) {
        return NextResponse.json(
          { 
            error: 'Authentication failed - Invalid API key',
            message: 'The API key is invalid or expired. Please check your Dodo Payments dashboard for the correct API key.',
            apiKeyPrefix: DODO_PAYMENTS_CONFIG.apiKey.substring(0, 10) + '...'
          },
          { status: 500 }
        )
      }
      
      if (error.status === 404) {
        return NextResponse.json(
          { 
            error: 'Product not found',
            message: 'The product ID does not exist. Please check your Dodo Payments dashboard.',
            productId: 'pdt_mYcKtEdhWQVomTRUdfu0H'
          },
          { status: 500 }
        )
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json(
        { error: `Failed to create payment: ${errorMessage}` },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Test checkout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}