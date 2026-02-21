'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppData } from '@/lib/hooks/use-app-data'
import CreditsSection from '@/components/app/dashboard/CreditsSection'
import OptimizedUsageSection from '@/components/app/dashboard/OptimizedUsageSection'
import BillingSection from '@/components/app/dashboard/BillingSection'
import UserSettingsSection from '@/components/app/dashboard/UserSettingsSection'
import { ElegantLoading } from '@/components/ui/elegant-loading'
import { Suspense } from 'react'
import Link from 'next/link'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading, isDemo } = useAppData()
  const [activeSection, setActiveSection] = useState('credits')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['credits', 'usage', 'billing', 'settings'].includes(tab)) {
      setActiveSection(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (!isLoading && !user && !isDemo) {
      router.push('/app/signin')
    }
  }, [isLoading, user, isDemo, router])

  if (isLoading) {
    return <ElegantLoading message="Loading your dashboard..." />
  }

  if (!user && !isDemo) {
    return null
  }

  if (!user && isDemo) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-md bg-[#FFFF00]/10 border border-[#FFFF00]/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#FFFF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Create your account</h2>
          <p className="text-white/50 text-sm mb-8">Sign up to access your dashboard — track credits, view billing history, and manage your subscription.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/app/signin?tab=signup" className="bg-[#FFFF00] text-black font-bold px-6 py-2.5 rounded-md hover:bg-yellow-300 transition text-sm">
              Get Started
            </Link>
            <Link href="/app/signin" className="border border-white/20 text-white/70 hover:text-white font-medium px-6 py-2.5 rounded-md transition text-sm">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'credits', label: 'Profile' },
    { id: 'usage', label: 'Activity' },
    { id: 'billing', label: 'Billings' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#FFFF00] selection:text-black">
      <main className="pt-24 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Compact Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Dashboard
            </h1>
          </div>

          {/* Segmented Control */}
          <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-md p-1 gap-0.5">
            {tabs.map((tab) => {
              const isActive = activeSection === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div>
            {activeSection === 'credits' && <CreditsSection />}
            {activeSection === 'usage' && <OptimizedUsageSection />}
            {activeSection === 'billing' && <BillingSection />}
            {activeSection === 'settings' && <UserSettingsSection />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<ElegantLoading message="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  )
}
