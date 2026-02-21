import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { signInUser } from '@/lib/auth-simple'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('Signin attempt for:', email)

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Extract IP and user agent for session tracking
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    console.log('Signin context:', { ipAddress, userAgent: userAgent.substring(0, 50) })

    // Use real auth implementation to validate and create a session
    const { user, session } = await signInUser(email, password, ipAddress)

    // Set session cookie (must match what other routes expect)
    const cookieStore = await cookies()
    cookieStore.set('session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return NextResponse.json({ user, session })
  } catch (error) {
    console.error('Signin error:', error)
    const message = error instanceof Error ? error.message : 'Signin failed'
    const status = message === 'User not found' || message === 'Invalid password' ? 401 : 500
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}