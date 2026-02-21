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

    // Mock user data - in a real app, you'd query your database
    const users = [
      {
        id: 'user1',
        email: 'user@example.com',
        name: 'John Doe',
        subscription_status: 'free',
        api_usage: 45,
        monthly_api_limit: 100,
        created_at: '2024-01-15T10:30:00Z',
        last_login_at: '2024-01-20T14:22:00Z'
      },
      {
        id: 'user2',
        email: 'jane@example.com',
        name: 'Jane Smith',
        subscription_status: 'pro',
        api_usage: 230,
        monthly_api_limit: 1000,
        created_at: '2024-01-10T09:15:00Z',
        last_login_at: '2024-01-21T11:45:00Z'
      },
      {
        id: 'user3',
        email: 'premium@example.com',
        name: 'Premium User',
        subscription_status: 'enterprise',
        api_usage: 1500,
        monthly_api_limit: 10000,
        created_at: '2024-01-05T16:20:00Z',
        last_login_at: '2024-01-21T09:30:00Z'
      }
    ]

    return NextResponse.json(users)

  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}