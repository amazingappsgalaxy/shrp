import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase'
import { PRICING_PLANS } from './pricing-config'

// Credit management functions - Simplified version for Supabase migration
export class CreditManager {
  /**
   * Get user's current credit balance
   */
  static async getUserCreditBalance(userId: string): Promise<number> {
    try {
      const db = getDb()
      const nowIso = new Date().toISOString()
      const { data, error } = await db
        .from('credits')
        .select('amount, expires_at, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      
      if (error) {
        console.error('Error getting user credit balance:', error)
        return 0
      }
      
      const totalCredits = data?.reduce((sum: number, credit: { amount: number }) => sum + credit.amount, 0) || 0
      return totalCredits
    } catch (error) {
      console.error('Error getting user credit balance:', error)
      return 0
    }
  }

  /**
   * Grant credits to user account (for purchases or admin grants)
   */
  static async grantCredits({
    userId,
    amount,
    type = 'purchase',
    source = 'credit_purchase',
    description,
    transactionId,
    expiresAt,
    metadata
  }: {
    userId: string
    amount: number
    type?: 'purchase' | 'bonus' | 'admin_grant'
    source?: 'credit_purchase' | 'admin_grant' | 'bonus' | 'subscription_renewal'
    description?: string
    transactionId?: string
    expiresAt?: number | null
    metadata?: any
  }) {
    try {
      const db = getDb()
      const expiresAtIso = expiresAt
        ? new Date(expiresAt).toISOString()
        : '9999-12-31T23:59:59.999Z'

      // Merge description and metadata into a JSON string
      let metaObj: any = {}
      if (metadata != null) {
        if (typeof metadata === 'string') {
          // Preserve raw string inside an object
          metaObj.raw = metadata
        } else if (typeof metadata === 'object') {
          metaObj = { ...metadata }
        }
      }
      if (description) metaObj.description = description
      const safeMetadataWithDesc: string | null = Object.keys(metaObj).length > 0 ? JSON.stringify(metaObj) : null

      const creditData = {
        user_id: userId,
        amount,
        type,
        source,
        transaction_id: transactionId,
        expires_at: expiresAtIso,
        metadata: safeMetadataWithDesc,
        is_active: true,
        created_at: new Date().toISOString()
      }

      const { data, error } = await db
        .from('credits')
        .insert(creditData)
        .select('id')
        .single()

      if (error) {
        console.error('Error granting credits:', error)
        throw error
      }

      const newBalance = await this.getUserCreditBalance(userId)

      return {
        success: true,
        newBalance,
        creditId: data?.id || null,
        transactionId: transactionId || null
      }
    } catch (error) {
      console.error('Error granting credits:', error)
      throw error
    }
  }

  /**
   * Deduct credits from user account
   */
  static async deductCredits({
    userId,
    amount,
    reason = 'image_enhancement',
    description,
    enhancementTaskId,
    metadata
  }: {
    userId: string
    amount: number
    reason?: 'image_enhancement' | 'api_usage' | 'admin_deduction'
    description?: string
    enhancementTaskId?: string
    metadata?: any
  }) {
    try {
      const db = getDb()
      const currentBalance = await this.getUserCreditBalance(userId)
      if (currentBalance < amount) {
        throw new Error('Insufficient credits')
      }

      // Merge description, enhancementTaskId and metadata into JSON
      let metaObj: any = {}
      if (metadata != null) {
        if (typeof metadata === 'string') {
          metaObj.raw = metadata
        } else if (typeof metadata === 'object') {
          metaObj = { ...metadata }
        }
      }
      if (description) metaObj.description = description
      if (enhancementTaskId) metaObj.enhancement_task_id = enhancementTaskId
      const safeMetadataWithDesc: string | null = Object.keys(metaObj).length > 0 ? JSON.stringify(metaObj) : null

      const deductionData = {
        user_id: userId,
        amount: -amount,
        type: 'deduction',
        source: reason,
        metadata: safeMetadataWithDesc,
        expires_at: '9999-12-31T23:59:59.999Z',
        is_active: true,
        created_at: new Date().toISOString()
      }

      const { data, error } = await db
        .from('credits')
        .insert(deductionData)
        .select('id')
        .single()

      if (error) {
        console.error('Error deducting credits:', error)
        throw error
      }

      return {
        success: true,
        remainingBalance: currentBalance - amount,
        transactionId: data?.id || null
      }
    } catch (error) {
      console.error('Error deducting credits:', error)
      throw error
    }
  }

  /**
   * Get credit history for a user
   */
  static async getCreditHistory(userId: string, limit = 50) {
    try {
      const db = getDb()
      const { data, error } = await db
        .from('credits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error getting credit history:', error)
        return []
      }
      
      const mapped = (data || []).map((row: any) => {
        let meta: any = null
        if (row.metadata) {
          try { meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata } catch {}
        }
        return {
          id: row.id,
          amount: row.amount,
          type: row.type,
          reason: row.source,
          description: meta?.description ?? null,
          createdAt: row.created_at
        }
      })
      
      return mapped
    } catch (error) {
      console.error('Error getting credit history:', error)
      return []
    }
  }

