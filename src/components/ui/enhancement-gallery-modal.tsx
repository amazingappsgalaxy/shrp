"use client"

import { createPortal } from "react-dom"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"
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
  category?: string
  creditsConsumed?: number
  taskTags?: string
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
  const [mounted, setMounted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

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
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Guard against empty pairs
  if (!pairs || pairs.length === 0) {
    return null
  }

  // Smooth spring animation for slider
  const sliderMotionValue = useMotionValue(sliderPosition)
  const springSliderPosition = useSpring(sliderMotionValue, {
    stiffness: 300,
    damping: 30
  })

  const currentPair = pairs[currentIndex]
  if (!currentPair) return null

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

  // Body Scroll Lock - Enhanced for better compatibility
  useEffect(() => {
    if (isOpen) {
      // Store original values
      const scrollY = window.scrollY
      const body = document.body

      // Apply scroll lock
      body.style.position = 'fixed'
      body.style.top = `-${scrollY}px`
      body.style.width = '100%'
      body.style.overflow = 'hidden'
    } else {
      // Restore scroll position
      const body = document.body
      const scrollY = body.style.top
      body.style.position = ''
      body.style.top = ''
      body.style.width = ''
      body.style.overflow = ''

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Slider - Mouse movement based (not drag)
  const handleSliderMouseMove = (e: React.MouseEvent) => {
    if (viewMode !== 'comparison') return
    updateSliderPosition(e.clientX)
  }

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
    sliderMotionValue.set(clampedPercentage)
  }

  // Transform for slider position
  const sliderLeft = useTransform(springSliderPosition, (value) => `${value}%`)
  const clipPath = useTransform(springSliderPosition, (value) => `inset(0 ${100 - value}% 0 0)`)

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

  if (!isOpen || !mounted) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center font-sans"
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
          className="relative w-full h-full max-w-7xl max-h-screen p-6 flex flex-col pointer-events-none"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Enable pointer events on content */}
          <div className="w-full h-full flex flex-col pointer-events-auto">
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
                onClick={onClose}
                className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border hover:glow-neon transition-all duration-300"
                title="Close (Esc)"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-6 min-h-0">
              {/* Main Image Container */}
              <div className="flex-1 relative min-h-0">
                <motion.div
                  ref={containerRef}
                  className="relative w-full h-full rounded-2xl overflow-hidden glass border border-glass-border select-none"
                  layout
                  onMouseMove={handleSliderMouseMove}
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
                              draggable={false}
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
                              draggable={false}
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
                              draggable={false}
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
                              draggable={false}
                            />
                          </motion.div>

                          {/* Slider Handle - Only in comparison mode */}
                          {viewMode === 'comparison' && (
                            <motion.div
                              className="absolute top-0 bottom-0 flex items-center justify-center z-50 cursor-ew-resize touch-none"
                              style={{
                                left: `${springSliderPosition.get() ?? 50}%`,
                                x: '-50%' // Use x instead of transform to avoid conflicts
                              }}
                              onMouseDown={handleSliderMouseDown}
                              onTouchStart={(e) => {
                                if (e.touches.length > 0) {
                                  setIsDragging(true)
                                  updateSliderPosition(e.touches[0].clientX)
                                }
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className={`
                                w-1 h-full bg-gradient-to-b from-accent-neon via-accent-blue to-accent-purple shadow-neon
                                ${isDragging ? 'shadow-neon-strong w-1.5' : ''}
                                transition-all duration-200
                              `} />

                              <div className="absolute w-12 h-12 flex items-center justify-center -translate-x-1/2 left-1/2">
                                <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-ew-resize">
                                  <div className="flex gap-0.5">
                                    <div className="w-0.5 h-3 bg-gray-300 rounded-full" />
                                    <div className="w-0.5 h-3 bg-gray-300 rounded-full" />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* View Mode Labels */}
                          {(viewMode === 'comparison' || viewMode === 'before' || viewMode === 'after') && (
                            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-30">
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
                        className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-30"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
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
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent-neon/20 rounded-lg flex items-center justify-center">
                              <Camera className="w-5 h-5 text-accent-neon" />
                            </div>
                            <div>
                              <div className="text-white font-medium text-lg">1536 × 1536</div>
                              <div className="text-xs text-gray-400">Output Resolution</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {currentPair.description && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Info className="w-5 h-5 text-accent-blue" />
                            Description
                          </h3>
                          <p className="text-gray-300 text-sm leading-relaxed break-words">
                            {currentPair.description}
                          </p>
                        </div>
                      )}


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
                      title="Previous (Left Arrow)"
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
                      title="Next (Right Arrow)"
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
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}