"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion"
import { Sparkles, Scan, Zap, Layers } from "lucide-react"
import Image from "next/image"

export function MagicalPortraitSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Mouse position for scanner
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth spring animation for scanner
  const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 }
  const smoothX = useSpring(mouseX, smoothOptions)
  const smoothY = useSpring(mouseY, smoothOptions)

  // Magnification Logic
  // Formula: translate = -mousePos * (zoomLevel - 1)
  const zoomLevel = 2;

  const moveX = useTransform(smoothX, (latest) => -latest * (zoomLevel - 1))
  const moveY = useTransform(smoothY, (latest) => -latest * (zoomLevel - 1))

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  // Initial center position
  useEffect(() => {
    if (containerRef.current) {
      mouseX.set(containerRef.current.clientWidth / 2)
      mouseY.set(containerRef.current.clientHeight / 2)
    }
  }, [])

  return (
    <section className="relative py-32 bg-black overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFFF00]/50 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#FFFF00]/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Text Content - Updated for Skin Realism */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FFFF00]/20 bg-[#FFFF00]/5 mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-[#FFFF00] animate-pulse" />
              <span className="text-xs font-bold text-[#FFFF00] uppercase tracking-widest">Ultra-Realistic Detail</span>
            </motion.div>

            <h2 className="font-heading text-5xl md:text-6xl font-black text-white mb-6 leading-none">
              Pore-Level <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFF00] via-white to-[#FFFF00]">
                Perfection.
              </span>
            </h2>

            <p className="text-lg text-white/50 mb-10 leading-relaxed max-w-lg">
              Our AI understands the biological structure of human skin. It doesn't just smooth; it reconstructs micro-texture, pores, and fine lines for a hyper-realistic finish that looks completely natural.
            </p>

            <div className="flex flex-col gap-6">
              {[
                { icon: Scan, title: "Micro-Texture Recovery", desc: "Restores lost skin grain and pore definition." },
                { icon: Layers, title: "Authentic Lighting", desc: "Preserves natural subsurface scattering." },
                { icon: Zap, title: "No 'Plastic' Look", desc: "Avoids artificial over-smoothing artifacts." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-[#FFFF00]/30 transition-colors">
                    <item.icon className="w-6 h-6 text-white group-hover:text-[#FFFF00] transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{item.title}</h4>
                    <p className="text-white/40 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Interactive Scanner */}
          <div className="order-1 lg:order-2">
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0, rotate: 5 }}
              whileInView={{ opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[3/4] w-full max-w-md mx-auto rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl cursor-none group"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                // Reset to center
                if (containerRef.current) {
                  mouseX.set(containerRef.current.clientWidth / 2)
                  mouseY.set(containerRef.current.clientHeight / 2)
                }
              }}
            >
              {/* Base Image (Blurry/Before) */}
              <div className="absolute inset-0">
                <Image
                  src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg"
                  alt="Before"
                  fill
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-black/10" />
              </div>

              {/* Scanner Lens - Reveals After Image */}
              <motion.div
                className="absolute w-64 h-64 rounded-full overflow-hidden border-2 border-[#FFFF00] shadow-[0_0_50px_rgba(255,255,0,0.3)] z-20 will-change-transform"
                style={{
                  x: smoothX,
                  y: smoothY,
                  translateX: '-50%',
                  translateY: '-50%'
                }}
              >
                {/* High Res Image Inside Lens - Exactly overlapping but zoomed */}
                <motion.div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                >
                  {/* 
                      Correction: To make the "Lens" look like it's revealing the underlying image but zoomed, 
                      we need an element INSIDE the lens that is the size of the CONTAINER, 
                      and positioned relative to the lens such that it aligns.
                    */}
                  <div
                    className="absolute top-1/2 left-1/2" // Center in lens
                    style={{
                      width: containerRef.current ? containerRef.current.clientWidth : 400, // Approximate fallback
                      height: containerRef.current ? containerRef.current.clientHeight : 600,
                    }}
                  >
                    <motion.div
                      className="absolute top-0 left-0 w-full h-full"
                      style={{
                        x: moveX,
                        y: moveY,
                        left: "-50%", // Offset by half width to center on lens center
                        top: "-50%",
                        width: "100%",
                      }}
                    >
                      <Image
                        src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
                        alt="After"
                        fill
                        className="object-cover"
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: "0 0" }}
                      />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Lens UI Overlays */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFFF00]/10 to-transparent pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFF00]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </motion.div>

              {/* Floating Label */}
              <div className="absolute bottom-6 left-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-mono text-white/70 border border-white/10 pointer-events-none">
                Hover to Scan
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
