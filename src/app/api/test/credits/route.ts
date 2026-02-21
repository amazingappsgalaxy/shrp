import { NextRequest, NextResponse } from 'next/server'
import { CreditManager } from '@/lib/credits'
import { getSession } from '@/lib/simple-auth'
import { cookies } from 'next/headers'

/**
 * Test endpoint for credit system functionality
 * GET /api/test/credits - Get user credit info
 * POST /api/test/credits - Test credit operations
 */

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const sessionData = await getSession(sessionToken)
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = sessionData.user.id
    
    // Get current balance
    const balance = await CreditManager.getUserCreditBalance(userId)
    
    // Get active credits breakdown
    const activeCredits = await CreditManager.getActiveCredits(userId)
    
    // Get expiring credits (next 7 days)
    const expiringCredits = await CreditManager.getExpiringCredits(userId, 7)
    
    // Get credit history
    const history = await CreditManager.getCreditHistory(userId, 20)
    
    const dayMs = 24 * 60 * 60 * 1000

    return NextResponse.json({
      userId,
      currentBalance: balance,
      activeCredits: activeCredits.map(c => ({
        id: c.id,
        amount: c.amount,
        type: c.type,
        source: c.source,
        expiresAt: c.expiresAt,
        expiresOn: new Date(c.expiresAt).toISOString(),
        daysUntilExpiration: Math.ceil((c.expiresAt - Date.now()) / dayMs)
      })),
      expiringCredits: expiringCredits.map(c => ({
        id: c.id,
        amount: c.amount,
        expiresAt: c.expiresAt,
        expiresOn: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
        daysUntilExpiration: c.expiresAt ? Math.ceil((c.expiresAt - Date.now()) / dayMs) : null
      })),
      recentTransactions: history.slice(0, 10).map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        reason: t.reason,
        description: t.description,
        createdAt: t.createdAt,
        date: new Date(t.createdAt).toISOString()
      }))
    })
    
  } catch (error) {
    console.error('Error getting credit info:', error)
    return NextResponse.json(
      { error: 'Failed to get credit info', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const sessionData = await getSession(sessionToken)
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = sessionData.user.id
    const { action, ...params } = await request.json()
    
    let result: any
    
    switch (action) {
      case 'grant': {
        const { amount, type = 'bonus', source = 'admin_grant' } = params as any
        result = await CreditManager.addCredits({
          userId,
          amount,
          type,
          source,
          metadata: { testGrant: true }
        })
        break
      }
      case 'deduct': {
        const { amount: deductAmount, reason = 'api_usage' } = params as any
        result = await CreditManager.deductCredits({
          userId,
          amount: deductAmount,
          reason,
          description: `Test deduction: ${deductAmount} credits`
        })
        break
      }
      case 'grant_monthly': {
        const { plan = 'basic', subscriptionId = 'test-sub' } = params as any
        result = await CreditManager.grantMonthlyCredits({
          userId,
          plan,
          subscriptionId
        })
        break
      }
      case 'expire_old':
        result = await CreditManager.expireOldCredits()
        break
      case 'get_expiring': {
        const { days = 7 } = params as any
        result = await CreditManager.getExpiringCredits(userId, days)
        break
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error testing credit operations:', error)
    return NextResponse.json(
      { error: 'Failed to perform test operation', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}