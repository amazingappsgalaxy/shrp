'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface BeforeAfterSliderProps {
  before: string
  after: string
  width?: number
  height?: number
  className?: string
}

export function BeforeAfterSlider({ 
  before, 
  after, 
  width = 600, 
  height = 400, 
  className 
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) handleMove(e.clientX)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX)
  }

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleMouseUp)
      }
    }
  }, [isDragging])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSliderPosition(prev => Math.max(0, prev - 5))
      } else if (e.key === 'ArrowRight') {
        setSliderPosition(prev => Math.min(100, prev + 5))
      } else if (e.key === ' ') {
        setSliderPosition(prev => prev === 50 ? 0 : prev === 0 ? 100 : 50)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-lg", className)}
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      role="img"
      aria-label="Before and after image comparison slider"
      tabIndex={0}
    >
      {/* Before Image */}
      <img
        src={before}
        alt="Before"
        className="absolute top-0 left-0 right-0 bottom-0 w-full h-full object-cover"
      />

      {/* After Image Container */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={after}
          alt="After"
          className="absolute top-0 left-0 right-0 bottom-0 w-full h-full object-cover"
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={sliderPosition}
        aria-label="Image comparison slider"
      />
    </div>
  )
}
