'use client'

export const dynamic = 'force-dynamic'

import NextDynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client-simple'
import { useEffect } from 'react'

// Disable SSR for AuthUI to avoid hydration mismatches caused by browser extensions/password managers
const AuthUINoSSR = NextDynamic(() => import('@/components/ui/auth-fuse').then(m => m.AuthUI), { ssr: false })

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.replace('/app/dashboard')
    }
  }, [user, router])

  // Optionally render nothing while checking auth to avoid flicker
  if (user) return null

  return <AuthUINoSSR />
}