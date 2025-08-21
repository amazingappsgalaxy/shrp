"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

interface HighlightTextProps {
  children: React.ReactNode
  className?: string
  highlightClassName?: string
  delay?: number
}

export function HighlightText({ 
  children, 
  className = "", 
  highlightClassName = "bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600",
  delay = 0 
}: HighlightTextProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      <motion.span
        className="relative z-10"
        initial={{ opacity: 0.7 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay }}
      >
        {children}
      </motion.span>
      <motion.span
        className={`absolute inset-0 -z-10 ${highlightClassName} opacity-20 blur-lg`}
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
      />
      <motion.span
        className={`absolute inset-0 -z-10 ${highlightClassName} opacity-30`}
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.6, delay: delay + 0.4, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
      />
    </span>
  )
}

export function HighlightTextUnderline({ 
  children, 
  className = "", 
  underlineClassName = "bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600",
  delay = 0 
}: HighlightTextProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.div
        className={`absolute -bottom-2 left-0 right-0 h-1 ${underlineClassName} rounded-full`}
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
      />
    </span>
  )
}