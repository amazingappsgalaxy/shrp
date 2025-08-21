"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import Image from "next/image"

interface LogoAnimationProps {
  src?: string
  alt?: string
  width?: number
  height?: number
  className?: string
  animated?: boolean
  glowEffect?: boolean
}

export function LogoAnimation({
  src = "/logo.svg",
  alt = "Sharpii.ai Logo",
  width = 120,
  height = 40,
  className = "",
  animated = true,
  glowEffect = true
}: LogoAnimationProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Simulate logo load
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const logoVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      filter: "blur(10px)"
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 1.2,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.2
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  const glowVariants = {
    animate: {
      filter: [
        "drop-shadow(0 0 10px hsl(199 100% 50% / 0.3))",
        "drop-shadow(0 0 20px hsl(199 100% 50% / 0.6))",
        "drop-shadow(0 0 10px hsl(199 100% 50% / 0.3))"
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const sparkleVariants = {
    animate: {
      opacity: [0, 1, 0],
      scale: [0.5, 1.2, 0.5],
      rotate: [0, 180, 360],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        staggerChildren: 0.2
      }
    }
  }

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      variants={logoVariants}
      initial={animated ? "initial" : false}
      animate={animated && isLoaded ? "animate" : false}
      whileHover={animated ? "hover" : undefined}
    >
      {/* Main Logo */}
      <motion.div
        className="relative z-10"
        variants={glowEffect ? glowVariants : undefined}
        animate={glowEffect && animated ? "animate" : undefined}
      >
        {src.endsWith('.svg') ? (
          <div 
            className="relative"
            style={{ width, height }}
          >
            {/* Custom SVG Logo */}
            <svg
              width={width}
              height={height}
              viewBox="0 0 120 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              {/* Background Shape */}
              <motion.rect
                x="2"
                y="2"
                width="116"
                height="36"
                rx="18"
                fill="url(#logoGradient)"
                stroke="url(#logoBorder)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
              
              {/* Text */}
              <motion.text
                x="20"
                y="26"
                fill="white"
                fontSize="14"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                Sharpii.ai
              </motion.text>
              
              {/* AI Accent */}
              <motion.circle
                cx="100"
                cy="20"
                r="3"
                fill="hsl(180 100% 50%)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              />
              
              {/* Gradient Definitions */}
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(199 100% 50%)" />
                  <stop offset="50%" stopColor="hsl(258 90% 66%)" />
                  <stop offset="100%" stopColor="hsl(180 100% 50%)" />
                </linearGradient>
                <linearGradient id="logoBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(199 100% 50% / 0.5)" />
                  <stop offset="100%" stopColor="hsl(180 100% 50% / 0.5)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="object-contain"
            priority
          />
        )}
      </motion.div>

      {/* Sparkle Effects */}
      {animated && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-accent-neon rounded-full"
              style={{
                left: `${20 + i * 25}%`,
                top: `${15 + (i % 2) * 70}%`,
              }}
              variants={sparkleVariants}
              animate="animate"
              transition={{
                delay: i * 0.3,
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Subtle Pulse Ring */}
      {animated && glowEffect && (
        <motion.div
          className="absolute inset-0 rounded-full border border-accent-neon/30 -z-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      )}

      {/* Loading State */}
      {!isLoaded && animated && (
        <motion.div
          className="absolute inset-0 bg-surface rounded-lg animate-pulse"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        />
      )}
    </motion.div>
  )
}

// Preset configurations
export const LOGO_PRESETS = {
  header: {
    width: 120,
    height: 40,
    animated: true,
    glowEffect: false
  },
  hero: {
    width: 200,
    height: 60,
    animated: true,
    glowEffect: true
  },
  footer: {
    width: 100,
    height: 32,
    animated: false,
    glowEffect: false
  },
  loading: {
    width: 150,
    height: 50,
    animated: true,
    glowEffect: true
  }
}