import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { findUserByEmail, createUser, createSession } from '@/lib/supabase-server'
import { generateSessionToken } from '@/lib/auth-simple'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseAdmin(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Use admin API to create user with email pre-confirmed (no confirmation email needed,
    // matching the old custom auth behaviour where users could sign in immediately)
    const adminClient = getAdminClient()
    const { data: { user }, error } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false, // sends verification email via Supabase/Maileroo SMTP
      user_metadata: { full_name: name.trim() },
    })

    if (error || !user) {
      const msg = error?.message || 'Signup failed'
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Find or create user in public.users
    let appUser = await findUserByEmail(normalizedEmail)
    let userId = appUser?.id

    if (!appUser) {
      userId = await createUser({
        email: normalizedEmail,
        name: name.trim(),
        passwordHash: 'supabase-auth-managed',
      })
    }

    if (!userId) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    // Bridge: create custom session so middleware + all existing API routes work unchanged
    const sessionToken = generateSessionToken()
    await createSession({
      userId,
      token: sessionToken,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
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
        name: name.trim(),
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    const message = error instanceof Error ? error.message : 'Signup failed'
    if (message.includes('already exists')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}