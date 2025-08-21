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
  Layers,
  Zap,
  Eye,
  Palette,
  Wand2,
  Stars,
  Camera,
  Scan,
  Gauge,
  Award,
  ArrowRight,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Heart,
  Lightbulb,
  Rocket,
  Crown,
  Diamond,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Share2,
  Settings,
  Filter,
  Sliders,
  Image as ImageIcon,
  Maximize2,
  RotateCw,
  Crop,
  Contrast,
  Sun,
  Moon,
  Aperture,
  Focus,
  Layers2,
  Paintbrush,
  Eraser,
  Scissors,
  Move,
  ZoomIn,
  ZoomOut,
  Grid,
  Square,
  Circle
} from "lucide-react"
import { SparklesText } from "../ui/sparkles-text"
import { StarBorder } from "../ui/star-border"
import { AwardBadge, AWARD_PRESETS } from "../ui/award-badge"

interface PortraitEnhancementSuiteProps {
  className?: string
}

// Professional Enhancement Tools Component
const EnhancementTool = ({ 
  tool, 
  isActive, 
  onClick, 
  delay = 0 
}: { 
  tool: any, 
  isActive: boolean, 
  onClick: () => void,
  delay?: number 
}) => {
  return (
    <motion.div
      className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 ${
        isActive 
          ? 'bg-gradient-to-br from-accent-neon/30 to-accent-purple/30 border-accent-neon shadow-lg shadow-accent-neon/20 scale-105' 
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-102'
      } backdrop-blur-xl border group`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <motion.div
          className={`p-3 rounded-lg ${
            isActive 
              ? 'bg-gradient-to-r from-accent-neon to-accent-purple text-white' 
              : 'bg-white/10 text-white/70 group-hover:text-white'
          }`}
          animate={isActive ? {
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {tool.icon}
        </motion.div>
        
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">{tool.name}</h4>
          <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
            {tool.description}
          </p>
        </div>

        {/* Active Indicator */}
        {isActive && (
          <motion.div
            className="absolute top-2 right-2 w-2 h-2 bg-accent-neon rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  )
}

// Interactive Canvas Component
const InteractiveCanvas = ({ 
  currentImage, 
  activeTool, 
  isProcessing, 
  processingStep,
  progress 
}: {
  currentImage: string,
  activeTool: string | null,
  isProcessing: boolean,
  processingStep: number,
  progress: number
}) => {
  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden">
      <StarBorder className="h-full" speed={isProcessing ? 1 : 2}>
        <div className="relative w-full h-full glass rounded-2xl overflow-hidden">
          
          {/* Main Image */}
          <motion.img
            src={currentImage}
            alt="Portrait Canvas"
            className="w-full h-full object-cover"
            animate={{
              filter: isProcessing ? 'blur(1px) brightness(0.8)' : 'blur(0px) brightness(1)',
              scale: isProcessing ? 1.02 : 1,
            }}
            transition={{ duration: 0.6 }}
          />

          {/* Tool Overlay Effects */}
          <AnimatePresence>
            {activeTool && !isProcessing && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Tool-specific overlays */}
                {activeTool === 'skin' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-500/10" />
                )}
                {activeTool === 'eyes' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
                )}
                {activeTool === 'lighting' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10" />
                )}
                {activeTool === 'color' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Overlay */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Processing Grid */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(0, 212, 255, 0.4) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0, 212, 255, 0.4) 1px, transparent 1px)
                    `,
                    backgroundSize: '25px 25px'
                  }}
                />
                
                {/* Scanning Effect */}
                <motion.div
                  className="absolute w-full h-1 bg-gradient-to-r from-transparent via-accent-neon to-transparent"
                  animate={{
                    y: [0, 500, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Progress Indicator */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass backdrop-blur-xl rounded-lg p-3 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white font-medium">
                        {processingStep === 0 ? 'Analyzing...' :
                         processingStep === 1 ? 'Enhancing...' :
                         'Finalizing...'}
                      </span>
                      <span className="text-sm text-accent-neon font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-accent-neon to-accent-purple"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas Tools Overlay */}
          <div className="absolute top-4 left-4 flex gap-2">
            {['crop', 'rotate', 'zoom'].map((tool) => (
              <motion.button
                key={tool}
                className="p-2 glass backdrop-blur-xl rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tool === 'crop' && <Crop className="w-4 h-4" />}
                {tool === 'rotate' && <RotateCw className="w-4 h-4" />}
                {tool === 'zoom' && <ZoomIn className="w-4 h-4" />}
              </motion.button>
            ))}
          </div>

          {/* Device Preview Icons */}
          <div className="absolute top-4 right-4 flex gap-2">
            {[Monitor, Tablet, Smartphone].map((Icon, index) => (
              <motion.button
                key={index}
                className="p-2 glass backdrop-blur-xl rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
              </motion.button>
            ))}
          </div>
        </div>
      </StarBorder>
    </div>
  )
}

