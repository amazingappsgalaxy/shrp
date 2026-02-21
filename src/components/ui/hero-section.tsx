"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Play, Sparkles, Star, Zap } from 'lucide-react'
import Image from "next/image"
import { Button } from '@/components/ui/button'

export function HeroSection() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 100])
  const y2 = useTransform(scrollY, [0, 500], [0, -100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <section className="relative min-h-[100vh] w-full overflow-hidden flex items-center justify-center bg-black selection:bg-[#FFFF00] selection:text-black">
      {/* Dynamic Background Noise & Grain */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* Abstract Gradient Orbs - Yellow & White */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#FFFF00]/5 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="container relative z-10 px-4 md:px-6 pt-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* Left Content: Typography */}
          <motion.div
            className="lg:col-span-7 flex flex-col justify-center"
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 1, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 self-start mb-8 px-4 py-2 rounded-full border border-[#FFFF00]/30 bg-[#FFFF00]/5 backdrop-blur-sm"
            >
              <Zap className="w-4 h-4 text-[#FFFF00] fill-[#FFFF00]" />
              <span className="text-xs font-bold text-[#FFFF00] tracking-[0.2em] uppercase">
                Next-Gen AI Engine
              </span>
            </motion.div>

            {/* Massive Heading */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-8 text-white">
              Create <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#FFFF00] to-[#E6E600]">
                  Unreal
                </span>
                {/* Underline decoration */}
                <motion.svg
                  className="absolute left-0 -bottom-2 w-full h-4 text-[#FFFF00]"
                  viewBox="0 0 100 10"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                >
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </motion.svg>
              </span>
              <br />
              Reality.
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-xl leading-relaxed mb-10">
              The ultimate AI platform for professional image generation and sub-pixel enhancement. Transform low-res inputs into 8K masterpieces instantly.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/app/signin?tab=signup">
                <Button className="w-full sm:w-auto h-14 px-10 rounded-full bg-[#FFFF00] text-black hover:bg-[#D4D400] hover:scale-105 transition-all text-lg font-bold">
                  Start Creating
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 text-lg font-bold backdrop-blur-sm">
                  <Play className="mr-2 w-5 h-5 fill-white" />
                  Live Demo
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex items-center gap-6 text-white/30 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-current" />
                4.9/5 Rating
              </span>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <span>Used by 50k+ Creators</span>
            </div>
          </motion.div>

          {/* Right Content: Visual */}
          <motion.div
            className="lg:col-span-5 relative h-[600px] lg:h-[800px] w-full flex items-center justify-center"
            style={{ y: y1 }}
          >
            {/* Background Shape */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FFFF00]/20 to-transparent rounded-[3rem] rotate-3 blur-3xl opacity-30" />

            {/* Main Image Container */}
            <motion.div
              className="relative w-full max-w-md aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shadow-[#FFFF00]/10"
              initial={{ scale: 0.97, opacity: 1, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              whileHover={{ scale: 1.02, rotate: 1, transition: { duration: 0.4 } }}
            >
              <Image
                src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/hero/herodesktop.jpeg"
                alt="AI Generated Masterpiece"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
              />

              {/* Floating UI Elements */}
              <motion.div
                className="absolute top-6 left-6 right-6 flex justify-between items-start"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#FFFF00] rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-white/90">Processing...</span>
                </div>
              </motion.div>

              {/* Bottom Glass Card */}
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/10 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#FFFF00] flex items-center justify-center text-black font-bold">
                    AI
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Upscale Complete</div>
                    <div className="text-white/50 text-xs">Resolution: 8192 x 8192</div>
                  </div>
                  <div className="ml-auto">
                    <Sparkles className="w-5 h-5 text-[#FFFF00]" />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Parallax Floating Elements */}
            <motion.div
              style={{ y: y2 }}
              className="absolute -right-8 top-1/4 bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 shadow-xl hidden md:block"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-20 h-2 bg-white/10 rounded-full" />
              </div>
              <div className="w-32 h-20 bg-white/5 rounded-lg" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
        style={{ opacity }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
      </motion.div>
    </section>
  )
}
