import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Anon client for resetPasswordForEmail (user-facing operation)
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sharpii.ai'

    // Check if user exists in public.users
    const { data: appUser } = await adminClient
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    // Always return success to avoid leaking whether an email exists
    if (!appUser) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
    }

    // Find the user in Supabase Auth by email.
    // Note: public.users.id != auth.users.id (DB auto-generates separate UUIDs),
    // so we must use listUsers + email filter — not getUserById.
    const { data: authList } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    const authUser = authList?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === normalizedEmail
    )

    if (authUser) {
      // User exists in Supabase Auth.
      // resetPasswordForEmail fails for unconfirmed users — confirm the email first.
      // Requesting a password reset proves intent to access the account, so this is safe.
      if (!authUser.email_confirmed_at) {
        await adminClient.auth.admin.updateUserById(authUser.id, { email_confirm: true })
      }
    } else {
      // User is not in Supabase Auth (legacy bcrypt-only account) — lazy-migrate.
      const tempPassword = crypto.randomBytes(32).toString('hex')
      const { error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: appUser.email.split('@')[0] },
      })
      if (createError) {
        console.error('forgot-password: failed to lazy-migrate user to auth:', createError)
        return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
      }
    }

    // Send the reset email via Supabase (uses Maileroo SMTP configured in dashboard)
    const { error } = await anonClient.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${siteUrl}/app/reset-password`,
    })

    if (error) {
      console.error('forgot-password: Supabase resetPasswordForEmail error:', error)
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
    }

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (error) {
    console.error('forgot-password error:', error)
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
  }
}
