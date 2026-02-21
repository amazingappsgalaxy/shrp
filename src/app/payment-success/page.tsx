'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingScreen text="Loading..." />}>
      <PaymentSuccessClient />
    </Suspense>
  )
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <Spinner />
      <p className="text-white/50 text-sm">{text}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
  )
}

const MAX_RETRIES = 5

function PaymentSuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'async' | 'completed' | 'error'>('processing')
  const [countdown, setCountdown] = useState(5)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const retryCount = useRef(0)
  const hasRun = useRef(false)

  useEffect(() => {
    // Guard against React StrictMode double-invoking this effect in development,
    // which would call /complete twice simultaneously and bypass idempotency.
    if (hasRun.current) return
    hasRun.current = true

    const paymentId = searchParams.get('payment_id')
    const sessionId = searchParams.get('session_id') || searchParams.get('session')
    const subscriptionId = searchParams.get('subscription_id') || searchParams.get('subscriptionId')

    if (!subscriptionId && !paymentId && !sessionId) {
      setStatus('completed')
      return
    }

    const run = async () => {
      if (retryCount.current >= MAX_RETRIES) {
        setStatus('async')
        setCountdown(5)
        return
      }

      try {
        const body = subscriptionId
          ? { subscriptionId }
          : paymentId
            ? { paymentId }
            : { sessionId }

        const res = await fetch('/api/payments/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })

        if (res.status === 202) {
          retryCount.current += 1
          setTimeout(run, 3000)
          return
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({} as any))
          if (res.status === 401 || res.status === 403) {
            router.push('/app/signin?redirect=/payment-success')
            return
          }
          setErrorMessage(data?.error || data?.details || 'Failed to complete payment')
          setStatus('error')
          return
        }

        setStatus('completed')
        setCountdown(5)
      } catch {
        retryCount.current += 1
        if (retryCount.current < MAX_RETRIES) {
          setTimeout(run, 3000)
        } else {
          setStatus('async')
          setCountdown(5)
        }
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'completed' && status !== 'async') return
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [status, countdown])

  useEffect(() => {
    if ((status === 'completed' || status === 'async') && countdown === 0) {
      router.push('/app/dashboard')
    }
  }, [status, countdown, router])

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Spinner />
        <p className="text-white/50 text-sm">Confirming your payment…</p>
      </div>
    )
  }

  if (status === 'async') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-10 h-10 rounded-full border border-amber-400/40 flex items-center justify-center">
          <span className="text-amber-400 text-lg">⏳</span>
        </div>
        <div>
          <p className="text-white font-medium mb-1">Payment received</p>
          <p className="text-white/40 text-sm">Credits will appear in your account shortly.</p>
        </div>
        <p className="text-white/30 text-xs">Redirecting in {countdown}s</p>
        <button
          onClick={() => router.push('/app/dashboard')}
          className="mt-2 text-white/60 text-sm underline underline-offset-2"
        >
          Go to dashboard
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-10 h-10 rounded-full border border-red-400/40 flex items-center justify-center">
          <span className="text-red-400 text-lg">✕</span>
        </div>
        <div>
          <p className="text-white font-medium mb-1">Verification failed</p>
          <p className="text-white/40 text-sm">{errorMessage || 'Could not confirm your payment. If charged, please contact support.'}</p>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg"
          >
            Retry
          </button>
          <button
            onClick={() => router.push('/app/dashboard')}
            className="px-4 py-2 text-white/60 text-sm border border-white/10 rounded-lg"
          >
            Dashboard
          </button>
        </div>
      </div>
    )
  }

  // completed
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
        <span className="text-white text-lg">✓</span>
      </div>
      <div>
        <p className="text-white font-medium mb-1">Payment successful</p>
        <p className="text-white/40 text-sm">Credits have been added to your account.</p>
      </div>
      <p className="text-white/30 text-xs">Redirecting in {countdown}s</p>
      <button
        onClick={() => router.push('/app/dashboard')}
        className="mt-2 text-white/60 text-sm underline underline-offset-2"
      >
        Go to dashboard
      </button>
    </div>
  )
}
