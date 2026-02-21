"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Check, ArrowRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { PRICING_PLANS, PRICING_CONFIG } from "@/lib/pricing-config"
import { useSession } from "@/lib/auth-client-simple"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface MyPricingPlansProps {
  showHeader?: boolean
  title?: string
  subtitle?: string
  className?: string
}

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}

export function MyPricingPlans({
  showHeader = true,
  title = "Choose Your Perfect Plan",
  subtitle = "Transform your images with professional AI enhancement. Start with any plan and upgrade anytime.",
  className = ""
}: MyPricingPlansProps) {
  const [isYearly, setIsYearly] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState<string | null>(null)
  const { data: authData, isLoading: sessionLoading } = useSession()

  const router = useRouter()
  const discountPercent = Math.round((PRICING_CONFIG.yearlyDiscount ?? 0) * 100)

  const handlePlanSelect = async (plan: any, skipAuthCheck = false) => {
    console.log('🎯 Plan selected:', plan.name, 'Billing:', isYearly ? 'yearly' : 'monthly')
    console.log('🔐 Auth state:', {
      user: authData?.user?.email,
      loading: sessionLoading,
      skipAuthCheck,
      timestamp: new Date().toISOString()
    })

    setIsLoading(plan.name)

    try {
      // If we're not skipping auth check, verify authentication first
      if (!skipAuthCheck) {
        // If session is still loading, wait
        if (sessionLoading) {
          console.log('⏳ Session loading, waiting...')
          setTimeout(() => {
            setIsLoading(null)
            handlePlanSelect(plan, skipAuthCheck)
          }, 300)
          return
        }

        // If user is not authenticated, store plan and redirect to login
        if (!authData?.user) {
          console.log('👤 User not authenticated - storing plan and redirecting to login')
          const planData = {
            plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
            billingPeriod: isYearly ? 'yearly' : 'monthly'
          }
          localStorage.setItem('selectedPlan', JSON.stringify(planData))
          console.log('💾 Stored plan data:', planData)
          router.push('/app/login')
          return
        }
      }

      console.log('✅ User authenticated - proceeding to checkout API')

      // Create the request body
      const requestBody = {
        plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
        billingPeriod: isYearly ? 'yearly' : 'monthly'
      }

      console.log('📦 Checkout request:', requestBody)

      // Call the checkout API
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      console.log('📞 Checkout response status:', response.status)

      // Parse response
      let data: any = null
      try {
        data = await response.json()
        console.log('📜 Checkout response data:', data)
      } catch (e) {
        console.error('❌ Failed to parse response:', e)
        toast.error('Invalid response from server')
        return
      }

      // Handle authentication errors
      if (response.status === 401) {
        console.log('❌ 401 - treating as unauthenticated')
        const planData = {
          plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
          billingPeriod: isYearly ? 'yearly' : 'monthly'
        }
        localStorage.setItem('selectedPlan', JSON.stringify(planData))
        router.push('/app/login')
        return
      }

      // Handle other errors
      if (!response.ok) {
        const message = (data && data.error) ? data.error : 'Failed to create checkout session'
        console.error('❌ Checkout failed:', message)
        toast.error(message)
        return
      }

      // Success - redirect to Dodo Payments
      if (data && data.checkoutUrl) {
        console.log('✅ Redirecting to Dodo checkout:', data.checkoutUrl)
        window.location.href = data.checkoutUrl
      } else {
        console.error('❌ No checkout URL in response')
        toast.error('No checkout URL received')
      }

    } catch (error) {
      console.error('❌ Checkout error:', error)
      toast.error(error instanceof Error ? error.message : 'Checkout failed')
    } finally {
      setIsLoading(null)
    }
  }

  // Single useEffect to handle stored plans after authentication
  React.useEffect(() => {
    console.log('🔍 useEffect triggered - checking for stored plans')
    console.log('🔍 Auth state:', {
      hasUser: !!authData?.user,
      userEmail: authData?.user?.email,
      loading: sessionLoading,
      timestamp: new Date().toISOString()
    })

    // Only process when user is authenticated and session is loaded
    if (authData?.user && !sessionLoading) {
      const storedPlan = localStorage.getItem('selectedPlan')
      console.log('🔍 Stored plan found:', storedPlan)

      if (storedPlan) {
        try {
          const planData = JSON.parse(storedPlan)
          console.log('🔍 Parsed plan data:', planData)

          // Find the matching plan
          const plan = PRICING_PLANS.find(p =>
            p.name.toLowerCase().replace(/\s+/g, '_') === planData.plan
          )

          if (plan) {
            console.log('🚀 Processing stored plan:', plan.name)

            // Clear the stored plan to prevent reprocessing
            localStorage.removeItem('selectedPlan')

            // Set the billing period
            setIsYearly(planData.billingPeriod === 'yearly')

            // Trigger checkout with a delay to ensure UI is ready
            setTimeout(() => {
              console.log('🚀 Triggering checkout for stored plan:', plan.name)
              handlePlanSelect(plan, true) // Skip auth check since user is already authenticated
            }, 1000)
          } else {
            console.log('❌ Plan not found for stored data:', planData.plan)
            localStorage.removeItem('selectedPlan')
          }
        } catch (error) {
          console.error('❌ Error parsing stored plan:', error)
          localStorage.removeItem('selectedPlan')
        }
      }
    }
  }, [authData?.user, sessionLoading])

  return (
    <div className={cn("relative w-full", className)}>
      {showHeader && (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center mb-12 sm:mb-14">
          <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-bold tracking-tight">
            {title}
          </motion.h2>
          <motion.p variants={fadeIn} className="mt-4 text-base sm:text-lg text-muted-foreground">
            {subtitle}
          </motion.p>

          {/* Billing Toggle */}
          <motion.div variants={fadeIn} className="mt-8 inline-flex items-center bg-muted/60 dark:bg-white/5 border border-border dark:border-white/10 rounded-full p-1.5 shadow-sm min-w-[360px]">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "w-40 sm:w-44 px-6 sm:px-8 py-2 rounded-full text-sm sm:text-base font-medium transition-all duration-300",
                !isYearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "w-40 sm:w-44 px-6 sm:px-8 py-2 rounded-full text-sm sm:text-base font-medium transition-all duration-300 relative",
                isYearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              yearly
               <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                 Save {discountPercent}%
               </span>
             </button>
           </motion.div>
        </motion.div>
      )}

      {/* Pricing Grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="group/tbl grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
      >
        {PRICING_PLANS.map((plan) => {
          const Icon = plan.icon || Star
          const monthlyPrice = plan.price.monthly
          const yearlyPrice = plan.price.yearly
          const displayPrice = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice
          const isCreator = plan.name.toLowerCase().includes("creator")
          const isProfessional = plan.name.toLowerCase().includes("professional")
          const isSpecial = isCreator || isProfessional
          const badgeGradient = plan.badge === "Most Popular"
            ? "from-accent-purple to-accent-blue"
            : plan.badge === "Popular"
            ? "from-accent-blue to-accent-blue/80"
            : plan.badge === "Enterprise"
            ? "from-accent-purple/80 to-accent-purple"
            : "from-accent-blue to-accent-purple"

          return (
            <motion.div key={plan.name} variants={fadeIn} className={cn("relative group", (!!plan.highlight) && "lg:scale-[1.03] z-10")}>
              {/* Card */}
              <div
                className={cn(
                  "relative h-full rounded-3xl p-6 sm:p-8 transition-all duration-300",
                  // Persistent colored backgrounds for Creator & Professional
                  isCreator && "bg-gradient-to-br from-accent-blue/15 to-accent-blue/5 dark:from-accent-blue/25 dark:to-accent-blue/10 border border-accent-blue/30 dark:border-accent-blue/25",
                  isProfessional && "bg-gradient-to-br from-accent-purple/15 to-accent-purple/5 dark:from-accent-purple/25 dark:to-accent-purple/10 border border-accent-purple/30 dark:border-accent-purple/25",
                  !isSpecial && "bg-card border border-border",
                  // Shared hovers
                  "hover:border-foreground/20 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] group-hover/tbl:-translate-y-0.5",
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className={cn("bg-gradient-to-r text-white px-3 py-1 rounded-full text-xs font-medium shadow", badgeGradient)}>
                      {plan.badge}
                    </div>
                  </div>
                )}

                 {/* Icon */}
                 <div className="flex justify-center mb-5 sm:mb-6">
                   <div className="p-3 rounded-2xl bg-muted/60 dark:bg-white/5 border border-border dark:border-white/10">
                     <Icon className="h-6 w-6 text-primary" />
                   </div>
                 </div>

                 {/* Title + subtitle */}
                 <h3 className="text-xl sm:text-2xl font-semibold text-center mb-1">{plan.name}</h3>
                 <p className="text-sm text-muted-foreground text-center mb-5 sm:mb-6">{plan.subtitle}</p>

                 {/* Price */}
                 <div className="text-center mb-6 sm:mb-8">
                   <div className="flex items-baseline justify-center gap-1 mb-1 sm:mb-2">
                     <span className="text-3xl sm:text-4xl font-bold">${displayPrice}</span>
                     <span className="text-muted-foreground">/month</span>
                   </div>
                   {isYearly && (
                     <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Save {discountPercent}%</div>
                   )}

                   {!isYearly && (
                     <div className="text-sm text-muted-foreground">Billed monthly</div>
                   )}

                   {isYearly && (
                     <div className="text-sm text-muted-foreground">${yearlyPrice}/year (billed annually)</div>
                   )}
                 </div>

                 {/* Description */}
                 <p className="text-center text-muted-foreground mb-6 sm:mb-8">{plan.description}</p>

                 {/* CTA */}
                 <button
                   onClick={(e) => {
                     e.preventDefault()
                     e.stopPropagation()
                     console.log('Button clicked for plan:', plan.name)
                     handlePlanSelect(plan)
                   }}
                   disabled={isLoading === plan.name}
                   className={cn(
                     "w-full mb-6 sm:mb-8 group/btn relative overflow-hidden rounded-xl px-6 py-3 font-medium transition-all duration-300",
                     plan.highlight
                       ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
                       : "bg-muted/60 dark:bg-white/5 text-foreground border border-border dark:border-white/10 hover:bg-muted hover:border-foreground/20"
                   )}
                 >
                   <span className="relative z-10 flex items-center justify-center gap-2">
                     {isLoading === plan.name ? (
                       "Processing..."
                     ) : (
                       <>
                         Get Started
                         <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                       </>
                     )}
                   </span>
                 </button>

                 {/* Features */}
                 <div className="space-y-3">
                   {plan.features.map((feature, i) => (
                     <div key={i} className="flex items-start gap-3">
                       <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                       <span className="text-sm text-muted-foreground leading-relaxed">{feature}</span>
                     </div>
                   ))}
                 </div>
               </div>
             </motion.div>
           )
         })}
      </motion.div>
    </div>
  )
}