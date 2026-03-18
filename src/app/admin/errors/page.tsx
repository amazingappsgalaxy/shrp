'use client'

import { Fragment, useEffect, useState } from 'react'
import { getAdminHeaders } from '@/lib/admin-client-auth'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

interface ErrorsData {
  kpis: {
    total_failed: number
    failed_today: number
    error_rate: number
    most_problematic_model: string
  }
  error_rate_by_model: Array<{ model: string; count: number }>
  common_errors: Array<{ snippet: string; count: number }>
  error_log: Array<{
    id: string
    user_email: string
    model: string
    error_message: string
    created_at: string
  }>
}

function Skeleton() {
  return <div className="animate-pulse bg-white/10 rounded h-8 w-full" />
}

export default function ErrorsPage() {
  const [data, setData] = useState<ErrorsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedError, setExpandedError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/errors', { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Errors</h1>
        <p className="text-white/40 text-sm mt-1">Failed tasks and error analysis</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4"><Skeleton /></div>
            ))
          : [
              { label: 'Total Failed', value: data?.kpis.total_failed ?? 0 },
              { label: 'Failed Today', value: data?.kpis.failed_today ?? 0 },
              { label: 'Error Rate', value: `${(data?.kpis.error_rate ?? 0).toFixed(1)}%` },
              { label: 'Most Problematic Model', value: data?.kpis.most_problematic_model || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white/50 text-xs mb-2">{label}</div>
                <div className="text-white text-xl font-bold truncate">{value}</div>
              </div>
            ))}
      </div>

      {/* Error Rate by Model chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Error Rate by Model</h2>
        {loading ? (
          <div className="h-52 animate-pulse bg-white/5 rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.error_rate_by_model ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="model" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="count" name="Errors" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Common Error Messages */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Common Error Messages</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs">
                <th className="text-left pb-3 font-medium">Error Snippet</th>
                <th className="text-right pb-3 font-medium">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.common_errors ?? []).map((err, i) => (
                <tr key={i}>
                  <td className="py-2.5 pr-4 text-white/60 font-mono text-xs">{err.snippet}</td>
                  <td className="py-2.5 text-right text-red-400 font-semibold text-sm">{err.count}</td>
                </tr>
              ))}
              {(data?.common_errors ?? []).length === 0 && (
                <tr><td colSpan={2} className="py-6 text-center text-white/30 text-xs">No errors recorded</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Full Error Log */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Full Error Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Task ID</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">User</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Model</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Error</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton /></td>
                      ))}
                    </tr>
                  ))
                : (data?.error_log ?? []).map((err) => (
                    <Fragment key={err.id}>
                      <tr
                        className="hover:bg-white/[0.03] cursor-pointer"
                        onClick={() => setExpandedError(expandedError === err.id ? null : err.id)}
                      >
                        <td className="px-4 py-3 text-white/60 font-mono text-xs">{err.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-white/70 text-xs">{err.user_email}</td>
                        <td className="px-4 py-3 text-white/60 text-xs">{err.model}</td>
                        <td className="px-4 py-3 text-red-300/70 font-mono text-xs max-w-[200px] truncate">
                          {err.error_message?.slice(0, 100)}
                        </td>
                        <td className="px-4 py-3 text-white/40 text-xs">
                          {new Date(err.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                      {expandedError === err.id && (
                        <tr>
                          <td colSpan={5} className="px-4 pb-4">
                            <pre className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-lg p-3 whitespace-pre-wrap font-mono">
                              {err.error_message}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
              {!loading && (data?.error_log ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-white/30 text-xs">No errors found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