  /**
   * Get active credits for a user
   */
  static async getActiveCredits(userId: string) {
    try {
      const db = getDb()
      const nowIso = new Date().toISOString()
      const { data, error } = await db
        .from('credits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      
      if (error) {
        console.error('Error getting active credits:', error)
        return []
      }
      
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        amount: row.amount,
        type: row.type,
        source: row.source,
        // Normalize to a number (ms since epoch) so arithmetic works downstream
        expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : Number.MAX_SAFE_INTEGER
      }))
      
      return mapped
    } catch (error) {
      console.error('Error getting active credits:', error)
      return []
    }
  }

  /**
   * Grant subscription credits (monthly expiry)
   */
  static async grantSubscriptionCredits({
    userId,
    amount,
    plan,
    subscriptionId,
    transactionId,
    monthsToExpire = 1
  }: {
    userId: string
    amount: number
    plan: string
    subscriptionId?: string
    transactionId?: string
    monthsToExpire?: number
  }) {
    // Set expiry date to end of month
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + monthsToExpire)
    expiresAt.setDate(expiresAt.getDate() - 1) // End of month
    expiresAt.setHours(23, 59, 59, 999)

    const metadata = {
      plan,
      subscription_id: subscriptionId,
      type: 'subscription_credits',
      expires_monthly: true
    }

    return this.grantCredits({
      userId,
      amount,
      type: 'purchase',
      source: 'subscription_renewal',
      description: `${plan} Plan monthly credits`,
      transactionId,
      expiresAt: expiresAt.getTime(),
      metadata
    })
  }

  /**
   * Grant permanent credits (no expiry)
   */
  static async grantPermanentCredits({
    userId,
    amount,
    packageType,
    transactionId,
    description
  }: {
    userId: string
    amount: number
    packageType?: string
    transactionId?: string
    description?: string
  }) {
    const metadata = {
      package_type: packageType,
      type: 'permanent_credits',
      expires_monthly: false
    }

    return this.grantCredits({
      userId,
      amount,
      type: 'purchase',
      source: 'credit_purchase',
      description: description || `Permanent credits purchase`,
      transactionId,
      expiresAt: null, // No expiry - will be set to max date
      metadata
    })
  }

  // Simplified placeholder methods for compatibility
  static async addCredits(params: any) {
    return this.grantCredits(params)
  }

  static async grantMonthlyCredits(params: any) {
    return this.grantSubscriptionCredits(params)
  }

  static async expireOldCredits() {
    return { success: true }
  }

  static async processMonthlyRenewals() {
    return { success: true }
  }

  static async createMonthlyPayment(params: any) {
    return { success: true }
  }

  static getMonthlyPrice(plan: string, billingPeriod: string): number {
    const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === plan.toLowerCase())
    return planConfig?.price.monthly || 0
  }

  static async getExpiringCredits(userId: string, daysAhead = 7) {
    try {
      const db = getDb()
      const now = new Date()
      const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
      const { data, error } = await db
        .from('credits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .not('expires_at', 'is', null)
        .gte('expires_at', now.toISOString())
        .lte('expires_at', future.toISOString())

      if (error) {
        console.error('Error getting expiring credits:', error)
        return []
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        amount: row.amount,
        expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null
      }))
    } catch (error) {
      console.error('Error getting expiring credits:', error)
      return []
    }
  }
}

export const creditUtils = {
  calculateEnhancementCost(imageSize: number, enhancementType: string): number {
    // Base cost calculation
    const baseCost = 1
    const sizeFactor = Math.max(1, Math.floor(imageSize / (1024 * 1024))) // Per MB
    return baseCost * sizeFactor
  },

  formatCredits(credits: number): string {
    return credits.toLocaleString()
  },

  getExpirationStatus(expiresAt: number): {
    isExpired: boolean
    isExpiringSoon: boolean
    daysUntilExpiration: number
  } {
    const now = Date.now()
    const expiration = new Date(expiresAt).getTime()
    const daysUntilExpiration = Math.ceil((expiration - now) / (1000 * 60 * 60 * 24))
    
    return {
      isExpired: expiration < now,
      isExpiringSoon: daysUntilExpiration <= 7 && daysUntilExpiration > 0,
      daysUntilExpiration
    }
  }
}


// Prefer admin client on the server; fall back to anon only if configured
function getDb() {
  if (supabaseAdmin) return supabaseAdmin
  if (isSupabaseConfigured) return supabase
  throw new Error('Supabase not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local')
}