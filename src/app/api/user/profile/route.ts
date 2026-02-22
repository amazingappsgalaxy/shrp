import { NextRequest, NextResponse } from 'next/server'
import { getSession, hashPassword, verifyPassword } from '@/lib/auth-simple'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

const admin = supabaseAdmin as any

function getAuthAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const session = await getSession(token)
    if (!session?.user?.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const { data: user, error } = await admin
      .from('users')
      .select('id, name, email, created_at, password_hash')
      .eq('id', session.user.id)
      .single()

    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
      hasPassword: !!user.password_hash,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const session = await getSession(token)
    if (!session?.user?.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const body = await request.json()
    const { name, currentPassword, newPassword } = body

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    // Update name
    if (name !== undefined) {
      const trimmed = String(name).trim()
      if (!trimmed) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      if (trimmed.length > 100) return NextResponse.json({ error: 'Name too long' }, { status: 400 })
      updates.name = trimmed
    }

    // Update password
    if (newPassword !== undefined) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }

      // Fetch current user record
      const { data: user } = await admin
        .from('users')
        .select('email, password_hash')
        .eq('id', session.user.id)
        .single()

      const hash = user?.password_hash as string | undefined

      if (hash && hash.startsWith('$2')) {
        // Legacy bcrypt user — verify against stored hash
        if (!currentPassword) {
          return NextResponse.json({ error: 'Current password required to set a new password' }, { status: 400 })
        }
        const valid = await verifyPassword(currentPassword, hash)
        if (!valid) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }
      } else if (hash === 'supabase-auth-managed' || hash === 'google-oauth-managed') {
        // Supabase Auth user — verify current password via Supabase Auth signInWithPassword
        if (!currentPassword) {
          return NextResponse.json({ error: 'Current password required to set a new password' }, { status: 400 })
        }
        // Use an in-memory anon client (no cookie side-effects) just for credential check
        const verifyClient = createSupabaseAdmin(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
        const { error: signInError } = await verifyClient.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        })
        if (signInError) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }
        // Also update password in Supabase Auth (public.users.id === auth.users.id)
        const authAdmin = getAuthAdminClient()
        await authAdmin.auth.admin.updateUserById(session.user.id, { password: newPassword })
      }
      // If no hash at all (e.g. OAuth user with no password yet), allow setting without current password

      updates.password_hash = await hashPassword(newPassword)
    }

    if (Object.keys(updates).length === 1) {
      // Only updated_at — nothing to update
      return NextResponse.json({ success: true, message: 'No changes made' })
    }

    const { error } = await admin
      .from('users')
      .update(updates)
      .eq('id', session.user.id)

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
