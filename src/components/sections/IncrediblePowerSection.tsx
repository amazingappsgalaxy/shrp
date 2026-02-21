"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Zap, Eye, Sparkles, RotateCcw, Settings2, Target, Monitor, Cpu, Play, Pause, BarChart3, ChevronDown, Check } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function IncrediblePowerSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  // Interactive states
  const [textureValue, setTextureValue] = useState(65)
  const [detailValue, setDetailValue] = useState(45)
  const [smoothnessValue, setSmoothness] = useState(70)
  const [selectedTextureStyle, setSelectedTextureStyle] = useState("natural")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedEnhancementType, setSelectedEnhancementType] = useState("face")
  const [enhancementAreas, setEnhancementAreas] = useState({
    face: true,
    skin: true,
    nose: false,
    mouth: true,
    eyes: false
  })

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } }
  }

  const textureStyles = [
    { id: "natural", name: "Natural", desc: "Realistic skin pores", active: selectedTextureStyle === "natural" },
    { id: "smooth", name: "Smooth", desc: "Refined skin tone", active: selectedTextureStyle === "smooth" },
    { id: "detailed", name: "Detailed", desc: "Enhanced features", active: selectedTextureStyle === "detailed" }
  ]

  const enhancementOptions = [
    { id: "face", letter: "F", area: "Face", active: enhancementAreas.face },
    { id: "skin", letter: "S", area: "Skin", active: enhancementAreas.skin },
    { id: "nose", letter: "N", area: "Nose", active: enhancementAreas.nose },
    { id: "mouth", letter: "M", area: "Mouth", active: enhancementAreas.mouth },
    { id: "eyes", letter: "E", area: "Eyes", active: enhancementAreas.eyes }
  ]

  const handleReset = () => {
    setTextureValue(65)
    setDetailValue(45)
    setSmoothness(70)
    setSelectedTextureStyle("natural")
    setSelectedEnhancementType("face")
    setEnhancementAreas({
      face: true, skin: true, nose: false, mouth: true, eyes: false
    })
  }

  const toggleEnhancementArea = (areaId: string) => {
    setEnhancementAreas(prev => ({
      ...prev,
      [areaId]: !prev[areaId as keyof typeof prev]
    }))
  }

  const getCoveragePercentage = () => {
    const activeCount = Object.values(enhancementAreas).filter(Boolean).length
    return Math.round((activeCount / Object.keys(enhancementAreas).length) * 100)
  }

  const handleProcessing = () => {
    setIsProcessing(true)
    setTimeout(() => setIsProcessing(false), 3000)
  }

  return (
    <section className="py-24 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent-blue/5 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">

        {/* Header */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
            <Cpu className="h-4 w-4 text-[#FFFF00]" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Pro Control Engine</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="font-heading text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Professional Grade </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFF00] to-[#E6E600]">Control</span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-lg text-white/60 max-w-2xl mx-auto">
            Fine-tune every aspect of the enhancement process with our professional dashboard.
            Real-time feedback meets sub-pixel precision.
          </motion.p>
        </motion.div>

        {/* Dashboard UI */}
        <div className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto h-[600px] lg:h-[700px]">

          {/* Preview Area (Left - Large) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-8 relative h-full rounded-3xl overflow-hidden glass-premium border border-white/10 shadow-2xl group"
          >
            <Image
              src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
              alt="Workspace Preview"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Status Bar */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Live Preview</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-xs font-mono text-white/60">
                  4K • 60FPS
                </div>
              </div>
            </div>

            {/* Metrics Dock */}
            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4">
              {[
                { label: "Texture", value: textureValue, color: "text-[#FFFF00]" },
                { label: "Detail", value: detailValue, color: "text-yellow-400" },
                { label: "Smoothness", value: smoothnessValue, color: "text-amber-300" },
              ].map((metric, i) => (
                <div key={i} className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-xl">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{metric.label}</span>
                    <span className={cn("text-xl font-bold font-heading", metric.color)}>{metric.value}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full bg-current", metric.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Control Panel (Right) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-4 flex flex-col gap-4 h-full"
          >
            {/* Main Controls */}
            <div className="flex-1 glass-elevated border border-white/10 rounded-3xl p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Settings2 className="w-5 h-5 text-[#FFFF00]" />
                  <span className="font-bold text-white">Parameters</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-white/40 hover:text-white transition-colors uppercase tracking-wider font-bold"
                >
                  Reset Default
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-6">
                {[
                  { label: "Texture Strength", value: textureValue, setValue: setTextureValue, color: "text-[#FFFF00]" },
                  { label: "Micro Detail", value: detailValue, setValue: setDetailValue, color: "text-yellow-400" },
                  { label: "Skin Smoothness", value: smoothnessValue, setValue: setSmoothness, color: "text-amber-300" },
                ].map((control, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-white/80">{control.label}</span>
                      <span className="font-mono text-white/60">{control.value}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={control.value}
                      onChange={(e) => control.setValue(parseInt(e.target.value))}
                      className={cn(
                        "w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer",
                        "accent-white hover:accent-accent-neon transition-all"
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Texture Styles */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Processing Mode</span>
                <div className="grid grid-cols-1 gap-2">
                  {textureStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedTextureStyle(style.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200",
                        style.active
                          ? "bg-white/10 border-accent-blue/50"
                          : "bg-transparent border-white/5 hover:bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        style.active ? "border-accent-blue bg-accent-blue/20" : "border-white/20"
                      )}>
                        {style.active && <div className="w-2 h-2 bg-accent-blue rounded-full" />}
                      </div>
                      <div>
                        <div className={cn("text-sm font-bold", style.active ? "text-white" : "text-white/70")}>{style.name}</div>
                        <div className="text-xs text-white/40">{style.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhancement Zones */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Target Zones</span>
                  <span className="text-xs font-mono text-accent-neon">{getCoveragePercentage()}% Active</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {enhancementOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggleEnhancementArea(opt.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                        opt.active
                          ? "bg-accent-blue/20 border-accent-blue/50 text-white"
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                      )}
                    >
                      {opt.area}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Button */}
            <button
              onClick={handleProcessing}
              disabled={isProcessing}
              className="w-full py-5 rounded-2xl bg-[#FFFF00] text-black font-bold text-lg hover:bg-[#E6E600] hover:shadow-[0_0_20px_rgba(255,255,0,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Cpu className="animate-spin" />
                  Processing...
                </>
              ) : "Apply AI Enhancement"}
            </button>
          </motion.div>

        </div>
      </div>
    </section>
  )
}