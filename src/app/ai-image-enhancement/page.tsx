"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Check, 
  Zap, 
  Crown, 
  Star, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Rocket,
  Brain,
  Users,
  Globe,
  Quote,
  ArrowLeft,
  DollarSign,
  Play,
  Pause,
  ZoomIn,
  Upload,
  Download,
  Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TestimonialsSection } from "@/components/sections/TestimonialsSection"
import { PRICING_PLANS, getMonthlySavings } from "@/lib/pricing-config"

// Glow component
const Glow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "top" | "above" | "bottom" | "below" | "center" }
>(({ className, variant = "top", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute w-full",
      variant === "top" && "top-0",
      variant === "above" && "-top-[128px]",
      variant === "bottom" && "bottom-0",
      variant === "below" && "-bottom-[128px]",
      variant === "center" && "top-[50%] -translate-y-1/2",
      className
    )}
    {...props}
  >
    <div
      className={cn(
        "absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/.5)_10%,_hsl(var(--primary)/0)_60%)] sm:h-[512px]",
        variant === "center" && "-translate-y-1/2",
      )}
    />
    <div
      className={cn(
        "absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-[2] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/.3)_10%,_hsl(var(--primary)/0)_60%)] sm:h-[256px]",
        variant === "center" && "-translate-y-1/2",
      )}
    />
  </div>
))
Glow.displayName = "Glow"

// Mockup component
const Mockup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { type?: "mobile" | "responsive" }
>(({ className, type = "responsive", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex relative z-10 overflow-hidden shadow-2xl border border-border/5 border-t-border/15",
      type === "mobile" ? "rounded-[48px] max-w-[350px]" : "rounded-md",
      className
    )}
    {...props}
  />
))
Mockup.displayName = "Mockup"

// Hero Section Component
function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section className="relative bg-background text-foreground py-12 px-4 md:py-24 lg:py-32 overflow-hidden">
      <div className="relative mx-auto max-w-[1280px] flex flex-col gap-12 lg:gap-24">
        <div className="relative z-10 flex flex-col items-center gap-6 pt-8 md:pt-16 text-center lg:gap-12">
          <motion.h1
            className="inline-block animate-appear bg-gradient-to-b from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.1] sm:leading-[1.1] drop-shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Transform Your Images with AI
          </motion.h1>

          <motion.p
            className="max-w-[550px] animate-appear opacity-0 [animation-delay:150ms] text-base sm:text-lg md:text-xl text-muted-foreground font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Professional AI-powered image upscaling and enhancement. Turn low-resolution images into stunning high-quality masterpieces in seconds.
          </motion.p>

          <motion.div
            className="relative z-10 flex flex-wrap justify-center gap-4 animate-appear opacity-0 [animation-delay:300ms]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button size="lg" className="text-lg px-8 py-3 h-auto font-semibold">
              Start Enhancing Free
            </Button>
            <Button size="lg" variant="ghost" className="text-lg px-8 py-3 h-auto">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </motion.div>

          <div className="relative w-full pt-12 px-4 sm:px-6 lg:px-8">
            <Mockup className="animate-appear opacity-0 [animation-delay:700ms] shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] border-primary/10">
              <div className="relative w-full h-[400px] bg-gradient-to-br from-muted/50 to-background rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 w-full h-full p-8">
                    <div className="bg-muted/30 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Before</p>
                      </div>
                    </div>
                    <div className="bg-primary/10 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="h-12 w-12 mx-auto mb-2 text-primary" />
                        <p className="text-sm text-primary">After</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Mockup>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Glow variant="above" className="animate-appear-zoom opacity-0 [animation-delay:1000ms]" />
      </div>
    </section>
  )
}

