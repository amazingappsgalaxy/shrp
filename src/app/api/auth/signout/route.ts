import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { signOutUser } from '@/lib/auth-simple'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (token) {
      try {
        await signOutUser(token)
      } catch (e) {
        console.warn('Error deleting server session:', e)
      }
    }

    // Clear the session cookie in the response
    const res = NextResponse.json({ success: true })
    res.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
    return res
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json(
      { error: 'Signout failed' },
      { status: 500 }
    )
  }
}