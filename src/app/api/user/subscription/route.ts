import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        // Get user session from cookie or auth header
        const authHeader = request.headers.get('authorization')
        const cookieStore = await cookies()
        const token = authHeader?.replace('Bearer ', '') || cookieStore.get('session')?.value

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const session = await getSession(token)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Get subscription (active or pending_cancellation)
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['active', 'pending', 'pending_cancellation', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('Error fetching subscription:', error)
        }

        if (subscription) {
            const now = Date.now()
            const nextBilling = subscription.next_billing_date ? new Date(subscription.next_billing_date).getTime() : null
            const isExpiredCancellation = subscription.status === 'pending_cancellation' && !!nextBilling && nextBilling <= now

            if (isExpiredCancellation) {
                try {
                    await supabase
                        .from('subscriptions')
                        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                        .eq('id', subscription.id)
                } catch {
                }
                return NextResponse.json({
                    success: true,
                    has_active_subscription: false,
                    current_plan: 'free',
                    subscription: null
                })
            }

            return NextResponse.json({
                success: true,
                has_active_subscription: true,
                current_plan: subscription.plan,
                subscription
            })
        }

        return NextResponse.json({
            success: true,
            has_active_subscription: false,
            current_plan: 'free',
            subscription: null
        })
    } catch (error) {
        console.error('Error fetching subscription:', error)
        return NextResponse.json(
            { error: 'Failed to fetch subscription' },
            { status: 500 }
        )
    }
}
