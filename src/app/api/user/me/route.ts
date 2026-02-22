import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { UnifiedCreditsService } from '@/lib/unified-credits'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({
        user: null,
        credits: null,
        subscription: null,
        profile: null,
      })
    }

    const session = await getSession(sessionToken)
    if (!session?.user) {
      // Clear invalid cookie
      const res = NextResponse.json({
        user: null,
        credits: null,
        subscription: null,
        profile: null,
      })
      res.cookies.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      })
      return res
    }

    const user = {
      id: (session.user as any).id,
      email: (session.user as any).email,
      name:
        (session.user as any).name ??
        (session.user as any).full_name ??
        ((session.user as any).email?.split?.('@')?.[0] ?? 'User'),
    }

    // Fetch credits, subscription, and profile in parallel
    const [creditsResult, subscriptionResult, profileResult] =
      await Promise.allSettled([
        UnifiedCreditsService.getUserCredits(user.id),
        (supabase as any)
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', [
            'active',
            'pending',
            'pending_cancellation',
            'trialing',
          ])
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        (supabase as any)
          .from('users')
          .select('id, name, email, created_at, password_hash, is_email_verified')
          .eq('id', user.id)
          .single(),
      ])

    // Process credits
    const credits =
      creditsResult.status === 'fulfilled'
        ? creditsResult.value
        : { total: 0, subscription_credits: 0, permanent_credits: 0, subscription_expire_at: null }

    // Process subscription (including auto-cancel expired pending_cancellation)
    let subscriptionData: {
      has_active_subscription: boolean
      current_plan: string
      subscription: any
    } = {
      has_active_subscription: false,
      current_plan: 'free',
      subscription: null,
    }

    if (subscriptionResult.status === 'fulfilled') {
      const { data: sub, error: subError } = subscriptionResult.value as any
      if (sub && !subError) {
        // Auto-cancel expired pending_cancellation
        const now = Date.now()
        const nextBilling = sub.next_billing_date
          ? new Date(sub.next_billing_date).getTime()
          : null
        const isExpiredCancellation =
          sub.status === 'pending_cancellation' &&
          !!nextBilling &&
          nextBilling <= now

        if (isExpiredCancellation) {
          // Fire and forget — update to cancelled
          (supabase as any)
            .from('subscriptions')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id)
            .then(() => {})
            .catch(() => {})
        } else {
          subscriptionData = {
            has_active_subscription: true,
            current_plan: sub.plan,
            subscription: sub,
          }
        }
      }
    }

    // Process profile
    let profile: any = null
    if (profileResult.status === 'fulfilled') {
      const { data: profileRow } = profileResult.value as any
      if (profileRow) {
        profile = {
          id: profileRow.id,
          name: profileRow.name,
          email: profileRow.email,
          createdAt: profileRow.created_at,
          hasPassword: !!profileRow.password_hash,
          emailVerified: !!profileRow.is_email_verified,
        }
      }
    }

    return NextResponse.json({
      user,
      credits,
      subscription: subscriptionData,
      profile,
    })
  } catch (error) {
    console.error('[/api/user/me] Error:', error)
    return NextResponse.json(
      {
        user: null,
        credits: null,
        subscription: null,
        profile: null,
      },
      { status: 500 }
    )
  }
}
