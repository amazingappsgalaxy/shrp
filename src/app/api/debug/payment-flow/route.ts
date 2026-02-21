import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreditManager } from '@/lib/credits'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { PRICING_PLANS } from '@/lib/pricing-config'
/**
 * Debug payment flow to understand why credits aren't showing up
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session using better-auth
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers) as Record<string, string>
    })
    
    if (!session || !session.user) {
      return NextResponse.json({
        error: 'No session found',
        instructions: 'Please login first to debug payment flow'
      })
    }
    
    const userId = session.user.id
    
    console.log('🔍 Debugging payment flow for user:', userId)
    
    // Check user's current credit balance
    const creditBalance = await CreditManager.getUserCreditBalance(userId)
    
    // Get active credits
    const activeCredits = await CreditManager.getActiveCredits(userId)
    
    // Get credit history
    const creditHistory = await CreditManager.getCreditHistory(userId, 10)
    
    // Get recent payments
    const supabase = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey)
    
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: session.user.email
      },
      credits: {
        currentBalance: creditBalance,
        activeCredits: activeCredits.length,
        activeCreditsBreakdown: activeCredits.map(c => ({
          id: c.id,
          amount: c.amount,
          type: c.type,
          source: c.source,
          expiresAt: c.expiresAt,
          expiresOn: new Date(c.expiresAt).toISOString(),
          daysUntilExpiration: Math.ceil((c.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        }))
      },
      payments: {
        total: payments?.length || 0,
        recent: (payments || []).map(p => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          plan: p.plan,
          billingPeriod: p.billing_period,
          createdAt: p.created_at,
          date: new Date(p.created_at).toISOString(),
          dodoPaymentId: p.dodo_payment_id
        }))
      },
      transactions: {
        total: creditHistory.length,
        recent: creditHistory.slice(0, 5).map(t => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          reason: t.reason,
          description: t.description,
          createdAt: t.createdAt,
          date: new Date(t.createdAt).toISOString()
        }))
      }
    })
    
  } catch (error) {
    console.error('Error debugging payment flow:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId, plan = 'basic' } = await request.json()
    
    if (action === 'simulate_payment') {
      console.log('🧪 Simulating payment for user:', userId)
      
      // Determine monthly credits for the requested plan
      const requestedPlan = String(plan).toLowerCase()
      const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === requestedPlan)
      const resolvedPlan = planConfig ? planConfig.name : 'Basic'
      const creditsToAllocate = planConfig?.credits.monthly ?? PRICING_PLANS.find(p => p.name === 'Basic')!.credits.monthly
      
      // Grant test credits as if a successful monthly payment occurred
      const result = await CreditManager.grantCredits({
        userId,
        amount: creditsToAllocate,
        type: 'purchase',
        source: 'credit_purchase',
        description: `Simulated payment for ${resolvedPlan} plan (monthly)`,
        transactionId: `sim-${Date.now()}`,
        // Set expiration ~30 days from now to mimic monthly cycle
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        metadata: {
          simulated: true,
          plan: resolvedPlan,
          billingPeriod: 'monthly'
        }
      })
      
      return NextResponse.json({
        success: true,
        action: 'simulate_payment',
        userId,
        plan: resolvedPlan,
        creditsGranted: creditsToAllocate,
        creditResult: result,
        message: `Simulated payment and granted ${creditsToAllocate} credits for ${resolvedPlan} plan`
      })
    }
    
    return NextResponse.json({
      error: 'Unknown action',
      availableActions: ['simulate_payment']
    })
    
  } catch (error) {
    console.error('Error in payment debug action:', error)
    return NextResponse.json({
      error: 'Action failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}