"use client"
import React, { useState, useRef, useCallback } from "react"
import { IconArrowsHorizontal, IconArrowsMaximize, IconDownload } from "@tabler/icons-react"

interface ComparisonViewProps {
  original: string
  enhanced: string
  /** Label shown on the left (original) side. Defaults to "Original" */
  originalLabel?: string
  /** Label shown on the right (enhanced) side. Defaults to "Enhanced" */
  enhancedLabel?: string
  onDownload?: () => void
  onExpand?: () => void
}

export function ComparisonView({
  original,
  enhanced,
  originalLabel = "Original",
  enhancedLabel = "Enhanced",
  onDownload,
  onExpand,
}: ComparisonViewProps) {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    setSliderPos((x / rect.width) * 100)
  }, [])

  return (
    <div
      className="relative w-full h-full bg-[#050505] overflow-hidden select-none group"
      ref={containerRef}
      onMouseMove={(e) => handleMove(e.clientX)}
      onTouchMove={(e) => e.touches[0] && handleMove(e.touches[0].clientX)}
    >
      {/* Base image (original) */}
      <img
        src={original}
        className="absolute inset-0 w-full h-full object-contain"
        alt={originalLabel}
        draggable={false}
      />

      {/* Enhanced image clipped to right of slider */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
      >
        <img
          src={enhanced}
          className="absolute inset-0 w-full h-full object-contain"
          alt={enhancedLabel}
          draggable={false}
        />
      </div>

      {/* Slider line + handle */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 cursor-ew-resize"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <IconArrowsHorizontal className="w-4 h-4 text-black" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur text-white/80 text-xs font-medium rounded border border-white/10 uppercase tracking-wider">
        {originalLabel}
      </div>
      <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur text-white text-xs font-bold rounded border border-white/20 uppercase tracking-wider shadow-lg">
        {enhancedLabel}
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-6 right-6 flex gap-3 z-30">
        {onExpand && (
          <button
            onClick={(e) => { e.stopPropagation(); onExpand() }}
            className="p-3 bg-white text-black rounded-full shadow-xl hover:scale-105 transition-transform"
            title="Expand view"
          >
            <IconArrowsMaximize className="w-5 h-5" />
          </button>
        )}
        {onDownload && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload() }}
            className="p-3 bg-white text-black rounded-full shadow-xl hover:scale-105 transition-transform"
            title="Download"
          >
            <IconDownload className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
