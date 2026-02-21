import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession, listUserActivity } from '@/lib/auth-simple'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const sessionData = await getSession(sessionToken)
    if (!sessionData || !sessionData.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    const userId = sessionData.user.id
    
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Fetch user activity
    const activity = await listUserActivity(userId, limit)
    
    // Format response
    const formattedActivity = activity.map(item => ({
      id: item.id,
      userId: item.userId,
      action: item.action,
      metadata: item.metadata,
      createdAt: item.createdAt
    }))
    
    return NextResponse.json({
      success: true,
      activity: formattedActivity,
      total: formattedActivity.length
    })
    
  } catch (error) {
    console.error('API: Error listing activity:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch activity',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}