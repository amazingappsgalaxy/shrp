import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function checkAdminAuth(request: NextRequest): boolean {
  const adminEmail = request.headers.get('x-admin-email')
  return !!(adminEmail && adminEmail.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase())
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const offset = (page - 1) * limit

    // Build base query
    let query = supabase
      .from('users')
      .select('id, email, name, created_at, updated_at, subscription_status, last_login_at', {
        count: 'exact',
      })

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }

    if (status !== 'all') {
      query = query.eq('subscription_status', status)
    }

    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const userList = users || []
    const userIds = userList.map((u) => u.id)

    // Fetch credits for all users in one query
    const creditsByUser: Record<string, number> = {}
    if (userIds.length > 0) {
      const now = new Date().toISOString()
      const { data: creditsData } = await supabase
        .from('credits')
        .select('user_id, amount')
        .in('user_id', userIds)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)

      for (const row of creditsData || []) {
        creditsByUser[row.user_id] = (creditsByUser[row.user_id] || 0) + (row.amount || 0)
      }
    }

    // Fetch task counts for all users
    const tasksByUser: Record<string, number> = {}
    if (userIds.length > 0) {
      const { data: taskData } = await supabase
        .from('history_items')
        .select('user_id')
        .in('user_id', userIds)

      for (const row of taskData || []) {
        tasksByUser[row.user_id] = (tasksByUser[row.user_id] || 0) + 1
      }
    }

    // Fetch active subscriptions for plan
    const planByUser: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('user_id, plan, status, next_billing_date')
        .in('user_id', userIds)
        .in('status', ['active', 'pending_cancellation'])
        .order('next_billing_date', { ascending: false })

      // Keep only the latest active sub per user
      for (const row of subData || []) {
        if (!planByUser[row.user_id]) {
          planByUser[row.user_id] = row.plan || ''
        }
      }
    }

    const enrichedUsers = userList.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      created_at: u.created_at,
      subscription_status: u.subscription_status,
      last_login_at: u.last_login_at,
      credit_balance: creditsByUser[u.id] || 0,
      task_count: tasksByUser[u.id] || 0,
      plan: planByUser[u.id] || null,
    }))

    const total = count || 0
    const pages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      users: enrichedUsers,
      total,
      page,
      pages,
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
