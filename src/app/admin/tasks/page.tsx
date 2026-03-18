'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { getAdminHeaders } from '@/lib/admin-client-auth'

interface Task {
  id: string
  user_email: string
  model: string
  status: string
  credits_used: number
  created_at: string
  error_message?: string
  tool?: string
}

interface TasksResponse {
  tasks: Task[]
  total: number
}

const STATUS_FILTERS = ['all', 'processing', 'completed', 'failed', 'pending']

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-400',
    processing: 'bg-yellow-500/20 text-yellow-400 animate-pulse',
    failed: 'bg-red-500/20 text-red-400',
    pending: 'bg-white/10 text-white/50',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-white/10 text-white/50'}`}>
      {status}
    </span>
  )
}

function Skeleton() {
  return <div className="animate-pulse bg-white/10 rounded h-8 w-full" />
}

export default function TasksPage() {
  const [data, setData] = useState<TasksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toolFilter, setToolFilter] = useState('all')
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [tools, setTools] = useState<string[]>([])

  const fetchTasks = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (toolFilter !== 'all') params.set('tool', toolFilter)

    fetch(`/api/admin/tasks?${params.toString()}`, { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        // Extract unique tools
        const toolSet = new Set<string>((d.tasks ?? []).map((t: Task) => t.tool || t.model).filter(Boolean))
        setTools(['all', ...Array.from(toolSet)])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search, statusFilter, toolFilter])

  useEffect(() => {
    const timer = setTimeout(fetchTasks, 300)
    return () => clearTimeout(timer)
  }, [fetchTasks])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Tasks</h1>
        <p className="text-white/40 text-sm mt-1">
          {data ? `${data.total.toLocaleString()} tasks` : 'Loading...'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search by task ID or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FFFF00]/50 w-full sm:w-72"
          />
          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none"
          >
            {tools.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All Tools' : t}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-[#FFFF00]/20 text-[#FFFF00] border border-[#FFFF00]/40'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Task ID</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">User</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Model</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Credits</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton /></td>
                      ))}
                    </tr>
                  ))
                : (data?.tasks ?? []).map((task) => (
                    <Fragment key={task.id}>
                      <tr
                        className="hover:bg-white/[0.03] cursor-pointer"
                        onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      >
                        <td className="px-4 py-3 text-white/60 font-mono text-xs">{task.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-white/70 text-xs">{task.user_email}</td>
                        <td className="px-4 py-3 text-white/60 text-xs">{task.model}</td>
                        <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                        <td className="px-4 py-3 text-right text-white/70 text-xs">{task.credits_used}</td>
                        <td className="px-4 py-3 text-white/40 text-xs">
                          {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                      {expandedTask === task.id && (
                        <tr>
                          <td colSpan={6} className="px-4 pb-4">
                            {task.error_message ? (
                              <pre className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-lg p-3 whitespace-pre-wrap font-mono">
                                {task.error_message}
                              </pre>
                            ) : (
                              <div className="bg-white/5 rounded-lg px-3 py-2 text-white/30 text-xs">No error message</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
              {!loading && (data?.tasks ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-white/30 text-xs">No tasks found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
