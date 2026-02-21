/**
 * Payment Utils - DB-based checkout session correlation
 *
 * Replaces in-memory Maps and the JSON file (payment-mapping.json) with the
 * `checkout_sessions` Supabase table so it works correctly in serverless
 * deployments (Vercel / Netlify) where the filesystem is ephemeral and
 * instances don't share memory.
 */

import { supabaseAdmin } from './supabase'

const admin = supabaseAdmin as any

interface MappingData {
  userId: string
  plan: string
  billingPeriod: string
  userEmail: string
  paymentId?: string
  userName?: string
}

export const PaymentUtils = {
  /**
   * Persist checkout session → user correlation in the database.
   * Called right after the Dodo checkout session is created.
   */
  storeMapping: async (sessionId: string, data: MappingData): Promise<void> => {
    if (!admin) {
      console.warn('[PaymentUtils] Admin client unavailable – skipping storeMapping')
      return
    }

    try {
      await admin.from('checkout_sessions').upsert(
        {
          subscription_id: sessionId,
          user_id: data.userId,
          user_email: data.userEmail,
          plan: data.plan,
          billing_period: data.billingPeriod,
          amount: 0, // amount is stored separately; 0 is fine here
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'subscription_id' }
      )

      // Also upsert by paymentId as a secondary key if provided
      if (data.paymentId) {
        await admin.from('checkout_sessions').upsert(
          {
            subscription_id: data.paymentId,
            user_id: data.userId,
            user_email: data.userEmail,
            plan: data.plan,
            billing_period: data.billingPeriod,
            amount: 0,
            status: 'pending',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'subscription_id' }
        )
      }

      console.log(`[PaymentUtils] Stored checkout mapping for session ${sessionId} → user ${data.userId}`)
    } catch (e) {
      console.error('[PaymentUtils] Failed to store checkout mapping:', e)
    }
  },

  /**
   * Retrieve user mapping by session/subscription/payment ID from the database.
   */
  getMapping: async (id: string): Promise<MappingData | null> => {
    if (!admin) return null

    try {
      const { data, error } = await admin
        .from('checkout_sessions')
        .select('user_id, user_email, plan, billing_period')
        .eq('subscription_id', id)
        .maybeSingle()

      if (error || !data) return null

      return {
        userId: data.user_id,
        userEmail: data.user_email,
        plan: data.plan,
        billingPeriod: data.billing_period,
      }
    } catch (e) {
      console.error('[PaymentUtils] Failed to get checkout mapping:', e)
      return null
    }
  },

  /**
   * Mark a checkout session as completed.
   */
  markCompleted: async (sessionId: string): Promise<void> => {
    if (!admin) return
    try {
      await admin
        .from('checkout_sessions')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('subscription_id', sessionId)
    } catch (e) {
      console.error('[PaymentUtils] Failed to mark checkout completed:', e)
    }
  },
}
