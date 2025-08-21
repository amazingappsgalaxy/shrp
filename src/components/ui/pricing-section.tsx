"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Check, Sparkles, Zap, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PricingPlan {
  name: string
  subtitle: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: string[]
  highlight?: boolean
  badge?: string | null
  icon?: React.ComponentType<{ className?: string }>
}

interface PricingSectionProps {
  title?: string
  subtitle?: string
  plans?: PricingPlan[]
  id?: string
}

export function PricingSection({
  title = "Choose Your Plan",
  subtitle = "Transform your AI images with professional-grade enhancement",
  plans = DEFAULT_PLANS,
  id,
}: PricingSectionProps) {
  const [isYearly, setIsYearly] = React.useState(true) // Default to yearly

  return (
    <section id={id} className="py-20 px-6 bg-gradient-to-br from-background via-background to-background/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-text-primary">{title.split(' ').slice(0, -1).join(' ')}</span>{" "}
            <span className="text-gradient-neon">{title.split(' ').slice(-1)[0]}</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-12">
            {subtitle}
          </p>
          
          {/* Toggle */}
          <div className="inline-flex items-center bg-glass-light border border-glass-border rounded-full p-1 backdrop-blur-xl">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-6 py-3 rounded-full text-sm font-medium transition-all duration-300",
                !isYearly
                  ? "bg-accent-neon text-white shadow-lg shadow-accent-neon/25"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 relative",
                isYearly
                  ? "bg-accent-neon text-white shadow-lg shadow-accent-neon/25"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-accent-purple text-white text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon || Sparkles
            const monthlyPrice = plan.price.monthly
            const yearlyPrice = plan.price.yearly
            const monthlySavings = isYearly ? Math.round(((monthlyPrice * 12) - yearlyPrice) / 12 * 100) / 100 : 0
            const displayPrice = monthlyPrice
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-xl transition-all duration-500 group flex flex-col h-full overflow-hidden",
                  "hover:border-transparent hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-[1.02]",
                  "before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-cyan-500/50 before:via-purple-500/50 before:to-pink-500/50 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100 before:-z-10",
                  "after:absolute after:inset-[1px] after:rounded-2xl after:bg-gradient-to-br after:from-slate-900/95 after:to-slate-800/95 after:-z-10",
                  plan.highlight && "border-cyan-500/60 shadow-2xl shadow-cyan-500/20 scale-[1.02] bg-gradient-to-br from-slate-900/95 to-slate-800/95 before:opacity-100",
                  plan.name === "Enterprise" && "bg-muted/50 dark:bg-background"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg border border-cyan-400/30 backdrop-blur-sm">
                      {plan.badge}
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                    plan.highlight 
                      ? "bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/40" 
                      : "bg-gradient-to-br from-slate-600 to-slate-700 group-hover:from-cyan-500/80 group-hover:to-purple-600/80"
                  )}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors duration-300">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-4 group-hover:text-slate-300 transition-colors duration-300">{plan.subtitle}</p>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">${displayPrice}</span>
                      <span className="text-slate-400 text-sm">/month</span>
                    </div>
                    {isYearly && monthlySavings > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-cyan-400 text-xs font-medium bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                          Save ${monthlySavings}/month
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-slate-300 text-sm leading-relaxed">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold transition-all duration-300 text-sm relative overflow-hidden group/btn",
                    plan.highlight
                      ? "bg-gradient-to-r from-cyan-500 to-purple-600 hover:shadow-lg hover:shadow-cyan-500/30 text-white border-0 hover:scale-105 hover:from-cyan-400 hover:to-purple-500"
                      : "bg-slate-800/50 border border-slate-600/50 text-white hover:border-cyan-500/50 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-600/10 hover:scale-105 hover:text-cyan-300"
                  )}
                >
                  <span className="relative z-10">Choose {plan.name}</span>
                  {!plan.highlight && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-purple-600/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  )}
                </Button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Default pricing plans based on Enhancor.ai credit system
