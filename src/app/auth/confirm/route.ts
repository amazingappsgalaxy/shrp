import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { findUserByEmail, createSession } from '@/lib/supabase-server'
import { generateSessionToken } from '@/lib/auth-simple'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = url.searchParams.get('next') ?? '/app/dashboard'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${siteUrl}/app/signin?error=invalid_link`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

  if (error || !data.session) {
    console.error('[auth/confirm] verifyOtp error:', error?.message)
    return NextResponse.redirect(`${siteUrl}/app/signin?error=invalid_link`)
  }

  const authUser = data.session.user
  const email = authUser?.email

  if (email) {
    // Bridge: create our custom session cookie so middleware and API routes work
    const appUser = await findUserByEmail(email).catch(() => null)
    if (appUser) {
      const sessionToken = generateSessionToken()
      await createSession({
        userId: appUser.id,
        token: sessionToken,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        ipAddress: '0.0.0.0',
      })
      const cookieStore = await cookies()
      cookieStore.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }
  }

  return NextResponse.redirect(`${siteUrl}${next}`)
}
