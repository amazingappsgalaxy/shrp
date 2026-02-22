import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { findUserByEmail, createUser, createSession } from '@/lib/supabase-server'
import { generateSessionToken, verifyPassword } from '@/lib/auth-simple'
import { supabaseAdmin } from '@/lib/supabase'

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
      // Sync email verification status if Supabase Auth says email is confirmed
      if (userId && supabaseUser.email_confirmed_at) {
        ;(supabaseAdmin as any)
          .from('users')
          .update({ is_email_verified: true, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .then(() => {}).catch(() => {})
      }
    } else {
      // Supabase Auth failed — fallback to legacy bcrypt for existing users
      appUser = await findUserByEmail(normalizedEmail)
      const hash = appUser?.password_hash
      // Only attempt bcrypt if we have a real bcrypt hash (starts with $2b$ or $2a$)
      if (!appUser || !hash || !hash.startsWith('$2')) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      const validPassword = await verifyPassword(password, hash)
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      userId = appUser.id
      // Legacy user proved ownership via password — mark email as verified
      ;(supabaseAdmin as any)
        .from('users')
        .update({ is_email_verified: true, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .then(() => {}).catch(() => {})
      // Lazily migrate this user into Supabase Auth so future logins use it
      try {
        await getAdminClient().auth.admin.createUser({
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

    // Bridge: create custom session so middleware + all existing API routes work unchanged
    const sessionToken = generateSessionToken()
    const rawIp = request.headers.get('x-forwarded-for') || '127.0.0.1'
    await createSession({
      userId,
      token: sessionToken,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      ipAddress: rawIp.split(',')[0]?.trim() || '127.0.0.1',
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