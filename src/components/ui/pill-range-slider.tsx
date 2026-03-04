'use client'

import { useRef } from 'react'

interface PillRangeSliderProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  /** Accent colour for filled pills. Default: #FFFF00 */
  color?: string
  /** Number of pill segments. Default: 40 */
  segments?: number
  /**
   * Pill height in px — acts as the single scale knob.
   * Gap between pills and border-radius scale proportionally.
   * Default: 22
   */
  pillHeight?: number
  className?: string
}

/**
 * PillRangeSlider
 * Segmented pill-style range input. Proportions (pill height : gap : radius)
 * are fixed — use `pillHeight` to scale up or down uniformly.
 */
export function PillRangeSlider({
  value,
  min,
  max,
  step,
  onChange,
  color = '#FFFF00',
  segments = 40,
  pillHeight = 22,
  className,
}: PillRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const pct = max === min ? 1 : (value - min) / (max - min)
  const filledCount = Math.max(0, Math.round(pct * segments))

  // Gap and radius scale with pillHeight to keep proportions identical at any size
  const gap = Math.round((pillHeight * 3) / 22)         // 3px at h=22
  const radius = pillHeight / 2                          // always rounded-full

  const update = (e: React.PointerEvent) => {
    const r = trackRef.current!.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    onChange(Math.round((min + p * (max - min)) / step) * step)
  }

  return (
    <div
      ref={trackRef}
      className={`flex items-center w-full cursor-pointer select-none${className ? ` ${className}` : ''}`}
      style={{ touchAction: 'none', height: pillHeight, gap }}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); update(e) }}
      onPointerMove={e => { if (e.buttons > 0) update(e) }}
    >
      {Array.from({ length: segments }, (_, i) => {
        const t = i / (segments - 1)
        const isFilled = i < filledCount
        const isEdge = isFilled && i === filledCount - 1
        return (
          <div
            key={i}
            className="flex-1"
            style={{
              height: pillHeight,
              borderRadius: radius,
              background: isFilled ? (isEdge ? '#ffffff' : color) : '#222222',
              opacity: isFilled && !isEdge ? 0.5 + t * 0.5 : 1,
            }}
          />
        )
      })}
    </div>
  )
}
