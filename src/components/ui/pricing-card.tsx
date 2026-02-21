"use client"

import * as React from "react"
import { BadgeCheck, ArrowRight } from "lucide-react"
import NumberFlow from "@number-flow/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PRICING_CONFIG } from "@/lib/pricing-config"

export interface PricingTier {
  name: string
  price: Record<string, number | string>
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
  popular?: boolean
  glow?: boolean
}

interface PricingCardProps {
  tier: PricingTier
  paymentFrequency: string
}

export function PricingCard({ tier, paymentFrequency }: PricingCardProps) {
  const price = tier.price[paymentFrequency]
  const isHighlighted = tier.highlighted
  const isPopular = tier.popular
  const hasGlow = tier.glow

  const discountPercent = Math.round((PRICING_CONFIG.yearlyDiscount ?? 0) * 100)

  // Accent gradients per plan for bright, premium look
  const accent = React.useMemo(() => {
    switch (tier.name) {
      case "Basic":
        return {
          ring: "from-cyan-400/60 via-sky-400/60 to-blue-500/60",
          glow: "shadow-cyan-500/25",
          text: "from-cyan-300 to-sky-400",
          badge: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
          button: "from-cyan-400/80 to-blue-500/80",
        }
      case "Creator":
        return {
          ring: "from-fuchsia-400/60 via-pink-500/60 to-rose-500/60",
          glow: "shadow-pink-500/25",
          text: "from-fuchsia-300 to-pink-400",
          badge: "bg-pink-500/20 text-pink-300 border-pink-400/30",
          button: "from-fuchsia-500/80 to-pink-500/80",
        }
      case "Professional":
        return {
          ring: "from-purple-400/70 via-violet-500/70 to-indigo-500/70",
          glow: "shadow-purple-500/30",
          text: "from-purple-300 to-indigo-400",
          badge: "bg-purple-500/20 text-purple-300 border-purple-400/30",
          button: "from-purple-500/80 to-indigo-500/80",
        }
      default:
        return {
          ring: "from-emerald-400/70 via-teal-500/70 to-cyan-500/70",
          glow: "shadow-emerald-500/25",
          text: "from-emerald-300 to-teal-400",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
          button: "from-emerald-500/80 to-teal-500/80",
        }
    }
  }, [tier.name])

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-500",
        "bg-white/10 backdrop-blur-xl border border-white/10",
        "hover:border-transparent hover:bg-white/15 hover:scale-[1.02]",
        isPopular && "ring-1 ring-primary/30 shadow-lg shadow-primary/20",
        hasGlow && `shadow-lg ${accent.glow}`,
        tier.name === "Enterprise" && "bg-gray-900/50 border-gray-700/50"
      )}
    >
      {/* Animated gradient ring */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500",
          `bg-[radial-gradient(1200px_400px_at_50%_-20%,transparent_30%,rgba(255,255,255,0.12)_70%)] group-hover:opacity-100`
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-20 rounded-2xl p-[1px] opacity-40 group-hover:opacity-100 transition-opacity duration-500",
          `bg-gradient-to-r ${accent.ring}`
        )}
      />
      <div className="absolute inset-[1px] -z-10 rounded-2xl bg-gradient-to-b from-white/5 to-white/0" />

      {/* Simple Badge */}
      {isPopular && (
        <div className="absolute top-4 right-4">
          <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-medium border border-primary/30">
            Popular
          </div>
        </div>
      )}
      
      {hasGlow && (
        <div className="absolute top-4 right-4">
          <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-medium border border-purple-400/30">
            Pro
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-6 space-y-6">
        {/* Plan Name */}
        <div>
          <h3 className={cn("text-xl font-semibold mb-2 bg-clip-text text-transparent", `bg-gradient-to-r ${accent.text}`)}>
            {tier.name}
          </h3>
          <p className="text-gray-300/90 text-sm leading-relaxed">
            {tier.description}
          </p>
        </div>

        {/* Pricing */}
        <div className="py-2">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg text-gray-300/80">$</span>
            {typeof price === "number" ? (
              <NumberFlow
                value={price}
                className={cn("text-4xl font-bold bg-clip-text text-transparent", `bg-gradient-to-r ${accent.text}`)}
                willChange
              />
            ) : (
              <span className={cn("text-4xl font-bold bg-clip-text text-transparent", `bg-gradient-to-r ${accent.text}`)}>{price}</span>
            )}
            <span className="text-lg text-gray-300/80">
              /{paymentFrequency === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
          {paymentFrequency === 'yearly' && (
            <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border", accent.badge)}>
              Save {discountPercent}%
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <BadgeCheck className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-200/90 leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          className={cn(
            "w-full transition-all duration-300 font-medium text-white border border-white/20",
            "hover:-translate-y-0.5 hover:shadow-xl",
            "bg-gradient-to-r",
            accent.button
          )}
        >
          {tier.cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
