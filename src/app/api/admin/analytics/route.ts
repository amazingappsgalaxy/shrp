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

function periodToDays(period: string): number {
  switch (period) {
    case '7d':
      return 7
    case '90d':
      return 90
    case '30d':
    default:
      return 30
  }
}

function extractToolName(pageName: string | null): string {
  if (!pageName) return 'unknown'
  // Clean up page_name paths like /app/upscaler -> upscaler
  const cleaned = pageName.replace(/^\/+/, '').replace(/^app\//, '')
  return cleaned || 'unknown'
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const days = periodToDays(period)
    const since = new Date(Date.now() - days * 86400000).toISOString()

    // Fetch history items in period
    const { data: taskRows, error: taskError } = await supabase
      .from('history_items')
      .select('model_name, page_name, status, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    if (taskError) throw taskError

    const tasks = taskRows || []

    // Model usage
    const modelCounts: Record<string, number> = {}
    for (const t of tasks) {
      const m = t.model_name || 'unknown'
      modelCounts[m] = (modelCounts[m] || 0) + 1
    }
    const modelUsage = Object.entries(modelCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)

    // Daily tasks (grouped by date in JS)
    const dailyMap: Record<string, { count: number; failed: number }> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000)
      const key = d.toISOString().slice(0, 10)
      dailyMap[key] = { count: 0, failed: 0 }
    }
    for (const t of tasks) {
      const key = (t.created_at as string).slice(0, 10)
      if (dailyMap[key]) {
        dailyMap[key].count++
        if (t.status === 'failed') dailyMap[key].failed++
      }
    }
    const dailyTasks = Object.entries(dailyMap).map(([date, v]) => ({
      date,
      count: v.count,
      failed: v.failed,
    }))

    // Tool breakdown (by page_name)
    const toolCounts: Record<string, number> = {}
    for (const t of tasks) {
      const tool = extractToolName(t.page_name)
      toolCounts[tool] = (toolCounts[tool] || 0) + 1
    }
    const toolBreakdown = Object.entries(toolCounts)
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)

    // User growth: users created in period + cumulative totals
    const { data: newUsersRows } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    // Get total users count before period start
    const { count: baseCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', since)

    const newUsersByDay: Record<string, number> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000)
      const key = d.toISOString().slice(0, 10)
      newUsersByDay[key] = 0
    }
    for (const u of newUsersRows || []) {
      const key = (u.created_at as string).slice(0, 10)
      if (newUsersByDay[key] !== undefined) {
        newUsersByDay[key]++
      }
    }

    let runningTotal = baseCount || 0
    const userGrowth = Object.entries(newUsersByDay).map(([date, newCount]) => {
      runningTotal += newCount
      return { date, total: runningTotal, new: newCount }
    })

    // Revenue by plan (succeeded + USD, in period)
    const { data: paymentRows } = await supabase
      .from('payments')
      .select('amount, plan')
      .eq('status', 'completed')
      .eq('currency', 'USD')
      .gte('created_at', since)

    const planRevenue: Record<string, number> = {}
    for (const p of paymentRows || []) {
      const plan = p.plan || 'unknown'
      planRevenue[plan] = (planRevenue[plan] || 0) + (p.amount || 0)
    }
    const revenueByPlan = Object.entries(planRevenue)
      .map(([plan, amount]) => ({ plan, amount: Math.round((amount / 100) * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)

    return NextResponse.json({
      period,
      days,
      model_usage: modelUsage,
      daily_tasks: dailyTasks,
      user_growth: userGrowth,
      revenue_by_plan: revenueByPlan,
      tool_breakdown: toolBreakdown,
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
