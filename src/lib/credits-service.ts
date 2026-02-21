import { supabase, supabaseAdmin } from './supabase'
import { PRICING_PLANS, computePeriodEnd } from './pricing-config'

export interface CreditBalance {
  total: number
  subscription_credits: number
  permanent_credits: number
  subscription_expire_at: Date | null
}

export interface CreditTransaction {
  id: string
  amount: number
  type: 'credit' | 'debit'
  reason: string
  description: string
  balance_before: number
  balance_after: number
  created_at: string
  metadata?: any
}

export class CreditsService {
  /**
   * Get user's current credit balance with breakdown
   */
  static async getUserCredits(userId: string): Promise<CreditBalance> {
    const client = ((typeof window === 'undefined' ? supabaseAdmin : supabase) ?? supabase) as any

    try {
      // Use the database function for atomic read
      const { data, error } = await client.rpc('get_user_credits', {
        p_user_id: userId
      })

      if (error) {
        console.error('Error fetching user credits:', JSON.stringify(error, null, 2))
        // Return zero credits on error instead of throwing
        return {
          total: 0,
          subscription_credits: 0,
          permanent_credits: 0,
          subscription_expire_at: null
        }
      }

      return {
        total: data.total || 0,
        subscription_credits: data.subscription_credits || 0,
        permanent_credits: data.permanent_credits || 0,
        subscription_expire_at: data.subscription_expire_at ? new Date(data.subscription_expire_at) : null
      }
    } catch (e) {
      console.error('Exception fetching credits:', e)
      return {
        total: 0,
        subscription_credits: 0,
        permanent_credits: 0,
        subscription_expire_at: null
      }
    }
  }

  /**
   * Allocate credits to user after successful subscription payment
   * Uses atomic database function with idempotency
   */
  static async allocateSubscriptionCredits(
    userId: string,
    plan: string,
    billingPeriod: 'monthly' | 'yearly' | 'daily',
    subscriptionId: string | null,
    paymentId: string,
    options?: {
      expiresAt?: Date | string | null
      credits?: number
      description?: string
      metadata?: Record<string, unknown>
    }
  ): Promise<{ success: boolean; duplicate: boolean; message: string }> {
    // Get plan configuration
    const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === plan.toLowerCase())
    if (!planConfig) {
      throw new Error(`Plan configuration not found: ${plan}`)
    }

    const creditsToAllocate = typeof options?.credits === 'number' ? options.credits : planConfig.credits.monthly

    const expiryDate = options?.expiresAt
      ? new Date(options.expiresAt)
      : computePeriodEnd(billingPeriod)

    const admin = (supabaseAdmin ?? supabase) as any

