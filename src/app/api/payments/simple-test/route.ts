import { NextRequest, NextResponse } from 'next/server'
import { dodoClient as dodo } from '@/lib/dodo-client'

export async function POST(request: NextRequest) {
  console.log('🧪 [SIMPLE TEST] Testing basic Dodo payment...')

  try {
    // Create a simple one-time payment without using existing products
    const paymentData = {
      billing: {
        city: 'San Francisco',
        country: 'US' as const,
        state: 'CA',
        street: '123 Main St',
        zipcode: '94105'
      },
      customer: {
        email: 'test@sharpii.ai',
        name: 'Test User'
      },
      product_cart: [
        {
          product_id: process.env.DODO_CREATOR_MONTHLY_PRODUCT_ID!,
          quantity: 1
        }
      ],
      currency: 'USD',
      payment_link: true,
      return_url: 'http://localhost:3003/app/dashboard?payment=success',
      metadata: {
        test: 'true',
        plan: 'creator',
        type: 'test-payment'
      }
    }

    console.log('📤 [SIMPLE TEST] Creating payment:', JSON.stringify(paymentData, null, 2))
    const payment = await dodo.payments.create(paymentData)
    console.log('✅ [SIMPLE TEST] Payment created:', payment)

    return NextResponse.json({
      success: true,
      checkoutUrl: payment.payment_link,
      paymentId: payment.payment_id,
      instructions: [
        'This is a test payment without product dependencies',
        'If this works, the issue is with your product configuration',
        'You should create a new product in Dodo dashboard specifically for checkout'
      ]
    })

  } catch (error) {
    console.error('❌ [SIMPLE TEST] Failed:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      suggestions: [
        'Check your DODO_PAYMENTS_API_KEY is correct',
        'Verify you are in test mode',
        'Ensure your Dodo account has the proper permissions'
      ]
    }, { status: 500 })
  }
}