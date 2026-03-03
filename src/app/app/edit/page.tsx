'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { CreditIcon } from '@/components/ui/CreditIcon'
import { MODEL_REGISTRY } from '@/services/models'
import { cn } from '@/lib/utils'
import {
  IconUpload, IconTrash, IconPlus, IconWand, IconEraser,
  IconBrush, IconLoader2, IconDownload, IconX, IconPhoto,
  IconTypography, IconSquare, IconSparkles, IconRefresh,
  IconChevronDown, IconChevronUp,
} from '@tabler/icons-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'edit' | 'relight' | 'prompt'
type Tool = 'brush' | 'eraser' | 'rect' | 'text'

interface MaskLayer {
  id: string
  color: string
  colorName: string
  prompt: string
  referenceImageUrl: string | null
  centroid: { x: number; y: number } | null  // canvas-pixel space
  cardOffset: { x: number; y: number }        // user-dragged offset (CSS px)
}

interface TextAnnotation {
  id: string
  text: string
  x: number; y: number   // canvas-pixel
  color: string
  fontSize: number
}

interface RectAnnotation {
  id: string
  x: number; y: number; w: number; h: number  // canvas-pixel
  color: string
}

interface LightSettings {
  azimuth: number       // 0–360
  elevation: number     // -90–90
  color: string
  intensity: number     // 0–100
  softness: 'hard' | 'soft'
  sceneLock: boolean
}

interface GenerationResult {
  id: string
  url: string
  mode: Mode
  timestamp: number
  inputUrl: string
  prompt: string
}

interface Point { x: number; y: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const LAYER_COLORS = [
  { hex: '#FF4B4B', rgb: '255,75,75',   name: 'red'    },
  { hex: '#4B8BFF', rgb: '75,139,255',  name: 'blue'   },
  { hex: '#4BFF8B', rgb: '75,255,139',  name: 'green'  },
  { hex: '#FFD700', rgb: '255,215,0',   name: 'gold'   },
  { hex: '#FF4BFF', rgb: '255,75,255',  name: 'pink'   },
  { hex: '#4BEEFF', rgb: '75,238,255',  name: 'cyan'   },
]

const EDIT_MODELS = ['nano-banana-2', 'nano-banana-2-2k', 'nano-banana-pro', 'nano-banana-2-4k']

const RELIGHT_PRESETS = [
  { name: 'Front',   az: 0,   el: 25 },
  { name: 'Front-R', az: 45,  el: 45 },
  { name: 'Right',   az: 90,  el: 20 },
  { name: 'Back-R',  az: 135, el: 35 },
  { name: 'Back',    az: 180, el: 25 },
  { name: 'Left',    az: 270, el: 20 },
  { name: 'Top',     az: 0,   el: 85 },
  { name: 'Uplight', az: 0,   el: -35 },
]

const LIGHT_COLOR_PRESETS = [
  '#ffffff', '#ffe8d0', '#d0e8ff', '#48dbb6',
  '#00ff88', '#ff4444', '#ff44ff', '#ffcc00',
]

const LIGHTING_STYLES = [
  { id: 'natural',   name: 'Natural',   color: '#ffe8d0', az: 45,  el: 35, intensity: 65, softness: 'soft'  as const },
  { id: 'studio',    name: 'Studio',    color: '#ffffff', az: 0,   el: 45, intensity: 88, softness: 'soft'  as const },
  { id: 'cinematic', name: 'Cinematic', color: '#ffd080', az: 135, el: 20, intensity: 90, softness: 'hard'  as const },
  { id: 'sunlight',  name: 'Sunlight',  color: '#ffe44d', az: 90,  el: 62, intensity: 95, softness: 'hard'  as const },
  { id: 'golden',    name: 'Golden Hr', color: '#ff9500', az: 270, el: 5,  intensity: 75, softness: 'soft'  as const },
  { id: 'neon',      name: 'Neon',      color: '#00ffcc', az: 180, el: 25, intensity: 70, softness: 'hard'  as const },
  { id: 'rim',       name: 'Rim Light', color: '#d0f0ff', az: 180, el: 10, intensity: 80, softness: 'hard'  as const },
  { id: 'overhead',  name: 'Overhead',  color: '#ffffff', az: 0,   el: 85, intensity: 80, softness: 'soft'  as const },
  { id: 'glare',     name: 'Glare',     color: '#ffffff', az: 0,   el: 25, intensity: 100, softness: 'hard' as const },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

function computeDisplaySize(nw: number, nh: number): { w: number; h: number } {
  const maxW = Math.min(window.innerWidth - 360, 860)  // reserve for inline left panel + gaps
  const maxH = Math.min(window.innerHeight - 210, 700)
  let w = nw, h = nh
  if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
  if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
  return { w, h }
}

function computeLayerCentroid(canvas: HTMLCanvasElement): { x: number; y: number } | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let sx = 0, sy = 0, n = 0
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if ((data[(y * canvas.width + x) * 4 + 3] ?? 0) > 64) { sx += x; sy += y; n++ }
    }
  }
  return n ? { x: sx / n, y: sy / n } : null
}

function azToDesc(az: number) {
  const n = ((az % 360) + 360) % 360
  if (n < 22.5 || n >= 337.5) return 'the front'
  if (n < 67.5)  return 'the front-right'
  if (n < 112.5) return 'the right'
  if (n < 157.5) return 'the back-right'
  if (n < 202.5) return 'the back'
  if (n < 247.5) return 'the back-left'
  if (n < 292.5) return 'the left'
  return 'the front-left'
}

function elToDesc(el: number) {
  if (el > 60)  return 'overhead, directly above'
  if (el > 35)  return 'high-angle from above'
  if (el > 10)  return 'moderate angle'
  if (el > -10) return 'eye-level'
  if (el > -35) return 'low-angle'
  return 'uplighting from below'
}

function generateRelightPrompt(s: LightSettings) {
  const lock = s.sceneLock
    ? 'SCENE LOCK, FIXED VIEWPOINT, maintaining character consistency and pose. RELIGHTING ONLY: '
    : 'Relight: '
  const bright = s.intensity > 70 ? 'bright' : s.intensity > 40 ? 'medium' : 'subtle'
  return `${lock}${bright} ${s.softness} light source from ${azToDesc(s.azimuth)}, ${elToDesc(s.elevation)}, light color ${s.color}, cinematic relighting`
}

// ─── RelightSphere ────────────────────────────────────────────────────────────
// A CSS-based sphere with a dynamic highlight that you drag to position the light

