"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import Image from "next/image"
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2,
  Download,
  Share2,
  Zap,
  Sparkles
} from "lucide-react"

interface ComparisonPair {
  before: string
  after: string
  title: string
  description?: string
  improvement?: string
  processingTime?: string
}

interface ImageComparisonRedesignedProps {
  pairs?: ComparisonPair[]
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
  showStats?: boolean
  showControls?: boolean
}

const defaultPairs: ComparisonPair[] = [
  {
    before: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg",
    after: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png",
    title: "Portrait Enhancement",
    description: "Professional skin smoothing with natural texture preservation",
    improvement: "94%",
    processingTime: "28s"
  },
  {
    before: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+before.jpg",
    after: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+after.png",
    title: "Detail Recovery",
    description: "Advanced AI reconstruction of facial features",
    improvement: "91%",
    processingTime: "32s"
  },
  {
    before: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Man+1+Before.jpg",
    after: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Man+1+After.png",
    title: "Professional Headshot",
    description: "Studio-quality enhancement for business portraits",
    improvement: "96%",
    processingTime: "25s"
  }
]

export function ImageComparisonRedesigned({
  pairs = defaultPairs,
  autoPlay = false,
  autoPlayInterval = 6000,
  className = "",
  showStats = true,
  showControls = true
}: ImageComparisonRedesignedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Smooth spring animation for slider
  const springSliderPosition = useSpring(sliderPosition, {
    stiffness: 300,
    damping: 30
  })

  const currentPair = pairs[currentIndex]

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && !isDragging && !isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % pairs.length)
        setSliderPosition(50)
      }, autoPlayInterval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, isDragging, isHovered, pairs.length, autoPlayInterval])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + pairs.length) % pairs.length)
    setSliderPosition(50)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pairs.length)
    setSliderPosition(50)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const resetSlider = () => {
    setSliderPosition(50)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    updateSliderPosition(e.clientX)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    const touch = e.touches[0]
    updateSliderPosition(touch.clientX)
  }

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const percentage = ((clientX - rect.left) / rect.width) * 100
    const clampedPercentage = Math.max(5, Math.min(95, percentage))
    setSliderPosition(clampedPercentage)
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSliderPosition(e.clientX)
      }
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0]
        updateSliderPosition(touch.clientX)
      }
    }

    const handleGlobalTouchEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.addEventListener('touchmove', handleGlobalTouchMove)
      document.addEventListener('touchend', handleGlobalTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isDragging])

  return (
    <div className={`relative ${className}`}>
      {/* Main Comparison Container */}
      <motion.div
        ref={containerRef}
        className="relative aspect-[16/10] rounded-3xl overflow-hidden glass group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            {/* Before Image */}
            <div className="absolute inset-0">
              <Image
                src={currentPair.before}
                alt={`${currentPair.title} - Before`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />
            </div>

            {/* After Image with Clip */}
            <motion.div
              className="absolute inset-0"
              style={{
                clipPath: `inset(0 ${100 - springSliderPosition.get()}% 0 0)`,
              }}
            >
              <Image
                src={currentPair.after}
                alt={`${currentPair.title} - After`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/10" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Slider Handle */}
        <motion.div
          className="absolute top-0 bottom-0 flex items-center justify-center z-20 cursor-ew-resize"
          style={{
            left: `${springSliderPosition.get()}%`,
            transform: 'translateX(-50%)',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Slider Line */}
          <div className={`
            w-1 h-full bg-gradient-to-b from-accent-neon via-accent-blue to-accent-purple shadow-neon
            ${isDragging ? 'shadow-neon-strong w-1.5' : ''}
            transition-all duration-200
          `} />
          



        </motion.div>

        {/* Navigation Controls */}
        {showControls && (
          <>
            <motion.button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300"
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                x: isHovered ? 0 : -20
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>

            <motion.button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300"
              initial={{ opacity: 0, x: 20 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                x: isHovered ? 0 : 20
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>
          </>
        )}

        {/* Top Controls */}
        <motion.div
          className="absolute top-4 right-4 flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : -20
          }}
        >
          <button
            onClick={resetSlider}
            className="p-2 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
          
          {pairs.length > 1 && (
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>
          )}

          <button
            onClick={() => setShowFullscreen(true)}
            className="p-2 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
        </motion.div>

        {/* Enhanced Labels */}
        <motion.div
          className="absolute bottom-4 left-4 right-4 flex justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 20
          }}
        >
          <div className="px-4 py-2 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              Original
            </div>
          </div>
          <div className="px-4 py-2 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-accent-neon" />
              AI Enhanced
            </div>
          </div>
        </motion.div>

        {/* Processing Indicator */}
        <motion.div
          className="absolute top-4 left-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8
          }}
        >
          <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-xs font-medium text-green-400 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {currentPair.processingTime || "< 30s"}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Info Section */}
      <div className="mt-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              {currentPair.title}
            </h3>
            {currentPair.description && (
              <p className="text-text-secondary leading-relaxed">
                {currentPair.description}
              </p>
            )}
          </div>
          
          {showStats && currentPair.improvement && (
            <div className="ml-6 text-right">
              <div className="text-3xl font-bold text-gradient-neon mb-1">
                {currentPair.improvement}
              </div>
              <div className="text-sm text-text-muted">Quality Boost</div>
            </div>
          )}
        </div>

        {/* Enhanced Navigation Dots */}
        {pairs.length > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pairs.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index)
                    setSliderPosition(50)
                  }}
                  className={`
                    relative overflow-hidden rounded-full transition-all duration-300
                    ${index === currentIndex
                      ? 'w-8 h-3 bg-gradient-to-r from-accent-neon to-accent-blue shadow-neon'
                      : 'w-3 h-3 bg-surface-elevated hover:bg-accent-neon/30'
                    }
                  `}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {index === currentIndex && (
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ 
                        duration: autoPlayInterval / 1000,
                        ease: "linear",
                        repeat: isPlaying ? Infinity : 0
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            <div className="text-sm text-text-muted">
              {currentIndex + 1} of {pairs.length}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <motion.button
            className="btn-premium flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-4 h-4" />
            Try This Enhancement
          </motion.button>
          
          <button className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300">
            <Download className="w-4 h-4" />
          </button>
          
          <button className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}