import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreditManager } from '@/lib/credits'

/**
 * Comprehensive debug endpoint to test payment flow and credit system
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Running comprehensive payment flow test')
    
    // Test webhook endpoint accessibility
    const webhookTest = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'access' })
    })
      .then(res => ({ ok: res.ok, status: res.status as number | undefined, error: undefined as string | undefined }))
      .catch(e => ({ ok: false, status: undefined as number | undefined, error: e.message as string | undefined }))
    
    // Test return URLs
    const successUrlTest = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard`, {
      method: 'GET'
    })
      .then(res => ({ ok: res.ok, status: res.status as number | undefined, error: undefined as string | undefined }))
      .catch(e => ({ ok: false, status: undefined as number | undefined, error: e.message as string | undefined }))
    
    const cancelUrlTest = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/?payment=cancelled`, {
      method: 'GET'
    })
      .then(res => ({ ok: res.ok, status: res.status as number | undefined, error: undefined as string | undefined }))
      .catch(e => ({ ok: false, status: undefined as number | undefined, error: e.message as string | undefined }))
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tunnelUrl: 'https://view-ambassador-sorry-soc.trycloudflare.com',
      tests: {
        webhookEndpoint: {
          url: 'https://view-ambassador-sorry-soc.trycloudflare.com/api/payments/webhook',
          accessible: webhookTest.ok,
          status: webhookTest.status || 'error',
          error: !webhookTest.ok ? webhookTest.error : null
        },
        successUrl: {
          url: 'https://view-ambassador-sorry-soc.trycloudflare.com/app/dashboard',
          accessible: successUrlTest.ok,
          status: successUrlTest.status || 'error',
          error: !successUrlTest.ok ? successUrlTest.error : null
        },
        cancelUrl: {
          url: 'https://view-ambassador-sorry-soc.trycloudflare.com/?payment=cancelled',
          accessible: cancelUrlTest.ok,
          status: cancelUrlTest.status || 'error',
          error: !cancelUrlTest.ok ? cancelUrlTest.error : null
        }
      },
      webhookSetup: {
        requiredUrl: 'https://view-ambassador-sorry-soc.trycloudflare.com/api/payments/webhook',
        secret: 'whsec_CvW8M/rIMpywMbLC0HGysKxFXf2RrcRP',
        events: [
          'payment.succeeded',
          'payment.completed', 
          'payment.failed',
          'checkout.session.completed'
        ]
      },
      nextSteps: [
        '1. Update Dodo Payments webhook URL to: https://view-ambassador-sorry-soc.trycloudflare.com/api/payments/webhook',
        '2. Ensure webhook events include: payment.succeeded, payment.completed, payment.failed',
        '3. Test a real payment to verify webhook reception',
        '4. Check that success_url redirects to: https://view-ambassador-sorry-soc.trycloudflare.com/app/dashboard?payment=success'
      ]
    })
    
  } catch (error) {
    console.error('Error in full test debug:', error)
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId } = await request.json()
    
    if (action === 'simulate_webhook') {
      console.log('🧪 Simulating webhook reception for user:', userId)
      
      // Simulate a payment.succeeded webhook
      const mockWebhookEvent = {
        type: 'payment.succeeded',
        data: {
          payment_id: `test_${Date.now()}`,
          amount: 80000, // ₹800 in paise
          currency: 'INR',
          status: 'completed',
          metadata: {
            userId,
            plan: 'basic',
            billingPeriod: 'monthly',
            credits: '1000'
          }
        }
      }
      
      // Send to webhook endpoint
      const webhookResponse = await fetch(`https://view-ambassador-sorry-soc.trycloudflare.com/api/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'dodo-signature': 'test-signature'
        },
        body: JSON.stringify(mockWebhookEvent)
      })
      
      const webhookResult = await webhookResponse.text()
      
      // Check user's credit balance after simulation
      const newBalance = await CreditManager.getUserCreditBalance(userId)
      
      return NextResponse.json({
        success: true,
        action: 'simulate_webhook',
        webhookEvent: mockWebhookEvent,
        webhookResponse: {
          status: webhookResponse.status,
          result: webhookResult
        },
        newCreditBalance: newBalance
      })
    }
    
    if (action === 'check_user_credits') {
      const balance = await CreditManager.getUserCreditBalance(userId)
      const activeCredits = await CreditManager.getActiveCredits(userId)
      const history = await CreditManager.getCreditHistory(userId, 5)
      
      return NextResponse.json({
        success: true,
        action: 'check_user_credits',
        userId,
        creditBalance: balance,
        activeCredits: activeCredits.length,
        recentHistory: history.length
      })
    }
    
    return NextResponse.json({
      error: 'Unknown action',
      availableActions: ['simulate_webhook', 'check_user_credits']
    })
    
  } catch (error) {
    console.error('Error in debug action:', error)
    return NextResponse.json({
      error: 'Action failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}