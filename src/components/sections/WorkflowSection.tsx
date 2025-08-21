"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { ArrowRight, Play, Zap, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WorkflowSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  }



  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Process images in under 30 seconds",
      metric: "10x faster"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Precision AI",
      description: "Advanced algorithms for perfect results",
      metric: "99.9% accuracy"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Always Available",
      description: "24/7 processing with global servers",
      metric: "99.9% uptime"
    }
  ]

  return (
    <section className="py-32 relative overflow-hidden bg-background">
      {/* Enhanced Background with Multiple Layers */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface/20 to-background" />
        
        {/* Animated glow orbs */}
        <div className="absolute inset-0 opacity-30">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-neon/30 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/30 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-3/4 left-3/4 w-64 h-64 bg-accent-blue/30 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,255,255,0.08)_1px,transparent_0)] [background-size:60px_60px]" />
        
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">


        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-16"
        >
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-card rounded-2xl p-6 border border-glass-border backdrop-blur-glass group hover:border-accent-neon/40 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-neon/20 to-accent-blue/20 flex items-center justify-center group-hover:from-accent-neon/30 group-hover:to-accent-blue/30 transition-all duration-300">
                    {feature.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-text-primary mb-2 group-hover:text-accent-neon transition-colors duration-300">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-text-secondary mb-2">
                      {feature.description}
                    </p>
                    <div className="text-xs font-bold text-accent-neon">
                      {feature.metric}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center"
        >
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-glass-border-elevated backdrop-blur-glass">
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold text-text-primary">
                Ready to Transform Your Images?
              </h3>
              
              <p className="text-text-secondary">
                Join thousands of professionals who trust Sharpii.ai for their image enhancement needs.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  className="btn-premium px-8 py-4 text-lg font-semibold group"
                  size="lg"
                >
                  <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Start Enhancing Now
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
                
                <div className="text-sm text-text-muted">
                  No credit card required • Free trial available
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}