const DEFAULT_PLANS: PricingPlan[] = [
  {
    name: "Basic",
    subtitle: "Beginners & hobbyists",
    price: { monthly: 9, yearly: 90 },
    description: "10,800 monthly credits - Up to 108 images can be enhanced.",
    features: [
      "HD resolution only (1080p)",
      "Basic skin enhancement",
      "AI Smoothness Fix",
      "Standard Mode only",
      "Selective Area Editing",
      "Texture Control Settings",
      "Crop Tool Access",
      "Face Detection & Smart Cropping",
      "Early Access to New Features",
      "Kora Human and cinema access",
      "Standard Processing Speed",
      "API Access",
      "Refunds for Failed Generations"
    ],
    icon: Sparkles
  },
  {
    name: "Creator",
    subtitle: "Creators & small teams",
    price: { monthly: 24, yearly: 240 },
    description: "28,800 monthly credits - Up to 288 images can be enhanced.",
    features: [
      "Supports up to 2K resolution",
      "Advanced skin enhancement",
      "AI Smoothness Fix",
      "Standard + Heavy Mode",
      "Full Selective Area Editing",
      "Texture Control Settings",
      "Auto Crop Face Detection",
      "Credit top-ups available",
      "Early Access to New Features",
      "Kora Character Consistency access",
      "Priority processing",
      "API Access",
      "Refunds for Failed Generations"
    ],
    highlight: false,
    badge: "Popular",
    icon: Zap
  },
  {
    name: "Professional",
    subtitle: "Studios & power users",
    price: { monthly: 39, yearly: 390 },
    description: "46,800 monthly credits - Up to 468 images can be enhanced.",
    features: [
      "Supports up to 4K resolution",
      "Photo-real skin restoration",
      "AI Smoothness Fix",
      "Standard + Heavy Mode",
      "Full Selective Area Editing",
      "Full Precision Texture Control",
      "Advanced Crop Tools",
      "Advanced Face Cropping",
      "Unlimited Credit Top-Ups",
      "Character Consistency Professional access",
      "Highest priority processing",
      "Team management tools",
      "24/7 Priority support"
    ],
    highlight: true,
    icon: Crown
  },
  {
    name: "Enterprise",
    subtitle: "Large teams & agencies",
    price: { monthly: 99, yearly: 990 },
    description: "118,800 monthly credits - Up to 1,188 images can be enhanced.",
    features: [
      "Supports up to 4K resolution",
      "Photo-real skin restoration",
      "AI Smoothness Fix",
      "Standard + Heavy Mode",
      "Full Selective Area Editing",
      "Full Precision Texture Control",
      "Advanced Crop Tools",
      "Advanced Face Cropping",
      "Unlimited Credit Top-Ups",
      "Portrait Upscaler Professional access",
      "Highest priority processing",
      "Automatic Refunds on Failed Generation",
      "Team management tools",
      "24/7 Priority support"
    ],
    icon: Crown
  }
]

// Demo data and component
export const PAYMENT_FREQUENCIES = [
  {
    id: "monthly",
    label: "Credits",
    priceSuffix: " credits",
  },
  {
    id: "yearly",
    label: "Bulk Credits",
    priceSuffix: " credits",
    discount: "Best Value",
  },
]

export const TIERS = [
  {
    id: "standard",
    name: "Standard",
    price: {
      monthly: "100",
      yearly: "100",
    },
    description: "512×512 • ≤ 0.26 MP",
    features: [
      "Budget-friendly processing",
      "Perfect for testing",
      "Quick turnaround",
      "Basic enhancement",
      "Standard quality output",
    ],
    cta: "Start Processing",
  },
  {
    id: "hd",
    name: "HD",
    price: {
      monthly: "130",
      yearly: "130",
    },
    description: "1024×1024 • ≤ 1.05 MP",
    features: [
      "High definition quality",
      "Enhanced detail preservation",
      "Improved skin textures",
      "Better facial features",
      "Professional results",
    ],
    cta: "Choose HD",
    popular: true,
  },
  {
    id: "fullhd",
    name: "Full HD",
    price: {
      monthly: "180",
      yearly: "180",
    },
    description: "1920×1080 • ≤ 2.07 MP",
    features: [
      "Professional grade quality",
      "Superior detail enhancement",
      "Advanced skin realism",
      "Precise facial corrections",
      "Commercial use ready",
    ],
    cta: "Go Professional",
  },
  {
    id: "4k",
    name: "4K Ultra HD",
    price: {
      monthly: "360",
      yearly: "360",
    },
    description: "2160×2160 • ≤ 4.66 MP",
    features: [
      "Ultra high definition",
      "Maximum detail preservation",
      "Studio-quality results",
      "Perfect for large prints",
      "Premium enhancement",
    ],
    cta: "Get Ultra HD",
    highlighted: true,
  },
]

export function PricingSectionDemo({ id }: { id?: string }) {
  return (
    <div className="relative flex justify-center items-center w-full mt-20 scale-90">
      <div className="absolute inset-0 -z-10">
        <div className="h-full w-full bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:35px_35px] opacity-30 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>
        <PricingSection
          id={id}
          title="Choose Your Plan"
          subtitle="Transform your AI images with professional-grade enhancement"
          plans={DEFAULT_PLANS}
        />
    </div>
  );
}
