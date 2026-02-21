import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { signUpUser } from '@/lib/simple-auth'

// Simple demo account creation for testing
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create user with simple auth system
    const result = await signUpUser(email, 'demo-password', email.split('@')[0])

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('session', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    console.log(`Demo account created: ${email} (ID: ${result.user.id})`)

    return NextResponse.json({
      success: true,
      message: 'Demo account created successfully',
      user: result.user
    })

  } catch (error) {
    console.error('Error creating demo account:', error)
    return NextResponse.json(
      { error: 'Failed to create demo account', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}