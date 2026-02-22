'use client'

export const dynamic = 'force-dynamic'

import NextDynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client-simple'
import { useEffect, useRef } from 'react'

// Disable SSR for AuthUI to avoid hydration mismatches caused by browser extensions/password managers
const AuthUINoSSR = NextDynamic(() => import('@/components/ui/auth-fuse').then(m => m.AuthUI), { ssr: false })

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()
  const handledRef = useRef(false)

  useEffect(() => {
    if (!user || handledRef.current) return
    handledRef.current = true

    // Check if user clicked a pricing plan before logging in
    try {
      const storedPlan = localStorage.getItem('selectedPlan')
      if (storedPlan) {
        const planData = JSON.parse(storedPlan)
        localStorage.removeItem('selectedPlan')

        // Directly call checkout and redirect to Dodo payment page
        fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(planData),
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.checkoutUrl) {
              window.location.href = data.checkoutUrl
            } else {
              router.replace('/app/dashboard')
            }
          })
          .catch(() => router.replace('/app/dashboard'))
        return
      }
    } catch {
      // ignore parse errors
    }

    router.replace('/app/dashboard')
  }, [user, router])

  // Optionally render nothing while checking auth to avoid flicker
  if (user) return null

  return <AuthUINoSSR />
}