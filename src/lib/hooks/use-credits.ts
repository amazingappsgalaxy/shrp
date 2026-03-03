'use client'

import { useAppData, APP_DATA_KEY } from './use-app-data'

export { APP_DATA_KEY }

/**
 * useCredits — thin wrapper around useAppData() for credit-specific access.
 *
 * Returns the credit balance from the shared SWR cache (/api/user/me).
 * All pages that need to display or check credits should use this hook
 * instead of fetching /api/credits/balance independently.
 *
 * Credits are automatically refreshed by TaskManagerProvider whenever a
 * watched task completes.
 */
export function useCredits() {
  const { credits, isLoading, mutate } = useAppData()

  return {
    /** Full credit balance breakdown — null while loading */
    balance: credits,
    /** Total usable credits (subscription + permanent, expired excluded) */
    total: credits?.total ?? 0,
    isLoading,
    /** Force a re-fetch of the credit balance */
    refresh: mutate,
  }
}
