import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/simple-auth'
import { CreditManager } from '@/lib/credits'

export async function POST(request: NextRequest) {
  try {
    // Get user session for basic authentication
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const sessionData = await getSession(sessionToken)
    if (!sessionData || !sessionData.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, reason = 'admin_grant' } = body
    
    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid credit amount' },
        { status: 400 }
      )
    }

    if (amount > 100000) {
      return NextResponse.json(
        { error: 'Maximum 100,000 credits per grant' },
        { status: 400 }
      )
    }

    // Grant credits to the authenticated user
    const result = await CreditManager.addCredits({
      userId: sessionData.user.id,
      amount,
      type: 'bonus',
      source: 'admin_grant',
      metadata: {
        reason,
        grantedBy: 'admin',
        timestamp: new Date().toISOString()
      }
    })

    console.log(`💳 Admin: Granted ${amount} credits to user ${sessionData.user.id}`)

    return NextResponse.json({
      success: true,
      creditId: result.creditId,
      transactionId: result.transactionId,
      newBalance: result.newBalance,
      creditsGranted: amount,
      userId: sessionData.user.id
    })

  } catch (error) {
    console.error('Error granting credits:', error)
    return NextResponse.json(
      { 
        error: 'Failed to grant credits',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}