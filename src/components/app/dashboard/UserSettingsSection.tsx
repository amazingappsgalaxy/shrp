'use client'

import React, { useState, useEffect } from 'react'
import { useAppData } from '@/lib/hooks/use-app-data'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Check, Lock, Mail, User } from 'lucide-react'

export default function UserSettingsSection() {
  const { user, profile, isLoading: loading, mutate } = useAppData()

  const [name, setName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Sync name from SWR profile
  useEffect(() => {
    if (profile?.name && !name) {
      setName(profile.name)
    }
  }, [profile?.name])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSavingProfile(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Profile updated')
        mutate()
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      const body: Record<string, string> = { newPassword }
      if (profile?.hasPassword && currentPassword) {
        body.currentPassword = currentPassword
      }
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(profile?.hasPassword ? 'Password updated' : 'Password set successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        mutate()
      } else {
        toast.error(data.error || 'Failed to update password')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-white/5 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-52 bg-white/5 rounded-md animate-pulse" />
          <div className="h-52 bg-white/5 rounded-md animate-pulse" />
        </div>
      </div>
    )
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : ''

  const avatar = (profile?.name || profile?.email || 'U').charAt(0).toUpperCase()

  const pwStrength = newPassword.length === 0 ? 0
    : newPassword.length < 6 ? 1
    : newPassword.length < 10 ? 2
    : newPassword.length < 14 ? 3
    : 4

  const pwStrengthColor = pwStrength <= 1 ? 'bg-red-500' : pwStrength === 2 ? 'bg-amber-400' : pwStrength === 3 ? 'bg-amber-400' : 'bg-green-400'
  const pwStrengthLabel = pwStrength === 0 ? '' : pwStrength === 1 ? 'Weak' : pwStrength === 2 ? 'Fair' : pwStrength === 3 ? 'Good' : 'Strong'

  return (
    <div className="space-y-4">
      {/* Top: Avatar identity bar */}
      <div className="bg-white/[0.05] border border-white/8 rounded-md px-5 py-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-md bg-[#FFFF00] flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-black text-black">{avatar}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-white truncate">{profile?.name || 'Your Account'}</p>
          <p className="text-sm text-white/40 truncate">{profile?.email}</p>
          {memberSince && <p className="text-xs text-white/25 mt-0.5">Member since {memberSince}</p>}
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] text-white/20 uppercase tracking-wider">Account ID</span>
          <span className="text-xs font-mono text-white/30">{profile?.id?.slice(0, 16)}…</span>
        </div>
      </div>

      {/* 2-column grid: Profile + Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT — Profile */}
        <div className="bg-white/[0.05] border border-white/8 rounded-md p-5">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">Profile</p>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full bg-white/[0.02] border border-white/6 rounded-md pl-8 pr-4 py-2.5 text-sm text-white/25 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-white/20 mt-1">Email cannot be changed</p>
            </div>

            <button
              type="submit"
              disabled={savingProfile || name === profile?.name}
              className={`flex items-center gap-1.5 font-bold rounded-md px-4 py-2 text-sm transition-all ${
                savingProfile || name === profile?.name
                  ? 'bg-white/6 text-white/25 cursor-not-allowed'
                  : 'bg-[#FFFF00] hover:bg-[#c9c900] text-black cursor-pointer'
              }`}
            >
              {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {savingProfile ? 'Saving…' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* RIGHT — Security */}
        <div className="bg-white/[0.05] border border-white/8 rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              {profile?.hasPassword ? 'Change Password' : 'Set Password'}
            </p>
            {!profile?.hasPassword && (
              <span className="text-[11px] text-white/25">Enable email sign-in</span>
            )}
          </div>
          <form onSubmit={handleSavePassword} className="space-y-3">
            {profile?.hasPassword && (
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-9 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
                  >
                    {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-white/50 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-9 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
                >
                  {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          pwStrength >= level ? pwStrengthColor : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] ${
                    pwStrength <= 1 ? 'text-red-400' : pwStrength <= 3 ? 'text-amber-400' : 'text-green-400'
                  }`}>{pwStrengthLabel}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={`w-full bg-white/5 border rounded-md pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-all ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-500/50 focus:border-red-500/50'
                      : 'border-white/10 focus:border-white/25'
                  }`}
                  required
                />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={savingPassword || !newPassword || newPassword !== confirmPassword}
              className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 disabled:bg-white/3 disabled:text-white/15 disabled:cursor-not-allowed border border-white/10 text-white font-bold rounded-md px-4 py-2 text-sm transition-all"
            >
              {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              {savingPassword ? 'Saving…' : profile?.hasPassword ? 'Change Password' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
