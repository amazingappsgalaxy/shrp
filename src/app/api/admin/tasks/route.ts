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
    const status = searchParams.get('status') || ''
    const tool = searchParams.get('tool') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const offset = (page - 1) * limit

    // If searching by email, resolve user IDs first
    let emailUserIds: string[] | null = null
    if (search && search.includes('@')) {
      const { data: emailUsers } = await supabase
        .from('users')
        .select('id')
        .ilike('email', `%${search}%`)
      emailUserIds = (emailUsers || []).map((u) => u.id)
    }

    // Build history_items query
    let query = supabase
      .from('history_items')
      .select(
        'id, user_id, model_name, page_name, status, credits_used, error_message, created_at, completed_at',
        { count: 'exact' }
      )

    if (status) {
      query = query.eq('status', status)
    }

    if (tool) {
      query = query.ilike('page_name', `%${tool}%`)
    }

    if (search) {
      if (emailUserIds !== null) {
        // Email search: filter by user_id
        if (emailUserIds.length === 0) {
          // No matching users, return empty
          return NextResponse.json({ tasks: [], total: 0, page, pages: 1 })
        }
        query = query.in('user_id', emailUserIds)
      } else {
        // Search by task ID or model name
        // Try to detect UUID-like search
        const uuidPattern = /^[0-9a-f-]{8,}$/i
        if (uuidPattern.test(search)) {
          query = query.or(`id.eq.${search},model_name.ilike.%${search}%`)
        } else {
          query = query.ilike('model_name', `%${search}%`)
        }
      }
    }

    const { data: tasks, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const taskList = tasks || []
    const userIds = [...new Set(taskList.map((t) => t.user_id))]

    // Fetch user emails for the task user_ids
    const emailByUser: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)
      for (const u of users || []) {
        emailByUser[u.id] = u.email
      }
    }

    const enrichedTasks = taskList.map((t) => ({
      id: t.id,
      user_id: t.user_id,
      user_email: emailByUser[t.user_id] || null,
      model: t.model_name,
      tool: t.page_name,
      status: t.status,
      credits_used: t.credits_used,
      error_message: t.error_message,
      created_at: t.created_at,
      completed_at: t.completed_at,
    }))

    const total = count || 0
    const pages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      tasks: enrichedTasks,
      total,
      page,
      pages,
    })
  } catch (error) {
    console.error('Admin tasks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
