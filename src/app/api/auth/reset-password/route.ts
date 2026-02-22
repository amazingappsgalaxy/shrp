import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'

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

    // Validate the token
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

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update the user's password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', resetToken.user_id)

    if (updateError) {
      console.error('reset-password: failed to update password:', updateError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id)

    // Invalidate all existing sessions for the user (security)
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
