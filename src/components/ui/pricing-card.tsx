"use client"

import * as React from "react"
import { BadgeCheck, ArrowRight } from "lucide-react"
import NumberFlow from "@number-flow/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

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

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
        "bg-white/5 backdrop-blur-xl border border-white/10",
        "hover:border-white/20 hover:bg-white/10",
        isPopular && "ring-1 ring-primary/30 shadow-lg shadow-primary/20",
        hasGlow && "ring-1 ring-purple-500/30 shadow-lg shadow-purple-500/20",
        tier.name === "Enterprise" && "bg-gray-900/50 border-gray-700/50"
      )}
    >
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
          <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/30">
            Pro
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-6 space-y-6">
        {/* Plan Name */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {tier.name}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {tier.description}
          </p>
        </div>

        {/* Pricing */}
        <div className="py-2">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg text-gray-400">$</span>
            {typeof price === "number" ? (
              <NumberFlow
                value={price}
                className="text-4xl font-bold text-white"
                willChange
              />
            ) : (
              <span className="text-4xl font-bold text-white">{price}</span>
            )}
            <span className="text-lg text-gray-400">
              /{paymentFrequency === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
          {paymentFrequency === 'yearly' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              Save 17%
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <BadgeCheck className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-300 leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          className={cn(
            "w-full transition-all duration-300 font-medium",
            "bg-white/10 text-white border border-white/20 hover:bg-white/20",
            isPopular && "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30",
            hasGlow && "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30"
          )}
        >
          {tier.cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
