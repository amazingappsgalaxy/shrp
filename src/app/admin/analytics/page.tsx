'use client'

import { useEffect, useState } from 'react'
import { getAdminHeaders } from '@/lib/admin-client-auth'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

const PIE_COLORS = ['#FFFF00', '#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#4ade80', '#f59e0b', '#60a5fa']

interface AnalyticsData {
  period: string
  days: number
  // Task
  daily_tasks: Array<{ date: string; count: number; failed: number }>
  model_usage: Array<{ model: string; count: number }>
  tool_breakdown: Array<{ tool: string; count: number }>
  // Users
  user_growth: Array<{ date: string; total: number; new: number }>
  total_users: number
  new_users_in_period: number
  // Revenue
  revenue_by_plan: Array<{ plan: string; amount: number }>
  daily_revenue: Array<{ date: string; amount: number }>
  total_revenue_period: number
  // Subscriptions
  subscription_breakdown: Array<{ status: string; count: number }>
  plan_breakdown: Array<{ plan: string; count: number }>
  // Credits
  credits: {
    total_subscription: number
    total_permanent: number
    total: number
    expiring_in_7d: number
    avg_per_user: number
  }
}

type Period = '7d' | '30d' | '90d'

function Skeleton({ h = 52 }: { h?: number }) {
  return <div className={`h-${h} animate-pulse bg-white/5 rounded-xl`} style={{ height: `${h * 4}px` }} />
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-white/40 text-xs">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? 'text-[#FFFF00]' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-white/30 text-xs mt-1">{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1f] border border-white/10 rounded-xl px-3 py-2 text-xs">
      {label && (
        <p className="text-white/50 mb-1">
          {new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  )
}

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1f] border border-white/10 rounded-xl px-3 py-2 text-xs">
      {label && (
        <p className="text-white/50 mb-1">
          {new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: ${typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  )
}

function PieLegend({ data, colors }: { data: Array<{ name: string; count: number }>; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div className="flex-1 space-y-1.5 min-w-0">
      {data.map((item, i) => (
        <div key={item.name} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-white/60 text-xs truncate capitalize">{item.name}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-white text-xs font-semibold">{item.count.toLocaleString()}</span>
            {total > 0 && (
              <span className="text-white/30 text-xs">({Math.round((item.count / total) * 100)}%)</span>
            )}
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-white/30 text-xs">No data</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics?period=${period}`, { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const PERIODS: { label: string; value: Period }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
  ]

  const totalTasks = data?.daily_tasks.reduce((s, d) => s + d.count, 0) ?? 0
  const totalFailed = data?.daily_tasks.reduce((s, d) => s + d.failed, 0) ?? 0
  const failRate = totalTasks > 0 ? Math.round((totalFailed / totalTasks) * 1000) / 10 : 0

  const subPieData = (data?.subscription_breakdown ?? []).map((s) => ({ name: s.status, count: s.count }))
  const toolPieData = (data?.tool_breakdown ?? []).map((t) => ({ name: t.tool, count: t.count }))

  const hasRevenue = (data?.total_revenue_period ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Header + period picker */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-bold">Analytics</h1>
          <p className="text-white/40 text-sm mt-1">Platform usage, revenue and user trends</p>
        </div>
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 gap-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                period === value ? 'bg-[#FFFF00] text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-white/5 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label={`Tasks (${period})`} value={totalTasks.toLocaleString()} sub={`${totalFailed} failed (${failRate}%)`} accent />
          <KpiCard label="Total Users" value={(data?.total_users ?? 0).toLocaleString()} sub={`+${data?.new_users_in_period ?? 0} in period`} />
          <KpiCard label={`Revenue (${period})`} value={`$${(data?.total_revenue_period ?? 0).toFixed(2)}`} sub={hasRevenue ? 'Completed payments' : 'No payments yet'} accent={hasRevenue} />
          <KpiCard label="Avg Credit Balance" value={(data?.credits.avg_per_user ?? 0).toLocaleString()} sub="per user" />
        </div>
      )}

      {/* Daily Tasks line chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Daily Tasks</h2>
        {loading ? <Skeleton h={55} /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.daily_tasks ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Tasks" stroke="#FFFF00" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="failed" name="Failed" stroke="#f87171" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Revenue charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-1">Daily Revenue</h2>
          <p className="text-white/30 text-xs mb-4">Completed USD payments</p>
          {loading ? <Skeleton h={55} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.daily_revenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  tickFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<RevenueTooltip />} />
                <Bar dataKey="amount" name="Revenue" fill="#4ade80" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by Plan */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-1">Revenue by Plan</h2>
          <p className="text-white/30 text-xs mb-4">Total USD in period</p>
          {loading ? <Skeleton h={55} /> : (data?.revenue_by_plan?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.revenue_by_plan ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="plan" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="amount" name="Revenue" fill="#FFFF00" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-white/20 text-sm">No revenue data for this period</p>
            </div>
          )}
        </div>
      </div>

      {/* Model usage + Tool Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Model Usage</h2>
          {loading ? <Skeleton h={55} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(data?.model_usage ?? []).slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="model" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} angle={-15} textAnchor="end" height={40} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" name="Uses" fill="#FFFF00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Tool Breakdown</h2>
          {loading ? <Skeleton h={55} /> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={toolPieData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                  >
                    {toolPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <PieLegend data={toolPieData} colors={PIE_COLORS} />
            </div>
          )}
        </div>
      </div>

      {/* Subscription status + Plan breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-1">Subscription Status</h2>
          <p className="text-white/30 text-xs mb-4">All users incl. free (no subscription)</p>
          {loading ? <Skeleton h={55} /> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={subPieData}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                  >
                    {subPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <PieLegend data={subPieData} colors={PIE_COLORS} />
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-1">Active Plans</h2>
          <p className="text-white/30 text-xs mb-4">Subscriptions by plan name</p>
          {loading ? <Skeleton h={55} /> : (data?.plan_breakdown?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.plan_breakdown ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis type="category" dataKey="plan" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" name="Users" fill="#a78bfa" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-white/20 text-sm">No active subscriptions</p>
            </div>
          )}
        </div>
      </div>

      {/* Credits analytics */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-1">Credits Overview</h2>
        <p className="text-white/30 text-xs mb-4">Total credits across all active credit rows (not expired)</p>
        {loading ? <div className="h-24 animate-pulse bg-white/5 rounded-xl" /> : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Subscription Credits', value: (data?.credits.total_subscription ?? 0).toLocaleString(), accent: true },
              { label: 'Permanent Credits', value: (data?.credits.total_permanent ?? 0).toLocaleString(), accent: false },
              { label: 'Total Credits', value: (data?.credits.total ?? 0).toLocaleString(), accent: true },
              { label: 'Expiring in 7 Days', value: (data?.credits.expiring_in_7d ?? 0).toLocaleString(), accent: false },
              { label: 'Avg per User', value: (data?.credits.avg_per_user ?? 0).toLocaleString(), accent: false },
            ].map((c) => (
              <div key={c.label} className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-white/40 text-xs">{c.label}</div>
                <div className={`font-bold text-xl mt-1 ${c.accent ? 'text-[#FFFF00]' : 'text-white'}`}>{c.value}</div>
              </div>
            ))}
          </div>
        )}
        {/* Credits pie */}
        {!loading && (data?.credits.total ?? 0) > 0 && (
          <div className="mt-4 flex items-center gap-6">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={[
                  { label: 'Subscription', value: data?.credits.total_subscription ?? 0 },
                  { label: 'Permanent', value: data?.credits.total_permanent ?? 0 },
                  { label: 'Expiring 7d', value: data?.credits.expiring_in_7d ?? 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" name="Credits" radius={[4, 4, 0, 0]}>
                  <Cell fill="#FFFF00" />
                  <Cell fill="#22d3ee" />
                  <Cell fill="#f87171" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* User Growth */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-1">User Growth</h2>
        <p className="text-white/30 text-xs mb-4">Cumulative users + new signups per day</p>
        {loading ? <Skeleton h={55} /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.user_growth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total" name="Total Users" stroke="#22d3ee" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="new" name="New Users" stroke="#4ade80" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
