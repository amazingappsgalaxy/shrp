"use client"

import { useEffect, useRef } from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"

interface ScrollFadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
}

export function ScrollFadeIn({
  children,
  className = "",
  delay = 0,
  direction = 'up',
  distance = 50,
}: ScrollFadeInProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...directionMap[direction],
      }}
      animate={isInView ? {
        opacity: 1,
        x: 0,
        y: 0,
      } : {}}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  )
}

interface ScrollScaleInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  scale?: number
}

export function ScrollScaleIn({
  children,
  className = "",
  delay = 0,
  scale = 0.8,
}: ScrollScaleInProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        scale,
      }}
      animate={isInView ? {
        opacity: 1,
        scale: 1,
      } : {}}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.68, -0.55, 0.265, 1.55], // Spring easing
      }}
    >
      {children}
    </motion.div>
  )
}

interface ScrollStaggerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  childDelay?: number
}

export function ScrollStagger({
  children,
  className = "",
  staggerDelay = 0.1,
  childDelay = 0.2,
}: ScrollStaggerProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: childDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function ScrollStaggerChild({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {
          opacity: 0,
          y: 30,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

interface ScrollProgressProps {
  children: React.ReactNode
  className?: string
}

export function ScrollProgress({
  children,
  className = "",
}: ScrollProgressProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8])

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        opacity,
        scale,
      }}
    >
      {children}
    </motion.div>
  )
}

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  width?: boolean
  height?: boolean
}

export function ScrollReveal({
  children,
  className = "",
  width = false,
  height = true,
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className={`overflow-hidden ${className}`}
      initial={{
        ...(width && { width: 0 }),
        ...(height && { height: 0 }),
      }}
      animate={isInView ? {
        ...(width && { width: "auto" }),
        ...(height && { height: "auto" }),
      } : {}}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          ...(width && { x: -50 }),
          ...(height && { y: 50 }),
        }}
        animate={isInView ? {
          opacity: 1,
          x: 0,
          y: 0,
        } : {}}
        transition={{
          duration: 0.6,
          delay: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// Hook for scroll-based value transformations
export function useScrollTransform(
  inputRange: number[],
  outputRange: number[] | string[]
) {
  const { scrollY } = useScroll()
  return useTransform(scrollY, inputRange, outputRange)
}

// Hook for element-based scroll progress
export function useElementScrollProgress(offset: string[] = ["start end", "end start"]) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  })
  
  return { ref, scrollYProgress }
}