"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ZoomIn, ZoomOut, X, Maximize2, Move, RotateCw } from "lucide-react"

interface ImageZoomProps {
  src: string
  alt: string
  className?: string
  hoverZoom?: boolean
  clickToZoom?: boolean
  maxZoom?: number
  children?: React.ReactNode
}

interface ZoomState {
  scale: number
  x: number
  y: number
  rotation: number
}

export function ImageZoom({
  src,
  alt,
  className = "",
  hoverZoom = true,
  clickToZoom = true,
  maxZoom = 3,
  children,
}: ImageZoomProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: 1,
    x: 0,
    y: 0,
    rotation: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  const openModal = () => {
    if (clickToZoom) {
      setIsModalOpen(true)
      setZoomState({ scale: 1, x: 0, y: 0, rotation: 0 })
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setZoomState({ scale: 1, x: 0, y: 0, rotation: 0 })
  }

  const handleZoomIn = () => {
    setZoomState(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.5, maxZoom),
    }))
  }

  const handleZoomOut = () => {
    setZoomState(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.5, 0.5),
    }))
  }

  const handleReset = () => {
    setZoomState({ scale: 1, x: 0, y: 0, rotation: 0 })
  }

  const handleRotate = () => {
    setZoomState(prev => ({
      ...prev,
      rotation: prev.rotation + 90,
    }))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomState.scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - zoomState.x,
        y: e.clientY - zoomState.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomState.scale > 1) {
      setZoomState(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.5, Math.min(maxZoom, zoomState.scale * delta))
    
    if (newScale !== zoomState.scale) {
      setZoomState(prev => ({
        ...prev,
        scale: newScale,
      }))
    }
  }

  // Touch handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomState.scale > 1) {
      setIsDragging(true)
      const touch = e.touches[0]
      setDragStart({
        x: touch.clientX - zoomState.x,
        y: touch.clientY - zoomState.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && zoomState.scale > 1) {
      const touch = e.touches[0]
      setZoomState(prev => ({
        ...prev,
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      }))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return

      switch (e.key) {
        case 'Escape':
          closeModal()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case '0':
          handleReset()
          break
        case 'r':
        case 'R':
          handleRotate()
          break
      }
    }

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  return (
    <>
      {/* Main Image with Hover Zoom */}
      <div
        className={`relative overflow-hidden cursor-pointer group ${className}`}
        onClick={openModal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="relative w-full h-full"
          whileHover={hoverZoom ? { scale: 1.05 } : {}}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Zoom Icon */}
          {clickToZoom && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ scale: 0.8 }}
              animate={{ scale: isHovered ? 1 : 0.8 }}
            >
              <div className="p-3 rounded-full glass-elevated border border-glass-border-elevated glow-neon">
                <Maximize2 className="w-6 h-6 text-white" />
              </div>
            </motion.div>
          )}
        </motion.div>
        
        {children}
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
            onClick={closeModal}
          >
            {/* Controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoomOut()
                  }}
                  className="p-3 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300"
                  disabled={zoomState.scale <= 0.5}
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                
                <div className="px-4 py-2 rounded-full glass-elevated border border-glass-border-elevated text-white font-medium">
                  {Math.round(zoomState.scale * 100)}%
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoomIn()
                  }}
                  className="p-3 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300"
                  disabled={zoomState.scale >= maxZoom}
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRotate()
                  }}
                  className="p-3 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300"
                >
                  <RotateCw className="w-5 h-5 text-white" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReset()
                  }}
                  className="px-4 py-2 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300 text-white text-sm font-medium"
                >
                  Reset
                </button>
              </div>

              <button
                onClick={closeModal}
                className="p-3 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Image Container */}
            <motion.div
              ref={imageRef}
              className={`
                absolute inset-0 flex items-center justify-center p-16
                ${zoomState.scale > 1 ? 'cursor-move' : 'cursor-zoom-in'}
                ${isDragging ? 'cursor-grabbing' : ''}
              `}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <motion.div
                className="relative max-w-full max-h-full"
                animate={{
                  scale: zoomState.scale,
                  x: zoomState.x,
                  y: zoomState.y,
                  rotate: zoomState.rotation,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Image
                  src={src}
                  alt={alt}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-4 px-6 py-3 rounded-full glass-elevated border border-glass-border-elevated text-white text-sm">
                <div className="flex items-center gap-1">
                  <Move className="w-4 h-4" />
                  <span>Drag to pan</span>
                </div>
                <div className="w-px h-4 bg-white/30" />
                <span>Scroll to zoom</span>
                <div className="w-px h-4 bg-white/30" />
                <span>ESC to close</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}