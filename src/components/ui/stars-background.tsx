"use client"

import { useEffect, useRef } from "react"

interface StarsBackgroundProps {
  starDensity?: number
  allStarsTwinkle?: boolean
  twinkleProbability?: number
  minTwinkleSpeed?: number
  maxTwinkleSpeed?: number
  className?: string
}

export function StarsBackground({
  starDensity = 0.00015,
  allStarsTwinkle = true,
  twinkleProbability = 0.7,
  minTwinkleSpeed = 0.5,
  maxTwinkleSpeed = 1,
  className = ""
}: StarsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const stars: Array<{
      x: number
      y: number
      radius: number
      opacity: number
      twinkleSpeed: number
      twinkleDirection: number
    }> = []

    const createStars = () => {
      const numStars = Math.floor(canvas.width * canvas.height * starDensity)
      stars.length = 0

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * (maxTwinkleSpeed - minTwinkleSpeed) + minTwinkleSpeed,
          twinkleDirection: Math.random() > 0.5 ? 1 : -1
        })
      }
    }

    const drawStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()

        if (allStarsTwinkle || Math.random() < twinkleProbability) {
          star.opacity += star.twinkleDirection * star.twinkleSpeed * 0.01
          if (star.opacity <= 0.2 || star.opacity >= 1) {
            star.twinkleDirection *= -1
          }
          star.opacity = Math.max(0.2, Math.min(1, star.opacity))
        }
      })
    }

    const animate = () => {
      drawStars()
      animationId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    createStars()
    animate()

    const handleResize = () => {
      resizeCanvas()
      createStars()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [starDensity, allStarsTwinkle, twinkleProbability, minTwinkleSpeed, maxTwinkleSpeed])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    />
  )
}