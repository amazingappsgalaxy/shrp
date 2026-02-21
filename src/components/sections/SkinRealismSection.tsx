"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Shield, Target, Award, Sparkles, Check, Droplets, ScanFace, Layers } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function SkinRealismSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, staggerChildren: 0.2 } }
  }

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  return (
    <section className="relative py-32 overflow-hidden bg-black/40">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FFFF00]/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">

        {/* Header */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-24"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-8 w-auto">
            <Droplets className="h-4 w-4 text-[#FFFF00]" />
            <span className="text-sm font-bold text-white/90 uppercase tracking-widest">Ultra-Realistic Detail</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="font-heading text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white">Reality,</span> <span className="text-[#FFFF00]">Re-imagined.</span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-lg text-white/60 leading-relaxed max-w-3xl mx-auto">
            Stop settling for "plastic" AI skin. Our proprietary biological texture engine reconstructs pores, fine hairs, and melanin distribution from the ground up—delivering results indistinguishable from high-end camera RAWs.
          </motion.p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-32">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative group "
          >
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 aspect-[4/5]">
              <Image
                src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
                alt="Enhanced Portrait"
                fill
                className="object-cover"
              />

              {/* Floating Tag - Corrected Logic: Image is AFTER, so Tag is ENHANCED */}
              <div className="absolute top-6 right-6 px-4 py-2 bg-[#FFFF00] text-black rounded-full font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,0,0.4)]">
                Enhanced
              </div>

              <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
                <h3 className="text-2xl font-bold text-white mb-2">Pore-Level Perfection</h3>
                <p className="text-white/60 text-sm">Retains 100% of natural skin geography while removing blemishes.</p>
              </div>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative group lg:mt-16"
          >
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 aspect-[4/5]">
              <Image
                src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+after.png"
                alt="Enhanced Fashion"
                fill
                className="object-cover"
              />
              {/* Floating Tag */}
              <div className="absolute top-6 left-6 px-4 py-2 bg-[#FFFF00] text-black rounded-full font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,0,0.4)]">
                Remastered
              </div>

              <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
                <h3 className="text-2xl font-bold text-white mb-2">Authentic Texture</h3>
                <p className="text-white/60 text-sm">Micro-contrast enhancement without the artificial smoothing.</p>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  )
}