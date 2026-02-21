import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Simple admin authentication check
    const adminEmail = request.headers.get('X-Admin-Email')

    if (!adminEmail || adminEmail !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mock system stats - in a real app, you'd query your database
    const stats = {
      users: {
        total: 150,
        active: 45
      },
      tasks: {
        total: 320,
        completed: 285,
        processing: 12
      },
      revenue: {
        total: 12450.50
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}