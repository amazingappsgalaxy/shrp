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
  Sparkles,
  ZoomIn,
  ZoomOut,
  X,
  Grid3X3,
  SplitSquareHorizontal,
  Eye,
  EyeOff,
  Info,
  Settings,
  Split,
  Minimize2
} from "lucide-react"

interface ComparisonPair {
  before: string
  after: string
  title: string
  description?: string
  improvement?: string
  processingTime?: string
}

interface UnifiedImageViewerProps {
  pairs?: ComparisonPair[]
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
  showStats?: boolean
  initialMode?: 'comparison' | 'gallery' | 'fullscreen'
}

const defaultPairs: ComparisonPair[] = [
  {
    before: "/testpics/Girl+1+Before.jpg",
    after: "/testpics/Girl+1+After.png",
    title: "Portrait Enhancement",
    description: "Professional skin smoothing with natural texture preservation",
    improvement: "94%",
    processingTime: "28s"
  },
  {
    before: "/testpics/Asian+Girl+7+before.jpg",
    after: "/testpics/Asian+Girl+7+after.png",
    title: "Detail Recovery",
    description: "Advanced AI reconstruction of facial features",
    improvement: "91%",
    processingTime: "32s"
  },
  {
    before: "/testpics/White+Man+1+Before.jpg",
    after: "/testpics/White+Man+1+After.png",
    title: "Professional Headshot",
    description: "Studio-quality enhancement for business portraits",
    improvement: "96%",
    processingTime: "25s"
  }
]

type ViewMode = 'comparison' | 'before' | 'after' | 'gallery'

