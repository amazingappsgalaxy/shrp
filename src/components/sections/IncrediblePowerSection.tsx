"use client"

import { motion, easeOut } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Zap, Eye, Sparkles, RotateCcw, Settings2, Target, Monitor, Cpu, Play, Pause, BarChart3 } from "lucide-react"
import Image from "next/image"

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: easeOut
      }
    }
  }

  const textureStyles = [
    { id: "natural", name: "Natural", desc: "Realistic skin pores and texture", active: selectedTextureStyle === "natural" },
    { id: "smooth", name: "Smooth", desc: "Refined and clean skin tone", active: selectedTextureStyle === "smooth" },
    { id: "detailed", name: "Detailed", desc: "Enhanced facial features", active: selectedTextureStyle === "detailed" }
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
      face: true,
      skin: true,
      nose: false,
      mouth: true,
      eyes: false
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
      {/* Glassmorphism Background - Matching AI Enhanced Gallery */}
      {/* Background removed as requested */}

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-8"
        >
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-sm">
              <Cpu className="h-4 w-4 text-accent-neon" />
              <span className="text-sm font-semibold text-text-secondary">AI Engine</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-gradient-neon">
              Incredible AI Power
            </h2>
            
            <p className="text-lg text-text-secondary max-w-3xl mx-auto font-medium">
              Experience our advanced AI engine with real-time controls and instant feedback, delivering unparalleled image enhancement capabilities.
            </p>
          </motion.div>
        </motion.div>

        {/* Glassmorphic Main Dashboard */}
        <motion.div
          variants={containerVariants}
          className="grid lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Large Image Preview - Using glass-card */}
          <motion.div variants={itemVariants} className="order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden">
              <Image
                src="/testpics/Girl+1+After.png"
                alt="Enhanced Portrait"
                width={600}
                height={750}
                className="w-full aspect-[4/5] object-cover shadow-none"
              />
              
              {/* Glassmorphic Status Badge */}
              <div className="absolute top-4 right-4">
                <div className="px-4 py-2 rounded-full glass-card" style={{border: '1px solid hsl(142 76% 36% / 0.3)'}}>
                  <span className="text-sm font-bold text-success flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse"></div>
                    AI Enhanced
                  </span>
                </div>
              </div>
              
              {/* Glassmorphic Metrics Dock */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="glass-card rounded-xl p-5" style={{border: '1px solid hsl(142 76% 36% / 0.3)'}}>
                  <div className="grid grid-cols-3 gap-8 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-accent-neon">{textureValue}%</div>
                      <div className="text-xs text-text-secondary font-semibold uppercase tracking-wide">Texture</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-accent-purple">{detailValue}%</div>
                      <div className="text-xs text-text-secondary font-semibold uppercase tracking-wide">Detail</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-success">{smoothnessValue}%</div>
                      <div className="text-xs text-text-secondary font-semibold uppercase tracking-wide">Smooth</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Glassmorphic Control Panel */}
          <motion.div variants={itemVariants} className="order-1 lg:order-2 flex flex-col h-full">
            {/* Main Controls Card */}
            <div className="p-6 rounded-3xl border border-white/10 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl border border-white/10">
                    <Settings2 className="h-5 w-5 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">AI Controls</h3>
                    <p className="text-sm text-text-secondary font-medium">Real-time parameters</p>
                  </div>
                </div>
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 text-sm text-accent-blue bg-white/5 border border-white/10 shadow-sm hover:border-accent-blue/50 rounded-xl transition-all duration-300 font-semibold"
                >
                  Reset
                </button>
              </div>

              {/* Enhancement Type Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-text-primary">Enhancement Type</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedEnhancementType("face")}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      selectedEnhancementType === "face"
                        ? "bg-gradient-to-r from-accent-blue to-accent-purple text-white border border-white/20"
                        : "bg-white/5 border border-white/10 text-text-primary hover:border-accent-blue/30"
                    }`}
                  >
                    Face
                  </button>
                  <button
                    onClick={() => setSelectedEnhancementType("body")}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      selectedEnhancementType === "body"
                        ? "bg-gradient-to-r from-accent-blue to-accent-purple text-white border border-white/20"
                        : "bg-white/5 border border-white/10 text-text-primary hover:border-accent-blue/30"
                    }`}
                  >
                    Body
                  </button>
                </div>
              </div>

              {/* Glassmorphic Sliders */}
              <div className="space-y-3">
                {/* Texture Slider */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-text-primary">Texture Enhancement</span>
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 shadow-sm">
                      <span className="text-sm font-bold text-accent-blue">{textureValue}%</span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={textureValue}
                      onChange={(e) => setTextureValue(parseInt(e.target.value))}
                      className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Detail Slider */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-text-primary">Detail Level</span>
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 shadow-sm">
                      <span className="text-sm font-bold text-accent-purple">{detailValue}%</span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={detailValue}
                      onChange={(e) => setDetailValue(parseInt(e.target.value))}
                      className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>

                {/* Smoothness Slider */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-text-primary">Skin Smoothness</span>
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 shadow-sm">
                      <span className="text-sm font-bold text-success">{smoothnessValue}%</span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={smoothnessValue}
                      onChange={(e) => setSmoothness(parseInt(e.target.value))}
                      className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Glassmorphic Process Button */}
              <div className="mt-6">
                <button 
                  onClick={handleProcessing}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue/80 hover:to-accent-purple/80 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 backdrop-blur-md border border-white/20"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Apply Enhancement
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Glassmorphic Feature Cards */}
        <motion.div variants={containerVariants} className="grid md:grid-cols-2 gap-8">
          {/* AI Skin Texture Card */}
          <motion.div variants={itemVariants} className="p-6 rounded-3xl border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl border border-white/10">
                <Sparkles className="h-5 w-5 text-accent-blue" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">AI Skin Texture</h3>
                <p className="text-sm text-text-secondary font-medium">Advanced texture correction</p>
              </div>
            </div>

            {/* Glassmorphic Texture Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-text-primary">Texture Styles</span>
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 shadow-sm text-accent-blue">
                  <span className="text-xs font-bold">AI-POWERED</span>
                </div>
              </div>

              <div className="space-y-3">
                {textureStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedTextureStyle(style.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                      style.active 
                        ? 'bg-white/5 border border-accent-blue/30 shadow-sm' 
                        : 'bg-white/5 border border-white/10 shadow-sm hover:border-accent-blue/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full transition-all duration-200 ${
                      style.active ? 'bg-gradient-to-r from-accent-blue to-accent-purple' : 'bg-white/20 border border-white/30'
                    }`} />
                    <div className="flex-1 text-left">
                      <div className={`font-bold text-sm ${
                        style.active ? 'text-accent-blue' : 'text-text-primary'
                      }`}>
                        {style.name}
                      </div>
                      <div className="text-xs text-text-secondary font-medium">{style.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center pt-3">
                <div className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white text-xs font-bold backdrop-blur-md border border-white/20">
                  {selectedTextureStyle.toUpperCase()}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Selective Enhancement Card */}
          <motion.div variants={itemVariants} className="p-6 rounded-3xl border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl border border-white/10">
                <Target className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Selective Enhancement</h3>
                <p className="text-sm text-text-secondary font-medium">Choose specific areas</p>
              </div>
            </div>

            {/* Glassmorphic Toggle List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-text-primary">Enhancement Areas</span>
                <button 
                  onClick={() => setEnhancementAreas({
                    face: true,
                    skin: true,
                    nose: true,
                    mouth: true,
                    eyes: true
                  })}
                  className="text-xs text-accent-blue bg-white/5 border border-white/10 shadow-sm hover:border-accent-blue/50 px-3 py-1.5 rounded-xl transition-all duration-300 font-bold"
                >
                  Select All
                </button>
              </div>

              <div className="space-y-3">
                {enhancementOptions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 shadow-sm flex items-center justify-center text-sm font-bold text-text-primary">
                        {item.letter}
                      </div>
                      <span className="text-sm font-bold text-text-primary">{item.area}</span>
                    </div>
                    <button
                      onClick={() => toggleEnhancementArea(item.id)}
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 backdrop-blur-md border ${
                        item.active ? 'bg-gradient-to-r from-success to-emerald-500' : 'bg-white/5 border border-white/10 shadow-sm'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all duration-300 ${
                        item.active ? 'translate-x-7 border border-success/30' : 'translate-x-1 border border-white/30'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-center pt-3">
                <div className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-success to-emerald-500 text-white text-xs font-bold backdrop-blur-md border border-white/20">
                  {getCoveragePercentage()}% COVERAGE
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}