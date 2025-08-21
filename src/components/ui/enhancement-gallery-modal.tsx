"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useSpring } from "framer-motion"
import Image from "next/image"
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share2,
  Sparkles,
  Eye,
  EyeOff,
  Info,
  Clock,
  Zap,
  Camera,
  Palette,
  Settings,
  Maximize2,
  Play,
  Pause,
  BarChart3,
  Target,
  Layers
} from "lucide-react"

interface ComparisonPair {
  before: string
  after: string
  title: string
  description?: string
  improvement?: string
  processingTime?: string
  category?: string
}

interface EnhancementGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  pairs: ComparisonPair[]
  initialIndex?: number
  className?: string
}

type ViewMode = 'comparison' | 'before' | 'after' | 'split'

export function EnhancementGalleryModal({
  isOpen,
  onClose,
  pairs,
  initialIndex = 0,
  className = ""
}: EnhancementGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [viewMode, setViewMode] = useState<ViewMode>('comparison')
  const [showInfo, setShowInfo] = useState(false)
  const [isAutoPlay, setIsAutoPlay] = useState(false)
  const [showStats, setShowStats] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout>()

  // Smooth spring animation for slider
  const springSliderPosition = useSpring(sliderPosition, {
    stiffness: 300,
    damping: 30
  })

  const currentPair = pairs[currentIndex]

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlay && pairs.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % pairs.length)
      }, 3000)
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlay, pairs.length])

  // Reset state when modal opens/closes or index changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setSliderPosition(50)
      resetZoom()
      setViewMode('comparison')
      setShowInfo(false)
      setIsAutoPlay(false)
    }
  }, [isOpen, initialIndex])

  useEffect(() => {
    setSliderPosition(50)
    resetZoom()
  }, [currentIndex])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + pairs.length) % pairs.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pairs.length)
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
    if (viewMode !== 'comparison') return
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case '1':
          setViewMode('before')
          break
        case '2':
          setViewMode('comparison')
          break
        case '3':
          setViewMode('after')
          break
        case '4':
          setViewMode('split')
          break
        case ' ':
          e.preventDefault()
          setIsAutoPlay(!isAutoPlay)
          break
        case 'i':
          setShowInfo(!showInfo)
          break
        case 's':
          setShowStats(!showStats)
          break
      }
    }

    if (isDragging || isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDragging, isPanning, isOpen, showInfo, showStats, isAutoPlay])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          className="relative w-full h-full max-w-7xl max-h-screen p-6 flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Top Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300 ${showStats ? 'glow-neon' : ''
                }`}
              title="Toggle stats (S)"
            >
              <BarChart3 className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300 ${showInfo ? 'glow-neon' : ''
                }`}
              title="Toggle info (I)"
            >
              <Info className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex gap-6">
            {/* Main Image Container */}
            <div className="flex-1 relative">
              <motion.div
                ref={containerRef}
                className="relative w-full h-full rounded-2xl overflow-hidden glass border border-glass-border"
                layout
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentIndex}-${viewMode}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                  >
                    {/* Split View Mode */}
                    {viewMode === 'split' ? (
                      <div className="flex h-full">
                        <div className="flex-1 relative border-r border-glass-border">
                          <Image
                            src={currentPair.before}
                            alt={`${currentPair.title} - Before`}
                            fill
                            className="object-contain"
                            style={{
                              transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`
                            }}
                            onMouseDown={handlePanMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={() => setIsPanning(false)}
                            onWheel={handleWheel}
                            sizes="50vw"
                            priority
                          />
                          <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white backdrop-blur-md">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-400 rounded-full" />
                              Original
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 relative">
                          <Image
                            src={currentPair.after}
                            alt={`${currentPair.title} - After`}
                            fill
                            className="object-contain"
                            style={{
                              transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`
                            }}
                            onMouseDown={handlePanMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={() => setIsPanning(false)}
                            onWheel={handleWheel}
                            sizes="50vw"
                            priority
                          />
                          <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white backdrop-blur-md">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3 h-3 text-accent-neon" />
                              Enhanced
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Before Image */}
                        <div className="absolute inset-0">
                          <Image
                            src={currentPair.before}
                            alt={`${currentPair.title} - Before`}
                            fill
                            className="object-contain"
                            style={{
                              transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                              opacity: viewMode === 'after' ? 0 : 1
                            }}
                            onMouseDown={handlePanMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={() => setIsPanning(false)}
                            onWheel={handleWheel}
                            sizes="100vw"
                            priority
                          />
                        </div>

                        {/* After Image */}
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            clipPath: viewMode === 'comparison'
                              ? `inset(0 ${100 - springSliderPosition.get()}% 0 0)`
                              : viewMode === 'after'
                                ? 'inset(0 0% 0 0)'
                                : 'inset(0 100% 0 0)',
                          }}
                        >
                          <Image
                            src={currentPair.after}
                            alt={`${currentPair.title} - After`}
                            fill
                            className="object-contain"
                            style={{
                              transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`
                            }}
                            onMouseDown={handlePanMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={() => setIsPanning(false)}
                            onWheel={handleWheel}
                            sizes="100vw"
                            priority
                          />
                        </motion.div>

                        {/* Slider Handle - Only in comparison mode */}
                        {viewMode === 'comparison' && (
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
                            <div className="absolute w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                              <div className="w-1 h-4 bg-gradient-to-b from-accent-neon to-accent-blue rounded-full" />
                            </div>
                          </motion.div>
                        )}

                        {/* View Mode Labels - Only for non-split modes */}
                        {viewMode !== 'split' && (
                          <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
                            <motion.div
                              className="px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white backdrop-blur-md"
                              animate={{
                                opacity: viewMode === 'after' ? 0 : 1,
                                scale: viewMode === 'before' ? 1.1 : 1
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-400 rounded-full" />
                                Original
                              </div>
                            </motion.div>

                            <motion.div
                              className="px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white backdrop-blur-md"
                              animate={{
                                opacity: viewMode === 'before' ? 0 : 1,
                                scale: viewMode === 'after' ? 1.1 : 1
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-accent-neon" />
                                AI Enhanced
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Stats Overlay */}
                <AnimatePresence>
                  {showStats && (
                    <motion.div
                      className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-xs font-medium text-green-400 backdrop-blur-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {currentPair.processingTime || "< 30s"}
                        </div>
                      </div>

                      {currentPair.improvement && (
                        <div className="px-3 py-1 rounded-full bg-accent-neon/20 border border-accent-neon/30 text-xs font-medium text-accent-neon backdrop-blur-sm">
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {currentPair.improvement} boost
                          </div>
                        </div>
                      )}

                      <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-medium text-blue-400 backdrop-blur-sm">
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          AI Enhanced
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
              </motion.div>
            </div>

            {/* Side Info Panel */}
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  className="w-80 bg-black/80 backdrop-blur-xl border border-glass-border rounded-2xl p-6 overflow-y-auto"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-accent-neon" />
                        Image Details
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Category</span>
                          <span className="text-white">{currentPair.category || 'Portrait'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Resolution</span>
                          <span className="text-white">1920×1080</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">File Size</span>
                          <span className="text-white">2.4 MB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Format</span>
                          <span className="text-white">PNG</span>
                        </div>
                      </div>
                    </div>

                    {currentPair.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <Info className="w-5 h-5 text-accent-blue" />
                          Description
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {currentPair.description}
                        </p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-accent-purple" />
                        Enhancement Stats
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent-neon/20 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-accent-neon" />
                          </div>
                          <div>
                            <div className="text-white font-medium text-lg">{currentPair.improvement || "94%"}</div>
                            <div className="text-xs text-gray-400">Quality Improvement</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <div className="text-white font-medium text-lg">{currentPair.processingTime || "< 30s"}</div>
                            <div className="text-xs text-gray-400">Processing Time</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Layers className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-white font-medium text-lg">AI Super-Res</div>
                            <div className="text-xs text-gray-400">Enhancement Type</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-400" />
                        Keyboard Shortcuts
                      </h3>
                      <div className="space-y-2 text-xs text-gray-400">
                        <div className="flex justify-between">
                          <span>Previous/Next</span>
                          <span>← →</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Before Only</span>
                          <span>1</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Comparison</span>
                          <span>2</span>
                        </div>
                        <div className="flex justify-between">
                          <span>After Only</span>
                          <span>3</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Split View</span>
                          <span>4</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Auto-play</span>
                          <span>Space</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Toggle Info</span>
                          <span>I</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Toggle Stats</span>
                          <span>S</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Close</span>
                          <span>Esc</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Control Dock */}
          <motion.div
            className="mt-6 flex items-center justify-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 px-8 py-4 glass-elevated border border-glass-border-elevated rounded-2xl backdrop-blur-xl">
              {/* Navigation & Auto-play */}
              {pairs.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="p-3 rounded-xl glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                    title="Previous (←)"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>

                  <button
                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                    className={`p-3 rounded-xl glass hover:glass-elevated border border-glass-border transition-all duration-300 ${isAutoPlay ? 'glow-neon' : 'hover:glow-neon'
                      }`}
                    title="Auto-play (Space)"
                  >
                    {isAutoPlay ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>

                  <button
                    onClick={goToNext}
                    className="p-3 rounded-xl glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                    title="Next (→)"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>

                  <div className="w-px h-10 bg-glass-border mx-2" />
                </>
              )}

              {/* View Mode Controls */}
              <div className="flex items-center gap-1 p-1 bg-black/20 rounded-xl">
                <button
                  onClick={() => setViewMode('before')}
                  className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'before'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  title="Before only (1)"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setViewMode('comparison')}
                  className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'comparison'
                    ? 'bg-accent-neon/20 text-accent-neon border border-accent-neon/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  title="Comparison (2)"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setViewMode('after')}
                  className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'after'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  title="After only (3)"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setViewMode('split')}
                  className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'split'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  title="Split view (4)"
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-10 bg-glass-border mx-2" />

              {/* Zoom Controls */}
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-3 rounded-xl glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>

              <div className="px-4 py-2 text-sm text-gray-400 min-w-[80px] text-center font-mono">
                {Math.round(zoomLevel * 100)}%
              </div>

              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-3 rounded-xl glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={() => {
                  setSliderPosition(50)
                  resetZoom()
                }}
                className="p-3 rounded-xl glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                title="Reset view"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>

              <div className="w-px h-10 bg-glass-border mx-2" />

              {/* Actions */}
              <button
                className="p-3 rounded-xl glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                title="Download image"
              >
                <Download className="w-5 h-5 text-white" />
              </button>

              <button
                className="p-3 rounded-xl glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                title="Share image"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          {pairs.length > 1 && (
            <motion.div
              className="mt-4 flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {pairs.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`
                    rounded-full transition-all duration-300
                    ${index === currentIndex
                      ? 'w-8 h-2 bg-gradient-to-r from-accent-neon to-accent-blue shadow-neon'
                      : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                    }
                  `}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}