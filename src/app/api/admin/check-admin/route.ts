import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { checkIsAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    const sessionData = await getSession(sessionToken)

    if (!sessionData || !sessionData.user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    // Check if user is admin using database or fallback to hardcoded email
    let isAdmin = false

    try {
      isAdmin = await checkIsAdmin(sessionData.user.id)
    } catch (dbError) {
      console.log('Database admin check failed, using email fallback:', dbError)
      // Fallback: check hardcoded admin email
      isAdmin = sessionData.user.email === process.env.ADMIN_EMAIL
    }

    // Also check the user object directly if it has the isAdmin property
    if (!isAdmin && sessionData.user.isAdmin) {
      isAdmin = sessionData.user.isAdmin
    }

    return NextResponse.json({
      isAdmin,
      user: sessionData.user
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check admin status',
        isAdmin: false
      },
      { status: 500 }
    )
  }
}

// Keep the POST method for backwards compatibility
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ isAdmin: false, error: 'User ID required' }, { status: 400 });
    }

    const isAdmin = await checkIsAdmin(userId)

    return NextResponse.json({
      isAdmin,
      message: isAdmin ? 'User is admin' : 'User is not admin'
    });

  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false, error: 'Internal server error' }, { status: 500 });
  }
}