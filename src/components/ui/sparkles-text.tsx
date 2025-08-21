"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface SparklesTextProps {
  text: string
  className?: string
  sparkleColor?: string
  textColor?: string
}

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
  delay: number
}

export function SparklesText({ 
  text, 
  className = "", 
  sparkleColor = "hsl(180 100% 50%)",
  textColor = "transparent"
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  useEffect(() => {
    const generateSparkles = () => {
      const predefinedSparkles = [
        { id: 0, x: 15, y: 20, size: 3, delay: 0.2 },
        { id: 1, x: 85, y: 30, size: 4, delay: 0.8 },
        { id: 2, x: 25, y: 70, size: 2.5, delay: 1.2 },
        { id: 3, x: 75, y: 80, size: 3.5, delay: 0.5 },
        { id: 4, x: 45, y: 15, size: 4.5, delay: 1.5 },
        { id: 5, x: 65, y: 60, size: 2, delay: 0.3 },
        { id: 6, x: 35, y: 85, size: 3.8, delay: 1.8 },
        { id: 7, x: 55, y: 40, size: 2.8, delay: 0.7 }
      ]
      setSparkles(predefinedSparkles)
    }

    generateSparkles()
    const interval = setInterval(generateSparkles, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 1.5,
            delay: sparkle.delay,
            repeat: Infinity,
            repeatDelay: 1,
            ease: "easeInOut",
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, ${sparkleColor} 0%, transparent 70%)`,
              boxShadow: `0 0 ${sparkle.size * 2}px ${sparkleColor}`,
            }}
          />
        </motion.div>
      ))}

      {/* Text with gradient */}
      <motion.span
        className="relative z-10 bg-gradient-to-r from-accent-neon via-accent-blue to-accent-purple bg-clip-text text-transparent font-bold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {text}
      </motion.span>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-accent-neon via-accent-blue to-accent-purple opacity-20 blur-xl -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}