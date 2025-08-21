"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Share2, 
  RotateCcw, 
  Sparkles,
  Move
} from "lucide-react"
import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider
} from "@/components/ui/image-comparison"

interface EnhancedImageModalProps {
  beforeImage: string
  afterImage: string
  title: string
  description: string
  onClose: () => void
  improvement?: string
  processingTime?: string
  resolution?: string
}

export function EnhancedImageModal({ 
  beforeImage, 
  afterImage, 
  title, 
  description, 
  onClose,
  improvement = "94%",
  processingTime = "28s",
  resolution = "4K Ultra HD"
}: EnhancedImageModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const imageRef = useRef<HTMLDivElement>(null)

  // Hide instructions after 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

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

  const handleReset = () => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      e.preventDefault()
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(1, Math.min(3, zoomLevel + delta))
    setZoomLevel(newZoom)
    
    if (newZoom === 1) {
      setPanPosition({ x: 0, y: 0 })
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
        
        {/* Modal */}
        <motion.div
          className="relative w-full max-w-7xl h-full max-h-[95vh] flex flex-col glass rounded-3xl border border-glass-border overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Top Right */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="p-3 rounded-full glass-elevated border border-glass-border transition-all duration-300 hover:bg-red-500/20 hover:scale-110"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Main Image Comparison Area */}
          <div 
            className="flex-1 relative group overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div 
              className="w-full h-full relative overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                }}
              >
                <ImageComparison 
                  className="w-full h-full" 
                  enableHover
                  springOptions={{ bounce: 0.2, duration: 0.6 }}
                >
                  <ImageComparisonImage
                    src={beforeImage}
                    alt="Original Image"
                    position="left"
                  />
                  <ImageComparisonImage
                    src={afterImage}
                    alt="AI Enhanced Image"
                    position="right"
                  />
                  <ImageComparisonSlider className="w-1 bg-gradient-to-b from-accent-neon via-accent-blue to-accent-purple shadow-neon" />
                </ImageComparison>
              </div>
            </div>

            {/* Labels */}
            <motion.div
              className="absolute bottom-24 sm:bottom-28 left-4 right-4 sm:left-6 sm:right-6 flex justify-between pointer-events-none z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 20
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-3 py-2 sm:px-4 sm:py-2 rounded-full glass-elevated border border-glass-border-elevated text-xs sm:text-sm font-medium text-white backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  Original
                </div>
              </div>
              <div className="px-3 py-2 sm:px-4 sm:py-2 rounded-full glass-elevated border border-glass-border-elevated text-xs sm:text-sm font-medium text-white backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-accent-neon" />
                  AI Enhanced
                </div>
              </div>
            </motion.div>

            {/* Processing Time Indicator */}
            <motion.div
              className="absolute top-4 left-4 sm:top-6 sm:left-6 pointer-events-none z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.8
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-xs font-medium text-green-400 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  {processingTime}
                </div>
              </div>
            </motion.div>

            {/* Quality Improvement Badge */}
            <motion.div
              className="absolute top-4 right-16 sm:top-6 sm:right-20 pointer-events-none z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.8
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-3 py-1 rounded-full bg-accent-neon/20 border border-accent-neon/30 text-xs font-medium text-accent-neon backdrop-blur-sm">
                {improvement} improvement
              </div>
            </motion.div>

            {/* Instructions - Show once then disappear */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.9, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-4 py-3 sm:px-6 sm:py-3 rounded-full glass border border-glass-border text-white backdrop-blur-md text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <Move className="w-4 h-4" />
                      Hover and move to compare • Scroll to zoom
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Dock */}
          <motion.div
            className="p-3 sm:p-4 glass-elevated border-t border-glass-border"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Left Side - Stats */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Resolution:</span>
                  <span>{resolution}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Processing:</span>
                  <span>{processingTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Enhancement:</span>
                  <span className="text-gradient-neon font-semibold">{improvement}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>AI Enhanced</span>
                </div>
              </div>

              {/* Right Side - Controls */}
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 px-2 py-1 glass rounded-lg border border-glass-border">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  
                  <div className="px-2 py-1 min-w-[50px] text-center text-xs sm:text-sm text-text-secondary">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                  
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300"
                  title="Reset view"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button 
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300"
                  title="Download image"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button 
                  className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300"
                  title="Share image"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}