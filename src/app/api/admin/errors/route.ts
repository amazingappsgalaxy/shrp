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
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    // Accurate counts from DB (last 30 days)
    const [
      { count: totalFailed30d },
      { count: failedToday },
      { count: totalTasks30d },
    ] = await Promise.all([
      supabase.from('history_items').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', thirtyDaysAgo),
      supabase.from('history_items').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', todayStart),
      supabase.from('history_items').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    ])

    const errorRate = totalTasks30d && totalTasks30d > 0
      ? Math.round(((totalFailed30d || 0) / totalTasks30d) * 1000) / 10
      : 0

    // Fetch last 200 failed tasks for log and aggregations (last 30 days)
    const { data: failedTasks, error } = await supabase
      .from('history_items')
      .select('id, user_id, model_name, error_message, created_at')
      .eq('status', 'failed')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const taskList = failedTasks || []

    // Fetch user emails
    const userIds = [...new Set(taskList.map((t) => t.user_id))]
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

    // Error log
    const errorLog = taskList.map((t) => ({
      id: t.id,
      user_email: emailByUser[t.user_id] || t.user_id,
      model: t.model_name || 'unknown',
      error_message: t.error_message || '',
      created_at: t.created_at,
    }))

    // error_rate_by_model (failure counts from sample)
    const modelFailCounts: Record<string, number> = {}
    for (const t of taskList) {
      const m = t.model_name || 'unknown'
      modelFailCounts[m] = (modelFailCounts[m] || 0) + 1
    }
    const errorRateByModel = Object.entries(modelFailCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)

    const mostProblematicModel = errorRateByModel[0]?.model || '—'

    // common_errors
    const messageCounts: Record<string, number> = {}
    for (const t of taskList) {
      if (!t.error_message) continue
      const snippet = (t.error_message as string).slice(0, 100).trim()
      messageCounts[snippet] = (messageCounts[snippet] || 0) + 1
    }
    const commonErrors = Object.entries(messageCounts)
      .map(([snippet, count]) => ({ snippet, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      kpis: {
        total_failed: totalFailed30d || 0,
        failed_today: failedToday || 0,
        error_rate: errorRate,
        most_problematic_model: mostProblematicModel,
      },
      error_rate_by_model: errorRateByModel,
      common_errors: commonErrors,
      error_log: errorLog,
    })
  } catch (error) {
    console.error('Admin errors route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