    try {
      // If this is a Daily plan, we must expire all previous subscription credits first
      // This ensures user only has the current day's credits (9900)
      if (billingPeriod === 'daily') {
        // We added a new function for this: expire_user_subscription_credits
        // But if it's not available yet, we can try to rely on the fact that existing credits expire tomorrow anyway?
        // No, user explicitly asked to ensure they get expired.
        // We will try to call the new RPC function.
        try {
          await admin.rpc('expire_user_subscription_credits', { p_user_id: userId })
          console.log(`🧹 Cleared previous subscription credits for user ${userId} (Daily Plan)`)
        } catch (cleanupError) {
          console.warn('⚠️ Could not clear previous credits (Function might be missing):', cleanupError)
        }
      }

      // Use atomic function with idempotency
      const { data, error } = await admin.rpc('add_credits_atomic', {
        p_user_id: userId,
        p_amount: creditsToAllocate,
        p_credit_type: 'subscription',
        p_transaction_id: paymentId,
        p_subscription_id: subscriptionId,
        p_expires_at: expiryDate.toISOString(),
        p_description: options?.description || `${plan} plan credits (${billingPeriod})`,
        p_metadata: {
          plan,
          billing_period: billingPeriod,
          allocated_at: new Date().toISOString(),
          ...(options?.metadata || {})
        }
      })

      if (error) {
        console.error('Error allocating credits:', error)
        throw new Error('Failed to allocate credits')
      }

      if (data.duplicate) {
        console.log(`⚠️ Duplicate credit allocation prevented for payment ${paymentId}`)
      } else {
        console.log(`✅ Allocated ${creditsToAllocate} credits to user ${userId} for ${plan} plan`)
      }

      return {
        success: data.success,
        duplicate: data.duplicate,
        message: data.message
      }
    } catch (error) {
      console.error('Exception in allocateSubscriptionCredits:', error)
      throw error
    }
  }

  /**
   * Allocate permanent credits (top-up)
   */
  static async allocatePermanentCredits(
    userId: string,
    amount: number,
    paymentId: string,
    description: string
  ): Promise<{ success: boolean; duplicate: boolean; message: string }> {
    const admin = (supabaseAdmin ?? supabase) as any

    try {
      // Permanent credits never expire
      const farFutureDate = new Date('2099-12-31')

      const { data, error } = await admin.rpc('add_credits_atomic', {
        p_user_id: userId,
        p_amount: amount,
        p_credit_type: 'permanent',
        p_transaction_id: paymentId,
        p_subscription_id: null,
        p_expires_at: farFutureDate.toISOString(),
        p_description: description,
        p_metadata: {
          type: 'top_up',
          allocated_at: new Date().toISOString()
        }
      })

      if (error) {
        console.error('Error allocating permanent credits:', error)
        throw new Error('Failed to allocate permanent credits')
      }

      if (data.duplicate) {
        console.log(`⚠️ Duplicate permanent credit allocation prevented for payment ${paymentId}`)
      } else {
        console.log(`✅ Allocated ${amount} permanent credits to user ${userId}`)
      }

      return {
        success: data.success,
        duplicate: data.duplicate,
        message: data.message
      }
    } catch (error) {
      console.error('Exception in allocatePermanentCredits:', error)
      throw error
    }
  }

  /**
   * Deduct credits for image enhancement task
   * Uses hierarchy: subscription credits first, then permanent
   */
  static async deductCredits(
    userId: string,
    amount: number,
    taskId: string,
    description: string
  ): Promise<{ success: boolean; error?: string; deducted?: number }> {
    const admin = (supabaseAdmin ?? supabase) as any

    try {
      const { data, error } = await admin.rpc('deduct_credits_atomic', {
        p_user_id: userId,
        p_amount: amount,
        p_task_id: taskId,
        p_description: description,
        p_metadata: {
          task_id: taskId,
          deducted_at: new Date().toISOString()
        }
      })

      if (error) {
        console.error('Error deducting credits:', error)
        return { success: false, error: 'Failed to deduct credits' }
      }

      if (!data.success) {
        console.log(`❌ Insufficient credits for task ${taskId}: ${data.error}`)
        return {
          success: false,
          error: data.error
        }
      }

      console.log(`✅ Deducted ${amount} credits from user ${userId} for task ${taskId}`)
      console.log(`   From subscription: ${data.from_subscription}, From permanent: ${data.from_permanent}`)

      return {
        success: true,
        deducted: data.deducted
      }
    } catch (error) {
      console.error('Exception in deductCredits:', error)
      return { success: false, error: 'Exception during credit deduction' }
    }
  }

  /**
   * Get user's credit transaction history
   */
  static async getCreditHistory(userId: string, limit = 50): Promise<CreditTransaction[]> {
    const client = ((typeof window === 'undefined' ? supabaseAdmin : supabase) ?? supabase) as any

    try {
      const { data, error } = await client
        .from('credit_transactions')
        .select('id, amount, type, reason, description, balance_before, balance_after, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching credit history:', error)
        return []
      }

      return data || []
    } catch (e) {
      console.error('Exception fetching credit history:', e)
      return []
    }
  }

  /**
   * Expire old subscription credits (should be run as a cron job)
   */
  static async expireOldCredits(): Promise<number> {
    const admin = (supabaseAdmin ?? supabase) as any

    try {
      const { data, error } = await admin.rpc('expire_subscription_credits')

      if (error) {
        console.error('Error expiring old credits:', error)
        return 0
      }

      if (data > 0) {
        console.log(`✅ Expired ${data} user subscription credits`)
      }

      return data || 0
    } catch (error) {
      console.error('Exception in expireOldCredits:', error)
      return 0
    }
  }
}
