import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { findUserByEmail, createUser, createSession } from '@/lib/supabase-server'
import { generateSessionToken, verifyPassword } from '@/lib/auth-simple'

// Brute-force limits: 10 failed attempts per email or IP in 15 minutes
const MAX_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const rawIp = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const clientIp = rawIp.split(',')[0]?.trim() || '127.0.0.1'

    // Brute-force check
    const adminClient = getAdminClient()
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

    const [{ count: emailCount }, { count: ipCount }] = await Promise.all([
      adminClient
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', normalizedEmail)
        .gte('attempted_at', windowStart),
      adminClient
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', clientIp)
        .gte('attempted_at', windowStart),
    ])

    if ((emailCount ?? 0) >= MAX_ATTEMPTS || (ipCount ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please wait 15 minutes and try again.' },
        { status: 429 }
      )
    }
    // Helper: record a failed attempt and return 401
    const recordFailure = async (msg: string) => {
      await adminClient.from('login_attempts').insert({ email: normalizedEmail, ip_address: clientIp })
      return NextResponse.json({ error: msg }, { status: 401 })
    }

    let userId: string | undefined
    let appUser: Awaited<ReturnType<typeof findUserByEmail>> = null

    // Try Supabase Auth first
    const supabase = await createClient()
    const { data: { user: supabaseUser }, error: supabaseError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (supabaseUser && !supabaseError) {
      // Supabase Auth succeeded — find or sync public.users record
      appUser = await findUserByEmail(normalizedEmail)
      userId = appUser?.id
      if (!appUser) {
        console.log(`[Signin] Creating public.users record for ${normalizedEmail}`)
        userId = await createUser({
          email: normalizedEmail,
          name: supabaseUser.user_metadata?.full_name || normalizedEmail.split('@')[0],
          passwordHash: 'supabase-auth-managed',
        })
      }
    } else if (supabaseError?.message?.toLowerCase().includes('not confirmed')) {
      // Correct password but email not yet confirmed in Supabase — allow sign-in anyway
      appUser = await findUserByEmail(normalizedEmail)
      userId = appUser?.id
      if (!userId) {
        return recordFailure('Invalid email or password')
      }
    } else {
      // Supabase Auth failed — fallback to legacy bcrypt for existing users
      appUser = await findUserByEmail(normalizedEmail)
      const hash = appUser?.passwordHash

      // Give a helpful error for Google-only accounts
      if (appUser && (hash === 'google-oauth-managed' || hash === 'managed_by_supabase_auth')) {
        return NextResponse.json(
          { error: 'This account was created with Google. Please sign in with Google.' },
          { status: 401 }
        )
      }

      // Only attempt bcrypt if we have a real bcrypt hash
      if (!appUser || !hash || !hash.startsWith('$2')) {
        return recordFailure('Invalid email or password')
      }
      const validPassword = await verifyPassword(password, hash)
      if (!validPassword) {
        return recordFailure('Invalid email or password')
      }
      userId = appUser.id
      // Lazily migrate this user into Supabase Auth so future logins use it
      try {
        await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name: appUser.name },
        })
        console.log(`[Signin] Migrated ${normalizedEmail} to Supabase Auth`)
      } catch {
        // Non-fatal — migration will succeed next time or on password reset
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Failed to resolve user account' }, { status: 500 })
    }

    // Clear failed attempts on successful login + clean old records
    await Promise.allSettled([
      adminClient.from('login_attempts').delete().eq('email', normalizedEmail),
      adminClient.rpc('cleanup_old_login_attempts'),
    ])

    // Bridge: create custom session so middleware + all existing API routes work unchanged
    const sessionToken = generateSessionToken()
    await createSession({
      userId,
      token: sessionToken,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      ipAddress: clientIp,
    })

    const cookieStore = await cookies()
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({
      user: {
        id: userId,
        email: normalizedEmail,
        name: appUser?.name || supabaseUser?.user_metadata?.full_name || normalizedEmail.split('@')[0],
      },
    })
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: 'Signin failed' }, { status: 500 })
  }
}