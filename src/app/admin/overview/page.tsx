'use client'

import { useEffect, useState } from 'react'
import { getAdminHeaders } from '@/lib/admin-client-auth'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

interface OverviewData {
  kpis: {
    total_users: number
    new_today: number
    tasks_today: number
    failed_today: number
    mrr: number
    active_credits: number
  }
  task_timeline: Array<{ date: string; count: number; failed: number }>
  model_usage: Array<{ model: string; count: number }>
  top_errors: Array<{ snippet: string; count: number; model: string }>
  recent_tasks: Array<{
    id: string
    user_email: string
    model: string
    status: string
    credits_used: number
    created_at: string
  }>
}

function KpiCard({ label, value, prefix = '' }: { label: string; value: string | number; prefix?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-white/60 text-xs mb-2">{label}</div>
      <div className="text-white text-2xl font-bold">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  )
}

function Skeleton() {
  return <div className="animate-pulse bg-white/10 rounded h-8 w-full" />
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-400',
    processing: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
    pending: 'bg-white/10 text-white/60',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-white/10 text-white/60'}`}>
      {status}
    </span>
  )
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/overview', { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load overview data')
        setLoading(false)
      })
  }, [])

  if (error) {
    return <div className="text-red-400 text-sm">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Overview</h1>
        <p className="text-white/40 text-sm mt-1">Platform-wide stats at a glance</p>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <Skeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Total Users" value={data?.kpis.total_users ?? 0} />
          <KpiCard label="New Today" value={data?.kpis.new_today ?? 0} />
          <KpiCard label="Tasks Today" value={data?.kpis.tasks_today ?? 0} />
          <KpiCard label="Failed Today" value={data?.kpis.failed_today ?? 0} />
          <KpiCard label="MRR" value={data?.kpis.mrr ?? 0} prefix="$" />
          <KpiCard label="Active Credits" value={data?.kpis.active_credits ?? 0} />
        </div>
      )}

      {/* Task Timeline */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Task Timeline</h2>
        {loading ? (
          <div className="h-52 animate-pulse bg-white/5 rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.task_timeline ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <Legend />
              <Line type="monotone" dataKey="count" name="Tasks" stroke="#FFFF00" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="failed" name="Failed" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom row: Model Usage + Top Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Usage */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Model Usage</h2>
          {loading ? (
            <div className="h-48 animate-pulse bg-white/5 rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
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

        {/* Top Errors */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Top Errors</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs">
                    <th className="text-left pb-3 font-medium">Error</th>
                    <th className="text-left pb-3 font-medium">Model</th>
                    <th className="text-right pb-3 font-medium">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(data?.top_errors ?? []).map((err, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 text-white/60 font-mono text-xs max-w-[180px] truncate">{err.snippet}</td>
                      <td className="py-2 pr-3 text-white/60 text-xs">{err.model}</td>
                      <td className="py-2 text-right text-white font-semibold">{err.count}</td>
                    </tr>
                  ))}
                  {(data?.top_errors ?? []).length === 0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-white/30 text-xs">No errors</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Recent Tasks</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs">
                  <th className="text-left pb-3 font-medium">Task ID</th>
                  <th className="text-left pb-3 font-medium">User</th>
                  <th className="text-left pb-3 font-medium">Model</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Credits</th>
                  <th className="text-right pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data?.recent_tasks ?? []).map((task) => (
                  <tr key={task.id}>
                    <td className="py-2.5 pr-4 text-white/60 font-mono text-xs">{task.id.slice(0, 8)}</td>
                    <td className="py-2.5 pr-4 text-white/80 text-xs">{task.user_email}</td>
                    <td className="py-2.5 pr-4 text-white/60 text-xs">{task.model}</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={task.status} /></td>
                    <td className="py-2.5 pr-4 text-right text-white text-xs">{task.credits_used}</td>
                    <td className="py-2.5 text-right text-white/40 text-xs">
                      {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {(data?.recent_tasks ?? []).length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-white/30 text-xs">No tasks found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
