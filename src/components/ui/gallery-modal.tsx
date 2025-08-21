"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Share2, Sparkles } from "lucide-react"
import { ImageComparison, ImageComparisonImage, ImageComparisonSlider } from "./image-comparison"

interface GalleryModalProps {
  beforeImage: string
  afterImage: string
  onClose: () => void
  isOpen: boolean
}

export function GalleryModal({ 
  beforeImage, 
  afterImage, 
  onClose,
  isOpen 
}: GalleryModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle escape key and prevent body scroll
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Prevent body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalStyle
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

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
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(1, Math.min(3, zoomLevel + delta))
    setZoomLevel(newZoom)
    
    if (newZoom === 1) {
      setPanPosition({ x: 0, y: 0 })
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Enhanced Glassmorphic Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Enhanced Glassmorphic Modal Content */}
        <motion.div
          className="relative w-full max-w-6xl max-h-[90vh] glass-elevated rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced Glassmorphic Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-3 rounded-xl glass-elevated border border-glass-border-elevated transition-all duration-300 hover:glow-neon hover:bg-red-500/10 backdrop-blur-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            <X className="h-5 w-5 text-white" />
          </button>

          {/* Image Comparison Container */}
          <div 
            ref={containerRef}
            className="relative aspect-video bg-black/50"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <ImageComparison 
              className="w-full h-full"
              enableHover={true}
              springOptions={{ bounce: 0.2, duration: 0.8 }}
            >
              <ImageComparisonImage
                src={beforeImage}
                alt="Original Image - Before"
                position="left"
                className="object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`
                }}
              />
              <ImageComparisonImage
                src={afterImage}
                alt="AI Enhanced Image - After"
                position="right"
                className="object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`
                }}
              />
              <ImageComparisonSlider className="w-1 bg-gradient-to-b from-accent-neon via-accent-blue to-accent-purple shadow-neon" />
            </ImageComparison>

            {/* Enhanced Glassmorphic Labels */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between pointer-events-none">
              <motion.div
                className="px-4 py-2 rounded-full border backdrop-blur-xl bg-blue-500/20 border-blue-500/30 text-blue-400"
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="text-sm font-medium">Original</span>
              </motion.div>
              
              <motion.div
                className="px-4 py-2 rounded-full border backdrop-blur-xl bg-green-500/20 border-green-500/30 text-green-400"
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-sm font-medium">AI Enhanced</span>
                </div>
              </motion.div>
            </div>

            {/* Processing Time Indicator */}
            <motion.div
              className="absolute top-6 left-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 backdrop-blur-xl"
                   style={{
                     background: 'rgba(34, 197, 94, 0.15)',
                     backdropFilter: 'blur(12px)',
                     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                   }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">28s</span>
                </div>
              </div>
            </motion.div>

            {/* Zoom Level Indicator */}
            {zoomLevel > 1 && (
              <motion.div
                className="absolute top-6 right-16"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-medium text-purple-400 backdrop-blur-sm">
                  {Math.round(zoomLevel * 100)}%
                </div>
              </motion.div>
            )}
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between p-4 border-t border-glass-border bg-surface/50">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <span>Resolution: 4K Ultra HD</span>
              <span>•</span>
              <span>Processing: 28s</span>
              <span>•</span>
              <span className="text-gradient-neon font-semibold">94% improvement</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 px-3 py-1 glass rounded-lg border border-glass-border">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                
                <span className="text-sm text-text-secondary min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </AnimatePresence>
  )
}