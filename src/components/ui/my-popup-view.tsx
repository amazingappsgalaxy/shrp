"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  Info
} from "lucide-react"
import { ImageComparison, ImageComparisonImage, ImageComparisonSlider } from "./image-comparison"

interface MyPopupViewProps {
  isOpen: boolean
  onClose: () => void
  beforeImage: string
  afterImage: string
  title: string
  description: string
}

export default function MyPopupView({
  isOpen,
  onClose,
  beforeImage,
  afterImage,
  title,
  description
}: MyPopupViewProps) {
  const [viewMode, setViewMode] = useState<'comparison' | 'split'>('comparison')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showControls, setShowControls] = useState(true)
  const [isPortrait, setIsPortrait] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Set mounted state for client-side rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Reset zoom and pan when popup opens
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1)
      setPanPosition({ x: 0, y: 0 })
      setViewMode('comparison')
    }
  }, [isOpen])

  // Handle orientation changes for mobile responsiveness
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  // Handle keyboard events and prevent body scroll
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '4':
          setViewMode('split')
          break
        case 'h':
        case 'H':
          setShowControls(!showControls)
          break
        case ' ':
          e.preventDefault()
          setIsSpacePressed(true)
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        setIsSpacePressed(false)
        setIsDragging(false) // Stop dragging when spacebar is released
      }
    }

    // Prevent body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.body.style.overflow = originalStyle
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [isOpen, onClose, showControls])

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 4))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleReset = () => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoomLevel(prev => Math.min(Math.max(prev * delta, 0.5), 4))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      // In comparison mode: only drag when spacebar is pressed
      // In split view mode: always allow dragging when zoomed
      const canDrag = viewMode === 'split' || (viewMode === 'comparison' && isSpacePressed)

      if (canDrag) {
        e.preventDefault()
        setIsDragging(true)
        setDragStart({
          x: e.clientX - panPosition.x,
          y: e.clientY - panPosition.y
        })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (!isOpen || !isMounted) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 md:p-6"
        style={{
          zIndex: 2147483647,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Glassmorphic Black Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Glassmorphic Modal Design */}
        <motion.div
          className="relative w-full h-full max-w-sm max-h-[90vh] sm:max-w-2xl sm:max-h-[85vh] md:max-w-4xl md:max-h-[90vh] lg:max-w-6xl lg:max-h-[95vh] xl:max-w-7xl mx-auto overflow-hidden bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Top Right */}
          <AnimatePresence>
            {showControls && (
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 z-[100] p-2 rounded-lg bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-all duration-200 border border-white/20"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Main Image Display Area */}
          <div
            ref={containerRef}
            className="relative w-full h-full bg-black"
            style={{
              aspectRatio: isPortrait ? 'auto' : '16/10',
              minHeight: isPortrait ? '60vh' : 'auto'
            }}
          >
            {/* Render based on view mode */}
            {viewMode === 'comparison' && (
              <div className="w-full h-full relative overflow-hidden">
                {/* Transform Container */}
                <div
                  className="w-full h-full"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                    transformOrigin: 'center center'
                  }}
                >
                  <ImageComparison
                    className="w-full h-full"
                    enableHover={zoomLevel > 1 ? !isSpacePressed : true}
                    springOptions={{ bounce: 0.2, duration: 0.8 }}
                  >
                    <ImageComparisonImage
                      src={beforeImage}
                      alt="Original Image - Before"
                      position="left"
                      className="object-contain"
                    />
                    <ImageComparisonImage
                      src={afterImage}
                      alt="AI Enhanced Image - After"
                      position="right"
                      className="object-contain"
                    />
                    <ImageComparisonSlider
                      className={`w-0.5 bg-white shadow-lg transition-opacity duration-300 ${zoomLevel > 1 && isSpacePressed ? 'opacity-30' : 'opacity-100'
                        }`}
                    />
                  </ImageComparison>
                </div>

                {/* Event Handlers - Only for wheel and spacebar+drag */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  onWheel={handleWheel}
                />

                {/* Spacebar + Drag Handler - Only active when spacebar pressed and zoomed */}
                {zoomLevel > 1 && isSpacePressed && (
                  <div
                    className="absolute inset-0 z-10"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                      cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                  />
                )}
              </div>
            )}

            {viewMode === 'split' && (
              <div className="flex w-full h-full relative overflow-hidden">
                {/* Split View Images */}
                <div className="flex-1 relative overflow-hidden">
                  <img
                    src={beforeImage}
                    alt="Original Image"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                      transformOrigin: 'center center'
                    }}
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
                    <span className="flex items-center justify-center">Original</span>
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  <img
                    src={afterImage}
                    alt="AI Enhanced Image"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                      transformOrigin: 'center center'
                    }}
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-orange-500/60 text-orange-400 text-sm font-medium">
                    <div className="flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Enhanced</span>
                    </div>
                  </div>
                </div>

                {/* Event Handlers - Only for wheel */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  onWheel={handleWheel}
                />

                {/* Drag Handler - Always active when zoomed in split view (no spacebar needed) */}
                {zoomLevel > 1 && (
                  <div
                    className="absolute inset-0 z-10"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                      cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                  />
                )}
              </div>
            )}

            {/* Dynamic Labels for Comparison Mode - Centered */}
            {viewMode === 'comparison' && (
              <div className="absolute bottom-20 sm:bottom-24 left-4 right-4 sm:left-6 sm:right-6 flex justify-between pointer-events-none">
                <motion.div
                  className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <span className="text-xs font-medium text-center">Original</span>
                </motion.div>

                <motion.div
                  className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-orange-500/60 text-orange-400"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs font-medium text-center">AI Enhanced</span>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Zoom Level Indicator - Centered */}
            {zoomLevel !== 1 && (
              <motion.div
                className="absolute top-6 w-full flex justify-center z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className="flex items-center justify-center px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
                  <span>{Math.round(zoomLevel * 100)}%</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Control Dock - Centered */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                className="absolute bottom-4 w-full flex justify-center z-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20">

                  {/* Split View Toggle */}
                  <button
                    onClick={() => setViewMode(viewMode === 'split' ? 'comparison' : 'split')}
                    className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-200 ${viewMode === 'split'
                      ? 'bg-blue-500/30 text-blue-400 border border-blue-400/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    title="Toggle split view (4)"
                  >
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="1" y="2" width="6" height="12" rx="1" fill="currentColor" opacity="0.6" />
                      <rect x="9" y="2" width="6" height="12" rx="1" fill="currentColor" opacity="0.6" />
                      <line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                    <button
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 0.5}
                      className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>

                    <span className="text-xs text-white min-w-[40px] sm:min-w-[50px] text-center font-medium px-1">
                      {Math.round(zoomLevel * 100)}%
                    </span>

                    <button
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 4}
                      className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                    title="Reset view"
                  >
                    <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}