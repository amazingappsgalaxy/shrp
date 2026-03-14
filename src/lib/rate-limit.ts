import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { config } from './config'

// Per-user rate limits for AI generation routes
const RATE_LIMITS = {
  perMinute: 5,   // max 5 tasks per 60 seconds
  perHour: 30,    // max 30 tasks per hour
}

/**
 * Check if a user has exceeded rate limits for AI generation.
 * Uses history_items table — no new DB tables needed.
 * Returns a 429 NextResponse if rate limited, otherwise null.
 */
export async function checkAIRateLimit(userId: string): Promise<NextResponse | null> {
  try {
    const supabase = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey)

    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60_000).toISOString()
    const oneHourAgo = new Date(now.getTime() - 3_600_000).toISOString()

    // Check per-minute limit
    const { count: minuteCount } = await supabase
      .from('history_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneMinuteAgo)

    if ((minuteCount ?? 0) >= RATE_LIMITS.perMinute) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before generating again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Check per-hour limit
    const { count: hourCount } = await supabase
      .from('history_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo)

    if ((hourCount ?? 0) >= RATE_LIMITS.perHour) {
      return NextResponse.json(
        { error: 'Hourly generation limit reached. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      )
    }

    return null
  } catch {
    // If rate limit check fails, allow the request (don't block users due to infra issues)
    return null
  }
}
