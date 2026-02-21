import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await getSession(sessionToken)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get limit from query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get credit history
    const history = await UnifiedCreditsService.getCreditHistory(userId, limit)

    return NextResponse.json({
      success: true,
      history
    })
  } catch (error) {
    console.error('Error fetching credit history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit history' },
      { status: 500 }
    )
  }
}