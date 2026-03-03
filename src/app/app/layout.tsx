'use client'

import { usePathname } from 'next/navigation'
import UserHeader from '@/components/app/UserHeader'
import { TaskManagerProvider } from '@/components/providers/TaskManagerProvider'

// Auth pages that should NOT show the app header
const AUTH_PATHS = ['/app/signin', '/app/signup', '/app/reset-password', '/app/auth']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p))

  return (
    <TaskManagerProvider>
      {!isAuthPage && <UserHeader />}
      {children}
    </TaskManagerProvider>
  )
}