// Results Comparison Component
const ResultsComparison = ({ 
  beforeImage, 
  afterImage, 
  isVisible 
}: {
  beforeImage: string,
  afterImage: string,
  isVisible: boolean
}) => {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const handleSliderChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="relative w-full h-[400px] rounded-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, ease: "backOut" }}
        >
          <StarBorder className="h-full">
            <div 
              className="relative w-full h-full glass rounded-2xl overflow-hidden cursor-col-resize"
              onMouseMove={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              {/* Before Image */}
              <img
                src={beforeImage}
                alt="Before Enhancement"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* After Image with Clip Path */}
              <motion.div
                className="absolute inset-0"
                style={{
                  clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                }}
                animate={{
                  clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                }}
                transition={{ duration: 0.1 }}
              >
                <img
                  src={afterImage}
                  alt="After Enhancement"
                  className="w-full h-full object-cover"
                />
                
                {/* Enhancement Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-neon/10 via-transparent to-accent-purple/10" />
              </motion.div>

              {/* Slider Line */}
              <motion.div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                style={{ left: `${sliderPosition}%` }}
                animate={{ left: `${sliderPosition}%` }}
                transition={{ duration: 0.1 }}
              >
                {/* Slider Handle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-accent-neon to-accent-purple rounded-full" />
                </div>
              </motion.div>

              {/* Labels */}
              <div className="absolute bottom-4 left-4">
                <div className="glass backdrop-blur-xl rounded-lg px-3 py-2 border border-white/20">
                  <span className="text-sm text-white font-medium">Before</span>
                </div>
              </div>
              
              <div className="absolute bottom-4 right-4">
                <div className="glass backdrop-blur-xl rounded-lg px-3 py-2 border border-white/20">
                  <span className="text-sm text-white font-medium">After</span>
                </div>
              </div>

              {/* Enhancement Metrics */}
              <motion.div
                className="absolute top-4 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <div className="flex gap-4">
                  {[
                    { label: 'Skin Quality', value: '+95%' },
                    { label: 'Detail Clarity', value: '+87%' },
                    { label: 'Color Balance', value: '+92%' }
                  ].map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      className="glass backdrop-blur-xl rounded-lg px-3 py-2 border border-white/20 text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                    >
                      <div className="text-accent-neon font-bold text-sm">{metric.value}</div>
                      <div className="text-white/70 text-xs">{metric.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </StarBorder>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function PortraitEnhancementSuite({
  className = ""
}: PortraitEnhancementSuiteProps) {
  const [activeTab, setActiveTab] = useState('tools')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  // Sample images for the suite
  const sampleImages = [
    { 
      before: "/testpics/Girl+1+Before.jpg", 
      after: "/testpics/Girl+1+After.png", 
      title: "Natural Beauty",
      category: "Portrait"
    },
    { 
      before: "/testpics/Asian+Girl+7+before.jpg", 
      after: "/testpics/Asian+Girl+7+after.png", 
      title: "Professional",
      category: "Business"
    },
    { 
      before: "/testpics/Black+Man+1+Before.jpg", 
      after: "/testpics/Black+Man+1+After.png", 
      title: "Executive",
      category: "Corporate"
    },
    { 
      before: "/testpics/White+Man+1+Before.jpg", 
      after: "/testpics/White+Man+1+After.png", 
      title: "Creative",
      category: "Artistic"
    }
  ]

  // Enhancement tools
  const enhancementTools = [
    {
      id: 'skin',
      name: 'Skin Perfection',
      description: 'Advanced skin smoothing',
      icon: <Palette className="w-5 h-5" />,
      category: 'beauty'
    },
    {
      id: 'eyes',
      name: 'Eye Enhancement',
      description: 'Brighten and sharpen eyes',
      icon: <Eye className="w-5 h-5" />,
      category: 'beauty'
    },
    {
      id: 'lighting',
      name: 'Smart Lighting',
      description: 'Optimize lighting balance',
      icon: <Sun className="w-5 h-5" />,
      category: 'lighting'
    },
    {
      id: 'color',
      name: 'Color Grading',
      description: 'Professional color correction',
      icon: <Contrast className="w-5 h-5" />,
      category: 'color'
    },
    {
      id: 'details',
      name: 'Detail Enhancement',
      description: 'Sharpen fine details',
      icon: <Focus className="w-5 h-5" />,
      category: 'quality'
    },
    {
      id: 'background',
      name: 'Background Blur',
      description: 'Professional depth of field',
      icon: <Aperture className="w-5 h-5" />,
      category: 'effects'
    }
  ]

  // Tab options
  const tabs = [
    { id: 'tools', name: 'Enhancement Tools', icon: <Sliders className="w-4 h-4" /> },
    { id: 'presets', name: 'Style Presets', icon: <Filter className="w-4 h-4" /> },
    { id: 'advanced', name: 'Advanced Settings', icon: <Settings className="w-4 h-4" /> }
  ]

  const startEnhancement = () => {
    if (isProcessing) return

    setIsProcessing(true)
    setProgress(0)
    setProcessingStep(0)
    setIsComplete(false)

    // Simulate processing steps
    const steps = ['Analyzing', 'Enhancing', 'Finalizing']
    
    steps.forEach((_, stepIndex) => {
      setTimeout(() => {
        setProcessingStep(stepIndex)
        setProgress(0)

        // Animate progress for current step
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval)
              return 100
            }
            return prev + 2
          })
        }, 50)

        // Complete processing
        if (stepIndex === steps.length - 1) {
          setTimeout(() => {
            setIsProcessing(false)
            setIsComplete(true)
          }, 2500)
        }
      }, stepIndex * 3000)
    })
  }

  const resetEnhancement = () => {
    setIsProcessing(false)
    setIsComplete(false)
    setProgress(0)
    setProcessingStep(0)
  }

  const currentImage = sampleImages[currentImageIndex]

  return (
    <section className={`py-32 relative overflow-hidden bg-black ${className}`}>
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black" />
        
        {/* Dynamic Gradient Mesh */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(circle at 25% 25%, rgba(0, 212, 255, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 75% 25%, rgba(236, 72, 153, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 25% 75%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)
            `
          }}
          animate={{
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Animated Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-accent-neon rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Header Section */}
        <motion.div
          ref={ref}
          className="text-center mb-20"
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Premium Badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AwardBadge
              title="Professional Suite"
              subtitle="2024"
              icon="crown"
              variant="platinum"
              size="md"
              animated={isInView}
            />
            <AwardBadge
              {...AWARD_PRESETS.aiExcellence}
              size="md"
              animated={isInView}
            />
          </motion.div>

          {/* Main Title */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="text-white">Complete</span>
              <br />
              <SparklesText 
                text="Portrait Enhancement Suite" 
                className="text-6xl md:text-7xl lg:text-8xl"
              />
            </h2>
          </motion.div>

          <motion.p
            className="text-2xl text-text-secondary max-w-5xl mx-auto leading-relaxed mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Professional-grade portrait enhancement tools powered by cutting-edge AI. 
            Transform your portraits with precision, creativity, and unmatched quality.
          </motion.p>

          {/* Feature Highlights */}
          <motion.div
            className="flex flex-wrap justify-center gap-8 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {[
              { icon: <Rocket className="w-5 h-5" />, title: "AI-Powered", desc: "Advanced algorithms" },
              { icon: <Zap className="w-5 h-5" />, title: "Real-time", desc: "Instant preview" },
              { icon: <Crown className="w-5 h-5" />, title: "Professional", desc: "Studio quality" },
              { icon: <Shield className="w-5 h-5" />, title: "Non-destructive", desc: "Original preserved" }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="flex items-center gap-3 px-6 py-4 glass backdrop-blur-xl rounded-2xl border border-white/10"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-accent-neon">
                  {feature.icon}
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{feature.title}</div>
                  <div className="text-sm text-white/70">{feature.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>        
{/* Main Suite Interface */}
        <div className="max-w-8xl mx-auto">
          
          {/* Image Selection Gallery */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <h3 className="text-3xl font-bold text-white text-center mb-8">
              Choose Your Portrait
            </h3>
            <div className="flex justify-center gap-6 flex-wrap">
              {sampleImages.map((image, index) => (
                <motion.button
                  key={index}
                  onClick={() => !isProcessing && setCurrentImageIndex(index)}
                  className={`relative group ${
                    currentImageIndex === index 
                      ? 'scale-110' 
                      : 'hover:scale-105'
                  } transition-all duration-300`}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isProcessing}
                >
                  <StarBorder 
                    className={`w-32 h-32 ${
                      currentImageIndex === index ? 'opacity-100' : 'opacity-60'
                    }`}
                    speed={currentImageIndex === index ? 1.5 : 3}
                  >
                    <div className="w-full h-full glass rounded-2xl overflow-hidden">
                      <img
                        src={image.before}
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                      {currentImageIndex === index && (
                        <motion.div
                          className="absolute inset-0 bg-accent-neon/20 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <CheckCircle className="w-8 h-8 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </StarBorder>
                  <div className="mt-3 text-center">
                    <div className="text-white font-semibold text-sm">{image.title}</div>
                    <div className="text-white/60 text-xs">{image.category}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Main Interface Grid */}
          <div className="grid lg:grid-cols-4 gap-8">
            
            {/* Left Panel - Tools & Controls */}
            <motion.div
              className="lg:col-span-1 space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Tab Navigation */}
              <div className="glass backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                <div className="flex flex-col gap-2">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-accent-neon to-accent-purple text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {tab.icon}
                      <span className="font-medium">{tab.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Enhancement Tools */}
              {activeTab === 'tools' && (
                <motion.div
                  className="glass backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-accent-neon" />
                    Enhancement Tools
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {enhancementTools.map((tool, index) => (
                      <EnhancementTool
                        key={tool.id}
                        tool={tool}
                        isActive={activeTool === tool.id}
                        onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                        delay={index * 0.1}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Style Presets */}
              {activeTab === 'presets' && (
                <motion.div
                  className="glass backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-accent-neon" />
                    Style Presets
                  </h4>
                  <div className="space-y-3">
                    {['Natural', 'Glamour', 'Vintage', 'Cinematic', 'High Fashion', 'Soft Portrait'].map((preset, index) => (
                      <motion.button
                        key={preset}
                        className="w-full p-3 text-left glass backdrop-blur-xl rounded-lg border border-white/10 text-white hover:border-white/30 hover:bg-white/10 transition-all"
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="font-medium">{preset}</div>
                        <div className="text-sm text-white/60">Professional {preset.toLowerCase()} style</div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Advanced Settings */}
              {activeTab === 'advanced' && (
                <motion.div
                  className="glass backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-accent-neon" />
                    Advanced Settings
                  </h4>
                  <div className="space-y-4">
                    {[
                      { name: 'Skin Smoothing', value: 75 },
                      { name: 'Eye Enhancement', value: 60 },
                      { name: 'Color Saturation', value: 80 },
                      { name: 'Contrast', value: 65 },
                      { name: 'Brightness', value: 70 }
                    ].map((setting, index) => (
                      <motion.div
                        key={setting.name}
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex justify-between text-sm">
                          <span className="text-white">{setting.name}</span>
                          <span className="text-accent-neon">{setting.value}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <motion.div
                            className="h-2 rounded-full bg-gradient-to-r from-accent-neon to-accent-purple"
                            initial={{ width: 0 }}
                            animate={{ width: `${setting.value}%` }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <StarBorder className="w-full">
                  <motion.button
                    onClick={isComplete ? resetEnhancement : startEnhancement}
                    disabled={isProcessing}
                    className={`w-full px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      isProcessing
                        ? 'bg-white/5 text-white/40 cursor-not-allowed'
                        : isComplete
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/30'
                          : 'bg-gradient-to-r from-accent-blue via-accent-purple to-accent-neon text-white hover:shadow-lg hover:shadow-accent-blue/30'
                    }`}
                    whileHover={!isProcessing ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!isProcessing ? { scale: 0.98 } : {}}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-3">
                        <motion.div
                          className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Processing...</span>
                      </div>
                    ) : isComplete ? (
                      <div className="flex items-center justify-center gap-3">
                        <RotateCcw className="w-5 h-5" />
                        <span>Start Over</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <Rocket className="w-5 h-5" />
                        <span>Enhance Portrait</span>
                      </div>
                    )}
                  </motion.button>
                </StarBorder>

                {/* Export Options */}
                {isComplete && (
                  <motion.div
                    className="flex gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.button
                      className="flex-1 px-4 py-3 glass backdrop-blur-xl rounded-xl border border-white/10 text-white hover:border-white/30 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Download</span>
                    </motion.button>
                    <motion.button
                      className="flex-1 px-4 py-3 glass backdrop-blur-xl rounded-xl border border-white/10 text-white hover:border-white/30 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Share</span>
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>      
      {/* Center Panel - Interactive Canvas */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="space-y-6">
                {/* Canvas Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ImageIcon className="w-6 h-6 text-accent-neon" />
                    Live Canvas
                  </h3>
                  <div className="flex gap-2">
                    <motion.button
                      className="px-4 py-2 glass backdrop-blur-xl rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-all flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Grid className="w-4 h-4" />
                      <span className="text-sm">Grid</span>
                    </motion.button>
                    <motion.button
                      className="px-4 py-2 glass backdrop-blur-xl rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-all flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span className="text-sm">Fullscreen</span>
                    </motion.button>
                  </div>
                </div>

                {/* Interactive Canvas */}
                <InteractiveCanvas
                  currentImage={isComplete ? currentImage.after : currentImage.before}
                  activeTool={activeTool}
                  isProcessing={isProcessing}
                  processingStep={processingStep}
                  progress={progress}
                />

                {/* Canvas Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {['100%', '75%', '50%', '25%'].map((zoom) => (
                      <motion.button
                        key={zoom}
                        className="px-3 py-2 glass backdrop-blur-xl rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-all text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {zoom}
                      </motion.button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-white/70 text-sm">
                      {currentImage.title} • {currentImage.category}
                    </span>
                    <div className="flex gap-2">
                      <motion.button
                        className="p-2 glass backdrop-blur-xl rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        className="p-2 glass backdrop-blur-xl rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Panel - Results & Analytics */}
            <motion.div
              className="lg:col-span-1 space-y-6"
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {/* Enhancement Progress */}
              <div className="glass backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent-neon" />
                  Enhancement Progress
                </h4>
                
                <div className="space-y-4">
                  {[
                    { name: 'Skin Quality', progress: isComplete ? 95 : (isProcessing ? progress * 0.95 : 0), color: 'from-pink-500 to-rose-500' },
                    { name: 'Eye Clarity', progress: isComplete ? 87 : (isProcessing ? progress * 0.87 : 0), color: 'from-blue-500 to-cyan-500' },
                    { name: 'Color Balance', progress: isComplete ? 92 : (isProcessing ? progress * 0.92 : 0), color: 'from-purple-500 to-indigo-500' },
                    { name: 'Overall Quality', progress: isComplete ? 98 : (isProcessing ? progress * 0.98 : 0), color: 'from-green-500 to-emerald-500' }
                  ].map((metric, index) => (
                    <motion.div
                      key={metric.name}
                      className="space-y-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-white">{metric.name}</span>
                        <span className="text-accent-neon font-mono">
                          {Math.round(metric.progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full bg-gradient-to-r ${metric.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.progress}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Processing Status */}
              {isProcessing && (
                <motion.div
                  className="glass backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-accent-neon" />
                    AI Processing
                  </h4>
                  
                  <div className="space-y-4">
                    {['Analyzing facial structure', 'Applying enhancements', 'Optimizing quality'].map((step, index) => (
                      <motion.div
                        key={step}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          processingStep === index 
                            ? 'bg-accent-neon/20 border border-accent-neon/30' 
                            : processingStep > index
                              ? 'bg-green-500/20 border border-green-500/30'
                              : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        {processingStep > index ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : processingStep === index ? (
                          <motion.div
                            className="w-5 h-5 border-2 border-accent-neon border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                        )}
                        <span className={`text-sm ${
                          processingStep >= index ? 'text-white' : 'text-white/50'
                        }`}>
                          {step}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Enhancement History */}
              <div className="glass backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent-neon" />
                  Recent Enhancements
                </h4>
                
                <div className="space-y-3">
                  {[
                    { name: 'Professional Headshot', time: '2 min ago', quality: '+95%' },
                    { name: 'Natural Portrait', time: '5 min ago', quality: '+87%' },
                    { name: 'Creative Style', time: '8 min ago', quality: '+92%' }
                  ].map((item, index) => (
                    <motion.div
                      key={item.name}
                      className="flex items-center justify-between p-3 glass backdrop-blur-xl rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                      whileHover={{ scale: 1.02, x: 5 }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div>
                        <div className="text-white text-sm font-medium">{item.name}</div>
                        <div className="text-white/60 text-xs">{item.time}</div>
                      </div>
                      <div className="text-accent-neon text-sm font-bold">{item.quality}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent-neon" />
                  Quick Actions
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Auto Enhance', icon: <Wand2 className="w-4 h-4" /> },
                    { name: 'Batch Process', icon: <Layers2 className="w-4 h-4" /> },
                    { name: 'Style Transfer', icon: <Paintbrush className="w-4 h-4" /> },
                    { name: 'Background Remove', icon: <Eraser className="w-4 h-4" /> }
                  ].map((action, index) => (
                    <motion.button
                      key={action.name}
                      className="p-3 glass backdrop-blur-xl rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all text-center"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {action.icon}
                        <span className="text-xs font-medium">{action.name}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Results Comparison */}
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="text-center mb-8">
              <h3 className="text-4xl font-bold text-white mb-4">
                See the Transformation
              </h3>
              <p className="text-xl text-white/70">
                Compare before and after results with our interactive slider
              </p>
            </div>

            <ResultsComparison
              beforeImage={currentImage.before}
              afterImage={currentImage.after}
              isVisible={isComplete}
            />
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                className="mt-16 text-center"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ duration: 0.8, delay: 1, ease: "backOut" }}
              >
                <StarBorder className="inline-block p-2">
                  <div className="px-16 py-12 glass rounded-3xl">
                    <motion.div
                      className="flex items-center justify-center gap-6 mb-6"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Crown className="w-12 h-12 text-accent-neon" />
                      <h3 className="text-4xl font-bold text-white">Enhancement Complete!</h3>
                      <Diamond className="w-12 h-12 text-accent-purple" />
                    </motion.div>
                    <p className="text-2xl text-white/80 mb-8">
                      Your portrait has been transformed with professional-grade AI enhancement
                    </p>
                    <div className="flex justify-center gap-12">
                      {[
                        { label: 'Skin Quality', value: '+95%', color: 'text-pink-400' },
                        { label: 'Eye Clarity', value: '+87%', color: 'text-blue-400' },
                        { label: 'Color Balance', value: '+92%', color: 'text-purple-400' },
                        { label: 'Overall Quality', value: '+98%', color: 'text-green-400' }
                      ].map((metric, index) => (
                        <motion.div
                          key={metric.label}
                          className="text-center"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.2 + index * 0.1 }}
                        >
                          <div className={`text-3xl font-bold ${metric.color} mb-2`}>{metric.value}</div>
                          <div className="text-lg text-white/70">{metric.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </StarBorder>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}