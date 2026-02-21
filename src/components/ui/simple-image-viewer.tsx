"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useSpring } from "framer-motion"
import Image from "next/image"
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share2,
  Sparkles,
  Maximize2
} from "lucide-react"

interface ComparisonPair {
  before: string
  after: string
  title: string
  description?: string
  improvement?: string
  processingTime?: string
}

interface SimpleImageViewerProps {
  pairs?: ComparisonPair[]
  className?: string
  showStats?: boolean
  onImageClick?: (index: number) => void
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

export function SimpleImageViewer({
  pairs = defaultPairs,
  className = "",
  showStats = true,
  onImageClick
}: SimpleImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showControls, setShowControls] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Smooth spring animation for slider
  const springSliderPosition = useSpring(sliderPosition, {
    stiffness: 300,
    damping: 30
  })

  const hasPairs = pairs.length > 0
  const safeIndex = hasPairs ? Math.max(0, Math.min(currentIndex, pairs.length - 1)) : 0
  const currentPair = hasPairs ? pairs[safeIndex] : null

  const goToPrevious = () => {
    if (!hasPairs) return
    setCurrentIndex((prev) => (prev - 1 + pairs.length) % pairs.length)
    setSliderPosition(50)
    resetZoom()
  }

  const goToNext = () => {
    if (!hasPairs) return
    setCurrentIndex((prev) => (prev + 1) % pairs.length)
    setSliderPosition(50)
    resetZoom()
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

  // Slider dragging
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    updateSliderPosition(e.clientX)
  }

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const percentage = ((clientX - rect.left) / rect.width) * 100
    const clampedPercentage = Math.max(5, Math.min(95, percentage))
    setSliderPosition(clampedPercentage)
  }

  // Pan dragging
  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(1, Math.min(3, zoomLevel + delta))
    setZoomLevel(newZoom)
    
    if (newZoom === 1) {
      setPanPosition({ x: 0, y: 0 })
    }
  }

  // Global event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSliderPosition(e.clientX)
      }
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      setIsPanning(false)
    }

    if (isDragging || isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, isPanning])

  if (!currentPair) {
    return <div className={`relative ${className}`} />
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Container */}
      <motion.div
        ref={containerRef}
        className="relative aspect-[16/10] rounded-3xl overflow-hidden glass group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
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
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`
                }}
                onMouseDown={handlePanMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsPanning(false)}
                onWheel={handleWheel}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                priority
              />
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
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`
                }}
                onMouseDown={handlePanMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsPanning(false)}
                onWheel={handleWheel}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                priority
              />
            </motion.div>

            {/* Slider Handle */}
            <motion.div
              className="absolute top-0 bottom-0 flex items-center justify-center z-20 cursor-ew-resize"
              style={{
                left: `${springSliderPosition.get()}%`,
                transform: 'translateX(-50%)',
              }}
              onMouseDown={handleSliderMouseDown}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`
                w-1 h-full bg-gradient-to-b from-accent-neon via-accent-blue to-accent-purple shadow-neon
                ${isDragging ? 'shadow-neon-strong w-1.5' : ''}
                transition-all duration-200
              `} />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Labels */}
        <motion.div
          className="absolute bottom-4 left-4 right-4 flex justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: showControls ? 1 : 0,
            y: showControls ? 0 : 20
          }}
        >
          <div className="px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white backdrop-blur-md">
            Original
          </div>
          <div className="px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white backdrop-blur-md">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent-neon" />
              Enhanced
            </div>
          </div>
        </motion.div>

        {/* Processing Time */}
        <motion.div
          className="absolute top-4 left-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: showControls ? 1 : 0,
            scale: showControls ? 1 : 0.8
          }}
        >
          <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-xs font-medium text-green-400 backdrop-blur-sm">
            {currentPair.processingTime || "< 30s"}
          </div>
        </motion.div>

        {/* Zoom Level */}
        {zoomLevel > 1 && (
          <motion.div
            className="absolute top-4 right-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-medium text-purple-400 backdrop-blur-sm">
              {Math.round(zoomLevel * 100)}%
            </div>
          </motion.div>
        )}

        {/* Simple Control Dock */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-1 px-3 py-2 glass-elevated border border-glass-border-elevated rounded-xl backdrop-blur-xl">
                {/* Navigation */}
                {pairs.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="p-1.5 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                      title="Previous"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>

                    <button
                      onClick={goToNext}
                      className="p-1.5 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                      title="Next"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>

                    <div className="w-px h-6 bg-glass-border mx-1" />
                  </>
                )}

                {/* Zoom Controls */}
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="p-1.5 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300 disabled:opacity-50"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </button>

                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="p-1.5 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300 disabled:opacity-50"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </button>

                <button
                  onClick={() => {
                    setSliderPosition(50)
                    resetZoom()
                  }}
                  className="p-1.5 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>

                <div className="w-px h-6 bg-glass-border mx-1" />

                {/* Actions */}
                <button
                  className="p-1.5 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-white" />
                </button>

                <button
                  className="p-1.5 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                  title="Share"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>

                {onImageClick && (
                  <>
                    <div className="w-px h-6 bg-glass-border mx-1" />
                    <button
                      onClick={() => onImageClick(currentIndex)}
                      className="p-1.5 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                      title="View in enhanced gallery"
                    >
                      <Maximize2 className="w-4 h-4 text-white" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Info Section */}
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

        {/* Navigation Dots */}
        {pairs.length > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pairs.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index)
                    setSliderPosition(50)
                    resetZoom()
                  }}
                  className={`
                    rounded-full transition-all duration-300
                    ${index === currentIndex
                      ? 'w-8 h-3 bg-gradient-to-r from-accent-neon to-accent-blue shadow-neon'
                      : 'w-3 h-3 bg-surface-elevated hover:bg-accent-neon/30'
                    }
                  `}
                />
              ))}
            </div>

            <div className="text-sm text-text-muted">
              {currentIndex + 1} of {pairs.length}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}