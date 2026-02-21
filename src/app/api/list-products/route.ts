import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { DODO_PAYMENTS_CONFIG } from '@/lib/dodo-payments-config'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 [LIST] Listing all available products')
    console.log('📋 [LIST] API Key:', DODO_PAYMENTS_CONFIG.apiKey?.substring(0, 10) + '...')
    console.log('📋 [LIST] Environment:', DODO_PAYMENTS_CONFIG.environment)
    
    const dodo = new DodoPayments({
      bearerToken: DODO_PAYMENTS_CONFIG.apiKey,
      environment: DODO_PAYMENTS_CONFIG.environment as 'live_mode' | 'test_mode'
    })
    
    // List all products
    const products = await dodo.products.list()
    console.log('📋 [LIST] Raw products response:', JSON.stringify(products, null, 2))
    
    // Handle the response structure properly
    const productItems = Array.isArray(products) ? products : (products.items || [])
    
    return NextResponse.json({
      success: true,
      message: 'Products listed successfully',
      productCount: productItems.length || 0,
      products: productItems.map((product: any) => ({
        product_id: product.product_id,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        is_recurring: product.is_recurring,
        tax_category: product.tax_category,
        price_detail: product.price_detail
      })),
      rawResponse: products
    })
  } catch (error: any) {
    console.error('📋 [LIST] Product listing failed:', error)
    
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