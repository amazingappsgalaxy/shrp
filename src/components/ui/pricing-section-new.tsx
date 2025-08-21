"use client"

import * as React from "react"
import { PricingCard, type PricingTier } from "@/components/ui/pricing-card"
import { cn } from "@/lib/utils"

// Inline Tab component to avoid import issues
interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: React.ReactNode;
}

const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ className, selected, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "px-6 py-2 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "rounded-full backdrop-blur-sm border",
          selected 
            ? "bg-white/20 text-white border-white/30" 
            : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Tab.displayName = "Tab";

interface PricingSectionProps {
  title: string
  subtitle: string
  tiers: PricingTier[]
  frequencies: string[]
}

export function PricingSection({
  title,
  subtitle,
  tiers,
  frequencies,
}: PricingSectionProps) {
  const [selectedFrequency, setSelectedFrequency] = React.useState(() => {
    const initial = frequencies.includes("yearly") ? "yearly" : frequencies[0];
    console.log("Initial frequency:", initial);
    return initial;
  });

  const handleFrequencyChange = (freq: string) => {
    console.log("Changing frequency to:", freq);
    setSelectedFrequency(freq);
  };

  return (
    <section className="flex flex-col items-center gap-12 py-12">
      {/* Header Section */}
      <div className="space-y-6 text-center max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            {title}
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            {subtitle}
          </p>
        </div>
        
        {/* Billing Toggle */}
        <div className="mx-auto flex w-fit rounded-full bg-white/5 p-1.5 border border-white/10 backdrop-blur-sm">
          {frequencies.map((freq) => (
            <Tab
              key={freq}
              selected={selectedFrequency === freq}
              onClick={() => handleFrequencyChange(freq)}
            >
              {freq === 'monthly' ? 'Month' : 'Year'}
              {freq === "yearly" && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                  Save 17%
                </span>
              )}
            </Tab>
          ))}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid w-full max-w-6xl gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier) => (
          <PricingCard
            key={`${tier.name}-${selectedFrequency}`}
            tier={tier}
            paymentFrequency={selectedFrequency}
          />
        ))}
      </div>
    </section>
  )
}

// Demo data and component
export const PAYMENT_FREQUENCIES = ["yearly", "monthly"]

export const TIERS = [
  {
    name: "Basic",
    price: {
      monthly: 9,
      yearly: 90,
    },
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
    cta: "Get Started",
  },
  {
    name: "Creator",
    price: {
      monthly: 24,
      yearly: 240,
    },
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
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Professional",
    price: {
      monthly: 39,
      yearly: 390,
    },
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
    cta: "Get Started",
    glow: true,
  },
  {
    name: "Enterprise",
    price: {
      monthly: 99,
      yearly: 990,
    },
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
    cta: "Contact Us"
  },
]

export function PricingSectionDemo({ id }: { id?: string }) {
  return (
    <div id={id} className="relative z-[80] isolate pointer-events-auto flex justify-center items-center w-full mt-20">
        <div className="absolute inset-0 -z-10">
          <div className="h-full w-full bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:35px_35px] opacity-30 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>
        <PricingSection
          title="Choose Your Plan"
          subtitle="Transform your AI images with professional-grade enhancement"
          frequencies={PAYMENT_FREQUENCIES}
          tiers={TIERS}
        />
      </div>
    );
 }