import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { DODO_PAYMENTS_CONFIG, DODO_PRODUCT_IDS } from '@/lib/dodo-payments-config'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [SUBSCRIPTION] Testing subscription creation instead of payment')
    console.log('🔄 [SUBSCRIPTION] API Key:', DODO_PAYMENTS_CONFIG.apiKey?.substring(0, 10) + '...')
    console.log('🔄 [SUBSCRIPTION] Environment:', DODO_PAYMENTS_CONFIG.environment)
    console.log('🔄 [SUBSCRIPTION] Creator Monthly Product ID:', DODO_PRODUCT_IDS.creator.monthly)
    
    const dodo = new DodoPayments({
      bearerToken: DODO_PAYMENTS_CONFIG.apiKey,
      environment: DODO_PAYMENTS_CONFIG.environment as 'live_mode' | 'test_mode'
    })

    const productId = DODO_PRODUCT_IDS.creator.monthly
    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'Creator monthly product ID is not configured. Please set DODO_CREATOR_MONTHLY_PRODUCT_ID.'
      }, { status: 500 })
    }
    
    // Try creating a subscription instead of a payment
    const subscriptionData = {
      customer: {
        email: 'test@example.com',
        name: 'Test User'
      },
      billing: {
        city: 'Mumbai',
        country: 'IN' as const,
        state: 'Maharashtra',
        street: '123 Main St',
        zipcode: '400001'
      },
      product_id: productId,
      quantity: 1,
      return_url: DODO_PAYMENTS_CONFIG.returnUrl,
      metadata: {
        userId: 'test-user-123',
        plan: 'creator',
        billingPeriod: 'monthly',
        type: 'subscription'
      }
    }
    
    console.log('🔄 [SUBSCRIPTION] Subscription data:', JSON.stringify(subscriptionData, null, 2))
    
    // Try to create the subscription
    const subscription = await dodo.subscriptions.create(subscriptionData)
    console.log('✅ [SUBSCRIPTION] Subscription created successfully:', subscription)
    
    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      subscription,
      subscriptionData
    })
  } catch (error: any) {
    console.error('🔄 [SUBSCRIPTION] Subscription creation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      details: {
        status: error.status,
        headers: error.headers,
        error: error.error
      },
      subscriptionData: {
        customer: {
          email: 'test@example.com',
          name: 'Test User'
        },
        billing: {
          city: 'Mumbai',
          country: 'IN',
          state: 'Maharashtra',
          street: '123 Main St',
          zipcode: '400001'
        },
        product_id: DODO_PRODUCT_IDS.creator.monthly ?? null
      }
    }, { status: 500 })
  }
}