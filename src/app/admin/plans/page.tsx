'use client'

import { useEffect, useState } from 'react'
import { getAdminHeaders } from '@/lib/admin-client-auth'

interface Plan {
  name: string
  subtitle?: string
  price: {
    monthly: number
    yearly: number
  }
  description?: string
  features: string[]
  credits: {
    monthly: number
    images?: number
  }
  resolution?: string
  processing?: string
  support?: string
  highlight?: boolean
  badge?: string | null
}

interface PlansResponse {
  plans: Plan[]
  last_updated?: string
}

function Skeleton() {
  return <div className="animate-pulse bg-white/10 rounded h-7 w-full" />
}

export default function PlansPage() {
  const [data, setData] = useState<PlansResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/plans', { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Plans</h1>
        <p className="text-white/40 text-sm mt-1">Subscription plan definitions</p>
      </div>

      {/* Note */}
      <div className="bg-[#FFFF00]/5 border border-[#FFFF00]/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-[#FFFF00] text-sm mt-0.5">📋</span>
        <div>
          <p className="text-[#FFFF00]/80 text-sm font-medium">Read-only reference</p>
          <p className="text-white/40 text-xs mt-0.5">
            Plan configuration lives in <code className="text-white/60 bg-white/10 px-1 py-0.5 rounded">src/lib/pricing-config.ts</code>
          </p>
          {data?.last_updated && (
            <p className="text-white/30 text-xs mt-1">Last updated: {data.last_updated}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(data?.plans ?? []).map((plan) => (
            <div
              key={plan.name}
              className={`bg-white/5 border rounded-xl p-5 relative ${
                plan.highlight ? 'border-[#FFFF00]/40' : 'border-white/10'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-2.5 left-4">
                  <span className="bg-[#FFFF00] text-black text-xs font-bold px-2.5 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-4">
                <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                {plan.subtitle && <p className="text-white/40 text-xs mt-0.5">{plan.subtitle}</p>}
                {plan.description && <p className="text-white/50 text-sm mt-1">{plan.description}</p>}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-white/40 text-xs">Monthly</div>
                  <div className="text-white font-bold text-xl mt-1">
                    ${plan.price.monthly}
                    <span className="text-white/30 text-xs font-normal">/mo</span>
                  </div>
                </div>
                {plan.price.yearly > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/40 text-xs">Yearly</div>
                    <div className="text-white font-bold text-xl mt-1">
                      ${plan.price.yearly}
                      <span className="text-white/30 text-xs font-normal">/yr</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Credits */}
              <div className="bg-[#FFFF00]/5 border border-[#FFFF00]/10 rounded-lg p-3 mb-4">
                <div className="text-[#FFFF00]/60 text-xs">Monthly Credits</div>
                <div className="text-[#FFFF00] font-bold text-2xl mt-1">
                  {plan.credits.monthly.toLocaleString()}
                </div>
                {plan.credits.images && (
                  <div className="text-white/30 text-xs mt-0.5">~{plan.credits.images.toLocaleString()} images</div>
                )}
              </div>

              {/* Features */}
              <div>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Features</p>
                <ul className="space-y-1.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#FFFF00] text-xs mt-0.5 shrink-0">✓</span>
                      <span className="text-white/60 text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          {(data?.plans ?? []).length === 0 && (
            <div className="col-span-3 py-12 text-center text-white/30 text-sm">No plans configured</div>
          )}
        </div>
      )}
    </div>
  )
}
