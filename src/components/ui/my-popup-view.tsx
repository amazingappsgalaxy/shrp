"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ZoomIn, RotateCcw, X } from "lucide-react"

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
  const containerRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const afterImageRef = useRef<HTMLDivElement>(null)

  const [isMounted, setIsMounted] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isOpen])

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current || !sliderRef.current || !afterImageRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const percent = (x / rect.width) * 100

    sliderRef.current.style.left = `${percent}%`
    afterImageRef.current.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const startDrag = (clientX: number) => {
      updateSliderPosition(clientX)

      const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
        let cx;
        if ('touches' in moveEvent && moveEvent.touches && moveEvent.touches.length > 0) {
          cx = moveEvent.touches[0]?.clientX ?? 0;
        } else {
          cx = (moveEvent as MouseEvent).clientX;
        }
        requestAnimationFrame(() => updateSliderPosition(cx))
      }

      const upHandler = () => {
        window.removeEventListener('mousemove', moveHandler)
        window.removeEventListener('touchmove', moveHandler)
        window.removeEventListener('mouseup', upHandler)
        window.removeEventListener('touchend', upHandler)
      }

      window.addEventListener('mousemove', moveHandler)
      window.addEventListener('touchmove', moveHandler, { passive: false })
      window.addEventListener('mouseup', upHandler)
      window.addEventListener('touchend', upHandler)
    }

    let cx;
    if ('touches' in e && e.touches && e.touches.length > 0) {
      cx = e.touches[0]?.clientX ?? 0;
    } else {
      cx = (e as React.MouseEvent).clientX;
    }
    startDrag(cx)
  }, [updateSliderPosition])


  if (!isOpen || !isMounted) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[100000]"
        >
          <X className="w-6 h-6" />
        </button>

        <motion.div
          className="relative w-full max-w-6xl h-[85vh] mx-4 bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* COMPARISON AREA */}
          <div
            className="flex-1 relative overflow-hidden bg-black select-none cursor-ew-resize group"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            {/* 1. BACKGROUND = AFTER (Enhanced) = RIGHT SIDE */}
            <img
              src={afterImage}
              alt="Enhanced - After"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              style={{ transform: `scale(${zoomLevel})` }}
            />

            {/* Label: Enhanced (Right) */}
            <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-[#FFFF00] backdrop-blur-md rounded-full text-xs font-bold text-black border border-[#FFFF00]/20 pointer-events-none">
              Enhanced
            </div>

            {/* 2. FOREGROUND = BEFORE (Original) = LEFT SIDE (Clipped) */}
            <div
              ref={afterImageRef}
              className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)', // Starts at 50%
              }}
            >
              <img
                src={beforeImage}
                alt="Original - Before"
                className="absolute inset-0 w-full h-full object-contain max-w-none"
                style={{ width: '100%', height: '100%', transform: `scale(${zoomLevel})` }}
              />
              {/* Label: Original (Left) */}
              <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white/80 border border-white/10">
                Original
              </div>
            </div>

            {/* SLIDER LINE */}
            <div
              ref={sliderRef}
              className="absolute top-0 bottom-0 w-[2px] bg-[#FFFF00] z-30 pointer-events-none shadow-[0_0_15px_rgba(255,255,0,0.6)]"
              style={{ left: '50%' }}
            >
              {/* HANDLE ICON */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                <div className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full border-2 border-[#FFFF00] flex items-center justify-center shadow-lg">
                  <div className="flex gap-[2px]">
                    <div className="w-[1px] h-3 bg-[#FFFF00]" />
                    <div className="w-[1px] h-3 bg-[#FFFF00]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR / INFO */}
          <div className="w-full md:w-80 bg-black/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col z-40">
            <h3 className="text-2xl font-bold font-heading text-white mb-2">{title}</h3>
            <p className="text-white/60 leading-relaxed text-sm mb-6 flex-1">
              {description}
            </p>

            <div className="flex gap-4 mt-auto">
              <button
                onClick={() => setZoomLevel(z => Math.min(z + 0.5, 3))}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 text-white text-sm font-bold"
              >
                <ZoomIn className="w-4 h-4" /> Zoom
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 text-white text-sm font-bold"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}