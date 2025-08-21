"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useAnimation, useMotionValue } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface CarouselItem {
  id: string
  title: string
  description: string
  image: string
  category?: string
  stats?: {
    label: string
    value: string
  }[]
}

interface ScrollXCarouselProps {
  items: CarouselItem[]
  className?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  showNavigation?: boolean
  itemWidth?: number
}

export function ScrollXCarousel({
  items,
  className = "",
  autoPlay = false,
  autoPlayInterval = 4000,
  showNavigation = true,
  itemWidth = 320,
}: ScrollXCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const controls = useAnimation()

  const maxScroll = -(items.length * itemWidth - (containerRef.current?.offsetWidth || 0))

  const updateScrollButtons = () => {
    const currentX = x.get()
    setCanScrollLeft(currentX < 0)
    setCanScrollRight(currentX > maxScroll)
  }

  const scrollTo = (index: number) => {
    const targetX = -index * itemWidth
    const clampedX = Math.max(maxScroll, Math.min(0, targetX))
    
    controls.start({ x: clampedX })
    x.set(clampedX)
    setCurrentIndex(index)
    updateScrollButtons()
  }

  const scrollLeft = () => {
    const newIndex = Math.max(0, currentIndex - 1)
    scrollTo(newIndex)
  }

  const scrollRight = () => {
    const maxIndex = Math.max(0, items.length - Math.floor((containerRef.current?.offsetWidth || 0) / itemWidth))
    const newIndex = Math.min(maxIndex, currentIndex + 1)
    scrollTo(newIndex)
  }

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isDragging) return

    const interval = setInterval(() => {
      const maxIndex = Math.max(0, items.length - Math.floor((containerRef.current?.offsetWidth || 0) / itemWidth))
      const nextIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1
      scrollTo(nextIndex)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, currentIndex, isDragging, autoPlayInterval])

  // Update scroll buttons on resize
  useEffect(() => {
    const handleResize = () => updateScrollButtons()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Navigation Buttons */}
      {showNavigation && (
        <>
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`
              absolute left-4 top-1/2 transform -translate-y-1/2 z-10
              p-3 rounded-full glass-elevated border border-glass-border-elevated
              transition-all duration-300
              ${canScrollLeft 
                ? 'hover:glow-neon text-text-primary hover:text-accent-neon' 
                : 'opacity-50 cursor-not-allowed text-text-muted'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`
              absolute right-4 top-1/2 transform -translate-y-1/2 z-10
              p-3 rounded-full glass-elevated border border-glass-border-elevated
              transition-all duration-300
              ${canScrollRight 
                ? 'hover:glow-neon text-text-primary hover:text-accent-neon' 
                : 'opacity-50 cursor-not-allowed text-text-muted'
              }
            `}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div 
        ref={containerRef}
        className="overflow-hidden rounded-2xl"
      >
        <motion.div
          className="flex gap-6 cursor-grab active:cursor-grabbing"
          style={{ x }}
          animate={controls}
          drag="x"
          dragConstraints={{
            left: maxScroll,
            right: 0,
          }}
          dragElastic={0.1}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => {
            setIsDragging(false)
            updateScrollButtons()
          }}
          onDrag={() => updateScrollButtons()}
        >
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="flex-shrink-0 group"
              style={{ width: itemWidth }}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card-premium h-full overflow-hidden group-hover:glow-neon transition-all duration-300">
                {/* Image */}
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes={`${itemWidth}px`}
                  />
                  
                  {/* Category Badge */}
                  {item.category && (
                    <div className="absolute top-4 left-4">
                      <div className="px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-xs font-medium text-white">
                        {item.category}
                      </div>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-accent-neon transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {/* Stats */}
                  {item.stats && (
                    <div className="flex items-center gap-4 pt-4 border-t border-glass-border">
                      {item.stats.map((stat, statIndex) => (
                        <div key={statIndex} className="text-center">
                          <div className="text-lg font-bold text-gradient-neon">
                            {stat.value}
                          </div>
                          <div className="text-xs text-text-muted">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: Math.ceil(items.length / Math.floor((containerRef.current?.offsetWidth || itemWidth) / itemWidth)) }).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${index === Math.floor(currentIndex / Math.floor((containerRef.current?.offsetWidth || itemWidth) / itemWidth))
                ? 'bg-gradient-to-r from-accent-neon to-accent-blue w-8'
                : 'bg-surface-elevated hover:bg-accent-neon/30'
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}