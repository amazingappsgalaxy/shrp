"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react"
import { Button } from "./button"
import { SparklesText } from "./sparkles-text"

export function Hero21() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1
    }
  }

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI-Powered",
      description: "Advanced neural networks"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Results in under 30 seconds"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Privacy First",
      description: "Your data stays secure"
    }
  ]

  return (
    <section className="py-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-neon/20 rounded-full blur-2xl animate-float" style={{ animationDelay: "2s" }} />

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px"
          }} />
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <motion.div
          ref={ref}
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-glass-border mb-8"
          >
            <div className="w-2 h-2 bg-accent-neon rounded-full animate-pulse" />
            <span className="text-sm font-medium text-text-secondary">
              Trusted by Creative Professionals
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          >
            Ready to Transform Your Images with{" "}
            <SparklesText
              text="Professional AI?"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
            />
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-text-secondary leading-relaxed mb-12 max-w-2xl mx-auto"
          >
            Experience the future of image enhancement. Upload your photos and watch as our AI transforms them into stunning, professional-quality images in seconds.
          </motion.p>

          {/* Features Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="glass rounded-2xl p-6 border border-glass-border group hover:glass-elevated transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-neon to-accent-blue flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Button
              size="lg"
              className="btn-premium text-lg px-10 py-4 h-auto group"
              asChild
            >
              <Link href="/app/upload">
                <span className="relative z-10 flex items-center gap-2">
                  Start Enhancing Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="text-lg px-10 py-4 h-auto glass hover:glass-elevated border border-glass-border text-text-primary hover:text-accent-neon transition-all duration-300"
              asChild
            >
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-8 text-text-muted"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-sm">GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full" />
              <span className="text-sm">24/7 Support</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-accent-neon rounded-full"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </section>
  )
}