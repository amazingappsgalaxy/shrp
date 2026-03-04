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
  /**
   * Number of pill segments. Default: 40.
   * Ignored when `autoWidth` is true — segments are derived from discrete steps.
   */
  segments?: number
  /**
   * Pill height in px — the single scale knob.
   * Gap and border-radius scale proportionally. Default: 22
   */
  pillHeight?: number
  /**
   * When true, one pill per discrete step value, each with a fixed proportional
   * width. The slider sizes itself to content (w-fit) instead of filling its
   * container. Use this for compact / inline sliders.
   */
  autoWidth?: boolean
  className?: string
}

export function PillRangeSlider({
  value,
  min,
  max,
  step,
  onChange,
  color = '#FFFF00',
  segments = 40,
  pillHeight = 22,
  autoWidth = false,
  className,
}: PillRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  // In autoWidth mode the number of pills = number of discrete steps
  const count = autoWidth ? Math.round((max - min) / step) + 1 : segments

  const pct = max === min ? 1 : (value - min) / (max - min)
  const filledCount = Math.max(0, Math.round(pct * count))

  // All three scale proportionally with pillHeight
  const gap    = Math.round((pillHeight * 3) / 22)   // 3 px at h=22
  const radius = pillHeight / 2                       // always full pill
  // Fixed pill width keeps the same aspect ratio as the full-width slider
  const pillWidth = Math.round(pillHeight * 0.3)      // ~6.6 px at h=22

  const update = (e: React.PointerEvent) => {
    const r = trackRef.current!.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    onChange(Math.round((min + p * (max - min)) / step) * step)
  }

  return (
    <div
      ref={trackRef}
      className={`flex items-center cursor-pointer select-none${autoWidth ? '' : ' w-full'}${className ? ` ${className}` : ''}`}
      style={{ touchAction: 'none', height: pillHeight, gap }}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); update(e) }}
      onPointerMove={e => { if (e.buttons > 0) update(e) }}
    >
      {Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1)
        const isFilled = i < filledCount
        const isEdge = isFilled && i === filledCount - 1
        return (
          <div
            key={i}
            style={{
              height: pillHeight,
              borderRadius: radius,
              background: isFilled ? (isEdge ? '#ffffff' : color) : '#222222',
              opacity: isFilled && !isEdge ? 0.5 + t * 0.5 : 1,
              ...(autoWidth ? { width: pillWidth, flexShrink: 0 } : { flex: 1 }),
            }}
          />
        )
      })}
    </div>
  )
}
