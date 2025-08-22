"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  Sparkles,
  CheckCircle,
  Play,
  RotateCcw,
  Brain,
  Cpu,
  Target,
  Layers
} from "lucide-react"

interface MagicalPortraitSectionProps {
  beforeImage?: string
  afterImage?: string
  className?: string
}

// Animated Gradient Border Component
const AnimatedGradientBorder = ({ isActive, step }: { isActive: boolean, step: number }) => {
  const gradients = [
    'linear-gradient(45deg, #3b82f6, #06b6d4, #3b82f6, #06b6d4)',
    'linear-gradient(45deg, #8b5cf6, #ec4899, #8b5cf6, #ec4899)',
    'linear-gradient(45deg, #10b981, #059669, #10b981, #059669)'
  ]

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-3xl p-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: gradients[step] || gradients[0],
            backgroundSize: '300% 300%',
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-3xl"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              background: gradients[step] || gradients[0],
              backgroundSize: '300% 300%',
            }}
          />
          <div className="relative w-full h-full bg-black rounded-3xl" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Simple Linear Loading Bar
const SimpleLoader = ({ isActive, step, progress }: { isActive: boolean, step: number, progress: number }) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-6 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Glass Loading Container */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/90">
                {step === 0 ? 'Analyzing portrait...' :
                  step === 1 ? 'Enhancing features...' :
                    'Optimizing quality...'}
              </span>
              <span className="text-sm font-mono text-white/70">{Math.round(progress)}%</span>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${step === 0 ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                  step === 1 ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                    'bg-gradient-to-r from-green-400 to-emerald-400'
                  }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Simple Clean Image Transition
