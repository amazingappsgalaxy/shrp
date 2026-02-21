"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { ArrowRight, CheckCircle, Sparkles, Crown, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { PRICING_PLANS, PRICING_CONFIG } from "@/lib/pricing-config"
import { useSession } from "@/lib/auth-client-simple"
import { useRouter } from "next/navigation"

interface PricingTableTemporaryProps {
  showHeader?: boolean
  title?: string
  subtitle?: string
  className?: string
}

type FREQUENCY = 'monthly' | 'yearly'
const frequencies: FREQUENCY[] = ['monthly', 'yearly']

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
}

type PricingFrequencyToggleProps = React.ComponentProps<'div'> & {
  frequency: FREQUENCY
  setFrequency: React.Dispatch<React.SetStateAction<FREQUENCY>>
}

function PricingFrequencyToggle({
  frequency,
  setFrequency,
  ...props
}: PricingFrequencyToggleProps) {
  const discountPercent = Math.round((PRICING_CONFIG.yearlyDiscount ?? 0) * 100)

  return (
    <div
      className={cn(
        'glass-elevated mx-auto flex w-fit rounded-full border border-white/10 p-1.5 bg-black/40 backdrop-blur-md',
        props.className,
      )}
      {...props}
    >
      {frequencies.map((freq) => (
        <button
          key={freq}
          onClick={() => setFrequency(freq)}
          className={cn(
            "relative px-8 py-3 text-sm font-bold capitalize transition-all duration-300 rounded-full",
            frequency === freq
              ? "text-black"
              : "text-white/60 hover:text-white"
          )}
        >
          {frequency === freq && (
            <motion.div
              layoutId="activeFrequencyTemp"
              className="absolute inset-0 bg-accent-neon rounded-full shadow-[0_0_20px_-5px_hsl(var(--accent-neon)/0.5)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {freq}
            {freq === 'yearly' && (
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider",
                frequency === freq ? "bg-black/20 text-black" : "bg-accent-neon text-black"
              )}>
                -{discountPercent}%
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

type PricingCardProps = HTMLMotionProps<'div'> & {
  plan: any
  frequency?: FREQUENCY
  onPlanSelect: (plan: any) => void
  isLoading?: boolean
}

function PricingCard({
  plan,
  className,
  frequency = frequencies[0],
  onPlanSelect,
  isLoading,
  ...props
}: PricingCardProps) {
  const monthlyPrice = plan.price.monthly
  const yearlyPrice = plan.price.yearly
  const displayPrice = frequency === 'yearly' ? Math.round(yearlyPrice / 12) : monthlyPrice
  const isCreator = plan.name.toLowerCase().includes("creator")
  const isProfessional = plan.name.toLowerCase().includes("professional")
  
  // Design Logic:
  // Professional -> Gold/Neon (Premium)
  // Creator -> Blue/Purple (Creative)
  // Basic -> Glass/Neutral

  const cardStyle = isProfessional
    ? "bg-gradient-to-b from-[#1a1a00] to-black border-accent-neon/30 shadow-[0_0_40px_-10px_hsl(var(--accent-neon)/0.15)]"
    : isCreator
      ? "bg-gradient-to-b from-[#0f172a] to-black border-accent-blue/30 shadow-[0_0_40px_-10px_hsl(var(--accent-blue)/0.15)]"
      : "bg-black/60 backdrop-blur-xl border-white/10"

  const buttonStyle = isProfessional
    ? "bg-accent-neon text-black hover:bg-accent-neon/90 shadow-[0_0_20px_hsl(var(--accent-neon)/0.3)]"
    : isCreator
      ? "bg-accent-blue text-white hover:bg-accent-blue/90 shadow-[0_0_20px_hsl(var(--accent-blue)/0.3)]"
      : "bg-white/10 text-white border border-white/10 hover:bg-white/20"

  const accentColor = isProfessional 
    ? "text-accent-neon" 
    : isCreator 
      ? "text-accent-blue" 
      : "text-white"

  const featuresList = plan.features.slice(0, 7) // Limit to 7 lines

  return (
    <motion.div
      key={plan.name}
      className={cn(
        'relative flex w-full flex-col rounded-3xl border overflow-hidden transition-all duration-500 hover:-translate-y-2',
        cardStyle,
        className,
      )}
      {...props}
    >
      {/* Glow Effects */}
      {(isCreator || isProfessional) && (
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b opacity-20 blur-3xl",
            isProfessional ? "from-accent-neon via-transparent to-transparent" : "from-accent-blue via-transparent to-transparent"
          )} />
        </div>
      )}

      <div className="p-8 relative z-10 flex flex-col h-full">
        {/* Header with Badge Handling to avoid overlap */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-start w-full">
             <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner",
                isProfessional ? "bg-accent-neon/10 text-accent-neon border border-accent-neon/20" : 
                isCreator ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20" : 
                "bg-white/5 text-white/60 border border-white/10"
              )}>
                {isProfessional ? <Crown className="w-6 h-6" /> : isCreator ? <Zap className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
              </div>

             {plan.badge && (
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-lg",
                  isProfessional 
                    ? "bg-accent-neon text-black shadow-accent-neon/20"
                    : "bg-accent-blue text-white shadow-accent-blue/20"
                )}>
                  {plan.badge}
                </div>
              )}
          </div>

          <div>
            <h3 className={cn("text-2xl font-bold mb-2", isProfessional ? "text-white" : "text-white")}>
              {plan.name}
            </h3>
            <p className="text-white/50 text-sm font-medium leading-relaxed min-h-[40px] line-clamp-2">
              {plan.subtitle}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className={cn("text-4xl font-bold tracking-tight", isProfessional ? "text-accent-neon" : "text-white")}>
              ${displayPrice}
            </span>
            <span className="text-white/40 font-medium">/month</span>
          </div>
          {frequency === 'yearly' && (
            <p className="text-xs text-accent-neon font-bold mt-2">
              Billed ${yearlyPrice} yearly
            </p>
          )}
        </div>

        <div className="w-full h-px bg-white/10 mb-6" />

        {/* Credits Box */}
        <div className={cn(
          "mb-8 p-4 rounded-xl border flex items-center gap-4",
          isProfessional 
            ? "bg-accent-neon/5 border-accent-neon/20"
            : isCreator
              ? "bg-accent-blue/5 border-accent-blue/20"
              : "bg-white/5 border-white/5"
        )}>
          <div className={cn(
            "p-2 rounded-lg",
            isProfessional ? "bg-accent-neon/10 text-accent-neon" : isCreator ? "bg-accent-blue/10 text-accent-blue" : "bg-white/10 text-white/60"
          )}>
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
             <div className="text-white font-bold text-sm">
                {plan.credits.monthly.toLocaleString()} Credits
             </div>
             <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                Per Month
             </div>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {featuresList.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-3 text-sm text-white/70 group/feature">
              <CheckCircle className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors duration-300",
                isProfessional ? "text-accent-neon" :
                  isCreator ? "text-accent-blue" : "text-white/30"
              )} />
              <span className="line-clamp-1" title={feature}>{feature}</span>
            </li>
          ))}
          {plan.features.length > 7 && (
            <li className="text-xs text-white/40 pl-8 italic">
              + {plan.features.length - 7} more features
            </li>
          )}
        </ul>

        {/* CTA Button */}
        <button
          className={cn(
            "w-full rounded-xl py-4 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn",
            buttonStyle
          )}
          onClick={() => onPlanSelect(plan)}
          disabled={isLoading}
        >
          {isLoading ? (
            <span>Processing...</span>
          ) : (
            <>
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

export function PricingTableTemporary({
  showHeader = true,
  title = "Pricing Table Temporary",
  subtitle = "Choose the plan that fits your needs.",
  className = ""
}: PricingTableTemporaryProps) {
  const [frequency, setFrequency] = React.useState<FREQUENCY>('monthly')
  const [isLoading, setIsLoading] = React.useState<string | null>(null)
  const { data: authData, isLoading: sessionLoading } = useSession()
  const router = useRouter()

  const handlePlanSelect = async (plan: any) => {
    console.log('🎯 Plan selected:', plan.name, 'Billing:', frequency)

    setIsLoading(plan.name)

    try {
      if (sessionLoading) {
        setTimeout(() => {
          setIsLoading(null)
          handlePlanSelect(plan)
        }, 300)
        return
      }

      if (!authData?.user) {
        const planData = {
          plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
          billingPeriod: frequency
        }
        localStorage.setItem('selectedPlan', JSON.stringify(planData))
        router.push('/signup')
        return
      }

      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.name.toLowerCase().replace(/\s+/g, '_'),
          billingPeriod: frequency,
          userId: authData.user.id,
          email: authData.user.email
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate checkout')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
      setIsLoading(null)
    }
  }

  return (
    <section className={cn("py-24 relative overflow-hidden", className)} id="pricing-temp">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-neon/5 rounded-full blur-[100px]" />
      </div>

      <div className="container px-4 mx-auto relative z-10">
        {showHeader && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              {title}
            </h2>
            <p className="text-lg text-white/60 mb-8">
              {subtitle}
            </p>
            
            <PricingFrequencyToggle 
              frequency={frequency} 
              setFrequency={setFrequency}
            />
          </div>
        )}

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {PRICING_PLANS.map((plan) => (
            <motion.div key={plan.name} variants={fadeInUp} className="flex">
              <PricingCard
                plan={plan}
                frequency={frequency}
                onPlanSelect={handlePlanSelect}
                isLoading={isLoading === plan.name}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
