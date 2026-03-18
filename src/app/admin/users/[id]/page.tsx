'use client'

import { Fragment, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAdminHeaders } from '@/lib/admin-client-auth'

interface UserDetail {
  id: string
  email: string
  name: string
  created_at: string
  last_login_at: string
  subscription_status: string
  plan: string
  credits_subscription: number
  credits_permanent: number
  credits_total: number
  subscription?: {
    plan_name: string
    status: string
    current_period_start: string
    current_period_end: string
    next_billing_date: string
  }
  credit_transactions?: Array<{
    id: string
    amount: number
    type: string
    description: string
    created_at: string
  }>
  tasks?: Array<{
    id: string
    model: string
    status: string
    credits_used: number
    created_at: string
    error_message?: string
  }>
}

function Skeleton() {
  return <div className="animate-pulse bg-white/10 rounded h-7 w-full" />
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    free: 'bg-white/10 text-white/50',
    cancelled: 'bg-red-500/20 text-red-400',
    completed: 'bg-green-500/20 text-green-400',
    processing: 'bg-yellow-500/20 text-yellow-400 animate-pulse',
    failed: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-white/10 text-white/50'}`}>
      {status}
    </span>
  )
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'credits' | 'tasks' | 'billing'>('profile')

  // Credit form
  const [creditAmount, setCreditAmount] = useState('')
  const [creditType, setCreditType] = useState<'subscription' | 'permanent'>('permanent')
  const [creditReason, setCreditReason] = useState('')
  const [creditOp, setCreditOp] = useState<'grant' | 'deduct'>('grant')
  const [creditLoading, setCreditLoading] = useState(false)
  const [creditMsg, setCreditMsg] = useState('')

  // Expanded task
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const fetchUser = () => {
    setLoading(true)
    fetch(`/api/admin/users/${userId}`, { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const base = d.user || d
        setUser({
          ...base,
          plan: base.plan || d.subscription?.plan_name || 'free',
          credits_subscription: d.credits?.subscription ?? 0,
          credits_permanent: d.credits?.permanent ?? 0,
          credits_total: d.credits?.total ?? 0,
          subscription: d.subscription || null,
          credit_transactions: d.credit_history || [],
          tasks: (d.tasks || []).map((t: Record<string, unknown>) => ({
            ...t,
            model: t.model_name || t.model || 'unknown',
          })),
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchUser() }, [userId])

  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreditLoading(true)
    setCreditMsg('')

    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: creditOp === 'grant' ? 'POST' : 'DELETE',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          amount: Number(creditAmount),
          type: creditType,
          reason: creditReason,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCreditMsg(`Successfully ${creditOp === 'grant' ? 'granted' : 'deducted'} ${creditAmount} credits`)
        setCreditAmount('')
        setCreditReason('')
        fetchUser()
      } else {
        setCreditMsg(data.error || 'Operation failed')
      }
    } catch {
      setCreditMsg('Request failed')
    } finally {
      setCreditLoading(false)
    }
  }

  const TABS = [
    { key: 'profile', label: 'Profile' },
    { key: 'credits', label: 'Credits' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'billing', label: 'Billing' },
  ] as const

  const accountAge = user
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/users')}
          className="text-white/40 hover:text-white text-sm transition-colors"
        >
          ← Users
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}</div>
      ) : (
        <>
          {/* Profile header */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-xl font-bold">{user?.email}</h1>
              {user?.name && <p className="text-white/50 text-sm mt-0.5">{user.name}</p>}
              <p className="text-white/30 text-xs mt-2">Member for {accountAge} days</p>
            </div>
            <StatusBadge status={user?.subscription_status || 'free'} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/10 pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                  activeTab === tab.key
                    ? 'border-[#FFFF00] text-[#FFFF00]'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              {[
                { label: 'Email', value: user?.email },
                { label: 'Name', value: user?.name || '—' },
                { label: 'Created', value: user?.created_at ? new Date(user.created_at).toLocaleString() : '—' },
                { label: 'Last Login', value: user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—' },
                { label: 'Subscription', value: user?.subscription_status || 'free' },
                { label: 'Plan', value: user?.plan || 'free' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-white/40 text-sm">{label}</span>
                  <span className="text-white text-sm">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Credits tab */}
          {activeTab === 'credits' && (
            <div className="space-y-5">
              {/* Credit balance cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-white/50 text-xs mb-1">Subscription</div>
                  <div className="text-white text-xl font-bold">{(user?.credits_subscription ?? 0).toLocaleString()}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-white/50 text-xs mb-1">Permanent</div>
                  <div className="text-white text-xl font-bold">{(user?.credits_permanent ?? 0).toLocaleString()}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-white/50 text-xs mb-1">Total</div>
                  <div className="text-[#FFFF00] text-xl font-bold">{(user?.credits_total ?? 0).toLocaleString()}</div>
                </div>
              </div>

              {/* Grant/Deduct form */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Adjust Credits</h3>

                {/* Operation toggle */}
                <div className="flex gap-2 mb-4">
                  {(['grant', 'deduct'] as const).map((op) => (
                    <button
                      key={op}
                      onClick={() => setCreditOp(op)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        creditOp === op
                          ? op === 'grant' ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCreditSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-xs block mb-1">Amount</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        placeholder="100"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FFFF00]/50"
                      />
                    </div>
                    {creditOp === 'grant' && (
                      <div>
                        <label className="text-white/50 text-xs block mb-1">Type</label>
                        <select
                          value={creditType}
                          onChange={(e) => setCreditType(e.target.value as any)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none"
                        >
                          <option value="permanent">Permanent</option>
                          <option value="subscription">Subscription</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-white/50 text-xs block mb-1">Reason</label>
                    <textarea
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      placeholder="Admin adjustment..."
                      rows={2}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FFFF00]/50 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creditLoading}
                    className="bg-[#FFFF00] text-black font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60"
                  >
                    {creditLoading ? 'Processing...' : `${creditOp === 'grant' ? 'Grant' : 'Deduct'} Credits`}
                  </button>
                  {creditMsg && (
                    <p className={`text-xs mt-2 ${creditMsg.includes('Successfully') ? 'text-green-400' : 'text-red-400'}`}>
                      {creditMsg}
                    </p>
                  )}
                </form>
              </div>

              {/* Credit history */}
              {(user?.credit_transactions ?? []).length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4">Credit History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 text-xs">
                          <th className="text-left pb-3 font-medium">Amount</th>
                          <th className="text-left pb-3 font-medium">Type</th>
                          <th className="text-left pb-3 font-medium">Description</th>
                          <th className="text-left pb-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {user?.credit_transactions?.map((tx) => (
                          <tr key={tx.id}>
                            <td className={`py-2.5 pr-4 font-semibold text-sm ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 pr-4 text-white/50 text-xs capitalize">{tx.type}</td>
                            <td className="py-2.5 pr-4 text-white/60 text-xs">{tx.description}</td>
                            <td className="py-2.5 text-white/30 text-xs">
                              {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tasks tab */}
          {activeTab === 'tasks' && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Task ID</th>
                      <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Model</th>
                      <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                      <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Credits</th>
                      <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(user?.tasks ?? []).map((task) => (
                      <Fragment key={task.id}>
                        <tr
                          className="hover:bg-white/[0.03] cursor-pointer"
                          onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                        >
                          <td className="px-4 py-3 text-white/60 font-mono text-xs">{task.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-white/70 text-xs">{task.model}</td>
                          <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                          <td className="px-4 py-3 text-right text-white/70 text-xs">{task.credits_used}</td>
                          <td className="px-4 py-3 text-white/40 text-xs">
                            {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                        </tr>
                        {expandedTask === task.id && task.error_message && (
                          <tr>
                            <td colSpan={5} className="px-4 pb-3">
                              <pre className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-lg p-3 whitespace-pre-wrap font-mono">
                                {task.error_message}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    {(user?.tasks ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-xs">No tasks found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Billing tab */}
          {activeTab === 'billing' && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              {user?.subscription ? (
                <>
                  {[
                    { label: 'Plan', value: user.subscription.plan_name },
                    { label: 'Status', value: user.subscription.status },
                    { label: 'Period Start', value: user.subscription.current_period_start ? new Date(user.subscription.current_period_start).toLocaleDateString() : '—' },
                    { label: 'Period End', value: user.subscription.current_period_end ? new Date(user.subscription.current_period_end).toLocaleDateString() : '—' },
                    { label: 'Next Billing', value: user.subscription.next_billing_date ? new Date(user.subscription.next_billing_date).toLocaleDateString() : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <span className="text-white/40 text-sm">{label}</span>
                      <span className="text-white text-sm">{value}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-white/30 text-sm text-center py-6">No active subscription</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
