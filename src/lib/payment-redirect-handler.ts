export class PaymentRedirectHandler {
  private static STORAGE_KEY = 'payment_redirect_info'
  
  /**
   * Store payment information for redirect handling
   */
  static storePaymentInfo(paymentData: {
    paymentId: string
    successUrl: string
    cancelUrl: string
    userId: string
    plan: string
    billingPeriod: string
  }) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        ...paymentData,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to store payment info:', error)
    }
  }
  
  /**
   * Get stored payment information
   */
  static getPaymentInfo() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null
      
      const data = JSON.parse(stored)
      
      // Clean up old data (older than 1 hour)
      if (Date.now() - data.timestamp > 60 * 60 * 1000) {
        this.clearPaymentInfo()
        return null
      }
      
      return data
    } catch (error) {
      console.error('Failed to get payment info:', error)
      return null
    }
  }
  
  /**
   * Clear stored payment information
   */
  static clearPaymentInfo() {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear payment info:', error)
    }
  }
  
  /**
   * Check if current URL indicates a return from payment
   */
  static isReturnFromPayment(url: string): boolean {
    const urlObj = new URL(url)
    return (
      urlObj.pathname.includes('payment') ||
      urlObj.searchParams.has('payment_id') ||
      urlObj.searchParams.has('session_id') ||
      urlObj.searchParams.has('status') ||
      urlObj.searchParams.has('payment')
    )
  }
  
  /**
   * Handle post-payment redirect logic
   */
  static async handlePostPaymentRedirect(currentUrl: string): Promise<string | null> {
    const urlObj = new URL(currentUrl)
    const paymentId = urlObj.searchParams.get('payment_id')
    const sessionId = urlObj.searchParams.get('session_id')
    const status = urlObj.searchParams.get('status')
    
    // If we have clear payment success indicators
    if (status === 'succeeded' || status === 'completed') {
      this.clearPaymentInfo()
      return '/app/dashboard?payment=success'
    }
    
    // If we have clear failure indicators
    if (status === 'failed' || status === 'cancelled') {
      this.clearPaymentInfo()
      return '/?payment=failed#pricing-section'
    }
    
    // If we have a payment ID, use our status checker
    if (paymentId || sessionId) {
      return `/payment-status?payment_id=${paymentId || sessionId}`
    }
    
    // Check stored payment info
    const storedInfo = this.getPaymentInfo()
    if (storedInfo) {
      return `/payment-status?payment_id=${storedInfo.paymentId}`
    }
    
    return null
  }
  
  /**
   * Enhanced URL detection for Dodo redirect patterns
   */
  static detectDodoRedirect(url: string): {
    isDodoRedirect: boolean
    paymentId?: string
    status?: string
    redirectUrl?: string
  } {
    const urlObj = new URL(url)
    
    // Check for Dodo-specific patterns
    const dodoPatterns = [
      /checkout\.dodopayments\.com/,
      /test\.checkout\.dodopayments\.com/,
      /status\/[a-zA-Z0-9]+$/
    ]
    
    const isDodoRedirect = dodoPatterns.some(pattern => pattern.test(url))
    
    if (isDodoRedirect) {
      // Extract payment information from Dodo URLs
      const statusMatch = url.match(/status\/([a-zA-Z0-9]+)$/)
      // Coerce URLSearchParams values (string | null) to optional strings
      const paymentId = urlObj.searchParams.get('payment_id') || statusMatch?.[1] || undefined
      const status = urlObj.searchParams.get('status') || undefined
      
      return {
        isDodoRedirect: true,
        paymentId,
        status,
        redirectUrl: `/payment-status?source=dodo${paymentId ? `&payment_id=${paymentId}` : ''}${status ? `&status=${status}` : ''}`
      }
    }
    return { isDodoRedirect: false }
  }
}