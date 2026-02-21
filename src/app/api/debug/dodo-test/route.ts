import { NextRequest, NextResponse } from 'next/server'
import { dodoClient as dodo } from '@/lib/dodo-client'
import { DODO_PRODUCT_IDS } from '@/lib/dodo-payments-config'

export async function GET(request: NextRequest) {
  console.log('🔍 [DODO DEBUG] Testing Dodo Payments configuration...')

  try {
    // Test API connectivity
    console.log('1. Testing API connectivity...')

    // Get the creator monthly product ID from env
    const creatorMonthlyProductId = process.env.DODO_CREATOR_MONTHLY_PRODUCT_ID
    console.log('Creator monthly product ID:', creatorMonthlyProductId)

    // Test 1: Try to fetch product information
    try {
      console.log('2. Fetching product information...')
      const products = await dodo.products.list()
      const productItems = Array.isArray(products) ? products : (products as any)?.items || []
      const product = productItems.find((p: any) => p.product_id === creatorMonthlyProductId)
      console.log('✅ Product lookup result:', product || 'Not found')
    } catch (productError) {
      console.error('❌ Product fetch failed:', productError)
    }

    // Test 2: Try creating a simple one-time payment instead of subscription
    console.log('3. Testing one-time payment creation...')
    try {
      const paymentData = {
        billing: {
          city: 'San Francisco',
          country: 'US' as const,
          state: 'CA',
          street: '123 Main St',
          zipcode: '94105'
        },
        customer: {
          email: 'test@example.com',
          name: 'Test User'
        },
        product_cart: [
          {
            product_id: creatorMonthlyProductId!,
            quantity: 1
          }
        ],
        payment_link: true,
        metadata: {
          test: 'true',
          plan: 'creator',
          type: 'one-time'
        }
      }

      console.log('Payment data:', JSON.stringify(paymentData, null, 2))
      const payment = await dodo.payments.create(paymentData)
      console.log('✅ One-time payment created:', payment)

      return NextResponse.json({
        success: true,
        test: 'one-time-payment',
        product_id: creatorMonthlyProductId,
        payment: payment,
        checkout_url: payment.payment_link
      })

    } catch (paymentError) {
      console.error('❌ One-time payment failed:', paymentError)

      // Test 3: Try subscription creation (current approach)
      console.log('4. Testing subscription creation...')
      try {
        const subscriptionData = {
          billing: {
            city: 'San Francisco',
            country: 'US' as const,
            state: 'CA',
            street: '123 Main St',
            zipcode: '94105'
          },
          customer: {
            email: 'test@example.com',
            name: 'Test User'
          },
          product_id: creatorMonthlyProductId!,
          quantity: 1,
          return_url: 'http://localhost:3003/app/dashboard?payment=success',
          metadata: {
            test: 'true',
            plan: 'creator',
            type: 'subscription'
          }
        }

        console.log('Subscription data:', JSON.stringify(subscriptionData, null, 2))
        const subscription = await dodo.subscriptions.create(subscriptionData)
        console.log('✅ Subscription created:', subscription)

        return NextResponse.json({
          success: true,
          test: 'subscription',
          product_id: creatorMonthlyProductId,
          subscription: subscription,
          checkout_url: subscription.client_secret
            ? `https://checkout.dodopayments.com/pay/${subscription.client_secret}`
            : null
        })

      } catch (subscriptionError) {
        console.error('❌ Subscription creation failed:', subscriptionError)

        return NextResponse.json({
          success: false,
          error: 'Both payment methods failed',
          product_id: creatorMonthlyProductId,
          payment_error: paymentError,
          subscription_error: subscriptionError
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('❌ [DODO DEBUG] General error:', error)

    return NextResponse.json({
      success: false,
      error: 'General test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}