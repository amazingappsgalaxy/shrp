"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ArrowRight, Loader2, Sparkles, Zap, Star, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { PRICING_PLANS } from "@/lib/pricing-config"
import { useAppData } from "@/lib/hooks/use-app-data"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from '@/components/ui/button'
import UpgradeModal from "@/components/app/dashboard/UpgradeModal"

interface MyPricingPlans2Props {
  showHeader?: boolean
  title?: string
  subtitle?: string
  className?: string
  /** Pre-loaded sub from parent (UserHeader) — skips internal fetch when provided */
  preloadedActiveSub?: { plan: string; billing_period: string } | null
  /** True when parent has already finished checking subscription */
  preloadedSubChecked?: boolean
}

type FREQUENCY = 'monthly' | 'yearly'

export function MyPricingPlans2({
  showHeader = true,
  className = "",
  preloadedActiveSub,
  preloadedSubChecked = false,
}: MyPricingPlans2Props) {
  const [frequency, setFrequency] = useState<FREQUENCY>('monthly')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { user, subscription: subData, isLoading: appLoading } = useAppData()
  const router = useRouter()

  // Derive active subscription from SWR data or preloaded props
  const activeSub = React.useMemo(() => {
    if (preloadedSubChecked && preloadedActiveSub) return preloadedActiveSub
    if (subData?.has_active_subscription && subData.subscription) {
      return { plan: subData.subscription.plan, billing_period: subData.subscription.billing_period }
    }
    return null
  }, [preloadedSubChecked, preloadedActiveSub, subData])

  const subChecked = preloadedSubChecked || !appLoading

  const handlePlanSelect = async (plan: any) => {
    setIsLoading(plan.name)
    try {
      if (appLoading) {
        setTimeout(() => { setIsLoading(null); handlePlanSelect(plan) }, 300)
        return
      }
      const isDayPass = plan.name.toLowerCase().includes('day')
      const planKey = isDayPass ? 'day pass' : plan.name.toLowerCase().replace(/\s+/g, '_')
      const billingPeriod = isDayPass ? 'daily' : frequency

      if (!user) {
        const planData = { plan: planKey, billingPeriod }
        localStorage.setItem('selectedPlan', JSON.stringify(planData))
        router.push('/app/signin')
        return
      }

      const requestBody = { plan: planKey, billingPeriod }
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      let data: any = null
      try { data = await response.json() } catch (e) { toast.error('Invalid response from server'); return }

      if (response.status === 401) {
        const planData = { plan: planKey, billingPeriod }
        localStorage.setItem('selectedPlan', JSON.stringify(planData))
        router.push('/app/signin')
        return
      }
      if (!response.ok) { toast.error(data?.error || 'Failed to create checkout session'); return }
      if (data?.checkoutUrl) {
        toast.success('Redirecting to payment...')
        window.location.href = data.checkoutUrl
      } else {
        toast.error('No checkout URL received')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed')
    } finally {
      setIsLoading(null)
    }
  }

  // Subscribed user → show upgrade flow inline (no checkout)
  if (subChecked && activeSub) {
    return (
      <div className={cn('flex items-center justify-center py-16', className)}>
        <UpgradeModal
          inline
          currentPlan={activeSub.plan}
          currentBillingPeriod={activeSub.billing_period}
          onClose={() => {}}
          onSuccess={() => {
            window.dispatchEvent(new Event('sharpii:close-plans'))
          }}
        />
      </div>
    )
  }

  return (
    <section className={cn("pb-8 relative overflow-hidden", className)}>
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-[#FFFF00]/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        {showHeader && (
          <div className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 mb-8 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-[#FFFF00]" />
              <span className="text-xs font-bold font-sans text-white/80 uppercase tracking-widest">
                Official Pricing
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 leading-tight text-white tracking-tight">
              Start Your <span className="text-[#FFFF00]">Journey.</span>
            </h2>

            <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed font-sans">
              Transparent pricing for everyone. Upgrade, downgrade, or cancel anytime.
            </p>
          </div>
        )}

        {/* Segmented Control Toggle - WHITE style */}
        <div className="flex justify-center mt-0 mb-10">
          <div className="flex items-center p-1 bg-white/10 border border-white/10 rounded-full relative">
            {/* Sliding Background - White */}
            <motion.div
              className="absolute top-1 bottom-1 bg-white rounded-full shadow-lg z-0"
              initial={false}
              animate={{
                x: frequency === 'monthly' ? 0 : '100%',
                width: '50%'
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />

            <button
              onClick={() => setFrequency('monthly')}
              className={cn(
                "px-8 py-2.5 rounded-full text-sm font-bold transition-colors relative z-10 w-32",
                frequency === 'monthly' ? "text-black" : "text-white/60 hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setFrequency('yearly')}
              className={cn(
                "px-8 py-2.5 rounded-full text-sm font-bold transition-colors relative z-10 w-32 flex items-center justify-center gap-2",
                frequency === 'yearly' ? "text-black" : "text-white/60 hover:text-white"
              )}
            >
              Yearly
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-black",
                frequency === 'yearly'
                  ? "bg-black/10 text-black border border-black/10"
                  : "bg-[#FFFF00] text-black border border-[#FFFF00]"
              )}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto items-stretch">
          {PRICING_PLANS.map((plan, i) => {
            const isDayPass = plan.name.toLowerCase().includes('day pass') || plan.name.toLowerCase().includes('day')
            const monthlyPrice = plan.price.monthly
            const yearlyPrice = plan.price.yearly
            const displayPrice = isDayPass ? plan.price.monthly : (frequency === 'yearly' ? Math.round(yearlyPrice / 12) : monthlyPrice)
            const isCreator = plan.name === "Creator"
            const isPro = plan.name === "Professional"

            const isHighlighted = isCreator || isPro

            return (
              <div
                key={i}
                className={cn(
                  "flex flex-col p-6 lg:p-8 rounded-[2rem] transition-all duration-300 relative group h-full overflow-visible",
                  "hover:scale-[1.02] hover:-translate-y-1",
                  isCreator
                    ? "bg-[#FFFF00] text-black border border-[#FFFF00] shadow-[0_0_50px_rgba(255,255,0,0.15)]"
                    : isPro
                      ? "bg-[#FFFF00] text-black shadow-[0_0_80px_rgba(255,255,0,0.3)] z-10 scale-[1.02] ring-2 ring-white/50 ring-offset-4 ring-offset-black"
                      : "bg-[#0A0A0A] border border-white/5 text-white hover:border-white/10"
                )}
              >
                {/* Content Container to ensure internal clipping if valid */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                  {/* Shimmering Overlay for Pro (Subtle) */}
                  {isPro && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_3.5s_infinite] opacity-30 z-0 pointer-events-none" />
                  )}
                </div>

                {/* Popular Badge - Moved Top Right */}
                {plan.badge && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md",
                      isHighlighted
                        ? "bg-black text-[#FFFF00]"
                        : "bg-[#FFFF00] text-black"
                    )}>
                      <Star className="w-3 h-3 fill-current" />
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Plan Name */}
                <div className="mb-6 pt-8 relative z-20">
                  <h3 className={cn(
                    "text-lg font-black uppercase tracking-tight font-heading",
                    isCreator ? "text-black" : isPro ? "text-black" : "text-white"
                  )}>
                    {plan.name}
                  </h3>
                  <p className={cn(
                    "text-xs font-medium mt-1 leading-relaxed opacity-70 font-sans",
                    isCreator ? "text-black" : isPro ? "text-black" : "text-white/60"
                  )}>
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-8 relative z-20">
                  <div className="flex items-baseline gap-1">
                    <span className={cn(
                      "text-4xl font-black font-heading tracking-tight",
                      isHighlighted ? "text-black" : "text-white"
                    )}>${displayPrice}</span>
                    <span className={cn(
                      "text-xs font-bold uppercase font-sans mb-1",
                      isHighlighted ? "text-black/60" : "text-white/40"
                    )}>{isDayPass ? '/day' : '/mo'}</span>
                  </div>

                  {frequency === 'yearly' && !isDayPass && (
                    <div className={cn(
                      "mt-2 text-[10px] font-bold uppercase tracking-wide font-sans px-2 py-0.5 rounded w-fit",
                      isHighlighted ? "bg-black/5 text-black/70" : "bg-[#FFFF00]/10 text-[#FFFF00]"
                    )}>
                      Billed ${yearlyPrice}/yr
                    </div>
                  )}
                </div>

                {/* Credits Highlight */}
                <div className={cn(
                  "mb-8 p-4 rounded-xl border flex items-center gap-3 relative z-20",
                  isHighlighted
                    ? "bg-black border-black text-[#FFFF00]"
                    : "bg-white/5 border-white/5"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isHighlighted ? "bg-[#FFFF00] text-black" : "bg-[#FFFF00]/10 text-[#FFFF00]"
                  )}>
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <div className={cn(
                      "text-base font-bold font-sans",
                      isHighlighted ? "text-[#FFFF00]" : "text-[#FFFF00]"
                    )}>
                      {plan.credits.monthly.toLocaleString()} Credits
                    </div>
                    <div className={cn("text-[8px] uppercase font-bold tracking-wider opacity-60 font-sans", isHighlighted ? "text-[#FFFF00]" : "text-white")}>
                      Per Month
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8 flex-1 relative z-20">
                  <ul className="space-y-2.5">
                    {plan.features.slice(0, 7).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          isHighlighted ? "bg-black/10 text-black" : "bg-white/10 text-white/30"
                        )}>
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </div>
                        <span className={cn(
                          "text-xs font-medium font-sans leading-relaxed",
                          isHighlighted ? "text-black/80" : "text-white/70"
                        )}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button */}
                <div className="mt-auto relative z-20">
                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isLoading === plan.name}
                    className={cn(
                      "w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 overflow-hidden relative group/btn",
                      "shadow-lg hover:translate-y-[-2px]",
                      isHighlighted
                        ? "bg-black text-white hover:bg-black/90 hover:shadow-xl"
                        : "bg-white text-black hover:bg-[#FFFF00]"
                    )}
                  >
                    {/* Shimmer Effect */}
                    <span className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />

                    <span className="relative z-20 flex items-center justify-center gap-2">
                      {isLoading === plan.name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Get Started
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
