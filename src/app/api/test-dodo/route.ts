import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { DODO_PAYMENTS_CONFIG } from '@/lib/dodo-payments-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Dodo API connection...')
    console.log('API Key prefix:', DODO_PAYMENTS_CONFIG.apiKey?.substring(0, 10) + '...')
    console.log('Environment:', DODO_PAYMENTS_CONFIG.environment)
    
    const dodo = new DodoPayments({
      bearerToken: DODO_PAYMENTS_CONFIG.apiKey,
      environment: DODO_PAYMENTS_CONFIG.environment as 'live_mode' | 'test_mode'
    })
    
    // Try to list products first (less sensitive than customers)
    console.log('Attempting to list products...')
    const products = await dodo.products.list()
    
    // Handle the response structure properly
    const productItems = Array.isArray(products) ? products : (products.items || [])
    
    return NextResponse.json({
      success: true,
      message: 'Dodo API connection successful',
      productCount: productItems.length || 0,
      products: productItems.slice(0, 3), // Show first 3 products for debugging
      responseStructure: typeof products // For debugging the actual response structure
    })
  } catch (error: any) {
    console.error('Dodo API test failed:', error)
    
    // Check if it's an authentication error
    if (error.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed - Invalid API key',
          message: 'The API key is invalid or expired. Please check your Dodo Payments dashboard for the correct API key.',
          apiKeyPrefix: DODO_PAYMENTS_CONFIG.apiKey?.substring(0, 10) + '...'
        },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        status: error.status,
        details: error
      },
      { status: 500 }
    )
  }
}