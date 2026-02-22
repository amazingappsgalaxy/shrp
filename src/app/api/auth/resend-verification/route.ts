import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { createClient } from '@supabase/supabase-js'

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const session = await getSession(token)
    if (!session?.user?.email) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const email = (session.user as { email: string }).email

    const { error } = await anonClient.auth.resend({ type: 'signup', email })
    if (error) {
      console.error('resend-verification error:', error)
      return NextResponse.json({ error: 'Failed to resend verification email' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Verification email sent.' })
  } catch (err) {
    console.error('resend-verification error:', err)
    return NextResponse.json({ error: 'Failed to resend verification email' }, { status: 500 })
  }
}