// Proof Section Component
function ProofSection() {
  const stats = [
    { number: "2M+", label: "Images Enhanced" },
    { number: "50K+", label: "Happy Users" },
    { number: "99.9%", label: "Uptime" },
    { number: "4.9/5", label: "User Rating" }
  ]

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-4">Trusted by Professionals Worldwide</h2>
          <p className="text-muted-foreground">Join thousands who've transformed their images with Sharpii.ai</p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Features Section Component
function FeaturesSection() {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [progress, setProgress] = useState(0)

  const features = [
    {
      step: "Upload",
      title: "Upload Your Image",
      content: "Simply drag and drop or select your low-resolution image. We support all major formats including JPEG, PNG, and WebP.",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop"
    },
    {
      step: "Enhance",
      title: "AI Processing",
      content: "Our advanced AI algorithms analyze and enhance your image, increasing resolution up to 8x while preserving quality.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop"
    },
    {
      step: "Download",
      title: "Get Results",
      content: "Download your enhanced high-resolution image in seconds. Perfect for printing, web use, or professional projects.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / 30)
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length)
        setProgress(0)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [progress, features.length])

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-10 text-center">
          How It Works
        </h2>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10 max-w-6xl mx-auto">
          <div className="order-2 md:order-1 space-y-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-6 md:gap-8"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2",
                    index === currentFeature
                      ? "bg-primary border-primary text-primary-foreground scale-110"
                      : "bg-muted border-muted-foreground",
                  )}
                >
                  {index <= currentFeature ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-lg font-semibold">{index + 1}</span>
                  )}
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm md:text-lg text-muted-foreground">{feature.content}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="order-1 md:order-2 relative h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden rounded-lg">
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0 rounded-lg overflow-hidden"
                      initial={{ y: 100, opacity: 0, rotateX: -20 }}
                      animate={{ y: 0, opacity: 1, rotateX: 0 }}
                      exit={{ y: -100, opacity: 0, rotateX: 20 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.step}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

// Pricing Section Component
function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing-section" className="relative py-24 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Choose the perfect plan for your image enhancement needs. Upgrade or downgrade at any time.
          </p>

          <div className="inline-flex items-center p-1 bg-muted/50 rounded-2xl border border-border/50 backdrop-blur-sm">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                !isYearly 
                  ? "bg-background text-foreground shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative",
                isYearly 
                  ? "bg-background text-foreground shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 15%
              </Badge>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PRICING_PLANS.map((plan, index) => {
            const monthlyPrice = plan.price.monthly
            const yearlyPrice = plan.price.yearly
            const displayPrice = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice
            const savings = isYearly ? getMonthlySavings(monthlyPrice) : 0
            const IconComponent = plan.icon
            
            return (
              <motion.div
                key={plan.name}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={cn(
                  "relative h-full p-6 rounded-3xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background/80 backdrop-blur-sm",
                  plan.highlight 
                    ? "border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/20" 
                    : "border-border/50 hover:border-border"
                )}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        plan.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    {IconComponent && (
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4",
                        plan.highlight ? "bg-primary/10" : "bg-muted/50"
                      )}>
                        <IconComponent className={cn(
                          "w-6 h-6",
                          plan.highlight ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                    )}
                    
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{plan.subtitle}</p>
                    
                    <div className="mb-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">${displayPrice}</span>
                        <span className="text-muted-foreground text-sm">/month</span>
                      </div>
                      
                      {isYearly && savings > 0 && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          Save ${savings.toFixed(2)}/month
                        </div>
                      )}
                      
                      {isYearly && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ${yearlyPrice}/year billed annually
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Key Features
                    </div>
                    {plan.features.slice(0, 6).map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm text-foreground/90 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.features.length > 6 && (
                      <div className="text-xs text-muted-foreground pt-2">
                        +{plan.features.length - 6} more features
                      </div>
                    )}
                  </div>

                  <Button 
                    className={cn(
                      "w-full rounded-xl font-medium transition-all duration-300",
                      plan.highlight 
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl" 
                        : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
                    )}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
        
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-muted-foreground">
            All plans include a 7-day free trial. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Main Sharpii AI Website Component
function SharpiiAIWebsite() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <ProofSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
    </div>
  )
}

export default function AIImageEnhancementPage() {
  return <SharpiiAIWebsite />
}
