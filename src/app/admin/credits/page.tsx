'use client'

import { useState, useEffect, useRef } from 'react'
import { getAdminHeaders } from '@/lib/admin-client-auth'

interface UserSuggestion {
  id: string
  email: string
  name: string
  credits_total: number
  credit_balance: number
}

interface RecentOperation {
  id: string
  user_email: string
  amount: number
  type: string
  description: string
  created_at: string
}

export default function CreditsPage() {
  const [emailInput, setEmailInput] = useState('')
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [operation, setOperation] = useState<'grant' | 'deduct'>('grant')
  const [amount, setAmount] = useState('')
  const [creditType, setCreditType] = useState<'permanent' | 'subscription'>('permanent')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [recentOps, setRecentOps] = useState<RecentOperation[]>([])
  const [recentLoading, setRecentLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch recent credit operations
  useEffect(() => {
    fetch('/api/admin/users?limit=20', { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        // Collect recent transactions from users if available
        setRecentLoading(false)
      })
      .catch(() => setRecentLoading(false))
  }, [])

  // User search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!emailInput || emailInput.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    searchTimer.current = setTimeout(() => {
      fetch(`/api/admin/users?search=${encodeURIComponent(emailInput)}&limit=5`, { headers: getAdminHeaders() })
        .then((r) => r.json())
        .then((d) => {
          setSuggestions(d.users ?? [])
          setShowDropdown(true)
        })
        .catch(() => {})
    }, 300)
  }, [emailInput])

  const handleSelectUser = (user: UserSuggestion) => {
    setSelectedUser(user)
    setEmailInput(user.email)
    setShowDropdown(false)
    setSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) {
      setMessage('Please select a user from the suggestions')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/credits`, {
        method: operation === 'grant' ? 'POST' : 'DELETE',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          amount: Number(amount),
          type: creditType,
          reason,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(`Successfully ${operation === 'grant' ? 'granted' : 'deducted'} ${amount} credits to ${selectedUser.email}`)
        setAmount('')
        setReason('')
        setSelectedUser(null)
        setEmailInput('')
      } else {
        setMessage(data.error || 'Operation failed')
      }
    } catch {
      setMessage('Request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-white text-2xl font-bold">Credits</h1>
        <p className="text-white/40 text-sm mt-1">Grant or deduct credits for any user</p>
      </div>

      {/* Grant/Deduct form */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-5">Adjust User Credits</h2>

        {/* Operation toggle */}
        <div className="flex gap-2 mb-5">
          {(['grant', 'deduct'] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setOperation(op)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                operation === op
                  ? op === 'grant'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              {op}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User search */}
          <div className="relative" ref={dropdownRef}>
            <label className="text-white/50 text-xs block mb-1.5">User (search by email)</label>
            <input
              type="text"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value)
                setSelectedUser(null)
              }}
              placeholder="user@example.com"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FFFF00]/50"
            />
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1f] border border-white/15 rounded-xl shadow-xl z-50 overflow-hidden">
                {suggestions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="text-white text-sm">{user.email}</div>
                    <div className="text-white/40 text-xs mt-0.5">
                      {user.name || 'No name'} · {(user.credit_balance ?? user.credits_total ?? 0).toLocaleString()} credits
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400">Selected: {selectedUser.email}</span>
                <span className="text-white/30">· {(selectedUser.credit_balance ?? selectedUser.credits_total ?? 0).toLocaleString()} credits currently</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-white/50 text-xs block mb-1.5">Amount (credits)</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFFF00]/50"
            />
          </div>

          {/* Credit type (only for grant) */}
          {operation === 'grant' && (
            <div>
              <label className="text-white/50 text-xs block mb-1.5">Credit Type</label>
              <div className="flex gap-2">
                {(['permanent', 'subscription'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCreditType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      creditType === t
                        ? 'bg-[#FFFF00]/20 text-[#FFFF00] border border-[#FFFF00]/40'
                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-white/50 text-xs block mb-1.5">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Admin adjustment, refund, compensation..."
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFFF00]/50 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFFF00] text-black font-bold rounded-xl h-12 text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `${operation === 'grant' ? 'Grant' : 'Deduct'} Credits`}
          </button>

          {message && (
            <div className={`text-sm rounded-lg px-4 py-3 ${
              message.includes('Successfully')
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>

      {/* Info note */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-white/30 text-xs leading-relaxed">
        <strong className="text-white/50">Note:</strong> Permanent credits never expire. Subscription credits expire at the end of the billing period. Deducting credits reduces from the available balance regardless of type.
      </div>
    </div>
  )
}
