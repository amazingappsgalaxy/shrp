import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const session = await getSession(token)
    if (!session?.user?.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    if (!supabase) return NextResponse.json({ error: 'Billing system not configured' }, { status: 500 })

    // Find the pending-cancellation subscription
    const { data: current, error: subError } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'pending_cancellation')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError || !current) {
      return NextResponse.json({ error: 'No pending-cancellation subscription found' }, { status: 404 })
    }

    if (!current.dodo_subscription_id) {
      return NextResponse.json({ error: 'Subscription ID not found' }, { status: 400 })
    }

    // Tell Dodo to re-enable auto-renew
    await (dodo as any).subscriptions.update(current.dodo_subscription_id, {
      cancel_at_next_billing_date: false
    })

    // Update our DB
    await (supabase as any)
      .from('subscriptions')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', current.id)

    return NextResponse.json({
      success: true,
      subscription: {
        id: current.dodo_subscription_id,
        plan: current.plan,
        billing_period: current.billing_period,
        status: 'active',
        next_billing_date: current.next_billing_date
      }
    })
  } catch (error) {
    console.error('❌ Reactivate subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
