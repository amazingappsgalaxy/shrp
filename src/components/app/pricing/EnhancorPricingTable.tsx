"use client"

import * as React from "react"
import { Check, Crown, Zap, Star } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PricingTier {
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
  }
  credits: string
  features: string[]
  popular?: boolean
  icon?: React.ReactNode
  buttonText: string
  buttonVariant?: "default" | "outline"
}

interface EnhancorPricingTableProps {
  className?: string
}

const pricingTiers: PricingTier[] = [
  {
    name: "Testing",
    description: "Perfect for trying out Enhancor",
    price: {
      monthly: 10,
      yearly: 100
    },
    credits: "≤ 512×512 (≤ 0.26 MP)",
    features: [
      "100 credits per image",
      "Basic enhancement",
      "Standard processing",
      "Email support",
      "Face detection & cropping",
      "Photo resizer tools"
    ],
    icon: <Zap className="h-5 w-5" />,
    buttonText: "Get Started",
    buttonVariant: "outline"
  },
  {
    name: "Budget-friendly",
    description: "Great for regular use",
    price: {
      monthly: 15,
      yearly: 150
    },
    credits: "≤ 1024×1024 (≤ 1.05 MP)",
    features: [
      "130 credits per image",
      "HD quality enhancement",
      "Advanced skin texture",
      "Priority support",
      "Selective area enhancement",
      "Built-in optimization tools",
      "4K upscaling available"
    ],
    popular: true,
    icon: <Star className="h-5 w-5" />,
    buttonText: "Most Popular",
    buttonVariant: "default"
  },
  {
    name: "Professional",
    description: "For professional creators",
    price: {
      monthly: 25,
      yearly: 250
    },
    credits: "≤ 1920×1080 (≤ 2.07 MP)",
    features: [
      "180 credits per image",
      "Full HD processing",
      "Advanced texture control",
      "Priority support",
      "Cinematic B-roll generator",
      "Device simulation modes",
      "Portrait & TikTok ratios",
      "Batch processing"
    ],
    icon: <Crown className="h-5 w-5" />,
    buttonText: "Go Professional",
    buttonVariant: "outline"
  },
  {
    name: "Ultra HD",
    description: "Maximum quality and features",
    price: {
      monthly: 45,
      yearly: 450
    },
    credits: "≤ 2160×2160 (≤ 4.66 MP)",
    features: [
      "360 credits per image",
      "4K Ultra HD quality",
      "Stunning detail & sharpness",
      "24/7 priority support",
      "All enhancement features",
      "API access",
      "Custom processing options",
      "White-label solutions"
    ],
    icon: <Crown className="h-5 w-5 text-yellow-500" />,
    buttonText: "Ultimate Plan",
    buttonVariant: "default"
  }
]

export function EnhancorPricingTable({ className }: EnhancorPricingTableProps) {
  const [isYearly, setIsYearly] = React.useState(false)

  return (
    <div className={cn("w-full max-w-7xl mx-auto px-4 py-16", className)}>
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Enhancement Plan
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Transform your AI-generated images into photorealistic masterpieces
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={cn("text-sm font-medium", !isYearly ? "text-gray-900 dark:text-white" : "text-gray-500")}>
            Month
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              isYearly ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                isYearly ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
          <span className={cn("text-sm font-medium", isYearly ? "text-gray-900 dark:text-white" : "text-gray-500")}>
            Year
            <span className="ml-1 text-xs text-green-600 font-semibold">Save 17%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pricingTiers.map((tier, index) => {
          const price = isYearly ? tier.price.yearly : tier.price.monthly
          const monthlyEquivalent = isYearly ? Math.round(tier.price.yearly / 12) : null
          
          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <Card className={cn(
                "relative p-6 h-full flex flex-col transition-all duration-300 hover:shadow-lg overflow-hidden",
                tier.popular 
                  ? "border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_100%] animate-gradient-x shadow-lg scale-105" 
                  : tier.name === "Professional"
                  ? "border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-gradient-x shadow-lg scale-105"
                  : tier.name === "Ultra HD"
                  ? "border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}>
                {/* Gradient border overlay */}
                {tier.popular && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_100%] animate-gradient-x rounded-lg" />
                )}
                {tier.name === "Professional" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-gradient-x rounded-lg" />
                )}
                {/* Content with background */}
                <div className={cn(
                  "relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 h-full flex flex-col",
                  (tier.popular || tier.name === "Professional") ? "m-0.5" : ""
                )}>
                  <div className="flex items-center gap-2 mb-4">
                    {tier.icon}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {tier.name}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                    {tier.description}
                  </p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${price}
                      </span>
                      <span className="text-gray-500 text-sm">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    {monthlyEquivalent && (
                      <p className="text-sm text-gray-500 mt-1">
                        ${monthlyEquivalent}/month billed yearly
                      </p>
                    )}
                    <p className="text-sm font-medium text-blue-600 mt-2">
                      {tier.credits}
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={cn(
                      "w-full rounded-md",
                      tier.popular 
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" 
                        : ""
                    )}
                    variant={tier.buttonVariant}
                    size="lg"
                  >
                    {tier.buttonText}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
      
      {/* Additional Info */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          All plans include face detection, smart cropping, and photo resizing tools to optimize your credits.
          <br />
          Save up to 60% on processing costs with built-in optimization features.
        </p>
      </div>
    </div>
  )
}