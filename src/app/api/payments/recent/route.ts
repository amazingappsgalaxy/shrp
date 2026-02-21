import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/simple-auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const since = searchParams.get('since')
    
    if (!userId || !since) {
      return NextResponse.json(
        { error: 'Missing userId or since parameter' },
        { status: 400 }
      )
    }

    // Verify user session
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const session = await getSession(token)
    if (!session || !session.user || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Invalid session or unauthorized' },
        { status: 401 }
      )
    }

    const sinceTimestamp = parseInt(since)
    
    // Check for payments created since the timestamp
    const { data: paymentsData, error } = await supabase
      .from('payments')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'completed')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Filter payments created since the timestamp
    const recentPayments = (paymentsData || []).filter((payment: any) => 
      payment.createdAt > sinceTimestamp || payment.paidAt > sinceTimestamp
    )

    console.log(`🔍 Checking for payments since ${new Date(sinceTimestamp).toISOString()}`)
    console.log(`📊 Found ${recentPayments.length} recent payments for user ${userId}`)

    return NextResponse.json({
      success: true,
      newPayments: recentPayments.map((p: any) => ({
        id: p.id,
        dodoPaymentId: p.dodoPaymentId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        plan: p.plan,
        billingPeriod: p.billingPeriod,
        creditsGranted: p.creditsGranted,
        createdAt: p.createdAt,
        paidAt: p.paidAt
      })),
      total: recentPayments.length,
      lastChecked: Date.now()
    })

  } catch (error) {
    console.error('Recent payments check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check recent payments',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}