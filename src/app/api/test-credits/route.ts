import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { CreditsService } from '@/lib/credits-service'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const session = await getSession(token)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    console.log('🧪 [TEST CREDITS] Testing credits service for user:', userId)

    // Test getting user credits
    const balance = await CreditsService.getUserCredits(userId)
    console.log('✅ [TEST CREDITS] Current balance:', balance)

    // Test getting credit history
    const history = await CreditsService.getCreditHistory(userId, 10)
    console.log('✅ [TEST CREDITS] Transaction history:', history.length, 'transactions')

    return NextResponse.json({
      success: true,
      userId,
      credits: {
        total: balance.total,
        subscription_credits: balance.subscription_credits,
        permanent_credits: balance.permanent_credits,
        subscription_expire_at: balance.subscription_expire_at
      },
      historyCount: history.length,
      recentTransactions: history.slice(0, 3).map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        reason: t.reason,
        created_at: t.created_at
      })),
      message: 'Credits service is working correctly'
    })

  } catch (error) {
    console.error('❌ [TEST CREDITS] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { plan, billingPeriod, userId: testUserId } = await request.json()

    console.log('🧪 [TEST CREDITS] Testing credit allocation:', { plan, billingPeriod, testUserId })

    // Get user session if userId not provided
    let userId = testUserId
    if (!userId) {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required or provide userId' },
          { status: 401 }
        )
      }

      const session = await getSession(token)
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        )
      }
      userId = session.user.id
    }

    // Test allocating credits
    await CreditsService.allocateSubscriptionCredits(
      userId,
      plan || 'creator',
      (billingPeriod || 'monthly') as 'monthly' | 'yearly',
      `test-sub-${Date.now()}`,
      `test-payment-${Date.now()}`
    )

    // Get updated balance
    const balance = await CreditsService.getUserCredits(userId)

    return NextResponse.json({
      success: true,
      message: 'Credits allocated successfully',
      userId,
      plan: plan || 'creator',
      billingPeriod: billingPeriod || 'monthly',
      newBalance: balance
    })

  } catch (error) {
    console.error('❌ [TEST CREDITS] Error allocating credits:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

