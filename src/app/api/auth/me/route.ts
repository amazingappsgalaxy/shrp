import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/simple-auth'

export async function GET(request: NextRequest) {
  try {
    // Get user session from cookie
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    const session = await getSession(token)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Return user information
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || session.user.email
      },
      authenticated: true
    })

  } catch (error) {
    console.error('Auth me API error:', error)
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    )
  }
}