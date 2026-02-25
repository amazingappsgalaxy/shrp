"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface GenerationAnimationProps {
  /** Additional classes for the wrapping div (must be positioned relative/absolute parent) */
  className?: string
  /** Label shown at the bottom. Defaults to "Generating" */
  label?: string
  /** Whether to show the label text. Defaults to true */
  showLabel?: boolean
  /** Size variant for the pulsing dot / label. Defaults to "md" */
  size?: "sm" | "md" | "lg"
}

/**
 * GenerationAnimation — the animated processing gradient used whenever
 * the app is generating / processing an image.
 *
 * Usage:
 *   <div className="relative w-full aspect-square rounded-xl overflow-hidden">
 *     <GenerationAnimation />
 *   </div>
 *
 * The parent MUST have `relative` / `absolute` positioning and `overflow-hidden`.
 * The component fills its parent with `absolute inset-0`.
 */
export function GenerationAnimation({
  className,
  label = "Generating",
  showLabel = true,
  size = "md",
}: GenerationAnimationProps) {
  const [params, setParams] = useState({
    seed: 0,
    d1: 0,
    d2: 0,
    noiseX: 0,
    noiseY: 0,
    scale: 1,
  })

  useEffect(() => {
    setParams({
      seed: Math.floor(Math.random() * 1000),
      d1: Math.random() * -20,
      d2: Math.random() * -20,
      noiseX: Math.floor(Math.random() * 200),
      noiseY: Math.floor(Math.random() * 200),
      scale: 1 + Math.random() * 0.2,
    })
  }, [])

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.25' numOctaves='2' stitchTiles='stitch' seed='${params.seed}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

  const dotSize = size === "sm" ? "w-1 h-1" : size === "lg" ? "w-2 h-2" : "w-1.5 h-1.5"
  const textSize = size === "sm" ? "text-[9px]" : size === "lg" ? "text-xs" : "text-[10px]"
  const padding = size === "sm" ? "bottom-2 left-2" : size === "lg" ? "bottom-4 left-4" : "bottom-3 left-3"

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-[#1a1a1c]", className)}>
      {/* Rotating conic gradients */}
      <div className="absolute inset-0">
        <div
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,#ffffff_45deg,transparent_90deg)] opacity-60 blur-[40px]"
          style={{ animationDelay: `${params.d1}s` }}
        />
        <div
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_10s_linear_infinite_reverse] bg-[conic-gradient(from_180deg,transparent_0deg,#d4d4d8_60deg,transparent_120deg)] opacity-40 blur-[50px]"
          style={{ animationDelay: `${params.d2}s` }}
        />
      </div>

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.38] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: noiseSvg,
          backgroundSize: "150px 150px",
          backgroundPosition: `${params.noiseX}px ${params.noiseY}px`,
          transform: `scale(${params.scale})`,
        }}
      />

      {/* Bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Label */}
      {showLabel && (
        <div className={cn("absolute z-10 flex items-center gap-1.5", padding)}>
          <div className={cn("rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]", dotSize)} />
          <span className={cn("font-medium text-white/90 tracking-widest uppercase drop-shadow", textSize)}>
            {label}
          </span>
        </div>
      )}
    </div>
  )
}
