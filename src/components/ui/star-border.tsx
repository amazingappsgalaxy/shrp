"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface StarBorderProps {
  children: React.ReactNode
  className?: string
  speed?: number
  starColor?: string
  borderWidth?: number
}

export function StarBorder({ 
  children, 
  className = "",
  speed = 2,
  starColor = "hsl(180 100% 50%)",
  borderWidth = 2
}: StarBorderProps) {
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    const generateStars = () => {
      const newStars = []
      for (let i = 0; i < 12; i++) {
        newStars.push({
          id: i,
          x: (i / 12) * 100,
          y: 0,
          delay: i * 0.2
        })
      }
      setStars(newStars)
    }

    generateStars()
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Border Container */}
      <div 
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          padding: `${borderWidth}px`,
        }}
      >
        {/* Animated Border */}
        <div className="absolute inset-0 rounded-2xl">
          {/* Top Border */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-neon to-transparent">
            {stars.slice(0, 3).map((star) => (
              <motion.div
                key={`top-${star.id}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${starColor} 0%, transparent 70%)`,
                  boxShadow: `0 0 8px ${starColor}`,
                  left: `${star.x}%`,
                  top: "-4px",
                }}
                animate={{
                  x: ["0%", "100%", "0%"],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: speed,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          {/* Right Border */}
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-accent-blue to-transparent">
            {stars.slice(3, 6).map((star, index) => (
              <motion.div
                key={`right-${star.id}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${starColor} 0%, transparent 70%)`,
                  boxShadow: `0 0 8px ${starColor}`,
                  right: "-4px",
                  top: `${(index / 3) * 100}%`,
                }}
                animate={{
                  y: ["0%", "100%", "0%"],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: speed,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          {/* Bottom Border */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-purple to-transparent">
            {stars.slice(6, 9).map((star) => (
              <motion.div
                key={`bottom-${star.id}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${starColor} 0%, transparent 70%)`,
                  boxShadow: `0 0 8px ${starColor}`,
                  left: `${100 - star.x}%`,
                  bottom: "-4px",
                }}
                animate={{
                  x: ["0%", "-100%", "0%"],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: speed,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          {/* Left Border */}
          <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-accent-pink to-transparent">
            {stars.slice(9, 12).map((star, index) => (
              <motion.div
                key={`left-${star.id}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${starColor} 0%, transparent 70%)`,
                  boxShadow: `0 0 8px ${starColor}`,
                  left: "-4px",
                  top: `${100 - (index / 3) * 100}%`,
                }}
                animate={{
                  y: ["0%", "-100%", "0%"],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: speed,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>
        </div>

        {/* Corner Stars */}
        {[
          { position: "top-left", x: "-6px", y: "-6px" },
          { position: "top-right", x: "calc(100% - 6px)", y: "-6px" },
          { position: "bottom-right", x: "calc(100% - 6px)", y: "calc(100% - 6px)" },
          { position: "bottom-left", x: "-6px", y: "calc(100% - 6px)" },
        ].map((corner, index) => (
          <motion.div
            key={corner.position}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: `radial-gradient(circle, ${starColor} 0%, transparent 70%)`,
              boxShadow: `0 0 12px ${starColor}`,
              left: corner.x,
              top: corner.y,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: speed * 1.5,
              delay: index * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 glass rounded-2xl border border-glass-border">
        {children}
      </div>

      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-50 blur-xl -z-10"
        style={{
          background: `linear-gradient(45deg, ${starColor}20, transparent, ${starColor}20)`,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: speed * 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}