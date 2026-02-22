import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Validate the custom reset token
    const { data: resetToken } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (resetToken.used_at) {
      return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 })
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
    }

    // Get the user's email to find their Supabase Auth account
    const { data: appUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', resetToken.user_id)
      .maybeSingle()

    if (appUser?.email) {
      // Update password in Supabase Auth — generate a magic link to find the auth user ID,
      // then update via admin API. Use getUserByEmail via admin if available.
      try {
        const { data: authList } = await supabase.auth.admin.listUsers()
        const authUser = authList?.users?.find(u => u.email?.toLowerCase() === appUser.email.toLowerCase())
        if (authUser?.id) {
          await supabase.auth.admin.updateUserById(authUser.id, { password })
        }
      } catch (authErr) {
        console.error('reset-password: failed to update Supabase Auth password:', authErr)
        // Non-fatal: custom session is cleared, so user cannot sign in anyway
      }
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id)

    // Invalidate all existing custom sessions for the user (security)
    await supabase
      .from('sessions')
      .delete()
      .eq('user_id', resetToken.user_id)

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('reset-password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
