"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  Sparkles,
  Eye,
  Palette,
  Zap,
  Star,
  Award,
  Camera,
  Wand2,
  Heart,
  Download,
  Share2,
  Info,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  Layers,
  Target,
  Clock,
  Upload,
  Cpu,
  Image as ImageIcon,
  Brush,
  Scan,
  Lightbulb,
  Maximize2
} from "lucide-react"

interface EnhancementStep {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  duration: number
  delay: number
}

interface QualityMetric {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}

interface PortraitEnhancementSuiteProps {
  beforeImage: string
  afterImage: string
  title?: string
  description?: string
  className?: string
}

export default function PortraitEnhancementSuite({
  beforeImage,
  afterImage,
  title = "Watch the Magic Happen",
  description = "Experience the power of AI as it transforms your portrait in real-time. Watch each enhancement step unfold with cinematic precision.",
  className = ""
}: PortraitEnhancementSuiteProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [showMetrics, setShowMetrics] = useState(false)
  const [revealProgress, setRevealProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
  
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  // Enhanced workflow steps with more detailed progression
  const enhancementSteps: EnhancementStep[] = [
    {
      id: "scan",
      icon: <Scan className="w-6 h-6" />,
      title: "AI Scanning",
      description: "Deep analysis of facial features, skin texture, and lighting conditions",
      color: "from-blue-500 to-cyan-500",
      duration: 1200,
      delay: 0
    },
    {
      id: "process",
      icon: <Cpu className="w-6 h-6" />,
      title: "Neural Processing",
      description: "Advanced AI models process and enhance every pixel with precision",
      color: "from-purple-500 to-pink-500",
      duration: 1800,
      delay: 600
    },
    {
      id: "enhance",
      icon: <Sparkles className="w-6 h-6" />,
      title: "Magic Enhancement",
      description: "Applying skin smoothing, color correction, and detail enhancement",
      color: "from-orange-500 to-yellow-500",
      duration: 1500,
      delay: 1200
    },
    {
      id: "perfect",
      icon: <Award className="w-6 h-6" />,
      title: "Perfection Mode",
      description: "Final touches for professional-grade portrait perfection",
      color: "from-green-500 to-emerald-500",
      duration: 1000,
      delay: 1800
    }
  ]

  // Quality metrics
  const qualityMetrics: QualityMetric[] = [
    {
      label: "Enhancement Quality",
      value: "98.5%",
      icon: <Wand2 className="w-4 h-4" />,
      color: "text-blue-400"
    },
    {
      label: "Natural Appearance",
      value: "99.2%",
      icon: <Heart className="w-4 h-4" />,
      color: "text-pink-400"
    },
    {
      label: "Detail Preservation",
      value: "97.8%",
      icon: <Eye className="w-4 h-4" />,
      color: "text-green-400"
    },
    {
      label: "Processing Speed",
      value: "< 30s",
      icon: <Zap className="w-4 h-4" />,
      color: "text-orange-400"
    }
  ]

  // Auto-play animation sequence
  useEffect(() => {
    if (!isInView || !autoPlay) return

    const timer = setTimeout(() => {
      startEnhancement()
    }, 1000)

    return () => clearTimeout(timer)
  }, [isInView, autoPlay])

  // Enhancement animation controller
  const startEnhancement = () => {
    if (isPlaying) return
    
    setIsPlaying(true)
    setCurrentStep(-1)
    setRevealProgress(0)
    setIsComplete(false)
    setShowMetrics(false)

    // Step progression
    enhancementSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index)
        
        // Update reveal progress
        const progress = ((index + 1) / enhancementSteps.length) * 100
        setRevealProgress(progress)
        
        // Complete animation
        if (index === enhancementSteps.length - 1) {
          setTimeout(() => {
            setIsComplete(true)
            setShowMetrics(true)
            setIsPlaying(false)
          }, step.duration)
        }
      }, step.delay)
    })
  }

  const resetEnhancement = () => {
    setIsPlaying(false)
    setCurrentStep(-1)
    setRevealProgress(0)
    setIsComplete(false)
    setShowMetrics(false)
  }

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay)
    if (!autoPlay) {
      startEnhancement()
    }
  }

  return (
    <section className={`py-24 relative overflow-hidden bg-slate-900 ${className}`}>
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header Section - Following WorkflowSection pattern */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Sparkles className="h-4 w-4 text-accent-neon" />
              <span className="text-sm font-semibold text-text-secondary">AI Enhancement Magic</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              <span className="text-white">{title}</span>
            </h2>
            
            <p className="text-lg text-text-secondary max-w-3xl mx-auto mt-6 mb-8">
              {description}
            </p>

            {/* Enhanced Control Button */}
            <div className="flex items-center justify-center gap-6">
              <motion.button
                onClick={startEnhancement}
                disabled={isPlaying}
                className={`relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden ${
                  isPlaying
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-accent-blue to-accent-purple text-white hover:shadow-2xl hover:scale-105'
                }`}
                whileHover={!isPlaying ? { scale: 1.05, y: -2 } : {}}
                whileTap={!isPlaying ? { scale: 0.95 } : {}}
              >
                {/* Button Glow Effect */}
                {!isPlaying && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                )}
                
                {/* Button Content */}
                <div className="relative z-10 flex items-center gap-3">
                  {isPlaying ? (
                    <>
                      <motion.div
                        className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Creating Magic...</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      >
                        <Sparkles className="w-6 h-6" />
                      </motion.div>
                      <span>Watch the Magic Happen</span>
                    </>
                  )}
                </div>
              </motion.button>

              {/* Reset Button */}
              {(isComplete || currentStep > -1) && (
                <motion.button
                  onClick={resetEnhancement}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-md border border-white/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Main Enhancement Area - Grid Layout like WorkflowSection */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Workflow Steps */}
            {enhancementSteps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 60 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.25, 0.46, 0.45, 0.94],
                  delay: 0.2 * index 
                }}
              >
                {/* Step Number */}
                <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg z-10 transition-all duration-500 ${
                  currentStep >= index 
                    ? `bg-gradient-to-r ${step.color} shadow-lg scale-110` 
                    : 'bg-gray-600'
                }`}>
                  {currentStep > index ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : currentStep === index ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    index + 1
                  )}
                </div>
                
                {/* Step Card */}
                <div className={`p-8 rounded-3xl h-full transition-all duration-500 ${
                  currentStep >= index 
                    ? 'glass-premium scale-105 shadow-2xl' 
                    : 'glass-card'
                }`}>
                  <div className="text-center space-y-6">
                    {/* Icon */}
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto transition-all duration-500 ${
                      currentStep >= index 
                        ? `bg-gradient-to-r ${step.color} shadow-lg` 
                        : 'bg-white/10'
                    }`}>
                      <div className="text-white">
                        {step.icon}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                      <p className="text-text-secondary leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Arrow (except for last step) */}
                {index < enhancementSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                      currentStep > index 
                        ? 'bg-accent-neon/30 text-accent-neon' 
                        : 'bg-accent-neon/20 text-white/50'
                    }`}>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Magical Image Reveal Section */}
          <motion.div
            className="relative max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {/* Enhancement Preview Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">Live Enhancement Preview</h3>
              <p className="text-text-secondary">Watch your portrait transform in real-time</p>
            </motion.div>

            <div className="relative aspect-[16/10] rounded-3xl overflow-hidden glass-premium shadow-2xl">
              {/* Scanning Overlay Effect */}
              <AnimatePresence>
                {currentStep === 0 && isPlaying && (
                  <motion.div
                    className="absolute inset-0 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                    <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-sm" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Processing Grid Overlay */}
              <AnimatePresence>
                {currentStep === 1 && isPlaying && (
                  <motion.div
                    className="absolute inset-0 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-1 p-4">
                      {[...Array(48)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="bg-purple-500/20 rounded-sm"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                          transition={{
                            duration: 0.8,
                            delay: i * 0.02,
                            repeat: Infinity,
                            repeatDelay: 1
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Before Image */}
              <motion.img
                src={beforeImage}
                alt="Original Image"
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 1 }}
                animate={{ 
                  opacity: 1,
                  filter: currentStep >= 2 ? 'brightness(0.8) contrast(0.9)' : 'brightness(1) contrast(1)'
                }}
                transition={{ duration: 0.5 }}
              />

              {/* After Image with Advanced Reveal */}
              <motion.div
                className="absolute inset-0 w-full h-full"
                style={{
                  clipPath: `inset(0 ${100 - revealProgress}% 0 0)`,
                }}
              >
                <motion.img
                  src={afterImage}
                  alt="Enhanced Image"
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.05, filter: 'brightness(1.1) contrast(1.1) saturate(1.2)' }}
                  animate={{ 
                    scale: isComplete ? 1 : 1.05,
                    filter: isComplete ? 'brightness(1) contrast(1) saturate(1)' : 'brightness(1.1) contrast(1.1) saturate(1.2)'
                  }}
                  transition={{ duration: 1 }}
                />
                
                {/* Enhanced Magical Reveal Line */}
                <motion.div
                  className="absolute right-0 top-0 h-full"
                  style={{
                    right: `${100 - revealProgress}%`,
                    width: '4px',
                    background: 'linear-gradient(to bottom, #00d4ff, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
                    boxShadow: '0 0 40px rgba(0, 212, 255, 0.8), 0 0 80px rgba(59, 130, 246, 0.6), 0 0 120px rgba(139, 92, 246, 0.4)'
                  }}
                  animate={isPlaying ? {
                    boxShadow: [
                      '0 0 40px rgba(0, 212, 255, 0.8), 0 0 80px rgba(59, 130, 246, 0.6)',
                      '0 0 60px rgba(0, 212, 255, 1), 0 0 120px rgba(59, 130, 246, 0.8)',
                      '0 0 40px rgba(0, 212, 255, 0.8), 0 0 80px rgba(59, 130, 246, 0.6)'
                    ],
                    width: ['4px', '6px', '4px']
                  } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  {/* Reveal Line Particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                          left: '50%',
                          top: `${i * 12.5}%`,
                        }}
                        animate={isPlaying ? {
                          scale: [0, 1.5, 0],
                          opacity: [0, 1, 0],
                          x: [-2, 2, -2]
                        } : {}}
                        transition={{
                          duration: 1,
                          delay: i * 0.1,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              {/* Enhanced Multi-Layer Sparkle Effects */}
              <AnimatePresence>
                {isPlaying && (
                  <>
                    {/* Primary Sparkles */}
                    {[
                      { left: 25, top: 30, delay: 0.5, color: 'text-blue-400', size: 'w-4 h-4' },
                      { left: 75, top: 20, delay: 1.2, color: 'text-purple-400', size: 'w-5 h-5' },
                      { left: 40, top: 60, delay: 0.8, color: 'text-cyan-400', size: 'w-3 h-3' },
                      { left: 60, top: 45, delay: 1.5, color: 'text-pink-400', size: 'w-4 h-4' },
                      { left: 30, top: 75, delay: 0.3, color: 'text-blue-300', size: 'w-3 h-3' },
                      { left: 80, top: 65, delay: 1.8, color: 'text-purple-300', size: 'w-5 h-5' }
                    ].map((sparkle, i) => (
                      <motion.div
                        key={`primary-${i}`}
                        className="absolute z-20"
                        style={{
                          left: `${sparkle.left}%`,
                          top: `${sparkle.top}%`,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: [0, 1.8, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 2.5,
                          delay: sparkle.delay,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                      >
                        <Sparkles className={`${sparkle.size} ${sparkle.color} drop-shadow-lg`} />
                      </motion.div>
                    ))}

                    {/* Secondary Micro Sparkles */}
                    {[
                      { left: 15, top: 25, delay: 0.7 },
                      { left: 85, top: 35, delay: 1.4 },
                      { left: 35, top: 15, delay: 0.9 },
                      { left: 65, top: 85, delay: 1.1 },
                      { left: 45, top: 55, delay: 1.6 },
                      { left: 55, top: 25, delay: 0.4 },
                      { left: 25, top: 85, delay: 1.9 },
                      { left: 75, top: 55, delay: 0.6 }
                    ].map((sparkle, i) => (
                      <motion.div
                        key={`micro-${i}`}
                        className="absolute z-15"
                        style={{
                          left: `${sparkle.left}%`,
                          top: `${sparkle.top}%`,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 0.8, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          delay: sparkle.delay,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-lg" />
                      </motion.div>
                    ))}

                    {/* Floating Enhancement Particles */}
                    {currentStep >= 2 && (
                      <>
                        {[
                          { left: 20, top: 40, delay: 0.2 },
                          { left: 80, top: 30, delay: 0.8 },
                          { left: 50, top: 20, delay: 1.2 },
                          { left: 30, top: 80, delay: 0.5 },
                          { left: 70, top: 70, delay: 1.5 }
                        ].map((particle, i) => (
                          <motion.div
                            key={`particle-${i}`}
                            className="absolute z-10"
                            style={{
                              left: `${particle.left}%`,
                              top: `${particle.top}%`,
                            }}
                            initial={{ scale: 0, opacity: 0, y: 20 }}
                            animate={{
                              scale: [0, 1, 0],
                              opacity: [0, 0.6, 0],
                              y: [20, -20, 20],
                            }}
                            transition={{
                              duration: 3,
                              delay: particle.delay,
                              repeat: Infinity,
                              repeatDelay: 1,
                            }}
                          >
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-sm" />
                          </motion.div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </AnimatePresence>

              {/* Progress Indicator */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md text-white text-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    Original
                  </motion.div>

                  <AnimatePresence>
                    {revealProgress > 5 && (
                      <motion.div
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md text-blue-400 text-sm"
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Enhanced
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/40 rounded-full h-2 backdrop-blur-md">
                  <motion.div
                    className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${revealProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Epic Completion Celebration */}
              <AnimatePresence>
                {isComplete && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Celebration Particles */}
                    <div className="absolute inset-0">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            left: `${50 + (i % 2 === 0 ? 1 : -1) * (10 + i * 2)}%`,
                            top: `${50 + (i % 3 === 0 ? 1 : -1) * (5 + i * 1.5)}%`,
                            background: `hsl(${200 + i * 15}, 70%, 60%)`,
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: [0, 1.5, 0],
                            opacity: [0, 1, 0],
                            y: [0, -100, -200],
                            x: [(i % 2 === 0 ? 1 : -1) * 50, (i % 2 === 0 ? 1 : -1) * 100],
                          }}
                          transition={{
                            duration: 2,
                            delay: i * 0.1,
                            repeat: Infinity,
                            repeatDelay: 3,
                          }}
                        />
                      ))}
                    </div>

                    <motion.div
                      className="text-center space-y-8 z-10"
                      initial={{ scale: 0, opacity: 0, y: 50 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.4 }}
                    >
                      {/* Success Icon with Glow */}
                      <motion.div
                        className="relative mx-auto w-24 h-24"
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 blur-xl opacity-60" />
                        <div className="relative w-full h-full rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center shadow-2xl">
                          <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                      </motion.div>

                      {/* Success Message */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <h3 className="text-3xl font-bold text-white mb-4">
                          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            ✨ Transformation Complete! ✨
                          </span>
                        </h3>
                        <p className="text-white/90 text-xl mb-2">Your portrait has been magically enhanced</p>
                        <p className="text-white/70 text-sm">Professional AI enhancement with natural results</p>
                      </motion.div>

                      {/* Action Buttons */}
                      <motion.div
                        className="flex gap-4 justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                      >
                        <motion.button
                          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-bold text-lg shadow-2xl"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Download className="w-5 h-5" />
                          Download Enhanced
                        </motion.button>
                        <motion.button
                          className="flex items-center gap-3 px-8 py-4 bg-white/20 backdrop-blur-md text-white rounded-2xl font-bold text-lg border border-white/30 shadow-xl"
                          whileHover={{ scale: 1.05, y: -2, backgroundColor: 'rgba(255,255,255,0.3)' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Share2 className="w-5 h-5" />
                          Share Result
                        </motion.button>
                      </motion.div>

                      {/* Try Again Button */}
                      <motion.button
                        onClick={resetEnhancement}
                        className="text-white/60 hover:text-white text-sm underline transition-colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                      >
                        Try with another image
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Quality Metrics - Following website pattern */}
          <AnimatePresence>
            {showMetrics && (
              <motion.div
                className="grid md:grid-cols-4 gap-6 mt-16"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ duration: 0.8, staggerChildren: 0.1 }}
              >
                {qualityMetrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    className="text-center space-y-4 p-6 glass-card rounded-2xl"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${metric.color.replace('text-', 'bg-').replace('400', '500/20')}`}>
                      <div className={metric.color}>
                        {metric.icon}
                      </div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold mb-2 ${metric.color}`}>
                        {metric.value}
                      </div>
                      <div className="text-text-secondary">
                        {metric.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}