export function UnifiedImageViewer({
  pairs = defaultPairs,
  autoPlay = false,
  autoPlayInterval = 6000,
  className = "",
  showStats = true,
  initialMode = 'comparison'
}: UnifiedImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode === 'fullscreen' ? 'comparison' : initialMode)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showDock, setShowDock] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
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
    if (isPlaying && !isDragging && !isHovered && viewMode === 'comparison') {
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
  }, [isPlaying, isDragging, isHovered, pairs.length, autoPlayInterval, viewMode])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + pairs.length) % pairs.length)
    setSliderPosition(50)
    resetZoom()
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pairs.length)
    setSliderPosition(50)
    resetZoom()
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const resetSlider = () => {
    setSliderPosition(50)
  }

  const resetZoom = () => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1)
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 })
      }
      return newZoom
    })
  }

  // Slider dragging for comparison mode
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'comparison') return
    e.preventDefault()
    setIsDragging(true)
    updateSliderPosition(e.clientX)
  }

  const handleSliderTouchStart = (e: React.TouchEvent) => {
    if (viewMode !== 'comparison') return
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

  // Pan dragging for zoom mode
  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1 || viewMode === 'comparison') return
    e.preventDefault()
    setIsPanning(true)
    setDragStart({
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 1) {
      e.preventDefault()
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode === 'comparison') return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(1, Math.min(3, zoomLevel + delta))
    setZoomLevel(newZoom)
    
    if (newZoom === 1) {
      setPanPosition({ x: 0, y: 0 })
    }
  }

  // Global event listeners for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && viewMode === 'comparison') {
        updateSliderPosition(e.clientX)
      }
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      setIsPanning(false)
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && viewMode === 'comparison') {
        const touch = e.touches[0]
        updateSliderPosition(touch.clientX)
      }
    }

    const handleGlobalTouchEnd = () => {
      setIsDragging(false)
    }

    if (isDragging || isPanning) {
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
  }, [isDragging, isPanning, viewMode])

  const renderImage = () => {
    const currentImage = viewMode === 'after' ? currentPair.after : currentPair.before
    const imageTransform = `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`

    if (viewMode === 'comparison') {
      return (
        <>
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

          {/* Slider Handle */}
          <motion.div
            className="absolute top-0 bottom-0 flex items-center justify-center z-20 cursor-ew-resize"
            style={{
              left: `${springSliderPosition.get()}%`,
              transform: 'translateX(-50%)',
            }}
            onMouseDown={handleSliderMouseDown}
            onTouchStart={handleSliderTouchStart}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`
              w-1 h-full bg-gradient-to-b from-accent-neon via-accent-blue to-accent-purple shadow-neon
              ${isDragging ? 'shadow-neon-strong w-1.5' : ''}
              transition-all duration-200
            `} />
          </motion.div>
        </>
      )
    }

    return (
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ transform: imageTransform }}
        onMouseDown={handlePanMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <Image
          src={currentImage}
          alt={`${currentPair.title} - ${viewMode === 'after' ? 'After' : 'Before'}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
          priority
        />
      </motion.div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Container */}
      <div className="relative aspect-[16/10] rounded-3xl overflow-hidden glass-premium group">
        <Image
          src={currentImage}
          alt={currentImageData?.title || "Enhanced Image"}
          fill
          className="object-cover transition-all duration-500 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 80vw"
        />
        
        {/* Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Image Info */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white">
                {currentImageData?.category || "Enhanced"}
              </div>
              <div className="px-4 py-2 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white">
                {currentImageData?.quality || "4K"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Labels */}
      {viewMode === 'comparison' && (
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
      )}

      {/* Single View Mode Label */}
      {(viewMode === 'before' || viewMode === 'after') && (
        <motion.div
          className="absolute top-4 right-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8
          }}
        >
          <div className={`px-3 py-1 rounded-full border ${
            viewMode === 'after' 
              ? "bg-green-500/20 border-green-500/30 text-green-400" 
              : "bg-blue-500/20 border-blue-500/30 text-blue-400"
          }`}>
            <span className="text-sm font-medium">
              {viewMode === 'after' ? "AI Enhanced" : "Original"}
            </span>
          </div>
        </motion.div>
      )}

      {/* Processing Time Indicator */}
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

      {/* Zoom Level Indicator */}
      {zoomLevel > 1 && (
        <motion.div
          className="absolute top-4 right-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-medium text-purple-400 backdrop-blur-sm">
            {Math.round(zoomLevel * 100)}%
          </div>
        </motion.div>
      )}

      {/* Bottom Dock */}
      <AnimatePresence>
        {showDock && (
          <motion.div
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center gap-2 px-4 py-3 glass-card rounded-2xl backdrop-blur-xl">
              {/* Navigation */}
              <div className="flex items-center gap-1 pr-2 border-r border-glass-border">
                <motion.button
                  onClick={goToPrevious}
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </motion.button>

                <motion.button
                  onClick={goToNext}
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Next image"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </motion.button>
              </div>

              {/* View Mode Controls */}
              <div className="flex items-center gap-1 pr-2 border-r border-glass-border">
                <motion.button
                  onClick={() => setViewMode('comparison')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'comparison'
                      ? 'glass hover:glass-elevated border-glass-border hover:glow-neon'
                      : 'glass hover:glass-elevated border-glass-border hover:glow-neon'
                  } transition-all duration-300`}
                  title="Side by Side Comparison"
                >
                  <SplitSquareHorizontal className="h-4 w-4 text-white" />
                </motion.button>

                <motion.button
                  onClick={() => setViewMode('before')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'before'
                      ? 'glass hover:glass-elevated border-glass-border hover:glow-neon'
                      : 'glass hover:glass-elevated border-glass-border hover:glow-neon'
                  } transition-all duration-300`}
                  title="Show Original"
                >
                  <Eye className="h-4 w-4 text-white" />
                </motion.button>

                <motion.button
                  onClick={() => setViewMode('after')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'after'
                      ? 'glass hover:glass-elevated border-glass-border hover:glow-neon'
                      : 'glass hover:glass-elevated border-glass-border hover:glow-neon'
                  } transition-all duration-300`}
                  title="Show Enhanced"
                >
                  <Sparkles className="h-4 w-4 text-white" />
                </motion.button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 pr-2 border-r border-glass-border">
                <motion.button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </motion.button>

                <motion.button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Playback Controls */}
              {pairs.length > 1 && viewMode === 'comparison' && (
                <div className="flex items-center gap-1 pr-2 border-r border-glass-border">
                  <motion.button
                    onClick={togglePlayPause}
                    className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={isPlaying ? "Pause slideshow" : "Play slideshow"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white" />
                    )}
                  </motion.button>
                </div>
              )}

              {/* Reset Controls */}
              <div className="flex items-center gap-1 pr-2 border-r border-glass-border">
                <motion.button
                  onClick={resetSlider}
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Reset comparison"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </motion.button>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={() => setShowInfo(!showInfo)}
                  className={`p-2 rounded-lg border transition-all duration-300 ${
                    showInfo
                      ? 'bg-accent-neon text-white border-accent-neon shadow-neon'
                      : 'glass hover:glass-elevated border-glass-border hover:glow-neon'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Toggle info"
                >
                  <Info className="w-4 h-4" />
                </motion.button>

                <motion.button
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Download"
                >
                  <Download className="w-4 h-4 text-white" />
                </motion.button>

                <motion.button
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Share"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </motion.button>

                <motion.button
                  onClick={() => setShowDock(false)}
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:bg-red-500/20 transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Hide dock"
                >
                  <EyeOff className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show Dock Button (when hidden) */}
      {!showDock && (
        <motion.button
          onClick={() => setShowDock(true)}
          className="fixed bottom-6 right-6 p-3 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Show controls"
        >
          <Settings className="w-5 h-5 text-white" />
        </motion.button>
      )}

      {/* Enhanced Info Section */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            className="mt-6 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
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

            {/* Navigation Dots */}
            {pairs.length > 1 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {pairs.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index)
                        setSliderPosition(50)
                        resetZoom()
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
                      {index === currentIndex && isPlaying && (
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ 
                            duration: autoPlayInterval / 1000,
                            ease: "linear",
                            repeat: Infinity
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

            {/* Action Button */}
            <div className="flex items-center gap-3 pt-2">
              <motion.button
                className="btn-premium flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-4 h-4" />
                Try This Enhancement
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="fixed bottom-6 right-6 p-3 rounded-full glass-card hover:glow-neon transition-all duration-300 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 className="h-5 w-5 text-white" />
        ) : (
          <Maximize2 className="h-5 w-5 text-white" />
        )}
      </motion.button>
    </div>
  )
}