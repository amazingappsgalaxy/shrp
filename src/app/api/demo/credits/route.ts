import { NextRequest, NextResponse } from 'next/server'

// Demo credits API that works without authentication for testing
export async function GET(request: NextRequest) {
  try {
    // Return mock data for demo purposes
    return NextResponse.json({
      user: {
        id: 'demo_user',
        email: 'demo@example.com'
      },
      credits: {
        balance: 55000, // Mock balance matching the user's expected credits
        activeCredits: 1,
        creditDetails: [{
          amount: 55000,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'creator_plan_monthly'
        }]
      },
      recentHistory: [
        {
          id: '1',
          amount: 5000,
          type: 'credit',
          reason: 'subscription_renewal',
          description: 'Creator plan (monthly) - Sep 13, 2025, 11:57 PM',
          createdAt: new Date('2025-09-13T23:57:00Z').getTime()
        },
        {
          id: '2',
          amount: -200,
          type: 'debit',
          reason: 'task_execution',
          description: 'Image enhancement task - 200 credits',
          createdAt: new Date(Date.now() - 60000).getTime()
        }
      ],
      payments: [
        {
          id: 'pay_1',
          dodoPaymentId: 'dodo_abc123',
          amount: 4500, // $45.00
          currency: 'USD',
          status: 'completed',
          plan: 'credit_package_5k',
          billingPeriod: 'one_time',
          creditsGranted: 5500, // 5000 + 500 bonus
          createdAt: new Date('2025-09-13T23:57:00Z').getTime(),
          paidAt: new Date('2025-09-13T23:58:15Z').getTime()
        },
        {
          id: 'pay_2',
          dodoPaymentId: 'dodo_def456',
          amount: 1000, // $10.00
          currency: 'USD',
          status: 'completed',
          plan: 'credit_package_1k',
          billingPeriod: 'one_time',
          creditsGranted: 1000,
          createdAt: new Date('2025-09-12T14:30:00Z').getTime(),
          paidAt: new Date('2025-09-12T14:31:22Z').getTime()
        }
      ]
    })

  } catch (error) {
    console.error('Demo credits API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check credits',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}