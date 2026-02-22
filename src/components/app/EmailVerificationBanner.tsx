'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { IconMailCheck, IconX, IconLoader2 } from '@tabler/icons-react'

export default function EmailVerificationBanner() {
  const { isAuthenticated, isLoading, emailVerified } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  // Don't show while loading, if not authenticated, if verified, or if dismissed
  if (isLoading || !isAuthenticated || emailVerified || dismissed) return null

  const handleResend = async () => {
    setResending(true)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        setResent(true)
      }
    } catch {
      // ignore
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2 text-amber-800">
        <IconMailCheck size={16} className="shrink-0" />
        <span>
          Please verify your email address.{' '}
          {resent ? (
            <span className="font-medium text-green-700">Verification email sent!</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-medium underline underline-offset-2 hover:text-amber-900 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {resending && <IconLoader2 size={12} className="animate-spin" />}
              Resend email
            </button>
          )}
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-600 hover:text-amber-900 shrink-0"
        aria-label="Dismiss"
      >
        <IconX size={16} />
      </button>
    </div>
  )
}