function RelightSphere({
  azimuth, elevation, lightColor, intensity,
  onAzimuthChange, onElevationChange,
  size = 200,
}: {
  azimuth: number; elevation: number; lightColor: string; intensity: number
  onAzimuthChange: (v: number) => void
  onElevationChange: (v: number) => void
  size?: number
}) {
  const dragging = useRef(false)
  const startRef = useRef({ x: 0, y: 0, az: 0, el: 0 })

  // Highlight position on sphere surface (% within the circle)
  const hx = 50 + Math.sin(azimuth * Math.PI / 180) * 32
  const hy = 50 - Math.sin(elevation * Math.PI / 180) * 32
  const bri = 0.35 + (intensity / 100) * 0.65

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    startRef.current = { x: e.clientX, y: e.clientY, az: azimuth, el: elevation }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    onAzimuthChange(Math.round(((startRef.current.az + dx * 1.1) % 360 + 360) % 360))
    onElevationChange(Math.round(Math.max(-85, Math.min(85, startRef.current.el - dy * 0.7))))
  }
  const onPointerUp = () => { dragging.current = false }

  return (
    <div
      style={{ width: size, height: size, position: 'relative', borderRadius: '50%', cursor: 'grab', touchAction: 'none', userSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Base sphere – deep dark globe */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 42% 38%, #1e1e2a 0%, #080810 70%)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.95)',
      }} />

      {/* Dynamic light hit */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `radial-gradient(circle at ${hx}% ${hy}%, ${lightColor} 0%, ${lightColor}99 18%, ${lightColor}33 38%, transparent 58%)`,
        opacity: bri,
        transition: 'background 0.05s',
      }} />

      {/* Ambient glow fill */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `radial-gradient(circle at ${100 - hx}% ${100 - hy}%, rgba(255,255,255,0.04) 0%, transparent 50%)`,
      }} />

      {/* Specular rim on surface edge */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.1) 0%, transparent 35%)',
      }} />

      {/* Outer glow */}
      <div style={{
        position: 'absolute', inset: -8, borderRadius: '50%',
        boxShadow: `0 0 ${Math.round(50 * bri)}px ${lightColor}${Math.round(bri * 60).toString(16).padStart(2, '0')}`,
        pointerEvents: 'none',
      }} />

      {/* Light indicator dot */}
      <div style={{
        position: 'absolute',
        width: 10, height: 10,
        borderRadius: '50%',
        background: lightColor,
        left: `calc(${hx}% - 5px)`,
        top: `calc(${hy}% - 5px)`,
        boxShadow: `0 0 10px ${lightColor}, 0 0 4px white`,
        pointerEvents: 'none',
        transition: 'left 0.04s, top 0.04s',
      }} />

      {/* Direction labels */}
      {[
        { l: 'F', x: '50%', y: 6 },
        { l: 'B', x: '50%', y: size - 18 },
        { l: 'L', x: 6,     y: '50%' },
        { l: 'R', x: size - 14, y: '50%' },
      ].map(({ l, x, y }) => (
        <span key={l} style={{
          position: 'absolute',
          left: typeof x === 'number' ? x : undefined,
          top: typeof y === 'number' ? y : undefined,
          right: undefined,
          transform: typeof x === 'string' ? 'translateX(-50%)' : typeof y === 'string' ? 'translateY(-50%)' : undefined,
          fontSize: 10, fontWeight: 900,
          color: 'rgba(255,255,255,0.22)',
          pointerEvents: 'none',
          lineHeight: 1,
        }}>{l}</span>
      ))}

      {/* Drag hint text */}
      <div style={{
        position: 'absolute', bottom: '14%', left: 0, right: 0,
        textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)',
        pointerEvents: 'none', fontWeight: 700, letterSpacing: 1,
      }}>DRAG TO MOVE LIGHT</div>
    </div>
  )
}

// ─── ModelDropdown ─────────────────────────────────────────────────────────────