const SimpleImageTransition = ({ beforeImage, afterImage, isVisible }: {
  beforeImage: string,
  afterImage: string,
  isVisible: boolean
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Original Image - Slowly scales down and slides back */}
          <motion.div
            className="absolute inset-0 rounded-3xl overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl"
            initial={{ scale: 1, y: 0 }}
            animate={{ scale: 0.85, y: 20 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            style={{ zIndex: 1 }}
          >
            <img
              src={beforeImage}
              alt="Original"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* Enhanced Image - Pops up in place after delay */}
          <motion.div
            className="absolute inset-0 rounded-3xl overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.6,
              ease: "easeOut",
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            style={{ zIndex: 2 }}
          >
            <img
              src={afterImage}
              alt="Enhanced"
              className="w-full h-full object-cover object-center"
            />

            {/* Subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function MagicalPortraitSection({
  beforeImage = "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg",
  afterImage = "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png",
  className = ""
}: MagicalPortraitSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [isComplete, setIsComplete] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [stepProgress, setStepProgress] = useState(0)

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const processingSteps = [
    {
      id: "analyzing",
      icon: <Brain className="w-6 h-6" />,
      title: "Neural Analysis",
      description: "AI examines facial structure and skin patterns with deep learning algorithms",
      color: "from-blue-500 to-cyan-500",
      duration: 1800
    },
    {
      id: "processing",
      icon: <Cpu className="w-6 h-6" />,
      title: "Deep Processing",
      description: "Advanced neural networks apply intelligent skin enhancement and color correction",
      color: "from-purple-500 to-pink-500",
      duration: 1800
    },
    {
      id: "optimizing",
      icon: <Target className="w-6 h-6" />,
      title: "Quality Optimization",
      description: "Final optimization algorithms ensure natural appearance and professional quality",
      color: "from-green-500 to-emerald-500",
      duration: 1800
    }
  ]

  const startMagic = () => {
    if (isPlaying) return

    setIsPlaying(true)
    setCurrentStep(-1)
    setIsComplete(false)
    setShowComparison(false)
    setStepProgress(0)

    // Process each step with progress tracking
    processingSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index)
        setStepProgress(0)

        // Animate progress for current step
        const progressInterval = setInterval(() => {
          setStepProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval)
              return 100
            }
            return prev + (100 / (step.duration / 100))
          })
        }, 100)

        // Complete processing and show comparison
        if (index === processingSteps.length - 1) {
          setTimeout(() => {
            setCurrentStep(-1)
            setIsPlaying(false)

            // Show vertical stack comparison after processing
            setTimeout(() => {
              setShowComparison(true)
              setIsComplete(true)
            }, 300)
          }, step.duration)
        }
      }, index * 2000)
    })
  }

  const resetMagic = () => {
    setIsPlaying(false)
    setCurrentStep(-1)
    setIsComplete(false)
    setShowComparison(false)
    setStepProgress(0)
  }

  // Auto-start when in view
  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        startMagic()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isInView])

  return (
    <section id="magical-portrait-section" className={`py-24 relative overflow-hidden bg-black ${className}`}>
      {/* Black Background with Dot Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black" />

        {/* Subtle Dot Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* iOS-style Gradient Orbs */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.7, 0.4],
            x: [0, 20, 0],
            y: [0, -10, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.7, 0.4, 0.7],
            x: [0, -20, 0],
            y: [0, 10, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Header */}
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <Sparkles className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-semibold text-text-secondary">AI Portrait Magic</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-white">Watch the</span>
            <br />
            <span className="text-gradient-neon">Magic Happen</span>
          </h2>

          <p className="text-lg text-text-secondary max-w-3xl mx-auto">
            Experience the power of AI as it transforms your portrait in real-time.
            Watch each enhancement step unfold with cinematic precision.
          </p>
        </motion.div>

        {/* Main Content with Perfect Symmetry */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-stretch">

            {/* Processing Steps - Left Side */}
            <motion.div
              className="space-y-6 flex flex-col"
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <Layers className="w-6 h-6 text-accent-neon" />
                AI Processing Pipeline
              </h3>

              {processingSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className={`relative p-6 rounded-2xl border transition-all duration-500 ${currentStep === index
                    ? `bg-white/10 backdrop-blur-2xl border-white/30 scale-105 shadow-2xl`
                    : currentStep > index
                      ? 'bg-white/5 backdrop-blur-2xl border-green-400/20'
                      : 'bg-white/5 backdrop-blur-2xl border-white/10'
                    }`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.1 * index, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {/* Step Status */}
                  <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${currentStep > index
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : currentStep === index
                      ? `bg-gradient-to-r ${step.color} text-white shadow-lg`
                      : 'bg-white/10 backdrop-blur-xl text-white/60 border border-white/20'
                    }`}>
                    {currentStep > index ? (
                      <CheckCircle className="w-5 h-5" />
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

                  <div className="flex items-start gap-4">
                    <motion.div
                      className={`p-4 rounded-xl transition-all duration-500 ${currentStep === index
                        ? `bg-gradient-to-r ${step.color} text-white shadow-lg`
                        : currentStep > index
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-white/10 text-white/60'
                        }`}
                      animate={currentStep === index ? {
                        scale: [1, 1.05, 1],
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {step.icon}
                    </motion.div>

                    <div className="flex-1">
                      <h4 className={`text-xl font-bold mb-2 transition-colors duration-500 ${currentStep >= index ? 'text-white' : 'text-white/70'
                        }`}>
                        {step.title}
                      </h4>
                      <p className={`text-sm leading-relaxed transition-colors duration-500 ${currentStep >= index ? 'text-white/80' : 'text-white/50'
                        }`}>
                        {step.description}
                      </p>

                      {/* Modern Full Card Loading Animation */}
                      {currentStep === index && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl overflow-hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {/* Animated Gradient Overlay */}
                          <motion.div
                            className="absolute inset-0 rounded-2xl"
                            style={{
                              background: `linear-gradient(45deg, transparent, ${step.color === 'from-blue-500 to-cyan-500' ? 'rgba(59, 130, 246, 0.1)' :
                                step.color === 'from-purple-500 to-pink-500' ? 'rgba(168, 85, 247, 0.1)' :
                                  'rgba(16, 185, 129, 0.1)'
                                }, transparent)`,
                              backgroundSize: '200% 200%',
                            }}
                            animate={{
                              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                          />

                          {/* Shimmer Effect */}
                          <motion.div
                            className="absolute inset-0 rounded-2xl"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                              backgroundSize: '200% 100%',
                            }}
                            animate={{
                              backgroundPosition: ['-200% 0%', '200% 0%'],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                          />

                          {/* Pulsing Border */}
                          <motion.div
                            className="absolute inset-0 rounded-2xl border-2"
                            style={{
                              borderColor: step.color === 'from-blue-500 to-cyan-500' ? '#3b82f6' :
                                step.color === 'from-purple-500 to-pink-500' ? '#8b5cf6' :
                                  '#10b981'
                            }}
                            animate={{
                              opacity: [0.3, 0.8, 0.3],
                              scale: [1, 1.02, 1],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        </motion.div>
                      )}

                      {/* Progress Bar */}
                      {currentStep === index && (
                        <motion.div
                          className="mt-4 relative"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/70">Processing...</span>
                            <span className="text-xs font-mono text-white/70">{Math.round(stepProgress)}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full bg-gradient-to-r ${step.color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${stepProgress}%` }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Control Button */}
              <div className="mt-auto">
                <motion.button
                  onClick={isComplete ? resetMagic : startMagic}
                  disabled={isPlaying}
                  className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${isPlaying
                    ? 'bg-white/5 text-white/40 cursor-not-allowed backdrop-blur-2xl border border-white/10'
                    : isComplete
                      ? 'bg-white/10 backdrop-blur-2xl text-white hover:bg-white/20 border border-white/20'
                      : 'bg-gradient-to-r from-accent-blue to-accent-purple text-white hover:shadow-xl hover:scale-105'
                    }`}
                  whileHover={!isPlaying ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isPlaying ? { scale: 0.98 } : {}}
                >
                  {isPlaying ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Processing Magic...
                    </>
                  ) : isComplete ? (
                    <>
                      <RotateCcw className="w-5 h-5" />
                      Experience Again
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start the Magic
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Image Processing Area - Right Side */}
            <motion.div
              className="relative flex items-stretch"
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="relative w-full h-full rounded-3xl overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">

                {/* Animated Gradient Border */}
                <AnimatedGradientBorder
                  isActive={currentStep >= 0 && !showComparison}
                  step={currentStep}
                />

                {/* Original Image - Hidden when comparison is shown */}
                <motion.img
                  src={beforeImage}
                  alt="Original Portrait"
                  className="absolute inset-0 w-full h-full object-cover object-center rounded-3xl"
                  animate={{
                    filter: currentStep >= 0 && !showComparison ? 'blur(0.5px) brightness(0.9)' : 'blur(0px) brightness(1)',
                    opacity: showComparison ? 0 : 1
                  }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                />

                {/* Simple Linear Loading */}
                <SimpleLoader
                  isActive={currentStep >= 0 && !showComparison}
                  step={currentStep}
                  progress={stepProgress}
                />

                {/* Simple Image Transition */}
                <SimpleImageTransition
                  beforeImage={beforeImage}
                  afterImage={afterImage}
                  isVisible={showComparison}
                />

                {/* Magic Complete Tag - Bottom Center with Glassmorphism */}
                <AnimatePresence>
                  {showComparison && (
                    <motion.div
                      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30"
                      initial={{ y: 20, opacity: 0, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.8,
                        delay: 1.2,
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                    >
                      <div className="flex items-center gap-3 px-6 py-3 bg-white/15 backdrop-blur-2xl rounded-xl border border-white/25 shadow-xl">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 360, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 0.5
                          }}
                        >
                          <Sparkles className="w-5 h-5 text-accent-neon" />
                        </motion.div>
                        <span className="text-white font-semibold text-base">Magic Complete!</span>
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.3
                          }}
                        >
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}