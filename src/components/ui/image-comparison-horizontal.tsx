"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { IMAGE_ASSETS } from "@/lib/constants"

interface ComparisonPair {
  before: string
  after: string
  title: string
}

interface ImageComparisonHorizontalProps {
  pairs?: ComparisonPair[]
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
}

export function ImageComparisonHorizontal({
  pairs = IMAGE_ASSETS.beforeAfterPairs.slice(0, 6),
  autoPlay = true,
  autoPlayInterval = 4000,
  className = "",
}: ImageComparisonHorizontalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentPair = pairs[currentIndex]

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && !isDragging) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % pairs.length)
        setSliderPosition(50) // Reset slider position on auto-advance
      }, autoPlayInterval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, isDragging, pairs.length, autoPlayInterval])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + pairs.length) % pairs.length)
    setSliderPosition(50)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pairs.length)
    setSliderPosition(50)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setIsPlaying(false)
    updateSliderPosition(e.clientX)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setIsPlaying(false)
    const touch = e.touches[0]
    updateSliderPosition(touch.clientX)
  }

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const percentage = ((clientX - rect.left) / rect.width) * 100
    const clampedPercentage = Math.max(0, Math.min(100, percentage))
    setSliderPosition(clampedPercentage)
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSliderPosition(e.clientX)
      }
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0]
        updateSliderPosition(touch.clientX)
      }
    }

    const handleGlobalTouchEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.addEventListener('touchmove', handleGlobalTouchMove)
      document.addEventListener('touchend', handleGlobalTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isDragging])

  return (
    <div className={`relative ${className}`}>
      {/* Main Comparison Container */}
      <div
        ref={containerRef}
        className="relative aspect-[4/3] rounded-2xl overflow-hidden glass group cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Before Image */}
            <div className="absolute inset-0">
              <Image
                src={currentPair.before}
                alt={`${currentPair.title} - Before`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
              />
            </div>

            {/* After Image with Clip */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              }}
            >
              <Image
                src={currentPair.after}
                alt={`${currentPair.title} - After`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 flex items-center justify-center z-10 transition-opacity duration-200"
          style={{
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className={`
            w-1 h-full bg-gradient-to-b from-accent-neon to-accent-blue shadow-neon
            ${isDragging ? 'shadow-neon-strong' : ''}
          `} />

        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300 opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300 opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="absolute top-4 right-4 p-2 rounded-full glass-elevated border border-glass-border-elevated hover:glow-neon transition-all duration-300 opacity-0 group-hover:opacity-100"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Labels */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white">
            Before
          </div>
          <div className="px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white">
            After
          </div>
        </div>
      </div>

      {/* Title and Controls */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-text-primary mb-1">
            {currentPair.title}
          </h3>
          <p className="text-text-secondary text-sm">
            {currentIndex + 1} of {pairs.length}
          </p>
        </div>

        {/* Thumbnail Navigation */}
        <div className="flex items-center gap-2">
          {pairs.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setSliderPosition(50)
              }}
              className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${index === currentIndex
                  ? 'bg-gradient-to-r from-accent-neon to-accent-blue shadow-neon'
                  : 'bg-surface-elevated hover:bg-accent-neon/30'
                }
              `}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      {isPlaying && (
        <div className="mt-4 w-full h-1 bg-surface-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-neon to-accent-blue"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: autoPlayInterval / 1000, ease: "linear" }}
            key={currentIndex}
          />
        </div>
      )}
    </div>
  )
}