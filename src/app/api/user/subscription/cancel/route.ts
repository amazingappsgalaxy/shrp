import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'

export async function POST(request: NextRequest) {
    try {
        // Authenticate user via cookie or auth header
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const session = await getSession(token)
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
        }

        if (!supabase) {
            return NextResponse.json({ error: 'Billing system not configured' }, { status: 500 })
        }

        // Get active subscription from DB
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .in('status', ['active', 'trialing', 'pending', 'pending_cancellation'])
            .single()

        if (error || !subscription) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
        }

        if (subscription.status === 'pending_cancellation') {
            return NextResponse.json({
                success: true,
                message: 'Auto-renew is already turned off. Your plan stays active until the end of the billing period.',
                next_billing_date: subscription.next_billing_date
            })
        }

        const subId = subscription.dodo_subscription_id
        if (!subId) {
            return NextResponse.json({ error: 'Subscription ID not found' }, { status: 400 })
        }

        // Cancel in Dodo Payments - use cancel_at_next_billing_date
        // This stops recurring payments but keeps the subscription active until the billing period ends
        let providerSubscription: any = null
        try {
            console.log('🔄 Cancelling subscription in DodoPayments:', subId)
            await dodo.subscriptions.update(subId, {
                cancel_at_next_billing_date: true
            })
            providerSubscription = await dodo.subscriptions.retrieve(subId)
            console.log('✅ DodoPayments subscription after cancellation:', JSON.stringify(providerSubscription))
        } catch (dodoError: any) {
            console.error('❌ Dodo cancellation error:', dodoError)
            return NextResponse.json({
                error: 'Failed to cancel subscription with payment provider',
                details: dodoError.message
            }, { status: 500 })
        }

        // Update DB: mark as pending_cancellation so UI knows it's cancelled but still active
        // The subscription remains usable until the current billing period ends
        // Guard: Dodo test mode often returns a stale next_billing_date (past). Keep the DB value if it's better.
        const providerDate = providerSubscription?.next_billing_date
        const existingDate = subscription.next_billing_date
        const providerDateValid = providerDate && new Date(providerDate).getTime() > Date.now() + 60_000
        const preservedNextBillingDate = providerDateValid ? providerDate : (existingDate || providerDate)

        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: 'pending_cancellation',
                next_billing_date: preservedNextBillingDate,
                updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id)

        if (updateError) {
            console.error('DB update error:', updateError)
        }

        return NextResponse.json({
            success: true,
            message: 'Auto-renew turned off. Your plan stays active until the end of the billing period, and credits expire at that time.',
            next_billing_date: providerSubscription?.next_billing_date || subscription.next_billing_date,
            provider: {
                subscription_id: providerSubscription?.subscription_id || subId,
                status: providerSubscription?.status,
                cancel_at_next_billing_date: providerSubscription?.cancel_at_next_billing_date
            }
        })

    } catch (error) {
        console.error('Cancellation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
