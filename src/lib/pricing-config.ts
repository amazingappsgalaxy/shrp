import { Sparkles, Zap, Crown, Building2 } from "lucide-react"
import { ComponentType } from "react"

export interface PricingPlan {
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
  icon?: ComponentType<{ className?: string }>
  credits: {
    monthly: number
    images: number
  }
  resolution: string
  skinEnhancement: string
  modes: string[]
  processing: string
  support?: string
}

// Centralized pricing data based on the new requirements
export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Basic",
    subtitle: "Beginners & hobbyists",
    price: {
      monthly: 9,
      yearly: 96 // $8/month if yearly = $96/year (8*12)
    },
    description: "Perfect for getting started with AI image enhancement",
    credits: {
      monthly: 16200,
      images: 135
    },
    resolution: "HD resolution only (1080p)",
    skinEnhancement: "Basic skin enhancement",
    modes: ["Standard Mode only"],
    processing: "Standard Processing Speed",
    features: [
      "16,200 monthly credits",
      "Around 135 images can be enhanced",
      "HD resolution only (1080p)",
      "Basic skin enhancement",
      "Standard Models",
      "AI Smoothness Fix",
      "AI Plastic Face and Skin Fix",
      "Standard Mode only",
      "Selective Area Editing",
      "Standard Processing Speed"
    ],
    icon: Sparkles,
    highlight: false,
    badge: null
  },
  {
    name: "Creator",
    subtitle: "Creators & small teams",
    price: {
      monthly: 25,
      yearly: 252 // $252/year as specified
    },
    description: "Advanced features for content creators and small teams",
    credits: {
      monthly: 44400,
      images: 370
    },
    resolution: "Supports up to 2K resolution",
    skinEnhancement: "Advanced skin enhancement",
    modes: ["Standard Mode", "Heavy Mode"],
    processing: "Priority processing",
    support: "Priority support",
    features: [
      "44,400 monthly credits",
      "Around 370 images can be enhanced",
      "Supports up to 2K resolution",
      "Advanced skin enhancement",
      "Advanced Models",
      "AI Smoothness Fix",
      "AI Plastic Face and Skin Fix",
      "Standard + Heavy Mode",
      "Full Selective Area Editing",
      "Texture Control Settings",
      "Crop Tool Access",
      "Credit top-ups available",
      "Priority processing",
      "Priority support"
    ],
    icon: Zap,
    highlight: false,
    badge: "Popular"
  },
  {
    name: "Professional",
    subtitle: "Studios & power users",
    price: {
      monthly: 39,
      yearly: 34 * 12 // $34/month if yearly = $408/year
    },
    description: "Professional-grade features for studios and power users",
    credits: {
      monthly: 73800,
      images: 615
    },
    resolution: "Supports up to 4K resolution",
    skinEnhancement: "Photo-real skin restoration",
    modes: ["Standard Mode", "Heavy Mode"],
    processing: "Priority processing",
    features: [
      "73,800 monthly credits",
      "Around 615 images can be enhanced",
      "Supports up to 4K resolution",
      "Photo-real skin restoration",
      "AI Smoothness Fix",
      "Advanced Models",
      "AI Plastic Face and Skin Fix",
      "Standard + Heavy Mode",
      "Full Selective Area Editing",
      "Full Precision Texture Control",
      "Portrait Upscaler Professional access",
      "Advanced Crop Tools",
      "Unlimited Credit Top-Ups",
      "Early Access to New Features",
      "Priority processing"
    ],
    icon: Crown,
    highlight: true,
    badge: "Most Popular"
  },
  {
    name: "Enterprise",
    subtitle: "Large teams & agencies",
    price: {
      monthly: 99,
      yearly: 84 * 12 // $84/month if yearly = $1008/year
    },
    description: "Enterprise-grade solution for large teams and agencies",
    credits: {
      monthly: 187800,
      images: 1565
    },
    resolution: "Supports up to 4K resolution",
    skinEnhancement: "Photo-real skin restoration",
    modes: ["Standard Mode", "Heavy Mode"],
    processing: "Priority processing",
    features: [
      "187,800 monthly credits",
      "Around 1,565 images can be enhanced",
      "Supports up to 4K resolution",
      "Photo-real skin restoration",
      "AI Smoothness Fix",
      "Advanced Models",
      "AI Plastic Face and Skin Fix",
      "Standard + Heavy Mode",
      "Full Selective Area Editing",
      "Full Precision Texture Control",
      "Portrait Upscaler Professional access",
      "Advanced Crop Tools",
      "Unlimited Credit Top-Ups",
      "Early Access to New Features",
      "Priority processing"
    ],
    icon: Building2,
    highlight: false,
    badge: "Enterprise"
  },
  {
    name: "Day Pass",
    subtitle: "24-hour access for testing",
    price: {
      monthly: 10, // Use monthly field but treat as daily price
      yearly: 0
    },
    description: "Perfect for short-term projects and testing",
    credits: {
      monthly: 9900, // Credits provided for the 24h period
      images: 82
    },
    resolution: "Supports up to 4K resolution",
    skinEnhancement: "Advanced skin enhancement",
    modes: ["Standard Mode", "Heavy Mode"],
    processing: "Priority processing",
    features: [
      "9,900 credits for 24 hours",
      "Credits expire after 24 hours",
      "Appropriate for rapid testing",
      "Same features as Creator plan",
      "Auto-renews daily (for testing)"
    ],
    icon: Zap,
    highlight: false,
    badge: "Test"
  }
]

// Pricing configuration constants
export const PRICING_CONFIG = {
  yearlyDiscount: 0.15, // 15% discount
  currency: "USD",
  billingPeriods: {
    monthly: "month",
    yearly: "year",
    daily: "day"
  }
} as const

// Helper functions
export function getYearlyPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * (1 - PRICING_CONFIG.yearlyDiscount))
}

export function getMonthlySavings(monthlyPrice: number): number {
  const yearlyTotal = getYearlyPrice(monthlyPrice)
  const monthlyTotal = monthlyPrice * 12
  return Math.round((monthlyTotal - yearlyTotal) / 12 * 100) / 100
}

export function getYearlySavings(monthlyPrice: number): number {
  const yearlyTotal = getYearlyPrice(monthlyPrice)
  const monthlyTotal = monthlyPrice * 12
  return monthlyTotal - yearlyTotal
}

/**
 * How many days subscription credits last per billing period.
 * All credits expire on a monthly cycle regardless of whether the user
 * subscribed monthly or yearly. Daily (Day Pass) expires after 1 day.
 * Change these values here to adjust expiry for all plans at once.
 */
export const BILLING_PERIOD_EXPIRY_DAYS: Record<string, number> = {
  daily: 1,
  monthly: 30,
  yearly: 30, // yearly subscribers still get monthly credit cycles
}

/**
 * Compute the expiry date for subscription credits.
 * @param billingPeriod - 'daily' | 'monthly' | 'yearly'
 * @param fromDate - start of the period (defaults to now)
 */
export function computePeriodEnd(billingPeriod: string, fromDate?: Date): Date {
  const d = fromDate ? new Date(fromDate) : new Date()
  const days = BILLING_PERIOD_EXPIRY_DAYS[billingPeriod] ?? 30
  d.setDate(d.getDate() + days)
  return d
}

// Export default plans for backward compatibility
export default PRICING_PLANS