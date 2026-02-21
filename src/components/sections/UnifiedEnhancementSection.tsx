"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import {
  Sparkles, Eye, Palette, Brain, Layers, Award,
  TrendingUp, Zap, Shield, Heart, Play, CheckCircle2, Loader2, CheckCircle
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AnimatePresence } from "framer-motion"

export function UnifiedEnhancementSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeFeature, setActiveFeature] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAfter, setShowAfter] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // ... (Keep existing variants if needed, or simplify)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  }

  const enhancementSuite = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Neural Skin Analysis",
      description: "Advanced AI analyzes 50+ skin parameters for personalized enhancement.",
      stats: "99.2% accuracy",
      color: "text-accent-blue"
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Multi-Layer Processing",
      description: "Separate enhancement layers for skin, eyes, hair, and background.",
      stats: "4-layer depth",
      color: "text-accent-purple"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Texture Preservation",
      description: "Maintains natural skin texture while removing imperfections.",
      stats: "95% detail retention",
      color: "text-accent-neon"
    }
  ]

  const performanceMetrics = [
    { icon: <TrendingUp className="h-5 w-5" />, label: "Quality Improvement", value: "94.8%" },
    { icon: <Award className="h-5 w-5" />, label: "Max Resolution", value: "Up to 8K" },
    { icon: <Shield className="h-5 w-5" />, label: "Secure Processing", value: "Enterprise" },
    { icon: <Heart className="h-5 w-5" />, label: "Natural Results", value: "99.1%" }
  ]

  const handleEnhance = () => {
    if (showAfter || isProcessing) return
    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false) // Stop loading
      setShowAfter(true) // Show result
    }, 2000)
  }

  return (
    <section className="py-24 relative overflow-hidden bg-black/40">

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-accent-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-accent-purple/5 rounded-full blur-[120px]" />
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
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-8">
            <Zap className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-medium text-white/80 uppercase tracking-widest">Instant Results</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="text-white">See It In</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-neon to-white">Action</span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Experience the power of our neural engine. With a single click, transform low-quality snapshots into professional-grade photography.
          </motion.p>
        </motion.div>

        {/* Feature Grid - Reduced to 3 items for cleaner look */}
        <div className="grid md:grid-cols-3 gap-6 mb-24 max-w-6xl mx-auto">
          {enhancementSuite.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl glass-card border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-white/5", feature.color)}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Interactive Processing Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-6xl"
        >
          <div className="bg-black/40 border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">

            <div className="grid md:grid-cols-2 gap-12 items-center">

              {/* Left Side: Controls */}
              <div className="space-y-8">
                <h3 className="text-3xl font-bold text-white">One Click Enhancement</h3>
                <p className="text-white/60">Our AI automatically detects subjects, analyzes lighting conditions, and applies optimal enhancements in seconds.</p>

                <div className="pt-4">
                  <Button
                    onClick={handleEnhance}
                    disabled={isProcessing || showAfter}
                    size="lg"
                    className={`btn-premium w-full sm:w-auto px-10 py-8 text-xl transition-all duration-300 ${showAfter ? '!bg-green-500 !shadow-none !text-black' : ''}`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Processing...
                      </span>
                    ) : showAfter ? (
                      <span className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6" />
                        Enhancement Complete
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6" />
                        Run AI Enhancement
                      </span>
                    )}
                  </Button>
                </div>

                {/* Metrics - Removed Satisfied Users as requested */}
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                  <div>
                    <div className="text-2xl font-bold text-white">8K</div>
                    <div className="text-xs text-white/40 uppercase tracking-widest">Max Resolution</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">2K/4K/8K</div>
                    <div className="text-xs text-white/40 uppercase tracking-widest">Upscaling Support</div>
                  </div>
                </div>
              </div>

              {/* Right Side: Demo Visual */}
              <div className="relative aspect-[3/4] md:aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/50">
                {/* Images */}
                <div className="absolute inset-0">
                  <Image
                    src={showAfter ? "/images/demo/enhanceafter.jpeg" : "/images/demo/enhancebefore.jpeg"}
                    alt="Demo"
                    fill
                    className="object-cover transition-opacity duration-700"
                  />
                </div>

                {/* Scanning Overlay */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ top: "-20%" }}
                      animate={{ top: "120%" }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-accent-neon/30 to-transparent border-y border-accent-neon/50 z-20"
                    />
                  )}
                </AnimatePresence>

                {/* Status Badge */}
                <div className="absolute top-4 left-4 z-30">
                  <div className={`px-4 py-2 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2 ${showAfter ? 'bg-green-500/20 text-green-400' : 'bg-black/60 text-white'}`}>
                    {showAfter ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {showAfter ? "Result Ready" : isProcessing ? "Processing..." : "Original"}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}