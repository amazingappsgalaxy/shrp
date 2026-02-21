"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

interface ParallaxContainerProps {
  children: React.ReactNode
  className?: string
  speed?: number
  direction?: 'up' | 'down'
  offset?: NonNullable<Parameters<typeof useScroll>[0]>['offset']
}

export function ParallaxContainer({
  children,
  className = "",
  speed = 0.5,
  direction = 'up',
  offset = ["start end", "end start"],
}: ParallaxContainerProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  })

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' 
      ? [`${speed * 100}%`, `${-speed * 100}%`]
      : [`${-speed * 100}%`, `${speed * 100}%`]
  )

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{ y }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  )
}

interface ParallaxImageProps {
  src: string
  alt: string
  className?: string
  speed?: number
  direction?: 'up' | 'down'
  scale?: number
}

export function ParallaxImage({
  src,
  alt,
  className = "",
  speed = 0.3,
  direction = 'up',
  scale = 1.1,
}: ParallaxImageProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' 
      ? [`${speed * 100}%`, `${-speed * 100}%`]
      : [`${-speed * 100}%`, `${speed * 100}%`]
  )

  const scaleValue = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [scale, 1, scale]
  )

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover will-change-transform"
        style={{ 
          y,
          scale: scaleValue,
        }}
      />
    </div>
  )
}

interface ParallaxTextProps {
  children: React.ReactNode
  className?: string
  speed?: number
  direction?: 'up' | 'down'
  opacity?: boolean
}

export function ParallaxText({
  children,
  className = "",
  speed = 0.2,
  direction = 'up',
  opacity = false,
}: ParallaxTextProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' 
      ? [`${speed * 100}%`, `${-speed * 100}%`]
      : [`${-speed * 100}%`, `${speed * 100}%`]
  )

  const opacityValue = opacity 
    ? useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
    : 1

  return (
    <motion.div
      ref={ref}
      className={`will-change-transform ${className}`}
      style={{ 
        y,
        opacity: opacityValue,
      }}
    >
      {children}
    </motion.div>
  )
}

interface ParallaxSectionProps {
  children: React.ReactNode
  className?: string
  backgroundImage?: string
  speed?: number
  overlay?: boolean
  overlayOpacity?: number
}

export function ParallaxSection({
  children,
  className = "",
  backgroundImage,
  speed = 0.5,
  overlay = true,
  overlayOpacity = 0.6,
}: ParallaxSectionProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`${speed * 50}%`, `${-speed * 50}%`]
  )

  return (
    <section ref={ref} className={`relative overflow-hidden ${className}`}>
      {backgroundImage && (
        <>
          <motion.div
            className="absolute inset-0 w-full h-full"
            style={{ y }}
          >
            <div
              className="w-full h-[120%]"
              style={{ 
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
              }}
            />
          </motion.div>
          {overlay && (
            <div 
              className="absolute inset-0 bg-black"
              style={{ opacity: overlayOpacity }}
            />
          )}
        </>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  )
}

// Utility hook for creating custom parallax effects
export function useParallax(speed: number = 0.5, direction: 'up' | 'down' = 'up') {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' 
      ? [`${speed * 100}%`, `${-speed * 100}%`]
      : [`${-speed * 100}%`, `${speed * 100}%`]
  )

  return { ref, y, scrollYProgress }
}