"use client"

import { motion } from "framer-motion"
import { Button } from "./button"
import { SparklesText } from "./sparkles-text"
import { fadeInVariants, staggerContainerVariants } from "@/lib/animations"
import { ArrowRight, Sparkles, Zap, Shield, Clock } from "lucide-react"
import Image from "next/image"

export function CTASection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/30 via-background to-surface/30" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-neon/10 rounded-full blur-3xl" />
      </div>

      {/* Background Image */}
      <div className="absolute inset-0 opacity-10">
        <Image
          src="/testpics/b-roll.jpeg"
          alt="Background"
          fill
          className="object-cover"
          quality={100}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            variants={fadeInVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-glass-border mb-8"
          >
            <Sparkles className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-medium text-text-secondary">
              Ready to Transform Your Images?
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            variants={fadeInVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tight mb-8"
          >
            <span className="text-text-primary">Start Creating</span>
            <br />
            <SparklesText 
              text="Stunning Images Today"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
            />
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={fadeInVariants}
            className="text-lg sm:text-xl md:text-2xl text-text-secondary leading-relaxed mb-12 max-w-3xl mx-auto"
          >
            Join over 50,000 photographers, studios, and agencies who trust Sharpii.ai 
            to deliver professional-grade image enhancement in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg"
                className="btn-premium text-xl px-12 py-6 h-auto"
                asChild
              >
                <a href="/upload">
                  <span className="relative z-10 flex items-center gap-3">
                    <Zap className="h-6 w-6" />
                    Start Free Trial
                    <ArrowRight className="h-6 w-6" />
                  </span>
                </a>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                size="lg"
                className="text-xl px-12 py-6 h-auto glass hover:glass-elevated border border-glass-border text-text-primary hover:text-accent-neon transition-all duration-300"
                asChild
              >
                <a href="/demo" className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  Watch Demo
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={fadeInVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto mb-12"
          >
            <div className="flex items-center justify-center gap-3 text-text-secondary">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-neon to-accent-blue flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-text-primary">7-Day Free Trial</div>
                <div className="text-xs text-text-muted">No credit card required</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-text-secondary">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-text-primary">30-Day Guarantee</div>
                <div className="text-xs text-text-muted">Money back promise</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-text-secondary">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-text-primary">Instant Setup</div>
                <div className="text-xs text-text-muted">Start in 30 seconds</div>
              </div>
            </div>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            variants={fadeInVariants}
            className="text-center"
          >
            <div className="inline-flex items-center gap-8 px-8 py-4 glass-elevated rounded-2xl border border-glass-border-elevated">
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient-neon">50K+</div>
                <div className="text-sm text-text-muted">Active Users</div>
              </div>
              <div className="w-px h-8 bg-glass-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient-neon">10M+</div>
                <div className="text-sm text-text-muted">Images Enhanced</div>
              </div>
              <div className="w-px h-8 bg-glass-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient-neon">4.9★</div>
                <div className="text-sm text-text-muted">User Rating</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-accent-neon rounded-full"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [-30, 30, -30],
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </section>
  )
}
