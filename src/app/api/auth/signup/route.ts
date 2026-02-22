import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { findUserByEmail, createSession } from '@/lib/supabase-server'
import { generateSessionToken } from '@/lib/auth-simple'
import { supabaseAdmin } from '@/lib/supabase'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
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
    const trimmedName = name.trim()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sharpii.ai'

    // Use the anon client's signUp — this is the ONLY Supabase method that reliably
    // sends the confirmation email via the configured SMTP (Mailroo).
    // admin.createUser does NOT send confirmation emails automatically.
    const anonClient = getAnonClient()
    const { data: authData, error: signUpError } = await anonClient.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: trimmedName, name: trimmedName },
        emailRedirectTo: `${siteUrl}/app/dashboard`,
      },
    })

    if (signUpError) {
      const msg = signUpError.message || 'Signup failed'
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
    }

    // Supabase returns a user with empty identities when the email is already registered
    if (authData.user.identities && authData.user.identities.length === 0) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 })
    }

    const authUserId = authData.user.id

    // The DB trigger has already created public.users with password_hash = 'managed_by_supabase_auth'.
    // Update it with the correct sentinel and name.
    ;(supabaseAdmin as any)
      .from('users')
      .update({
        password_hash: 'supabase-auth-managed',
        name: trimmedName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUserId)
      .then(() => {}).catch(() => {})

    // Find the public.users row to get the ID for the custom session.
    // The trigger fires synchronously so the row exists by now.
    let appUser = await findUserByEmail(normalizedEmail)

    // Fallback: if trigger hasn't propagated yet, wait briefly and retry once
    if (!appUser) {
      await new Promise(r => setTimeout(r, 300))
      appUser = await findUserByEmail(normalizedEmail)
    }

    if (!appUser) {
      // User was created in auth.users but trigger failed — still return success,
      // the account works via Supabase Auth even without a public.users row yet.
      console.error('signup: public.users row missing after auth.signUp for', normalizedEmail)
      return NextResponse.json({
        user: { id: authUserId, email: normalizedEmail, name: trimmedName },
        session: null,
      })
    }

    const userId = appUser.id

    // Create custom session so middleware and all existing API routes work immediately
    const sessionToken = generateSessionToken()
    let sessionCreated = false
    try {
      await createSession({
        userId,
        token: sessionToken,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      sessionCreated = true
    } catch (e) {
      console.warn('signup: failed to create custom session', e)
    }

    if (sessionCreated) {
      const cookieStore = await cookies()
      cookieStore.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: normalizedEmail,
        name: trimmedName,
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
