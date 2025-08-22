"use client"

import { motion, Variants } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import Image from "next/image"

import { Button } from "./button"
import { SparklesText } from "./sparkles-text"

import { staggerContainerVariants } from "@/lib/animations"

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export function HeroSection() {
  return (
    <section className="hero-section relative min-h-screen overflow-hidden">
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 parallax-container">
        <motion.div
          className="parallax-element absolute inset-0 scale-110"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Image
            src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/hero/herodesktop.jpeg"
            alt="AI Image Enhancement Hero"
            fill
            className="object-cover"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background/90" />
        </motion.div>
        
        {/* Texture Overlay */}
        <div className="absolute inset-0 opacity-30">
          <Image
            src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/hero/imageskintexturebackground.jpg"
            alt="Texture Background"
            fill
            className="object-cover mix-blend-overlay"
            quality={100}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-6 min-h-screen flex items-center pt-20">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            variants={fadeInVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-glass-border mb-8"
          >
            <Sparkles className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-medium text-text-secondary">
              Powered by Advanced AI Technology
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            variants={fadeInVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tight mb-6"
          >
            <span className="text-hero">
              Transform Images with{" "}
            </span>
            <br />
            <SparklesText 
              text="AI-Powered Skin Enhancer"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
            />
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInVariants}
            className="text-lg sm:text-xl md:text-2xl text-text-secondary leading-relaxed mb-12 max-w-3xl mx-auto"
          >
            Professional-grade image enhancement and skin upscaling powered by cutting-edge AI. 
            Transform your portraits with cinematic quality in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button 
              size="lg"
              className="btn-premium text-lg px-8 py-4 h-auto"
              asChild
            >
              <Link href="/upload">
                <span className="relative z-0 flex items-center gap-2">
                  Start Enhancing
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="text-lg px-8 py-4 h-auto glass hover:glass-elevated border border-glass-border text-text-primary hover:text-accent-neon transition-all duration-300"
              asChild
            >
              <Link href="/demo" className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Watch Demo
              </Link>
            </Button>
          </motion.div>


        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating Sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-accent-neon rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-glass-border rounded-full flex justify-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-3 bg-accent-neon rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
