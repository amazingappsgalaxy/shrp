import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { DODO_PAYMENTS_CONFIG, DODO_PRODUCT_IDS } from '@/lib/dodo-payments-config'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Testing payment creation with exact same config as checkout')
    console.log('🔍 [DEBUG] API Key:', DODO_PAYMENTS_CONFIG.apiKey?.substring(0, 10) + '...')
    console.log('🔍 [DEBUG] Environment:', DODO_PAYMENTS_CONFIG.environment)
    console.log('🔍 [DEBUG] Creator Monthly Product ID:', DODO_PRODUCT_IDS.creator.monthly)
    console.log('🔍 [DEBUG] Creator Yearly Product ID:', DODO_PRODUCT_IDS.creator.yearly)
    
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
    
    // Test the exact payment data structure used in checkout
    const paymentData = {
      billing: {
        city: 'Mumbai',
        country: 'IN' as const,
        state: 'Maharashtra',
        street: '123 Main St',
        zipcode: '400001'
      },
      customer: {
        email: 'test@example.com',
        name: 'Test User'
      },
      product_cart: [{
        product_id: productId,
        quantity: 1
      }],
      payment_link: true,
      return_url: DODO_PAYMENTS_CONFIG.returnUrl,
      metadata: {
        userId: 'test-user-123',
        plan: 'creator',
        billingPeriod: 'monthly',
        type: 'subscription'
      }
    }
    
    console.log('🔍 [DEBUG] Payment data:', JSON.stringify(paymentData, null, 2))
    
    // Try to create the payment
    const payment = await dodo.payments.create(paymentData)
    console.log('✅ [DEBUG] Payment created successfully:', payment)
    
    return NextResponse.json({
      success: true,
      message: 'Payment creation test successful',
      paymentData,
      payment
    })
  } catch (error: any) {
    console.error('❌ [DEBUG] Payment creation failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error
    }, { status: 500 })
  }
}