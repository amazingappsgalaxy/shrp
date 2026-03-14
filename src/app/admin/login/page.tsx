'use client'

import { useState } from 'react'
import { setAdminAuthenticated } from '@/lib/admin-client-auth'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        setAdminAuthenticated(email)
        window.location.href = '/admin/overview'
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid admin credentials')
      }
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
      <div className="w-full max-w-[400px] px-4">
        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="text-[#FFFF00] text-2xl font-bold mb-1">⚡ Sharpii</div>
            <h1 className="text-white text-xl font-semibold">Admin Login</h1>
            <p className="text-white/40 text-sm mt-1">Sign in to access the admin dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/60 text-sm block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FFFF00]/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#FFFF00]/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFFF00] text-black font-bold rounded-xl h-12 text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-white/20 text-xs text-center mt-6">
            Secure admin area — unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  )
}
