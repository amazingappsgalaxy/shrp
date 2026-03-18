'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminHeaders } from '@/lib/admin-client-auth'

interface User {
  id: string
  email: string
  name: string
  subscription_status: string
  credit_balance: number
  task_count: number
  plan: string
  created_at: string
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  pages: number
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    free: 'bg-white/10 text-white/50',
    cancelled: 'bg-red-500/20 text-red-400',
    pending_cancellation: 'bg-orange-500/20 text-orange-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-white/10 text-white/50'}`}>
      {status || 'free'}
    </span>
  )
}

function Skeleton() {
  return <div className="animate-pulse bg-white/10 rounded h-8 w-full" />
}

export default function UsersPage() {
  const router = useRouter()
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    params.set('page', String(page))

    fetch(`/api/admin/users?${params.toString()}`, { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search, statusFilter, page])

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  const STATUS_FILTERS = ['all', 'active', 'free', 'cancelled']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Users</h1>
        <p className="text-white/40 text-sm mt-1">
          {data ? `${data.total.toLocaleString()} total users` : 'Loading...'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FFFF00]/50 w-full sm:w-72"
        />
        <div className="flex gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
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
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Email</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Name</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Credits</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Tasks</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Plan</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Joined</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton /></td>
                      ))}
                    </tr>
                  ))
                : (data?.users ?? []).map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 text-white/80 text-xs">{user.email}</td>
                      <td className="px-4 py-3 text-white/60 text-xs">{user.name || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.subscription_status || 'free'} />
                      </td>
                      <td className="px-4 py-3 text-right text-white/80 text-xs">
                        {(user.credit_balance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-white/60 text-xs">{user.task_count ?? 0}</td>
                      <td className="px-4 py-3 text-white/60 text-xs capitalize">{user.plan || 'free'}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="text-xs bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
              {!loading && (data?.users ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-white/30 text-xs">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-white/40 text-xs">
            Page {data.page} of {data.pages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm bg-white/5 border border-white/10 text-white/60 rounded-lg disabled:opacity-40 hover:bg-white/10 transition-all"
            >
              Prev
            </button>
            <button
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm bg-white/5 border border-white/10 text-white/60 rounded-lg disabled:opacity-40 hover:bg-white/10 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
