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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    // --- Users ---
    const [
      { count: totalUsers },
      { count: newToday },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today),
    ])

    // --- Tasks ---
    const [
      { count: tasksToday },
      { count: failedToday },
      { count: completedToday },
    ] = await Promise.all([
      supabase.from('history_items').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('history_items').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', today),
      supabase.from('history_items').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', today),
    ])

    const todayTasksTotal = tasksToday || 0
    const successRate =
      todayTasksTotal > 0 ? Math.round(((completedToday || 0) / todayTasksTotal) * 1000) / 10 : 0

    // --- Revenue (MRR = last 30 days) ---
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'completed')
      .eq('currency', 'USD')
      .gte('created_at', thirtyDaysAgo)

    const mrr = (allPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0) / 100

    // --- Active credits total ---
    const nowIso = now.toISOString()
    const { data: activeCreditsData } = await supabase
      .from('credits')
      .select('amount')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)

    const activeCredits = (activeCreditsData || []).reduce((sum, r) => sum + (r.amount || 0), 0)

    // --- Model usage (last 30 days) ---
    const { data: modelRows } = await supabase
      .from('history_items')
      .select('model_name')
      .gte('created_at', thirtyDaysAgo)
      .not('model_name', 'is', null)

    const modelCounts: Record<string, number> = {}
    for (const row of modelRows || []) {
      const m = row.model_name || 'unknown'
      modelCounts[m] = (modelCounts[m] || 0) + 1
    }
    const modelUsage = Object.entries(modelCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)

    // --- Task timeline (last 30 days) ---
    const { data: timelineRows } = await supabase
      .from('history_items')
      .select('created_at, status')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true })

    const timelineMap: Record<string, { count: number; failed: number }> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - (29 - i) * 86400000)
      const key = d.toISOString().slice(0, 10)
      timelineMap[key] = { count: 0, failed: 0 }
    }
    for (const row of timelineRows || []) {
      const key = (row.created_at as string).slice(0, 10)
      if (timelineMap[key]) {
        timelineMap[key].count++
        if (row.status === 'failed') timelineMap[key].failed++
      }
    }
    const taskTimeline = Object.entries(timelineMap).map(([date, v]) => ({
      date,
      count: v.count,
      failed: v.failed,
    }))

    // --- Top errors (last 30 days, top 5) ---
    const { data: errorRows } = await supabase
      .from('history_items')
      .select('error_message, model_name')
      .eq('status', 'failed')
      .gte('created_at', thirtyDaysAgo)
      .not('error_message', 'is', null)

    const errorMap: Record<string, { count: number; model: string }> = {}
    for (const row of errorRows || []) {
      const msg = ((row.error_message as string) || '').slice(0, 120)
      if (!errorMap[msg]) {
        errorMap[msg] = { count: 0, model: row.model_name || 'unknown' }
      }
      errorMap[msg].count++
    }
    const topErrors = Object.entries(errorMap)
      .map(([snippet, v]) => ({ snippet, count: v.count, model: v.model }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // --- Recent tasks (last 10) ---
    const { data: recentTaskRows } = await supabase
      .from('history_items')
      .select('id, user_id, model_name, status, credits_used, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Batch-fetch user emails for recent tasks
    const userIds = [...new Set((recentTaskRows || []).map((t) => t.user_id))]
    let userEmailMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)
      for (const u of usersData || []) {
        userEmailMap[u.id] = u.email
      }
    }

    const recentTasks = (recentTaskRows || []).map((t) => ({
      id: t.id,
      user_email: userEmailMap[t.user_id] || t.user_id,
      model: t.model_name || 'unknown',
      status: t.status,
      credits_used: t.credits_used || 0,
      created_at: t.created_at,
    }))

    return NextResponse.json({
      kpis: {
        total_users: totalUsers || 0,
        new_today: newToday || 0,
        tasks_today: tasksToday || 0,
        failed_today: failedToday || 0,
        success_rate: successRate,
        mrr: Math.round(mrr * 100) / 100,
        active_credits: activeCredits,
      },
      model_usage: modelUsage,
      task_timeline: taskTimeline,
      top_errors: topErrors,
      recent_tasks: recentTasks,
    })
  } catch (error) {
    console.error('Admin overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