function ModelDropdown({ selectedModel, onSelect }: { selectedModel: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const m = MODEL_REGISTRY[selectedModel]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0c0c0e] border border-white/[0.06] shadow-lg hover:border-white/12 transition-all"
      >
        <IconSparkles className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs font-black text-gray-300 uppercase tracking-wide">
          {m?.label ?? 'Model'}{m?.qualityTier ? ` · ${m.qualityTier}` : ''}
        </span>
        <IconChevronDown className={cn('w-3 h-3 text-gray-500 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-[220px] bg-[#0c0c0e] border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden z-50">
          {EDIT_MODELS.map(id => {
            const mod = MODEL_REGISTRY[id]
            if (!mod) return null
            return (
              <button
                key={id}
                onClick={() => { onSelect(id); setOpen(false) }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-all',
                  selectedModel === id
                    ? 'bg-white/[0.06] text-[#FFFF00]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <span>{mod.label}{mod.qualityTier ? ` · ${mod.qualityTier}` : ''}</span>
                <div className={cn('flex items-center gap-1', selectedModel === id ? 'text-[#FFFF00]' : 'text-gray-500')}>
                  <CreditIcon className="w-3 h-3" />
                  <span>{mod.credits}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── FloatingMaskCard ─────────────────────────────────────────────────────────
// Contextual card that floats near the drawn mask centroid

function FloatingMaskCard({
  layer, scaleX, scaleY, canvasW, canvasH, isActive,
  onSelect, onUpdatePrompt, onAttachRef, onClearStrokes, onDelete, onCardDrag,
}: {
  layer: MaskLayer
  scaleX: number; scaleY: number
  canvasW: number; canvasH: number
  isActive: boolean
  onSelect: () => void
  onUpdatePrompt: (p: string) => void
  onAttachRef: (url: string) => void
  onClearStrokes: () => void
  onDelete: () => void
  onCardDrag: (dx: number, dy: number) => void
}) {
  const dragRef = useRef({ startX: 0, startY: 0, active: false })

  // Use centroid or default to canvas center
  const baseCentroidCss = layer.centroid
    ? { x: layer.centroid.x * scaleX, y: layer.centroid.y * scaleY }
    : { x: canvasW * 0.5, y: canvasH * 0.5 }

  const cardX = baseCentroidCss.x + 18 + layer.cardOffset.x
  const cardY = baseCentroidCss.y - 50 + layer.cardOffset.y

  return (
    <>
      {/* SVG connector line */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={canvasW} height={canvasH}
        style={{ overflow: 'visible' }}
      >
        <line
          x1={baseCentroidCss.x} y1={baseCentroidCss.y}
          x2={cardX + 6} y2={cardY + 24}
          stroke={layer.color}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          opacity={0.45}
        />
        <circle cx={baseCentroidCss.x} cy={baseCentroidCss.y} r={5} fill={layer.color} opacity={0.5} />
      </svg>

      {/* The card */}
      <div
        className={cn(
          'absolute w-[230px] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] border transition-all duration-200',
          isActive ? 'border-[#FFFF00]/25' : 'border-white/[0.06]'
        )}
        style={{
          left: cardX,
          top: cardY,
          background: '#0c0c0e',
          zIndex: isActive ? 20 : 10,
        }}
        onClick={onSelect}
      >
        {/* Drag handle / header */}
        <div
          className="flex items-center justify-between px-3 pt-3 pb-1.5 cursor-grab active:cursor-grabbing"
          onPointerDown={e => {
            dragRef.current = { startX: e.clientX, startY: e.clientY, active: true }
            e.currentTarget.setPointerCapture(e.pointerId)
            e.stopPropagation()
          }}
          onPointerMove={e => {
            if (!dragRef.current.active) return
            onCardDrag(e.clientX - dragRef.current.startX, e.clientY - dragRef.current.startY)
            dragRef.current.startX = e.clientX
            dragRef.current.startY = e.clientY
          }}
          onPointerUp={() => { dragRef.current.active = false }}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full ring-1 ring-white/10 flex-shrink-0" style={{ background: layer.color }} />
            <span className="text-[11px] font-black uppercase tracking-wider text-white capitalize">{layer.colorName}</span>
            {isActive && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider bg-white/[0.09] text-[#FFFF00]">
                active
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={e => { e.stopPropagation(); onClearStrokes() }}
              className="px-2 py-0.5 text-[10px] font-bold text-gray-500 hover:text-white transition-colors rounded hover:bg-white/5"
            >clear</button>
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              className="p-1 text-gray-500 hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Prompt textarea */}
        <div className="px-3 pb-2">
          <textarea
            value={layer.prompt}
            onChange={e => onUpdatePrompt(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder={`What to change in the ${layer.colorName} area…`}
            className="w-full bg-transparent text-[12px] text-white placeholder:text-white/25 resize-none outline-none leading-relaxed"
            style={{ minHeight: 48 }}
            rows={2}
          />
        </div>

        {/* Reference image */}
        <div className="px-3 pb-2.5 border-t border-white/5 pt-2">
          {layer.referenceImageUrl ? (
            <div className="flex items-center gap-2">
              <img src={layer.referenceImageUrl} alt="" className="w-7 h-7 rounded-lg object-cover border border-white/10 flex-shrink-0" />
              <span className="text-[10px] text-gray-400 flex-1">Reference attached</span>
              <button onClick={e => { e.stopPropagation(); onAttachRef('') }} className="text-gray-500 hover:text-red-400 transition-colors">
                <IconX className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-500 hover:text-white transition-colors" onClick={e => e.stopPropagation()}>
              <IconPhoto className="w-3.5 h-3.5" />
              Attach reference image
              <input type="file" accept="image/*" className="hidden" onChange={async e => {
                const file = e.target.files?.[0]; if (!file) return
                const fd = new FormData(); fd.append('file', file)
                try {
                  const r = await fetch('/api/images/upload', { method: 'POST', body: fd })
                  const d = await r.json()
                  onAttachRef(d.image?.url ?? URL.createObjectURL(file))
                } catch { onAttachRef(URL.createObjectURL(file)) }
              }} />
            </label>
          )}
        </div>
      </div>
    </>
  )
}

// ─── MovableTextAnnotation ────────────────────────────────────────────────────

function MovableTextAnnotation({
  ann, scaleX, scaleY, isSelected, isEditing, editValue,
  onSelect, onMove, onDelete, onStartEdit, onCommitEdit, onEditChange,
}: {
  ann: TextAnnotation
  scaleX: number; scaleY: number
  isSelected: boolean
  isEditing: boolean
  editValue: string
  onSelect: (e: React.PointerEvent) => void
  onMove: (dx: number, dy: number) => void
  onDelete: () => void
  onStartEdit: () => void
  onCommitEdit: (text: string) => void
  onEditChange: (v: string) => void
}) {
  const dragRef = useRef({ x: 0, y: 0, active: false })
  const fs = ann.fontSize * scaleY

  return (
    <div
      style={{
        position: 'absolute',
        left: ann.x * scaleX,
        top: (ann.y - ann.fontSize) * scaleY,
        pointerEvents: 'auto',
        cursor: isSelected ? 'move' : 'default',
        userSelect: 'none',
        zIndex: isSelected ? 25 : 15,
      }}
      onPointerDown={e => {
        if (isEditing) return
        e.stopPropagation()
        onSelect(e)
        dragRef.current = { x: e.clientX, y: e.clientY, active: true }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={e => {
        if (!dragRef.current.active || isEditing) return
        onMove((e.clientX - dragRef.current.x) / scaleX, (e.clientY - dragRef.current.y) / scaleY)
        dragRef.current.x = e.clientX
        dragRef.current.y = e.clientY
      }}
      onPointerUp={() => { dragRef.current.active = false }}
      onDoubleClick={e => { e.stopPropagation(); onStartEdit() }}
    >
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={e => onEditChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onCommitEdit(editValue)
            if (e.key === 'Escape') onCommitEdit(ann.text)
          }}
          onBlur={() => onCommitEdit(editValue)}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'rgba(0,0,0,0.7)',
            border: `1px solid ${ann.color}`,
            borderRadius: 6,
            outline: 'none',
            color: ann.color,
            fontSize: fs,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            padding: '2px 6px',
            minWidth: 80,
            lineHeight: 1.2,
          }}
        />
      ) : (
        <span style={{
          display: 'block',
          color: ann.color,
          fontSize: fs,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          textShadow: '0 1px 6px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.7)',
          lineHeight: 1.2,
          padding: '3px 6px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          outline: isSelected ? `1.5px solid ${ann.color}` : 'none',
          outlineOffset: 3,
          background: isSelected ? 'rgba(0,0,0,0.35)' : 'transparent',
        }}>
          {ann.text}
        </span>
      )}

      {/* Controls when selected */}
      {isSelected && !isEditing && (
        <div style={{
          position: 'absolute',
          top: -26,
          left: 0,
          display: 'flex',
          gap: 3,
          alignItems: 'center',
          pointerEvents: 'auto',
        }}>
          <button
            onPointerDown={e => { e.stopPropagation(); onStartEdit() }}
            style={{
              background: 'rgba(20,20,30,0.9)', border: `1px solid ${ann.color}55`,
              borderRadius: 5, padding: '2px 7px', color: ann.color,
              fontSize: 9, fontWeight: 700, cursor: 'pointer', letterSpacing: 1,
            }}
          >EDIT</button>
          <button
            onPointerDown={e => { e.stopPropagation(); onDelete() }}
            style={{
              background: 'rgba(180,30,30,0.85)', border: '1px solid rgba(255,100,100,0.3)',
              borderRadius: 5, padding: '2px 7px', color: 'white',
              fontSize: 9, fontWeight: 700, cursor: 'pointer',
            }}
          >✕</button>
        </div>
      )}
    </div>
  )
}

// ─── MovableRectAnnotation ────────────────────────────────────────────────────

const ANNOT_HANDLES = [
  { id: 'nw', cx: 0, cy: 0 }, { id: 'n', cx: 0.5, cy: 0 }, { id: 'ne', cx: 1, cy: 0 },
  { id: 'w', cx: 0, cy: 0.5 },                               { id: 'e', cx: 1, cy: 0.5 },
  { id: 'sw', cx: 0, cy: 1 }, { id: 's', cx: 0.5, cy: 1 },  { id: 'se', cx: 1, cy: 1 },
]

const HANDLE_CURSOR: Record<string, string> = {
  nw: 'nw-resize', n: 'ns-resize', ne: 'ne-resize',
  w: 'ew-resize', e: 'ew-resize',
  sw: 'sw-resize', s: 'ns-resize', se: 'se-resize',
}

function MovableRectAnnotation({
  ann, scaleX, scaleY, isSelected,
  onSelect, onMove, onResize, onDelete,
}: {
  ann: RectAnnotation
  scaleX: number; scaleY: number
  isSelected: boolean
  onSelect: (e: React.PointerEvent) => void
  onMove: (dx: number, dy: number) => void
  onResize: (dx: number, dy: number, handleId: string) => void
  onDelete: () => void
}) {
  const bodyDragRef = useRef({ x: 0, y: 0, active: false })
  const resizeDragRef = useRef({ x: 0, y: 0, active: false, handle: '' })

  return (
    <div
      style={{
        position: 'absolute',
        left: ann.x * scaleX,
        top: ann.y * scaleY,
        width: Math.abs(ann.w) * scaleX,
        height: Math.abs(ann.h) * scaleY,
        border: `2px dashed ${ann.color}`,
        background: ann.color + '18',
        borderRadius: 3,
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        cursor: isSelected ? 'move' : 'default',
        outline: isSelected ? `2px solid ${ann.color}55` : 'none',
        outlineOffset: 2,
        zIndex: isSelected ? 25 : 15,
      }}
      onPointerDown={e => {
        e.stopPropagation()
        onSelect(e)
        bodyDragRef.current = { x: e.clientX, y: e.clientY, active: true }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={e => {
        if (!bodyDragRef.current.active) return
        onMove((e.clientX - bodyDragRef.current.x) / scaleX, (e.clientY - bodyDragRef.current.y) / scaleY)
        bodyDragRef.current.x = e.clientX
        bodyDragRef.current.y = e.clientY
      }}
      onPointerUp={() => { bodyDragRef.current.active = false }}
    >
      {/* Delete chip */}
      {isSelected && (
        <div style={{ position: 'absolute', top: -26, right: 0 }}>
          <button
            onPointerDown={e => { e.stopPropagation(); onDelete() }}
            style={{
              background: 'rgba(180,30,30,0.9)', border: '1px solid rgba(255,100,100,0.3)',
              borderRadius: 5, padding: '2px 8px', color: 'white',
              fontSize: 9, fontWeight: 700, cursor: 'pointer',
            }}
          >✕ Delete</button>
        </div>
      )}

      {/* Resize handles */}
      {isSelected && ANNOT_HANDLES.map(h => (
        <div
          key={h.id}
          style={{
            position: 'absolute',
            width: 10, height: 10,
            borderRadius: 2,
            background: '#FFFF00',
            border: '1.5px solid rgba(0,0,0,0.7)',
            left: `calc(${h.cx * 100}% - 5px)`,
            top: `calc(${h.cy * 100}% - 5px)`,
            cursor: HANDLE_CURSOR[h.id] ?? 'default',
            zIndex: 2,
            boxShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
          onPointerDown={e => {
            e.stopPropagation()
            resizeDragRef.current = { x: e.clientX, y: e.clientY, active: true, handle: h.id }
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={e => {
            if (!resizeDragRef.current.active) return
            onResize(
              (e.clientX - resizeDragRef.current.x) / scaleX,
              (e.clientY - resizeDragRef.current.y) / scaleY,
              resizeDragRef.current.handle
            )
            resizeDragRef.current.x = e.clientX
            resizeDragRef.current.y = e.clientY
          }}
          onPointerUp={() => { resizeDragRef.current.active = false }}
        />
      ))}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EditPage() {
  useAuth()

  // ── Image state
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null)

  // ── Mode + Tool
  const [mode, setMode] = useState<Mode>('edit')
  const [activeTool, setActiveTool] = useState<Tool>('brush')
  const [brushSize, setBrushSize] = useState(28)

  // ── Layers
  const [layers, setLayers] = useState<MaskLayer[]>([])
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map())
  const nextColorIdx = useRef(0)

  // ── Annotations
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([])
  const [rectAnnotations, setRectAnnotations] = useState<RectAnnotation[]>([])
  const [selectedAnnotId, setSelectedAnnotId] = useState<string | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingTextValue, setEditingTextValue] = useState('')

  // ── Light
  const [lightSettings, setLightSettings] = useState<LightSettings>({
    azimuth: 45, elevation: 35, color: '#ffffff', intensity: 70, softness: 'soft', sceneLock: true,
  })
  const [activeLightingStyle, setActiveLightingStyle] = useState<string | null>(null)

  // ── Prompt mode
  const [promptText, setPromptText] = useState('')
  const [promptRefUrl, setPromptRefUrl] = useState<string | null>(null)

  // ── Model
  const [selectedModel, setSelectedModel] = useState('nano-banana-2')

  // ── Generation
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalResult, setModalResult] = useState<GenerationResult | null>(null)
  const [resultsDockOpen, setResultsDockOpen] = useState(true)

  // ── Canvas refs
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<Point | null>(null)
  const rectStartRef = useRef<Point | null>(null)
  const [rectPreview, setRectPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // ── Text input
  const [textInput, setTextInput] = useState({ visible: false, screenX: 0, screenY: 0, canvasX: 0, canvasY: 0 })
  const [textValue, setTextValue] = useState('')
  const textInputRef = useRef<HTMLInputElement>(null)

  // Scale factors
  const scaleX = displaySize && imageNaturalSize ? displaySize.w / imageNaturalSize.w : 1
  const scaleY = displaySize && imageNaturalSize ? displaySize.h / imageNaturalSize.h : 1

  // ── Canvas rendering
  const renderCanvas = useCallback(() => {
    const canvas = displayCanvasRef.current
    if (!canvas || !bgImageRef.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height)
    for (const layer of layers) {
      const lc = layerCanvasesRef.current.get(layer.id)
      if (lc) ctx.drawImage(lc, 0, 0)
    }
    // Text and rect annotations rendered as HTML overlays (moveable)
  }, [layers])

  useEffect(() => { renderCanvas() }, [renderCanvas])

  // ── Flatten annotations onto canvas for export
  const flattenForExport = useCallback((): string => {
    const src = displayCanvasRef.current
    if (!src) return ''
    const tmp = document.createElement('canvas')
    tmp.width = src.width; tmp.height = src.height
    const ctx = tmp.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(src, 0, 0)
    for (const ann of textAnnotations) {
      ctx.save()
      ctx.font = `bold ${ann.fontSize}px Inter, sans-serif`
      ctx.fillStyle = ann.color
      ctx.shadowColor = 'rgba(0,0,0,0.9)'
      ctx.shadowBlur = 5
      ctx.fillText(ann.text, ann.x, ann.y)
      ctx.restore()
    }
    for (const ann of rectAnnotations) {
      ctx.save()
      ctx.strokeStyle = ann.color
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(ann.x, ann.y, ann.w, ann.h)
      ctx.fillStyle = ann.color + '22'
      ctx.fillRect(ann.x, ann.y, ann.w, ann.h)
      ctx.restore()
    }
    return tmp.toDataURL('image/png')
  }, [textAnnotations, rectAnnotations])

  // ── Annotation handlers
  const handleTextAnnotMove = useCallback((id: string, dx: number, dy: number) => {
    setTextAnnotations(prev => prev.map(a => a.id === id ? { ...a, x: a.x + dx, y: a.y + dy } : a))
  }, [])

  const handleTextAnnotDelete = useCallback((id: string) => {
    setTextAnnotations(prev => prev.filter(a => a.id !== id))
    setSelectedAnnotId(null)
  }, [])

  const handleTextAnnotCommitEdit = useCallback((id: string, newText: string) => {
    if (newText.trim()) {
      setTextAnnotations(prev => prev.map(a => a.id === id ? { ...a, text: newText } : a))
    } else {
      setTextAnnotations(prev => prev.filter(a => a.id !== id))
    }
    setEditingTextId(null)
  }, [])

  const handleRectAnnotMove = useCallback((id: string, dx: number, dy: number) => {
    setRectAnnotations(prev => prev.map(a => a.id === id ? { ...a, x: a.x + dx, y: a.y + dy } : a))
  }, [])

  const handleRectAnnotResize = useCallback((id: string, dx: number, dy: number, handleId: string) => {
    setRectAnnotations(prev => prev.map(a => {
      if (a.id !== id) return a
      let { x, y, w, h } = a
      if (handleId.includes('w')) { x += dx; w -= dx }
      if (handleId.includes('e')) { w += dx }
      if (handleId.includes('n')) { y += dy; h -= dy }
      if (handleId.includes('s')) { h += dy }
      if (w < 10) w = 10
      if (h < 10) h = 10
      return { ...a, x, y, w, h }
    }))
  }, [])

  const handleRectAnnotDelete = useCallback((id: string) => {
    setRectAnnotations(prev => prev.filter(a => a.id !== id))
    setSelectedAnnotId(null)
  }, [])

  const applyLightingStyle = useCallback((s: typeof LIGHTING_STYLES[0]) => {
    setActiveLightingStyle(s.id)
    setLightSettings(prev => ({ ...prev, color: s.color, azimuth: s.az, elevation: s.el, intensity: s.intensity, softness: s.softness }))
  }, [])

  // ── File handling
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      bgImageRef.current = img
      setImageUrl(url)
      const nat = { w: img.naturalWidth, h: img.naturalHeight }
      setImageNaturalSize(nat)
      const ds = computeDisplaySize(nat.w, nat.h)
      setDisplaySize(ds)
      const canvas = displayCanvasRef.current
      if (canvas) {
        canvas.width = nat.w
        canvas.height = nat.h
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0)
      }
      setLayers([])
      setTextAnnotations([])
      setRectAnnotations([])
      layerCanvasesRef.current.clear()
      nextColorIdx.current = 0
    }
    img.src = url
  }, [])

  // ── Layer management
  const addLayer = useCallback(() => {
    if (!imageNaturalSize) return
    const colorData = LAYER_COLORS[nextColorIdx.current % LAYER_COLORS.length]!
    nextColorIdx.current++
    const layer: MaskLayer = {
      id: uid(), color: colorData.hex, colorName: colorData.name,
      prompt: '', referenceImageUrl: null, centroid: null, cardOffset: { x: 0, y: 0 },
    }
    const lc = document.createElement('canvas')
    lc.width = imageNaturalSize.w; lc.height = imageNaturalSize.h
    layerCanvasesRef.current.set(layer.id, lc)
    setLayers(prev => [...prev, layer])
    setActiveLayerId(layer.id)
  }, [imageNaturalSize])

  const removeLayer = useCallback((id: string) => {
    layerCanvasesRef.current.delete(id)
    setLayers(prev => prev.filter(l => l.id !== id))
    setActiveLayerId(prev => (prev === id ? null : prev))
    setTimeout(renderCanvas, 0)
  }, [renderCanvas])

  const clearLayerStrokes = useCallback((id: string) => {
    const lc = layerCanvasesRef.current.get(id)
    if (lc) { const ctx = lc.getContext('2d'); ctx?.clearRect(0, 0, lc.width, lc.height) }
    setLayers(prev => prev.map(l => l.id === id ? { ...l, centroid: null } : l))
    setTimeout(renderCanvas, 0)
  }, [renderCanvas])

  const updateLayerCentroid = useCallback((id: string) => {
    const lc = layerCanvasesRef.current.get(id)
    if (!lc) return
    setTimeout(() => {
      const centroid = computeLayerCentroid(lc)
      setLayers(prev => prev.map(l => l.id === id ? { ...l, centroid } : l))
    }, 0)
  }, [])

  // ── Canvas interaction helpers
  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = displayCanvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / scaleX, y: (e.clientY - rect.top) / scaleY }
  }, [scaleX, scaleY])

  const paintDot = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, colorRgb: string, erase: boolean) => {
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
    ctx.fillStyle = erase ? 'rgba(0,0,0,1)' : `rgba(${colorRgb},0.55)`
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const paintLine = useCallback((ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, radius: number, colorRgb: string, erase: boolean) => {
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
    ctx.strokeStyle = erase ? 'rgba(0,0,0,1)' : `rgba(${colorRgb},0.55)`
    ctx.lineWidth = radius * 2
    ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!bgImageRef.current) return
    setSelectedAnnotId(null)
    setEditingTextId(null)
    const pt = getCanvasPoint(e)

    if (activeTool === 'text' && mode === 'edit') {
      const canvas = displayCanvasRef.current!
      const rect = canvas.getBoundingClientRect()
      setTextInput({ visible: true, screenX: e.clientX - rect.left, screenY: e.clientY - rect.top, canvasX: pt.x, canvasY: pt.y })
      setTimeout(() => textInputRef.current?.focus(), 50)
      return
    }

    if (activeTool === 'rect' && mode === 'edit') {
      isDrawingRef.current = true; rectStartRef.current = pt; return
    }

    if ((activeTool === 'brush' || activeTool === 'eraser') && mode === 'edit' && activeLayerId) {
      const layer = layers.find(l => l.id === activeLayerId)
      const lc = layerCanvasesRef.current.get(activeLayerId)
      if (!layer || !lc) return
      const ctx = lc.getContext('2d')!
      const colorData = LAYER_COLORS.find(c => c.hex === layer.color)
      const r = brushSize / (2 * scaleX)
      paintDot(ctx, pt.x, pt.y, r, colorData?.rgb ?? '255,255,255', activeTool === 'eraser')
      isDrawingRef.current = true
      lastPointRef.current = pt
      renderCanvas()
    }
  }, [activeTool, mode, activeLayerId, layers, getCanvasPoint, brushSize, scaleX, paintDot, renderCanvas])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const pt = getCanvasPoint(e)

    if (activeTool === 'rect' && rectStartRef.current) {
      const s = rectStartRef.current
      setRectPreview({ x: s.x, y: s.y, w: pt.x - s.x, h: pt.y - s.y })
      return
    }

    if ((activeTool === 'brush' || activeTool === 'eraser') && activeLayerId) {
      const layer = layers.find(l => l.id === activeLayerId)
      const lc = layerCanvasesRef.current.get(activeLayerId)
      if (!layer || !lc) return
      const ctx = lc.getContext('2d')!
      const colorData = LAYER_COLORS.find(c => c.hex === layer.color)
      const r = brushSize / (2 * scaleX)
      const prev = lastPointRef.current ?? pt
      paintDot(ctx, pt.x, pt.y, r, colorData?.rgb ?? '255,255,255', activeTool === 'eraser')
      paintLine(ctx, prev.x, prev.y, pt.x, pt.y, r, colorData?.rgb ?? '255,255,255', activeTool === 'eraser')
      lastPointRef.current = pt
      renderCanvas()
    }
  }, [activeTool, activeLayerId, layers, getCanvasPoint, brushSize, scaleX, paintDot, paintLine, renderCanvas])

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    lastPointRef.current = null

    if (activeTool === 'rect' && rectStartRef.current) {
      const pt = getCanvasPoint(e)
      const s = rectStartRef.current
      const ann: RectAnnotation = {
        id: uid(), color: layers.find(l => l.id === activeLayerId)?.color ?? '#FFFF00',
        x: Math.min(s.x, pt.x), y: Math.min(s.y, pt.y),
        w: Math.abs(pt.x - s.x), h: Math.abs(pt.y - s.y),
      }
      if (ann.w > 5 && ann.h > 5) setRectAnnotations(prev => [...prev, ann])
      rectStartRef.current = null; setRectPreview(null)
      renderCanvas()
      return
    }

    if (activeTool === 'brush' && activeLayerId) {
      updateLayerCentroid(activeLayerId)
    }
  }, [activeTool, activeLayerId, layers, getCanvasPoint, renderCanvas, updateLayerCentroid])

  const commitText = useCallback(() => {
    if (!textValue.trim()) return
    const layer = layers.find(l => l.id === activeLayerId)
    setTextAnnotations(prev => [...prev, {
      id: uid(), text: textValue,
      x: textInput.canvasX, y: textInput.canvasY,
      color: layer?.color ?? '#FFFF00', fontSize: 20,
    }])
    setTextInput(p => ({ ...p, visible: false }))
    setTextValue('')
    setTimeout(renderCanvas, 0)
  }, [textValue, textInput, activeLayerId, layers, renderCanvas])

  // ── Generation
  const canGenerate = useMemo(() => {
    if (!imageUrl || isGenerating) return false
    if (mode === 'edit') return layers.some(l => l.prompt.trim())
    if (mode === 'relight') return true
    if (mode === 'prompt') return !!promptText.trim()
    return false
  }, [imageUrl, isGenerating, mode, layers, promptText])

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !imageUrl) return
    setIsGenerating(true); setError(null)
    const taskId = uid()
    try {
      let compositeDataUrl: string | undefined
      let combinedPrompt = ''
      const referenceImages: string[] = []

      if (mode === 'edit') {
        compositeDataUrl = flattenForExport()
        const activeLayers = layers.filter(l => l.prompt.trim())
        combinedPrompt = activeLayers.map(l => `In the ${l.colorName} highlighted region: ${l.prompt.trim()}`).join('. ')
          + '. Keep all non-highlighted areas completely unchanged.'
        activeLayers.forEach(l => { if (l.referenceImageUrl) referenceImages.push(l.referenceImageUrl) })
      } else if (mode === 'relight') {
        combinedPrompt = generateRelightPrompt(lightSettings)
      } else {
        combinedPrompt = promptText
        if (promptRefUrl) referenceImages.push(promptRefUrl)
      }

      const body: Record<string, unknown> = {
        mode, model: selectedModel, taskId,
        originalImageUrl: imageUrl, prompt: combinedPrompt, referenceImages,
      }
      if (compositeDataUrl) body.compositeDataUrl = compositeDataUrl

      const res = await fetch('/api/edit-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `HTTP ${res.status}`) }
      const data = await res.json()
      setResults(prev => [{ id: taskId, url: data.imageUrl, mode, timestamp: Date.now(), inputUrl: imageUrl, prompt: combinedPrompt }, ...prev])
      setResultsDockOpen(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally { setIsGenerating(false) }
  }, [canGenerate, imageUrl, mode, layers, lightSettings, promptText, promptRefUrl, selectedModel, flattenForExport])

  const creditCost = MODEL_REGISTRY[selectedModel]?.credits ?? 20

  const canvasCursor = !bgImageRef.current ? 'default'
    : mode !== 'edit' ? 'default'
    : !activeLayerId ? 'crosshair'
    : activeTool === 'text' ? 'text'
    : 'crosshair'

  // ── Render
  return (
    <div className="fixed inset-0 pt-16 bg-[#07070a] text-white overflow-hidden" style={{ userSelect: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>

      {/* ── CANVAS WORKSPACE ─────────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center px-4" style={{ top: '3rem' }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        {!imageUrl ? (
          /* Drop zone */
          <label className="group flex flex-col items-center gap-6 cursor-pointer">
            <div className="w-28 h-28 rounded-xl border border-dashed border-white/10 group-hover:border-[#FFFF00]/30 bg-white/[0.015] group-hover:bg-[#FFFF00]/[0.02] flex items-center justify-center transition-all duration-500">
              <IconUpload className="w-10 h-10 text-gray-600 group-hover:text-[#FFFF00]/50 transition-colors duration-300" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-bold text-gray-400 group-hover:text-white transition-colors">Drop an image or click to upload</p>
              <p className="text-xs text-gray-600">PNG · JPG · WebP · max 10MB</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </label>
        ) : (
          /* flex row: left panel + canvas */
          <div className="flex items-center gap-4 h-full">

            {/* ── LEFT PANEL: EDIT TOOLS ───────────────────────── */}
            {mode === 'edit' && (
              <div className="flex-shrink-0 self-center flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#0c0c0e] border border-white/[0.06] shadow-xl">
                {activeLayerId && (
                  <div className="w-6 h-1.5 rounded-full mb-0.5" style={{ background: layers.find(l => l.id === activeLayerId)?.color ?? '#fff' }} />
                )}
                {[
                  { id: 'brush' as Tool, Icon: IconBrush, tip: 'Brush' },
                  { id: 'eraser' as Tool, Icon: IconEraser, tip: 'Erase' },
                  { id: 'rect' as Tool, Icon: IconSquare, tip: 'Rect' },
                  { id: 'text' as Tool, Icon: IconTypography, tip: 'Text' },
                ].map(({ id, Icon, tip }) => (
                  <button key={id} onClick={() => setActiveTool(id)} title={tip}
                    className={cn('w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                      activeTool === id ? 'bg-[#FFFF00] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                    )}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
                {(activeTool === 'brush' || activeTool === 'eraser') && (<>
                  <div className="w-5 h-px bg-white/10 my-0.5" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="rounded-full border border-white/20" style={{
                      width: Math.max(6, Math.min(28, brushSize * 0.45)), height: Math.max(6, Math.min(28, brushSize * 0.45)),
                      background: activeTool === 'eraser' ? 'rgba(255,255,255,0.15)' : (layers.find(l => l.id === activeLayerId)?.color ?? '#FFFF00') + '80',
                    }} />
                    <input type="range" min={4} max={80} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))}
                      className="w-1 h-16 opacity-0 absolute cursor-pointer" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                    <span className="text-[9px] text-gray-500 font-mono">{brushSize}</span>
                  </div>
                </>)}
                <div className="w-5 h-px bg-white/10 my-0.5" />
                <button onClick={addLayer} title="Add Mask Layer" disabled={!imageUrl}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#FFFF00] hover:bg-[#FFFF00]/[0.06] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <IconPlus className="w-4 h-4" />
                </button>
                {layers.length > 0 && (<>
                  <div className="w-5 h-px bg-white/10" />
                  <div className="flex flex-col gap-1.5">
                    {layers.map(l => (
                      <button key={l.id} onClick={() => setActiveLayerId(l.id)}
                        className={cn('w-4 h-4 rounded-full ring-2 ring-offset-1 ring-offset-[#0c0c0e] transition-all',
                          activeLayerId === l.id ? 'ring-[#FFFF00] scale-110' : 'ring-white/20 hover:ring-white/40')}
                        style={{ background: l.color }} />
                    ))}
                  </div>
                </>)}
              </div>
            )}

            {/* ── LEFT PANEL: RELIGHT ──────────────────────────── */}
            {mode === 'relight' && (
              <div className="flex-shrink-0 w-[232px] self-center max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl bg-[#0c0c0e] border border-white/[0.06] shadow-xl">
                <div className="p-4 space-y-4">

                  {/* Lighting Style grid */}
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Lighting Style</p>
                    <div className="grid grid-cols-3 gap-1">
                      {LIGHTING_STYLES.map(s => (
                        <button key={s.id} onClick={() => applyLightingStyle(s)}
                          className={cn('py-2 rounded-lg border text-center transition-all',
                            activeLightingStyle === s.id
                              ? 'border-white/20 bg-white/[0.06] text-[#FFFF00]'
                              : 'border-white/5 text-gray-500 hover:text-white hover:border-white/10'
                          )}>
                          <span className="text-[10px] font-black uppercase tracking-wide leading-none">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sphere + readout */}
                  <div className="flex flex-col items-center gap-2">
                    <RelightSphere
                      azimuth={lightSettings.azimuth} elevation={lightSettings.elevation}
                      lightColor={lightSettings.color} intensity={lightSettings.intensity}
                      onAzimuthChange={az => { setLightSettings(p => ({ ...p, azimuth: az })); setActiveLightingStyle(null) }}
                      onElevationChange={el => { setLightSettings(p => ({ ...p, elevation: el })); setActiveLightingStyle(null) }}
                      size={148}
                    />
                    <div className="flex gap-5 text-[11px] font-mono">
                      <span className="text-gray-500">AZ <span className="text-white">{lightSettings.azimuth}°</span></span>
                      <span className="text-gray-500">EL <span className="text-white">{lightSettings.elevation > 0 ? '+' : ''}{lightSettings.elevation}°</span></span>
                    </div>
                  </div>

                  {/* Direction presets */}
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Direction</p>
                    <div className="grid grid-cols-4 gap-1">
                      {RELIGHT_PRESETS.map(p => (
                        <button key={p.name}
                          onClick={() => { setLightSettings(prev => ({ ...prev, azimuth: p.az, elevation: p.el })); setActiveLightingStyle(null) }}
                          className={cn('py-1.5 text-[10px] font-black rounded-md transition-all border',
                            lightSettings.azimuth === p.az && lightSettings.elevation === p.el
                              ? 'border-white/20 bg-white/[0.06] text-[#FFFF00]'
                              : 'border-white/5 text-gray-500 hover:text-white hover:border-white/10'
                          )}>{p.name}</button>
                      ))}
                    </div>
                  </div>

                  {/* Intensity */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-xs font-black text-white uppercase tracking-wider">Intensity</span>
                      <span className="font-mono text-[12px] text-white bg-white/5 px-1.5 py-0.5 rounded">{lightSettings.intensity}%</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{
                        width: `${(lightSettings.intensity - 10) / 90 * 100}%`,
                        background: `linear-gradient(to right, ${lightSettings.color}55, ${lightSettings.color})`,
                      }} />
                      <input type="range" min={10} max={100} step={5} value={lightSettings.intensity}
                        onChange={e => setLightSettings(p => ({ ...p, intensity: Number(e.target.value) }))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
                    </div>
                  </div>

                  {/* Light Falloff — segmented */}
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Light Falloff</p>
                    <div className="flex bg-[rgb(255_255_255_/_0.04)] p-0.5 rounded-lg border border-[rgb(255_255_255_/_0.04)]">
                      {(['soft', 'hard'] as const).map(type => (
                        <button key={type} onClick={() => setLightSettings(p => ({ ...p, softness: type }))}
                          className={cn('flex-1 py-1.5 text-[11px] font-black rounded-md transition-all uppercase tracking-wider',
                            lightSettings.softness === type ? 'bg-white/[0.09] text-[#FFFF00] shadow-sm' : 'text-gray-500 hover:text-white'
                          )}>{type}</button>
                      ))}
                    </div>
                  </div>

                  {/* Light Color */}
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Light Color</p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        <input type="color" value={lightSettings.color}
                          onChange={e => { setLightSettings(p => ({ ...p, color: e.target.value })); setActiveLightingStyle(null) }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="absolute inset-0 rounded-lg" style={{ background: lightSettings.color }} />
                      </div>
                      <input type="text" value={lightSettings.color}
                        onChange={e => { setLightSettings(p => ({ ...p, color: e.target.value })); setActiveLightingStyle(null) }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono uppercase outline-none focus:border-white/25 transition-all" />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {LIGHT_COLOR_PRESETS.map(c => (
                        <button key={c}
                          onClick={() => { setLightSettings(p => ({ ...p, color: c })); setActiveLightingStyle(null) }}
                          className={cn('w-6 h-6 rounded-full border-2 transition-all', lightSettings.color === c ? 'border-white scale-110' : 'border-white/15 hover:border-white/40')}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>

                  {/* Scene Lock */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-wider">Scene Lock</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">Preserve pose & character</p>
                    </div>
                    <button onClick={() => setLightSettings(p => ({ ...p, sceneLock: !p.sceneLock }))}
                      className={cn('relative w-10 flex-shrink-0 rounded-full transition-colors', lightSettings.sceneLock ? 'bg-[#FFFF00]' : 'bg-white/10')}
                      style={{ height: 22 }}>
                      <span className={cn('absolute top-[3px] left-[3px] w-4 h-4 rounded-full transition-transform shadow-sm',
                        lightSettings.sceneLock ? 'translate-x-[18px]' : 'translate-x-0')}
                        style={{ background: lightSettings.sceneLock ? '#000' : 'rgba(255,255,255,0.5)' }} />
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ── LEFT PANEL: PROMPT ───────────────────────────── */}
            {mode === 'prompt' && (
              <div className="flex-shrink-0 w-[232px] self-center rounded-xl bg-[#0c0c0e] border border-white/[0.06] shadow-xl p-4 space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Edit Instruction</p>
                <textarea
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  placeholder={"e.g. 'Make the background a sunset beach'"}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 resize-none outline-none focus:border-white/25 leading-relaxed transition-all"
                  rows={5}
                />
                <div>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Reference (optional)</p>
                  {promptRefUrl ? (
                    <div className="flex items-center gap-2.5">
                      <img src={promptRefUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                      <span className="text-xs text-gray-400 flex-1">Reference attached</span>
                      <button onClick={() => setPromptRefUrl(null)} className="text-gray-500 hover:text-red-400 transition-colors"><IconX className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-white transition-colors">
                      <IconPhoto className="w-4 h-4" />
                      Attach reference image
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return
                        const fd = new FormData(); fd.append('file', file)
                        try {
                          const r = await fetch('/api/images/upload', { method: 'POST', body: fd })
                          const d = await r.json(); setPromptRefUrl(d.image?.url ?? URL.createObjectURL(file))
                        } catch { setPromptRefUrl(URL.createObjectURL(file)) }
                      }} />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* ── CANVAS WRAPPER ───────────────────────────────── */}
            <div ref={canvasWrapperRef} className="relative flex-shrink-0" style={{ width: displaySize?.w, height: displaySize?.h }}>

            {/* Main canvas */}
            <canvas
              ref={displayCanvasRef}
              width={imageNaturalSize?.w}
              height={imageNaturalSize?.h}
              style={{
                display: 'block',
                width: displaySize?.w,
                height: displaySize?.h,
                cursor: canvasCursor,
                touchAction: 'none',
                borderRadius: 14,
                boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={e => { if (isDrawingRef.current) onMouseUp(e) }}
            />

            {/* Rect preview overlay */}
            {rectPreview && displaySize && (
              <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: 14 }}>
                <div className="absolute border-2 border-dashed" style={{
                  left: rectPreview.x * scaleX, top: rectPreview.y * scaleY,
                  width: rectPreview.w * scaleX, height: rectPreview.h * scaleY,
                  borderColor: layers.find(l => l.id === activeLayerId)?.color ?? '#FFFF00',
                  background: (layers.find(l => l.id === activeLayerId)?.color ?? '#FFFF00') + '20',
                }} />
              </div>
            )}

            {/* Floating text input */}
            {textInput.visible && (
              <div className="absolute z-30" style={{ left: textInput.screenX, top: textInput.screenY }}>
                <input
                  ref={textInputRef}
                  value={textValue}
                  onChange={e => setTextValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') { setTextInput(p => ({ ...p, visible: false })); setTextValue('') } }}
                  onBlur={commitText}
                  className="bg-black/90 border border-[#FFFF00]/40 text-[#FFFF00] text-sm px-3 py-2 rounded-xl outline-none min-w-[170px] shadow-2xl backdrop-blur-xl"
                  placeholder="Type & press Enter…"
                />
              </div>
            )}

            {/* Active tool & no-layer hint */}
            {mode === 'edit' && !activeLayerId && layers.length === 0 && (
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-6">
                <div className="px-4 py-2 rounded-lg bg-[#0c0c0e]/90 border border-white/[0.06] text-xs text-gray-400 font-bold">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[#FFFF00] text-[10px]">+</kbd> in the toolbar to add a mask layer
                </div>
              </div>
            )}

            {/* Floating mask cards (mode=edit) */}
            {mode === 'edit' && displaySize && layers.map(layer => (
              <FloatingMaskCard
                key={layer.id}
                layer={layer}
                scaleX={scaleX} scaleY={scaleY}
                canvasW={displaySize.w} canvasH={displaySize.h}
                isActive={activeLayerId === layer.id}
                onSelect={() => setActiveLayerId(layer.id)}
                onUpdatePrompt={p => setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, prompt: p } : l))}
                onAttachRef={url => setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, referenceImageUrl: url || null } : l))}
                onClearStrokes={() => clearLayerStrokes(layer.id)}
                onDelete={() => removeLayer(layer.id)}
                onCardDrag={(dx, dy) => setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, cardOffset: { x: l.cardOffset.x + dx, y: l.cardOffset.y + dy } } : l))}
              />
            ))}

            {/* Moveable annotation overlay */}
            {displaySize && (
              <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', borderRadius: 14 }}>
                {textAnnotations.map(ann => (
                  <MovableTextAnnotation
                    key={ann.id}
                    ann={ann}
                    scaleX={scaleX} scaleY={scaleY}
                    isSelected={selectedAnnotId === ann.id}
                    isEditing={editingTextId === ann.id}
                    editValue={editingTextId === ann.id ? editingTextValue : ann.text}
                    onSelect={e => { e.stopPropagation(); setSelectedAnnotId(ann.id) }}
                    onMove={(dx, dy) => handleTextAnnotMove(ann.id, dx, dy)}
                    onDelete={() => handleTextAnnotDelete(ann.id)}
                    onStartEdit={() => { setEditingTextId(ann.id); setEditingTextValue(ann.text) }}
                    onCommitEdit={text => handleTextAnnotCommitEdit(ann.id, text)}
                    onEditChange={v => setEditingTextValue(v)}
                  />
                ))}
                {rectAnnotations.map(ann => (
                  <MovableRectAnnotation
                    key={ann.id}
                    ann={ann}
                    scaleX={scaleX} scaleY={scaleY}
                    isSelected={selectedAnnotId === ann.id}
                    onSelect={e => { e.stopPropagation(); setSelectedAnnotId(ann.id) }}
                    onMove={(dx, dy) => handleRectAnnotMove(ann.id, dx, dy)}
                    onResize={(dx, dy, handle) => handleRectAnnotResize(ann.id, dx, dy, handle)}
                    onDelete={() => handleRectAnnotDelete(ann.id)}
                  />
                ))}
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {/* ── MODE SWITCHER (floating top center) ──────────────────────── */}
      <div className="fixed top-[4.6rem] left-1/2 -translate-x-1/2 z-40">
        <div className="flex bg-[rgb(255_255_255_/_0.04)] border border-[rgb(255_255_255_/_0.04)] rounded-full p-1 shadow-xl gap-0.5">
          {([
            { id: 'edit', label: '✏ Edit' },
            { id: 'relight', label: '☀ Relight' },
            { id: 'prompt', label: '✦ Prompt' },
          ] as { id: Mode; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={cn(
                'px-5 py-1.5 text-[11px] font-black rounded-full uppercase tracking-widest transition-all duration-200',
                mode === id
                  ? 'bg-[#FFFF00] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              )}
            >{label}</button>
          ))}
        </div>
      </div>


      {/* ── BOTTOM BAR ───────────────────────────────────────────────── */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">

        {/* Upload / Replace */}
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0c0c0e] border border-white/[0.06] shadow-lg cursor-pointer hover:border-white/12 transition-all">
          <IconUpload className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-black text-gray-400 uppercase tracking-wide">{imageUrl ? 'Replace' : 'Upload'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </label>

        {/* Model selector */}
        <ModelDropdown selectedModel={selectedModel} onSelect={setSelectedModel} />

        {/* Generate CTA */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={cn(
            'flex items-center gap-2.5 px-7 py-2.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200',
            canGenerate
              ? 'bg-[#FFFF00] text-black hover:bg-[#e6e600] shadow-[0_0_20px_rgba(255,255,0,0.15)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)]'
              : 'bg-white/[0.04] text-gray-600 cursor-not-allowed border border-white/5'
          )}
        >
          {isGenerating ? (
            <><IconLoader2 className="w-4 h-4 animate-spin" />Generating…</>
          ) : (
            <><IconWand className="w-4 h-4" />Generate<span className="flex items-center gap-1 opacity-60 font-mono text-xs"><CreditIcon className="w-3 h-3" />{creditCost}</span></>
          )}
        </button>
      </div>

      {/* ── RESULTS DOCK (floating bottom-right) ─────────────────────── */}
      {results.length > 0 && (
        <div className="fixed right-5 bottom-6 z-40">
          <div className="bg-[#0c0c0e] border border-white/[0.06] rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Results ({results.length})</span>
              <button onClick={() => setResultsDockOpen(p => !p)} className="text-gray-500 hover:text-white transition-colors">
                {resultsDockOpen ? <IconChevronDown className="w-4 h-4" /> : <IconChevronUp className="w-4 h-4" />}
              </button>
            </div>
            {resultsDockOpen && (
              <div className="flex gap-2 p-2.5" style={{ maxWidth: 320 }}>
                {results.slice(0, 5).map(r => (
                  <button
                    key={r.id} onClick={() => setModalResult(r)}
                    className="flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border border-white/8 hover:border-[#FFFF00]/40 transition-all duration-150 hover:scale-105"
                  >
                    <img src={r.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESULT MODAL ─────────────────────────────────────────────── */}
      {modalResult && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center" onClick={() => setModalResult(null)}>
          <div className="flex flex-col gap-4 max-w-4xl max-h-[90vh] items-center" onClick={e => e.stopPropagation()}>
            <img src={modalResult.url} alt="" className="rounded-2xl max-h-[74vh] object-contain shadow-[0_30px_80px_rgba(0,0,0,0.8)]" />
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setImageUrl(modalResult.url); bgImageRef.current = null; setLayers([]); layerCanvasesRef.current.clear(); setModalResult(null) }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FFFF00] text-black font-black text-sm hover:scale-105 transition-transform"
              >
                <IconRefresh className="w-4 h-4" /> Use as Input
              </button>
              <a href={modalResult.url} download="result.png" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/14 transition-colors">
                <IconDownload className="w-4 h-4" /> Download
              </a>
              <button onClick={() => setModalResult(null)} className="px-6 py-2.5 rounded-xl bg-white/5 text-white/40 font-bold text-sm hover:bg-white/8 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR TOAST ──────────────────────────────────────────────── */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-500/12 border border-red-500/25 text-red-300 text-sm shadow-2xl backdrop-blur-xl">
          <IconX className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-300/40 hover:text-red-300 transition-colors"><IconX className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  )
}
