'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { isAdminAuthenticated, getAdminEmail, adminLogout } from '@/lib/admin-client-auth'

const NAV_ITEMS = [
  { label: 'Overview', emoji: '📊', href: '/admin/overview' },
  { label: 'Users', emoji: '👥', href: '/admin/users' },
  { label: 'Tasks', emoji: '⚙️', href: '/admin/tasks' },
  { label: 'Errors', emoji: '❌', href: '/admin/errors' },
  { label: 'Credits', emoji: '💰', href: '/admin/credits' },
  { label: 'Model Pricing', emoji: '🔧', href: '/admin/model-pricing' },
  { label: 'Plans', emoji: '📋', href: '/admin/plans' },
  { label: 'Analytics', emoji: '📈', href: '/admin/analytics' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  // Synchronous auth check — sessionStorage is available immediately on the client
  const [isAuth] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null
    return isAdminAuthenticated()
  })

  useEffect(() => {
    if (pathname === '/admin/login') return
    if (isAuth === false) {
      window.location.href = '/admin/login'
    } else if (isAuth === true) {
      setEmail(getAdminEmail())
    }
  }, [isAuth, pathname])

  const handleLogout = () => {
    adminLogout()
    window.location.href = '/admin/login'
  }

  // Don't render layout for the login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // SSR or not authenticated — render nothing (redirect handled in useEffect)
  if (!isAuth) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#0d0d0f]">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-[220px] bg-[#0a0a0a] border-r border-white/10 flex flex-col z-50">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[#FFFF00] font-bold text-lg">⚡ Sharpii</span>
            <span className="bg-[#FFFF00]/20 text-[#FFFF00] text-xs font-semibold px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#FFFF00]/10 text-[#FFFF00] border-l-2 border-[#FFFF00] pl-[10px]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-white/40 text-xs mb-3 truncate">{email}</p>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-all text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[220px] min-h-screen bg-[#0d0d0f] p-6 flex-1">
        {children}
      </main>
    </div>
  )
}
