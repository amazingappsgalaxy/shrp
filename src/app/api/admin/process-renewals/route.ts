import { NextRequest, NextResponse } from 'next/server'
import { CreditManager } from '@/lib/credits'

/**
 * Daily cron job endpoint to process monthly renewals and credit expiration
 * This should be called once per day via a cron service like Vercel Cron or external scheduler
 * 
 * Usage:
 * POST /api/admin/process-renewals
 * Authorization: Bearer YOUR_ADMIN_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET || 'default-admin-secret'
    
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('🔄 Starting daily renewal processing...')
    
    // Step 1: Expire old credits
    const expiredCount = await CreditManager.expireOldCredits()
    console.log(`✅ Expired ${expiredCount} old credits`)
    
    // Step 2: Process monthly renewals
    const renewedCount = await CreditManager.processMonthlyRenewals()
    console.log(`✅ Processed ${renewedCount} monthly renewals`)
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      expiredCredits: expiredCount,
      processedRenewals: renewedCount,
      message: `Successfully processed ${renewedCount} renewals and expired ${expiredCount} credits`
    }
    
    console.log('🎉 Daily renewal processing completed:', result)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Error processing renewals:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process renewals',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for status check
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: 'Daily Renewal Processor',
    status: 'ready',
    description: 'Processes monthly subscription renewals and credit expiration',
    usage: 'POST with Authorization: Bearer ADMIN_SECRET',
    timestamp: new Date().toISOString()
  })
}