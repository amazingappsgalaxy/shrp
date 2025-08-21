"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef } from "react"
import Image from "next/image"
import { X, ZoomIn, ZoomOut, Download, Share2, RotateCcw } from "lucide-react"

interface ImageModalProps {
  beforeImage: string
  afterImage: string
  title: string
  description: string
  onClose: () => void
}

export function ImageModal({ beforeImage, afterImage, title, description, onClose }: ImageModalProps) {
  const [showAfter, setShowAfter] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
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

  const handleReset = () => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
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

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
        
        {/* Modal */}
        <motion.div
          className="relative max-w-7xl w-full max-h-[95vh] glass rounded-3xl border border-glass-border overflow-hidden"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-glass-border">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-text-primary mb-1">{title}</h3>
              <p className="text-text-secondary">{description}</p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1 glass rounded-lg border border-glass-border">
                <span className="text-sm text-text-secondary">Zoom: {Math.round(zoomLevel * 100)}%</span>
              </div>
              
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleReset}
                className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              
              <div className="w-px h-6 bg-glass-border mx-2" />
              
              <button className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300">
                <Download className="h-5 w-5" />
              </button>
              
              <button className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300">
                <Share2 className="h-5 w-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg glass hover:glass-elevated border border-glass-border transition-all duration-300 hover:bg-red-500/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div 
            ref={imageRef}
            className="relative aspect-video overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Before Image */}
            <motion.div
              className="absolute inset-0"
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                opacity: showAfter ? 0 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={beforeImage}
                alt={`${title} - Before`}
                fill
                className="object-contain"
                quality={100}
                priority
              />
            </motion.div>
            
            {/* After Image */}
            <motion.div
              className="absolute inset-0"
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                opacity: showAfter ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={afterImage}
                alt={`${title} - After`}
                fill
                className="object-contain"
                quality={100}
                priority
              />
            </motion.div>

            {/* Zoom Instructions */}
            {zoomLevel === 1 && (
              <motion.div
                className="absolute top-4 left-4 px-3 py-2 glass rounded-lg border border-glass-border"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm text-text-secondary">
                  Scroll to zoom • Click and drag to pan
                </p>
              </motion.div>
            )}

            {/* Before/After Toggle */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setShowAfter(false)}
                  className={`px-4 py-2 rounded-l-full border border-glass-border transition-all duration-300 ${
                    !showAfter 
                      ? "bg-accent-neon text-white border-accent-neon" 
                      : "glass hover:glass-elevated text-text-secondary"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Before
                </motion.button>
                
                <motion.button
                  onClick={() => setShowAfter(true)}
                  className={`px-4 py-2 rounded-r-full border border-glass-border transition-all duration-300 ${
                    showAfter 
                      ? "bg-accent-neon text-white border-accent-neon" 
                      : "glass hover:glass-elevated text-text-secondary"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  After
                </motion.button>
              </div>
            </div>

            {/* Image State Indicator */}
            <div className="absolute top-4 right-4">
              <motion.div
                className={`px-3 py-1 rounded-full border ${
                  showAfter 
                    ? "bg-green-500/20 border-green-500/30 text-green-400" 
                    : "bg-blue-500/20 border-blue-500/30 text-blue-400"
                }`}
                key={showAfter ? "after" : "before"}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm font-medium">
                  {showAfter ? "Enhanced" : "Original"}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-glass-border bg-surface/50">
            <div className="flex items-center justify-between text-sm text-text-muted">
              <div className="flex items-center gap-4">
                <span>Resolution: 4K Ultra HD</span>
                <span>•</span>
                <span>Processing Time: 28s</span>
                <span>•</span>
                <span>Enhancement: 94% improvement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>AI Enhanced</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}