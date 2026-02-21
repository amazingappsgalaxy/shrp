"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Sparkles,
  Zap,
  ScanLine,
  Wand2
} from "lucide-react"

import { staggerContainerVariants, fadeInVariants } from "@/lib/animations"

export function ComparisonSection() {
  const [sliderValue, setSliderValue] = useState(50)

  return (
    <section id="comparison-section" className="relative py-24 overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-neon/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 z-10 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Interactive Comparison - FIXED SIZE */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative w-full max-w-lg mx-auto aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group select-none">
              {/* Images */}
              <Image
                src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/comparison/comparebefore.jpeg"
                alt="Original"
                fill
                draggable={false}
                className="object-cover"
              />

              <div
                className="absolute inset-0 overflow-hidden will-change-[width]"
                style={{ width: `${sliderValue}%` }}
              >
                <Image
                  src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/comparison/compareafter.jpeg"
                  alt="Enhanced"
                  fill
                  draggable={false}
                  className="object-cover"
                />
              </div>

              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-col-resize z-20 group-hover:bg-accent-neon transition-colors"
                style={{ left: `${sliderValue}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform">
                  <ScanLine className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Hover Interaction Layer */}
              <div
                className="absolute inset-0 z-30 cursor-ew-resize opacity-0"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
                  setSliderValue((x / rect.width) * 100)
                }}
                onTouchMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width))
                  setSliderValue((x / rect.width) * 100)
                }}
              />

              {/* Labels */}
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/10 pointer-events-none">
                Enhanced
              </div>
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold text-white/50 border border-white/10 pointer-events-none">
                Original
              </div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            className="order-1 lg:order-2 text-left space-y-8"
            initial="hidden"
            whileInView="visible"
            variants={staggerContainerVariants}
          >
            <motion.div variants={fadeInVariants}>
              <span className="inline-block px-4 py-1.5 rounded-full border border-accent-neon/20 bg-accent-neon/5 text-sm font-bold text-accent-neon mb-6">
                Detail Recovery Engine
              </span>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1]">
                <span className="text-white">Reality, </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-neon to-[#fff]">Re-imagined.</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed">
                Our proprietary AI doesn't just sharpen images; it understands the context of every pixel. From skin texture to fabric details, Sharpii reconstructs reality with mathematically perfect precision.
              </p>
            </motion.div>

            <motion.div variants={fadeInVariants} className="space-y-6">
              <div className="flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-accent-neon/30 transition-colors group">
                <div className="p-3 rounded-xl bg-accent-neon/10 text-accent-neon group-hover:bg-accent-neon group-hover:text-black transition-colors">
                  <ScanLine className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Sub-Pixel Detail Recovery</h3>
                  <p className="text-white/60 text-sm leading-relaxed">Our AI hallucinates plausible details based on millions of high-res references to fill in missing information.</p>
                </div>
              </div>

              <div className="flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-accent-blue/30 transition-colors group">
                <div className="p-3 rounded-xl bg-accent-blue/10 text-accent-blue group-hover:bg-accent-blue group-hover:text-white transition-colors">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Natural Texture Synthesis</h3>
                  <p className="text-white/60 text-sm leading-relaxed">Preserves the natural grain of film or skin pores, avoiding the "plastic" smoothing common in other scalers.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}