import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { DODO_PAYMENTS_CONFIG, DODO_PRODUCT_IDS } from '@/lib/dodo-payments-config'

export async function GET(request: NextRequest) {
  try {
    console.log('🔗 [PAYMENT-LINK] Testing payment link creation for subscription')
    console.log('🔗 [PAYMENT-LINK] API Key:', DODO_PAYMENTS_CONFIG.apiKey?.substring(0, 10) + '...')
    console.log('🔗 [PAYMENT-LINK] Environment:', DODO_PAYMENTS_CONFIG.environment)
    
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
    
    // First create a subscription
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
    
    console.log('🔗 [PAYMENT-LINK] Creating subscription...')
    const subscription = await dodo.subscriptions.create(subscriptionData)
    console.log('🔗 [PAYMENT-LINK] Subscription created:', subscription)
    
    // Use the client_secret to construct checkout URL
    if (subscription.client_secret) {
      const checkoutUrl = `https://checkout.dodopayments.com/pay/${subscription.client_secret}`
      
      return NextResponse.json({
        success: true,
        message: 'Checkout URL created using client secret',
        subscription,
        checkoutUrl,
        clientSecret: subscription.client_secret
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'No payment ID found in subscription',
      subscription
    })
    
  } catch (error: any) {
    console.error('🔗 [PAYMENT-LINK] Payment link creation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      details: {
        status: error.status,
        headers: error.headers,
        error: error.error
      }
    }, { status: 500 })
  }
}