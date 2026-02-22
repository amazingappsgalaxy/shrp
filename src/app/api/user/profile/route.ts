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
      hasPassword: !!user.password_hash && user.password_hash !== 'google-oauth-managed' && user.password_hash !== 'managed_by_supabase_auth',
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
        // Bcrypt user — verify current password
        if (!currentPassword) {
          return NextResponse.json({ error: 'Current password required to change password' }, { status: 400 })
        }
        const valid = await verifyPassword(currentPassword, hash)
        if (!valid) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }
      } else if (hash === 'supabase-auth-managed') {
        // Supabase Auth managed — verify current password via signInWithPassword
        if (!currentPassword) {
          return NextResponse.json({ error: 'Current password required to change password' }, { status: 400 })
        }
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
        // Update password in Supabase Auth too
        const authAdmin = getAuthAdminClient()
        const { data: authList } = await authAdmin.auth.admin.listUsers({ perPage: 1000 })
        const authUser = authList?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === user.email.toLowerCase())
        if (authUser) await authAdmin.auth.admin.updateUserById(authUser.id, { password: newPassword })
      } else {
        // Google OAuth account, trigger-created account, or no password yet — allow setting without current password.
        // Add/update password capability in Supabase Auth so email+password login works after this.
        const authAdmin = getAuthAdminClient()
        const { data: authList } = await authAdmin.auth.admin.listUsers({ perPage: 1000 })
        const authUser = authList?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === user.email.toLowerCase())
        if (authUser) {
          await authAdmin.auth.admin.updateUserById(authUser.id, { password: newPassword, email_confirm: true })
        }
      }

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
