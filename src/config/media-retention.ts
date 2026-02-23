/**
 * Central configuration for Bunny CDN media retention.
 * Change durations here — no other code changes needed.
 */

export type RetentionPolicy =
  | { type: 'days'; days: number }
  | { type: 'permanent' }

export const MEDIA_RETENTION = {
  /** Input images uploaded by the user — short-lived (only needed for AI processing) */
  inputs: {
    type: 'days',
    days: 1,
  } satisfies RetentionPolicy,

  /** Output media produced by AI (images / videos) — kept for user access */
  outputs: {
    type: 'days',
    days: 31,
  } satisfies RetentionPolicy,
} as const

/**
 * Returns the ISO date string (YYYY-MM-DD) of the folder that should be
 * deleted today given a retention policy.
 * Returns null if the policy is 'permanent'.
 */
export function getExpiryDate(policy: RetentionPolicy): string | null {
  if (policy.type === 'permanent') return null
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - policy.days)
  return d.toISOString().split('T')[0]
}
