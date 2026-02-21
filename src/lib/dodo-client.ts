import DodoPayments from 'dodopayments'
import { DODO_PAYMENTS_CONFIG } from './dodo-payments-config'

// Centralized DodoPayments client with correct base URL configuration
export const dodoClient = new DodoPayments({
  bearerToken: DODO_PAYMENTS_CONFIG.apiKey,
  baseURL: DODO_PAYMENTS_CONFIG.environment === 'live_mode' 
    ? 'https://live.dodopayments.com' 
    : 'https://test.dodopayments.com'
})

export default dodoClient