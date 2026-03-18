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
    case '7d': return 7
    case '90d': return 90
    case '30d':
    default: return 30
  }
}

function extractToolName(pageName: string | null): string {
  if (!pageName) return 'unknown'
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
    const now = new Date().toISOString()
    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString()

    // ── 1. Task data ───────────────────────────────────────────────────────────
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

    // Daily tasks
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

    // Tool breakdown
    const toolCounts: Record<string, number> = {}
    for (const t of tasks) {
      const tool = extractToolName(t.page_name)
      toolCounts[tool] = (toolCounts[tool] || 0) + 1
    }
    const toolBreakdown = Object.entries(toolCounts)
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)

    // ── 2. User growth ─────────────────────────────────────────────────────────
    const [{ data: newUsersRows }, { count: baseCount }, { count: totalUsers }] = await Promise.all([
      supabase.from('users').select('created_at').gte('created_at', since).order('created_at', { ascending: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).lt('created_at', since),
      supabase.from('users').select('*', { count: 'exact', head: true }),
    ])

    const newUsersByDay: Record<string, number> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000)
      const key = d.toISOString().slice(0, 10)
      newUsersByDay[key] = 0
    }
    for (const u of newUsersRows || []) {
      const key = (u.created_at as string).slice(0, 10)
      if (newUsersByDay[key] !== undefined) newUsersByDay[key]++
    }

    let runningTotal = baseCount || 0
    const userGrowth = Object.entries(newUsersByDay).map(([date, newCount]) => {
      runningTotal += newCount
      return { date, total: runningTotal, new: newCount }
    })

    // ── 3. Revenue by plan ─────────────────────────────────────────────────────
    const { data: paymentRows } = await supabase
      .from('payments')
      .select('amount, plan, created_at')
      .eq('status', 'completed')
      .eq('currency', 'USD')
      .gte('created_at', since)

    const planRevenue: Record<string, number> = {}
    const dailyRevMap: Record<string, number> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000)
      dailyRevMap[d.toISOString().slice(0, 10)] = 0
    }
    for (const p of paymentRows || []) {
      const plan = p.plan || 'unknown'
      planRevenue[plan] = (planRevenue[plan] || 0) + (p.amount || 0)
      const dk = (p.created_at as string).slice(0, 10)
      if (dailyRevMap[dk] !== undefined) dailyRevMap[dk] += p.amount || 0
    }
    const revenueByPlan = Object.entries(planRevenue)
      .map(([plan, amount]) => ({ plan, amount: Math.round((amount / 100) * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)

    const dailyRevenue = Object.entries(dailyRevMap).map(([date, amountCents]) => ({
      date,
      amount: Math.round((amountCents / 100) * 100) / 100,
    }))

    // ── 4. Subscription breakdown ──────────────────────────────────────────────
    const { data: allSubs } = await supabase
      .from('subscriptions')
      .select('status, plan')

    const subStatusCounts: Record<string, number> = {}
    const subPlanCounts: Record<string, number> = {}
    for (const s of allSubs || []) {
      const st = s.status || 'unknown'
      subStatusCounts[st] = (subStatusCounts[st] || 0) + 1
      const pl = s.plan || 'unknown'
      subPlanCounts[pl] = (subPlanCounts[pl] || 0) + 1
    }

    // Users with no subscription = free users
    const usersWithSubs = (allSubs || []).length
    const freeUsers = Math.max(0, (totalUsers || 0) - usersWithSubs)
    subStatusCounts['free'] = (subStatusCounts['free'] || 0) + freeUsers

    const subscriptionBreakdown = Object.entries(subStatusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)

    const planBreakdown = Object.entries(subPlanCounts)
      .map(([plan, count]) => ({ plan, count }))
      .sort((a, b) => b.count - a.count)

    // ── 5. Credits totals ──────────────────────────────────────────────────────
    const { data: creditsRows } = await supabase
      .from('credits')
      .select('amount, type, expires_at')
      .eq('is_active', true)

    let totalSubCredits = 0
    let totalPermCredits = 0
    let expiringIn7d = 0
    for (const cr of creditsRows || []) {
      const amt = cr.amount || 0
      if (cr.type === 'subscription') {
        totalSubCredits += amt
      } else {
        totalPermCredits += amt
      }
      // Credits expiring in next 7 days (active, non-null expiry)
      if (cr.expires_at && cr.expires_at > now && cr.expires_at <= sevenDaysFromNow) {
        expiringIn7d += amt
      }
    }

    // Average credit balance
    const avgCreditBalance = (totalUsers || 0) > 0
      ? Math.round((totalSubCredits + totalPermCredits) / (totalUsers || 1))
      : 0

    return NextResponse.json({
      period,
      days,
      // Task analytics
      model_usage: modelUsage,
      daily_tasks: dailyTasks,
      tool_breakdown: toolBreakdown,
      // User analytics
      user_growth: userGrowth,
      total_users: totalUsers || 0,
      new_users_in_period: (newUsersRows || []).length,
      // Revenue analytics
      revenue_by_plan: revenueByPlan,
      daily_revenue: dailyRevenue,
      total_revenue_period: Math.round(revenueByPlan.reduce((s, r) => s + r.amount, 0) * 100) / 100,
      // Subscription analytics
      subscription_breakdown: subscriptionBreakdown,
      plan_breakdown: planBreakdown,
      // Credits analytics
      credits: {
        total_subscription: totalSubCredits,
        total_permanent: totalPermCredits,
        total: totalSubCredits + totalPermCredits,
        expiring_in_7d: expiringIn7d,
        avg_per_user: avgCreditBalance,
      },
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
