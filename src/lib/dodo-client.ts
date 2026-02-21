import DodoPayments from 'dodopayments'
import { DODO_PAYMENTS_CONFIG } from './dodo-payments-config'

// Centralized DodoPayments client with correct base URL configuration
export const dodoClient = new DodoPayments({
  bearerToken: DODO_PAYMENTS_CONFIG.apiKey,
  environment: DODO_PAYMENTS_CONFIG.environment,
})

export default dodoClient