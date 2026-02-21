import { CreditsService, CreditBalance } from './credits-service'

/**
 * Unified Credits Service
 * Single interface for all credit operations
 */
export class UnifiedCreditsService {
  /**
   * Get user's credit balance with breakdown
   */
  static async getUserCredits(userId: string): Promise<CreditBalance> {
    return await CreditsService.getUserCredits(userId)
  }

  /**
   * Get credit transaction history
   */
  static async getCreditHistory(userId: string, limit = 50) {
    return await CreditsService.getCreditHistory(userId, limit)
  }

  /**
   * Deduct credits for a task
   */
  static async deductCredits(
    userId: string,
    amount: number,
    taskId: string,
    description: string
  ) {
    return await CreditsService.deductCredits(userId, amount, taskId, description)
  }

  /**
   * Allocate subscription credits
   */
  static async allocateSubscriptionCredits(
    userId: string,
    plan: string,
    billingPeriod: 'monthly' | 'yearly',
    subscriptionId: string | null,
    paymentId: string
  ) {
    return await CreditsService.allocateSubscriptionCredits(
      userId,
      plan,
      billingPeriod,
      subscriptionId,
      paymentId
    )
  }

  /**
   * Allocate permanent credits (top-up)
   */
  static async allocatePermanentCredits(
    userId: string,
    amount: number,
    paymentId: string,
    description: string
  ) {
    return await CreditsService.allocatePermanentCredits(
      userId,
      amount,
      paymentId,
      description
    )
  }
}