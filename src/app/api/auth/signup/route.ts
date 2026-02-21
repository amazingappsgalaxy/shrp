import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { signUpUser } from '@/lib/auth-simple'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    
    // Basic validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }
    
    // Use real signup implementation
    const { user, session } = await signUpUser(email, password, name)
    
    // Set session cookie to integrate with server routes (only if session was created)
    if (session && session.token) {
      const cookieStore = await cookies()
      cookieStore.set('session', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }
    
    return NextResponse.json({ user, session })
  } catch (error) {
    console.error('Signup error:', error)
    const message = error instanceof Error ? error.message : 'Signup failed'

    // Map common errors to better status codes
    if (message.includes('already exists')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}