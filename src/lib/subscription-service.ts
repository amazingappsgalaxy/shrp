import { supabase, supabaseAdmin } from './supabase'

export interface UserSubscription {
    id: string
    plan: string
    status: string
    billing_period: string
    next_billing_date: string | null
    dodo_subscription_id: string | null
}

export interface SubscriptionStatus {
    has_active_subscription: boolean
    current_plan: string
    subscription: UserSubscription | null
}

export class SubscriptionService {
    /**
     * Get user's current subscription status
     */
    static async getUserSubscription(userId: string): Promise<SubscriptionStatus> {
        const client = ((typeof window === 'undefined' ? supabaseAdmin : supabase) ?? supabase) as any

        try {
            // Get active subscription
            const { data: subscription, error } = await client
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['active', 'pending', 'pending_cancellation', 'trialing'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching subscription:', error)
            }

            if (subscription) {
                return {
                    has_active_subscription: true,
                    current_plan: subscription.plan,
                    subscription
                }
            }

            // No active subscription
            return {
                has_active_subscription: false,
                current_plan: 'free',
                subscription: null
            }
        } catch (e) {
            console.error('Exception fetching subscription:', e)
            return {
                has_active_subscription: false,
                current_plan: 'free',
                subscription: null
            }
        }
    }

    /**
     * Check if user can purchase top-up credits
     * Only users with active subscriptions can buy top-up credits
     */
    static async canPurchaseTopUp(userId: string): Promise<boolean> {
        const status = await this.getUserSubscription(userId)
        return status.has_active_subscription
    }

    /**
     * Get all subscriptions for a user (including inactive)
     */
    static async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
        const client = ((typeof window === 'undefined' ? supabaseAdmin : supabase) ?? supabase) as any

        try {
            const { data, error } = await client
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching subscriptions:', error)
                return []
            }

            return data || []
        } catch (e) {
            console.error('Exception fetching subscriptions:', e)
            return []
        }
    }

    /**
     * Cancel a subscription
     */
    static async cancelSubscription(userId: string, subscriptionId: string): Promise<boolean> {
        const admin = (supabaseAdmin ?? supabase) as any

        try {
            const { error } = await admin
                .from('subscriptions')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('id', subscriptionId)
                .eq('user_id', userId)

            if (error) {
                console.error('Error cancelling subscription:', error)
                return false
            }

            return true
        } catch (e) {
            console.error('Exception cancelling subscription:', e)
            return false
        }
    }
}
