import { NextRequest, NextResponse } from 'next/server'

/**
 * Test webhook endpoint to simulate Dodo payment events
 * This helps debug webhook reception and credit allocation
 */
export async function POST(request: NextRequest) {
  try {
    const { eventType, userId, plan = 'basic', amount = 800 } = await request.json()
    
    console.log('🧪 Simulating webhook event:', { eventType, userId, plan, amount })
    
    // Create mock payment event
    const mockEvent = {
      type: eventType || 'payment.succeeded',
      data: {
        payment_id: `test_pay_${Date.now()}`,
        amount: amount,
        currency: 'INR',
        status: 'completed',
        metadata: {
          userId,
          plan,
          billingPeriod: 'monthly',
          credits: '1000'
        }
      }
    }
    
    // Forward to actual webhook endpoint
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'dodo-signature': 'test-signature'
      },
      body: JSON.stringify(mockEvent)
    })
    
    const webhookResult = await webhookResponse.text()
    
    return NextResponse.json({
      success: true,
      message: 'Mock webhook sent',
      mockEvent,
      webhookResponse: {
        status: webhookResponse.status,
        result: webhookResult
      }
    })
    
  } catch (error) {
    console.error('Error simulating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to simulate webhook', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Webhook Simulator',
    usage: 'POST with { eventType, userId, plan, amount }',
    examples: {
      success: {
        eventType: 'payment.succeeded',
        userId: 'user123', 
        plan: 'basic',
        amount: 800
      },
      failure: {
        eventType: 'payment.failed',
        userId: 'user123',
        plan: 'basic', 
        amount: 800
      }
    }
  })
}