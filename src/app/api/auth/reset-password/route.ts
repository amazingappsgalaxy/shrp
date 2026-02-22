import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/lib/auth-simple'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const { password, accessToken } = await request.json()

    if (!password || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Verify the access token and get the user
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    // Sync new bcrypt hash into public.users (keeps legacy fallback working)
    const newHash = await hashPassword(password)
    await adminClient
      .from('users')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    // Invalidate all existing custom sessions for security
    await adminClient
      .from('sessions')
      .delete()
      .eq('user_id', user.id)

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('reset-password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
