import { NextRequest, NextResponse } from 'next/server'

/**
 * Debug endpoint to test webhook reception and processing
 * This will help us understand if webhooks are actually being received from Dodo
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'Webhook Debug Test',
    purpose: 'Test webhook reception and processing',
    usage: {
      webhook_url: 'POST this endpoint to simulate webhooks',
      test_url: 'Use GET to see this info'
    },
    instructions: [
      '1. Configure Dodo webhook to point to this URL',
      '2. Make a test payment',
      '3. Check logs for webhook reception',
      '4. Verify credit allocation'
    ]
  })
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  
  try {
    console.log('\n🔔 WEBHOOK DEBUG TEST - Received at:', timestamp)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Log all headers
    console.log('📋 HEADERS:')
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
      console.log(`  ${key}: ${value}`)
    })
    
    // Log request body
    const body = await request.text()
    console.log('\n📄 BODY:')
    console.log('Body length:', body.length)
    console.log('Raw body:', body)
    
    let parsedBody
    try {
      parsedBody = JSON.parse(body)
      console.log('Parsed body:', JSON.stringify(parsedBody, null, 2))
    } catch (e) {
      console.log('Body is not valid JSON:', e)
    }
    
    // Log URL and method
    console.log('\n🌐 REQUEST INFO:')
    console.log('Method:', request.method)
    console.log('URL:', request.url)
    
    // Simulate forwarding to real webhook
    console.log('\n🔄 FORWARDING TO REAL WEBHOOK...')
    
    try {
      const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'dodo-signature': headers['dodo-signature'] || 'debug-signature'
        },
        body: body
      })
      
      const webhookResult = await webhookResponse.text()
      console.log('✅ Webhook forward result:', webhookResponse.status, webhookResult)
      
    } catch (error) {
      console.log('❌ Webhook forward error:', error)
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔔 WEBHOOK DEBUG TEST COMPLETE\n')
    
    return NextResponse.json({
      success: true,
      timestamp,
      message: 'Webhook debug test completed',
      headers,
      bodyLength: body.length,
      parsedBody: parsedBody || 'Invalid JSON',
      forwarded: true
    })
    
  } catch (error) {
    console.error('❌ WEBHOOK DEBUG ERROR:', error)
    return NextResponse.json({
      success: false,
      timestamp,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}