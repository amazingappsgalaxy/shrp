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
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    // --- Users ---
    const [
      { count: totalUsers },
      { count: newToday },
      { count: new7d },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    ])

    // active_30d: users with at least one history_item in last 30 days
    const { data: activeUserRows } = await supabase
      .from('history_items')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo)
    const active30dSet = new Set((activeUserRows || []).map((r) => r.user_id))
    const active30d = active30dSet.size

    // --- Tasks ---
    const [
      { count: totalTasks },
      { count: tasksToday },
      { count: processingTasks },
      { count: failedToday },
    ] = await Promise.all([
      supabase.from('history_items').select('*', { count: 'exact', head: true }),
      supabase.from('history_items').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('history_items').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
      supabase
        .from('history_items')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', today),
    ])

    const { count: completedToday } = await supabase
      .from('history_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', today)

    const todayTasksTotal = (tasksToday || 0)
    const successRate =
      todayTasksTotal > 0 ? Math.round(((completedToday || 0) / todayTasksTotal) * 1000) / 10 : 0

    // --- Revenue ---
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount, plan_name, created_at')
      .eq('status', 'succeeded')
      .eq('currency', 'USD')

    const payments = allPayments || []
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100
    const mrrPayments = payments.filter((p) => p.created_at >= thirtyDaysAgo)
    const mrr = mrrPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthPayments = payments.filter((p) => p.created_at >= monthStart)
    const thisMonth = thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100

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

    // --- Task timeline (last 30 days, grouped by date in JS) ---
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
      .map(([error, v]) => ({ error, count: v.count, model: v.model }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        new_today: newToday || 0,
        new_7d: new7d || 0,
        active_30d: active30d,
      },
      tasks: {
        total: totalTasks || 0,
        today: tasksToday || 0,
        processing: processingTasks || 0,
        failed_today: failedToday || 0,
        success_rate: successRate,
      },
      revenue: {
        total_usd: Math.round(totalRevenue * 100) / 100,
        mrr: Math.round(mrr * 100) / 100,
        this_month: Math.round(thisMonth * 100) / 100,
      },
      model_usage: modelUsage,
      task_timeline: taskTimeline,
      top_errors: topErrors,
    })
  } catch (error) {
    console.error('Admin overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
