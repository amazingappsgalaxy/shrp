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
    // Fetch failed tasks (up to 200 most recent)
    const { data: failedTasks, error } = await supabase
      .from('history_items')
      .select('id, user_id, model_name, page_name, error_message, created_at, completed_at, credits_used')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const taskList = failedTasks || []
    const userIds = [...new Set(taskList.map((t) => t.user_id))]

    // Fetch user emails
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

    const errors = taskList.map((t) => ({
      id: t.id,
      user_id: t.user_id,
      user_email: emailByUser[t.user_id] || null,
      model_name: t.model_name,
      page_name: t.page_name,
      error_message: t.error_message,
      credits_used: t.credits_used,
      created_at: t.created_at,
      completed_at: t.completed_at,
    }))

    // Compute by_model aggregate
    const modelFailCounts: Record<string, number> = {}
    for (const t of taskList) {
      const m = t.model_name || 'unknown'
      modelFailCounts[m] = (modelFailCounts[m] || 0) + 1
    }
    const byModel = Object.entries(modelFailCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)

    // Compute common error messages (top 10 snippets, truncated to 100 chars)
    const messageCounts: Record<string, number> = {}
    for (const t of taskList) {
      if (!t.error_message) continue
      const snippet = (t.error_message as string).slice(0, 100).trim()
      messageCounts[snippet] = (messageCounts[snippet] || 0) + 1
    }
    const commonMessages = Object.entries(messageCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Overall error rate: compare failed vs total for these tasks' date range
    let errorRate = 0
    if (taskList.length > 0) {
      const oldest = taskList[taskList.length - 1]?.created_at as string | undefined
      if (!oldest) return
      const { count: totalInRange } = await supabase
        .from('history_items')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oldest)

      if (totalInRange && totalInRange > 0) {
        errorRate = Math.round((taskList.length / totalInRange) * 1000) / 10
      }
    }

    return NextResponse.json({
      errors,
      aggregates: {
        by_model: byModel,
        common_messages: commonMessages,
        error_rate: errorRate,
        total_failed: taskList.length,
      },
    })
  } catch (error) {
    console.error('Admin errors route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
