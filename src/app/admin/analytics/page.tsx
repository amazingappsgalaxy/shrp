'use client'

import { useEffect, useState } from 'react'
import { getAdminHeaders } from '@/lib/admin-client-auth'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

const PIE_COLORS = ['#FFFF00', '#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#4ade80']

interface AnalyticsData {
  daily_tasks: Array<{ date: string; count: number; failed: number }>
  model_usage: Array<{ model: string; count: number }>
  tool_breakdown: Array<{ tool: string; count: number }>
  user_growth: Array<{ date: string; total: number; new: number }>
}

type Period = '7d' | '30d' | '90d'

function Skeleton() {
  return <div className="h-52 animate-pulse bg-white/5 rounded-xl" />
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1f] border border-white/10 rounded-xl px-3 py-2 text-xs">
      {label && <p className="text-white/50 mb-1">
        {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
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
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period])

  const PERIODS: { label: string; value: Period }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Analytics</h1>
          <p className="text-white/40 text-sm mt-1">Platform usage trends</p>
        </div>
        {/* Period selector */}
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 gap-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                period === value
                  ? 'bg-[#FFFF00] text-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Tasks line chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Daily Tasks</h2>
        {loading ? <Skeleton /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.daily_tasks ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Tasks" stroke="#FFFF00" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Model Usage + Tool Breakdown side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Usage bar chart */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Model Usage</h2>
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.model_usage ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="model" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" name="Uses" fill="#FFFF00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tool Breakdown pie chart */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Tool Breakdown</h2>
          {loading ? <Skeleton /> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie
                    data={data?.tool_breakdown ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="tool"
                  >
                    {(data?.tool_breakdown ?? []).map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {(data?.tool_breakdown ?? []).map((item, i) => (
                  <div key={item.tool} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-white/60 text-xs truncate">{item.tool}</span>
                    </div>
                    <span className="text-white text-xs font-semibold shrink-0">{item.count.toLocaleString()}</span>
                  </div>
                ))}
                {(data?.tool_breakdown ?? []).length === 0 && (
                  <p className="text-white/30 text-xs">No data</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Growth line chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">User Growth</h2>
        {loading ? <Skeleton /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.user_growth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total" name="Users" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
