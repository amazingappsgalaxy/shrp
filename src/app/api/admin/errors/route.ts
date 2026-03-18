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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIso = today.toISOString()

    // Fetch failed tasks (up to 200 most recent)
    const { data: failedTasks, error } = await supabase
      .from('history_items')
      .select('id, user_id, model_name, error_message, created_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const taskList = failedTasks || []

    // failed today count
    const failedToday = taskList.filter((t) => t.created_at >= todayIso).length

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

    // Error log (what page calls error_log)
    const errorLog = taskList.map((t) => ({
      id: t.id,
      user_email: emailByUser[t.user_id] || t.user_id,
      model: t.model_name || 'unknown',
      error_message: t.error_message || '',
      created_at: t.created_at,
    }))

    // error_rate_by_model
    const modelFailCounts: Record<string, number> = {}
    for (const t of taskList) {
      const m = t.model_name || 'unknown'
      modelFailCounts[m] = (modelFailCounts[m] || 0) + 1
    }
    const errorRateByModel = Object.entries(modelFailCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)

    const mostProblematicModel = errorRateByModel[0]?.model || '—'

    // common_errors (key: snippet)
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

    // Overall error rate
    let errorRate = 0
    if (taskList.length > 0) {
      const oldest = taskList[taskList.length - 1]?.created_at as string | undefined
      if (oldest) {
        const { count: totalInRange } = await supabase
          .from('history_items')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', oldest)

        if (totalInRange && totalInRange > 0) {
          errorRate = Math.round((taskList.length / totalInRange) * 1000) / 10
        }
      }
    }

    return NextResponse.json({
      kpis: {
        total_failed: taskList.length,
        failed_today: failedToday,
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
