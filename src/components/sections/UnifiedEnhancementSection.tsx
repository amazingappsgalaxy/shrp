"use client"

import { motion, Variants } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { 
  Wand2, Sparkles, Target, Palette, Camera, Shield, Fingerprint, Zap, Star, Eye, 
  Sparkle, CheckCircle, ArrowRight, Brain, Cpu, Layers, Award, Heart, 
  TrendingUp, Clock, Users, Download, Play, Pause, RotateCcw, Maximize2
} from "lucide-react"
import Image from "next/image"

export function UnifiedEnhancementSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeFeature, setActiveFeature] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }

  const floatingVariants: Variants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [-2, 2, -2],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  // Enhanced feature set with more detailed information
  const enhancementSuite = [
    {
      icon: <Brain className="h-7 w-7" />,
      title: "Neural Skin Analysis",
      description: "Advanced AI analyzes 50+ skin parameters for personalized enhancement",
      stats: "99.2% accuracy",
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
      delay: 0.1
    },
    {
      icon: <Layers className="h-7 w-7" />,
      title: "Multi-Layer Processing",
      description: "Separate enhancement layers for skin, eyes, hair, and background",
      stats: "4 processing layers",
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-400",
      delay: 0.2
    },
    {
      icon: <Sparkles className="h-7 w-7" />,
      title: "Texture Preservation",
      description: "Maintains natural skin texture while removing imperfections",
      stats: "Preserves 95% detail",
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      delay: 0.3
    },
    {
      icon: <Eye className="h-7 w-7" />,
      title: "Intelligent Eye Enhancement",
      description: "Brightens eyes, enhances iris detail, and removes red-eye",
      stats: "3x clarity boost",
      color: "from-orange-500/20 to-yellow-500/20",
      borderColor: "border-orange-500/30",
      iconColor: "text-orange-400",
      delay: 0.4
    },
    {
      icon: <Palette className="h-7 w-7" />,
      title: "Color Harmonization",
      description: "Balances skin tones and corrects color temperature automatically",
      stats: "Perfect color match",
      color: "from-rose-500/20 to-pink-500/20",
      borderColor: "border-rose-500/30",
      iconColor: "text-rose-400",
      delay: 0.5
    },
    {
      icon: <Award className="h-7 w-7" />,
      title: "Professional Quality",
      description: "Studio-grade results suitable for commercial photography",
      stats: "Commercial ready",
      color: "from-indigo-500/20 to-blue-500/20",
      borderColor: "border-indigo-500/30",
      iconColor: "text-indigo-400",
      delay: 0.6
    }
  ]

  // Processing steps for the interactive demo
  const processingSteps = [
    { name: "Analyzing", description: "AI examines facial structure", duration: 2000 },
    { name: "Enhancing", description: "Applying skin improvements", duration: 3000 },
    { name: "Refining", description: "Fine-tuning details", duration: 2000 },
    { name: "Complete", description: "Professional result ready", duration: 1000 }
  ]

  // Performance metrics
  const performanceMetrics = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Quality Improvement",
      value: "94.8%",
      color: "text-green-400"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Processing Speed",
      value: "< 15s",
      color: "text-blue-400"
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Satisfied Users",
      value: "50K+",
      color: "text-purple-400"
    },
    {
      icon: <Heart className="h-5 w-5" />,
      label: "Natural Results",
      value: "99.1%",
      color: "text-pink-400"
    }
  ]

  // Simulate processing animation
  const startProcessing = () => {
    setIsProcessing(true)
    setCurrentStep(0)
    
    processingSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index + 1)
        if (index === processingSteps.length - 1) {
          setTimeout(() => {
            setIsProcessing(false)
            setCurrentStep(0)
          }, step.duration)
        }
      }, processingSteps.slice(0, index).reduce((acc, s) => acc + s.duration, 0))
    })
  }

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Floating Particles */}
      {[
        { left: 10, top: 20, duration: 4, delay: 0 },
        { left: 25, top: 60, duration: 3.5, delay: 0.5 },
        { left: 40, top: 15, duration: 4.5, delay: 1 },
        { left: 55, top: 80, duration: 3, delay: 1.5 },
        { left: 70, top: 35, duration: 4, delay: 0.3 },
        { left: 85, top: 70, duration: 3.5, delay: 0.8 },
        { left: 15, top: 90, duration: 4.5, delay: 1.2 },
        { left: 30, top: 40, duration: 3, delay: 0.7 },
        { left: 45, top: 85, duration: 4, delay: 1.8 },
        { left: 60, top: 25, duration: 3.5, delay: 0.2 },
        { left: 75, top: 55, duration: 4.5, delay: 1.3 },
        { left: 90, top: 10, duration: 3, delay: 0.9 },
        { left: 5, top: 65, duration: 4, delay: 1.6 },
        { left: 35, top: 5, duration: 3.5, delay: 0.4 },
        { left: 50, top: 95, duration: 4.5, delay: 1.1 },
        { left: 65, top: 50, duration: 3, delay: 0.6 },
        { left: 80, top: 30, duration: 4, delay: 1.4 },
        { left: 95, top: 75, duration: 3.5, delay: 0.1 },
        { left: 20, top: 45, duration: 4.5, delay: 1.7 },
        { left: 8, top: 85, duration: 3, delay: 0.9 }
      ].map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Hero Section with Glassmorphic Design */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-24"
        >
          {/* Floating Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5 text-blue-400" />
            </motion.div>
            <span className="text-sm font-medium text-white/80">
              Next-Generation AI Enhancement Technology
            </span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </motion.div>

          {/* Main Title with Enhanced Typography */}
          <motion.div variants={itemVariants} className="space-y-6 mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center leading-tight">
              <motion.span 
                className="block text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Complete Portrait
              </motion.span>
              <motion.span 
                className="block bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Enhancement Suite
              </motion.span>
            </h1>
            
            <motion.p 
              className="text-xl text-white/70 text-center max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Revolutionary AI technology that transforms portraits with unprecedented precision, 
              preserving natural beauty while delivering professional-grade enhancements.
            </motion.p>
          </motion.div>

          {/* Performance Metrics Bar */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-6 mb-16"
          >
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
                whileHover={{ scale: 1.05, y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
              >
                <div className={`${metric.color}`}>
                  {metric.icon}
                </div>
                <div className="text-left">
                  <div className={`font-bold text-lg ${metric.color}`}>
                    {metric.value}
                  </div>
                  <div className="text-white/60 text-xs">
                    {metric.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Enhanced Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24"
        >
          {enhancementSuite.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative"
              onMouseEnter={() => setActiveFeature(index)}
              onMouseLeave={() => setActiveFeature(null)}
              whileHover={{ y: -8 }}
            >
              {/* Glassmorphic Card */}
              <div className={`relative p-8 rounded-3xl bg-gradient-to-br ${feature.color} backdrop-blur-xl border ${feature.borderColor} transition-all duration-500 group-hover:scale-105`}>
                {/* Animated Border Glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon with Animation */}
                <motion.div
                  className={`w-16 h-16 rounded-2xl bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 ${feature.iconColor}`}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  {feature.icon}
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-white/70 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Stats Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-medium text-white/80">
                    {feature.stats}
                  </span>
                </div>

                {/* Hover Effect Overlay */}
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={false}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Interactive Processing Demo */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-24"
        >
          <motion.div
            variants={itemVariants}
            className="max-w-4xl mx-auto"
          >
            {/* Demo Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Watch the Magic Happen
              </h2>
              <p className="text-lg text-white/70">
                Experience our AI enhancement process in real-time
              </p>
            </div>

            {/* Interactive Demo Container */}
            <div className="relative p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10">
              {/* Before/After Images */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="relative">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-black/20 backdrop-blur-md border border-white/10">
                    <Image
                      src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg"
                      alt="Before Enhancement"
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                    <span className="text-sm font-medium text-white">Original</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-black/20 backdrop-blur-md border border-white/10">
                    <Image
                      src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
                      alt="After Enhancement"
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-blue-500/40">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">Enhanced</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Processing Controls */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <motion.button
                  onClick={startProcessing}
                  disabled={isProcessing}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all duration-300 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Cpu className="w-5 h-5" />
                      </motion.div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Enhancement
                    </>
                  )}
                </motion.button>
              </div>

              {/* Processing Steps */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {processingSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                        currentStep > index
                          ? 'bg-green-500/20 border border-green-500/30'
                          : currentStep === index
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep > index
                          ? 'bg-green-500/30 text-green-400'
                          : currentStep === index
                          ? 'bg-blue-500/30 text-blue-400'
                          : 'bg-white/10 text-white/40'
                      }`}>
                        {currentStep > index ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : currentStep === index ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Cpu className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                      <div>
                        <div className={`font-medium ${
                          currentStep > index
                            ? 'text-green-400'
                            : currentStep === index
                            ? 'text-blue-400'
                            : 'text-white/60'
                        }`}>
                          {step.name}
                        </div>
                        <div className="text-sm text-white/50">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center"
        >
          <motion.div
            variants={itemVariants}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Portraits?
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Join thousands of photographers and creators who trust our AI enhancement suite
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center gap-3">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </span>
              </motion.button>
              
              <motion.button
                className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center gap-3">
                  <Download className="w-5 h-5" />
                  View Examples
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}