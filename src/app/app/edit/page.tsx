'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { CreditIcon } from '@/components/ui/CreditIcon'
import { MODEL_REGISTRY } from '@/services/models'
import { MechanicalSlider } from '@/components/ui/mechanical-slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  IconUpload, IconTrash, IconPlus, IconWand, IconEraser,
  IconBrush, IconLoader2, IconDownload, IconChevronDown,
  IconX, IconSparkles, IconSun, IconPhoto,
  IconTypography, IconSquare, IconMaximize, IconChevronUp,
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
}

interface TextAnnotation {
  id: string
  text: string
  x: number
  y: number
  color: string
  fontSize: number
}

interface LightSettings {
  azimuth: number     // 0–360: Front=0, Right=90, Back=180, Left=270
  elevation: number   // -90–90: below=-90, horizon=0, above=90
  color: string       // hex
  intensity: number   // 0–100
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
  { hex: '#FF4444', name: 'red' },
  { hex: '#4488FF', name: 'blue' },
  { hex: '#44DD88', name: 'green' },
  { hex: '#FFD700', name: 'yellow' },
  { hex: '#FF44FF', name: 'pink' },
  { hex: '#44EEFF', name: 'cyan' },
]

const EDIT_MODELS = [
  'nano-banana-2',
  'nano-banana-2-2k',
  'nano-banana-pro',
  'nano-banana-2-4k',
]

const RELIGHT_PRESETS = [
  { name: 'Front',    azimuth: 0,   elevation: 25 },
  { name: 'Front-R',  azimuth: 45,  elevation: 45 },
  { name: 'Right',    azimuth: 90,  elevation: 20 },
  { name: 'Back-R',   azimuth: 135, elevation: 35 },
  { name: 'Back',     azimuth: 180, elevation: 25 },
  { name: 'Left',     azimuth: 270, elevation: 20 },
  { name: 'Top',      azimuth: 0,   elevation: 85 },
  { name: 'Uplight',  azimuth: 0,   elevation: -35 },
]

const LIGHT_COLOR_PRESETS = [
  '#ffffff', '#ffe8d0', '#d0e8ff', '#48dbb6', '#00ff2a', '#ff0000', '#ff44ff', '#ffcc00',
]

function getCanvasTools(): { id: Tool; label: string; icon: React.ComponentType<{ className?: string }> }[] {
  return [
    { id: 'brush', label: 'Brush', icon: IconBrush },
    { id: 'eraser', label: 'Erase', icon: IconEraser },
    { id: 'rect', label: 'Rect', icon: IconSquare },
    { id: 'text', label: 'Text', icon: IconTypography },
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function computeDisplaySize(nw: number, nh: number): { w: number; h: number } {
  const maxW = 900, maxH = 680
  let w = nw, h = nh
  if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
  if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
  return { w, h }
}

function azimuthToDescription(az: number): string {
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

function elevationToDescription(el: number): string {
  if (el > 60) return 'overhead light source, directly above'
  if (el > 35) return 'high-angle light source from above'
  if (el > 10) return 'moderate-angle light source'
  if (el > -10) return 'eye-level light source'
  if (el > -35) return 'low-angle light, light shining slightly upward'
  return 'light source positioned below the character, light shining upwards, uplighting'
}

function generateRelightPrompt(s: LightSettings): string {
  const dir = azimuthToDescription(s.azimuth)
  const height = elevationToDescription(s.elevation)
  const bright = s.intensity > 70 ? 'bright' : s.intensity > 40 ? 'medium' : 'soft'
  const lock = s.sceneLock
    ? 'SCENE LOCK, FIXED VIEWPOINT, maintaining character consistency and pose. RELIGHTING ONLY: '
    : 'Relight the image: '
  return `${lock}light source from ${dir}, ${height}, ${bright} ${s.softness} colored light (${s.color}), cinematic relighting`
}

// ─── LightOrb ─────────────────────────────────────────────────────────────────

function LightOrb({
  azimuth, elevation, lightColor,
  onAzimuthChange, onElevationChange,
}: {
  azimuth: number
  elevation: number
  lightColor: string
  onAzimuthChange: (az: number) => void
  onElevationChange: (el: number) => void
}) {
  const SIZE = 184
  const C = SIZE / 2
  const R = SIZE * 0.38

  const svgRef = useRef<SVGSVGElement>(null)
  const elevRef = useRef<HTMLDivElement>(null)
  const isOrbDragging = useRef(false)
  const isElevDragging = useRef(false)

  // Light dot position: always on the ring perimeter
  const dotX = C + R * Math.sin(azimuth * Math.PI / 180)
  const dotY = C + R * Math.cos(azimuth * Math.PI / 180)

  // Elevation indicator position: fraction within the strip
  const elevFrac = (elevation + 90) / 180  // 0=bottom(-90°), 1=top(+90°)
  const ELEV_H = 120
  const elevDotY = ELEV_H * (1 - elevFrac)  // top=high elevation

  const handleOrbPointer = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (SIZE / rect.width) - C
    const y = (e.clientY - rect.top) * (SIZE / rect.height) - C
    const az = ((Math.atan2(x, y) * 180 / Math.PI) + 360) % 360
    onAzimuthChange(Math.round(az))
  }, [C, onAzimuthChange])

  const handleElevPointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = elevRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const frac = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    onElevationChange(Math.round(frac * 180 - 90))
  }, [onElevationChange])

  return (
    <div className="flex gap-3 items-center justify-center">
      {/* Orb SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        className="cursor-crosshair select-none flex-shrink-0"
        onPointerDown={e => { isOrbDragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); handleOrbPointer(e) }}
        onPointerMove={e => { if (isOrbDragging.current) handleOrbPointer(e) }}
        onPointerUp={() => { isOrbDragging.current = false }}
      >
        <defs>
          <radialGradient id="orbBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#121228" />
            <stop offset="100%" stopColor="#060610" />
          </radialGradient>
          <radialGradient id="lightSpot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={lightColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor={lightColor} stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="subtleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background */}
        <circle cx={C} cy={C} r={C - 2} fill="url(#orbBg)" />

        {/* Perspective grid lines */}
        {[-3, -1, 1, 3].map(i => (
          <line key={`h${i}`} x1={C - R - 18} y1={C + i * R / 4} x2={C + R + 18} y2={C + i * R / 4}
            stroke="#111124" strokeWidth="0.6" />
        ))}
        {[-3, -1, 1, 3].map(i => (
          <line key={`v${i}`} x1={C + i * R / 4} y1={C - R - 18} x2={C + i * R / 4} y2={C + R + 18}
            stroke="#111124" strokeWidth="0.6" />
        ))}

        {/* Concentric rings */}
        {[0.4, 0.7, 1].map(f => (
          <circle key={f} cx={C} cy={C} r={R * f}
            fill="none" stroke="#1a1a30" strokeWidth="0.8"
            strokeDasharray={f < 1 ? '3 5' : 'none'} />
        ))}

        {/* Axis lines */}
        <line x1={C} y1={C - R - 6} x2={C} y2={C + R + 6} stroke="#1a1a30" strokeWidth="0.6" />
        <line x1={C - R - 6} y1={C} x2={C + R + 6} y2={C} stroke="#1a1a30" strokeWidth="0.6" />

        {/* Direction labels */}
        <text x={C} y={C - R - 10} textAnchor="middle" fill="#2a2a50" fontSize="8" fontFamily="monospace" fontWeight="bold">F</text>
        <text x={C} y={C + R + 18} textAnchor="middle" fill="#2a2a50" fontSize="8" fontFamily="monospace" fontWeight="bold">B</text>
        <text x={C - R - 14} y={C + 3} textAnchor="middle" fill="#2a2a50" fontSize="8" fontFamily="monospace" fontWeight="bold">L</text>
        <text x={C + R + 14} y={C + 3} textAnchor="middle" fill="#2a2a50" fontSize="8" fontFamily="monospace" fontWeight="bold">R</text>

        {/* Orbit ring */}
        <circle cx={C} cy={C} r={R} fill="none" stroke="#24245a" strokeWidth="1.5" />

        {/* Light beam */}
        <line x1={C} y1={C} x2={dotX} y2={dotY}
          stroke={lightColor} strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="4 5" />

        {/* Glow pool at light position */}
        <circle cx={dotX} cy={dotY} r={24} fill={lightColor} fillOpacity="0.12" filter="url(#subtleGlow)" />

        {/* Center "scene" */}
        <rect x={C - 13} y={C - 13} width={26} height={26} rx={5}
          fill="#0c0c1a" stroke="#1e1e40" strokeWidth="1" />
        <text x={C} y={C + 5} textAnchor="middle" fill="#25254a" fontSize="12">◼</text>

        {/* Light indicator dot */}
        <circle cx={dotX} cy={dotY} r={11} fill={lightColor} filter="url(#glow)" />
        <circle cx={dotX} cy={dotY} r={11} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
        <circle cx={dotX} cy={dotY} r={4} fill="white" fillOpacity="0.8" />
      </svg>

      {/* Elevation strip */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[9px] text-white/20 font-mono">HI</span>
        <div
          ref={elevRef}
          className="relative cursor-ns-resize select-none"
          style={{ width: 16, height: ELEV_H }}
          onPointerDown={e => { isElevDragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); handleElevPointer(e) }}
          onPointerMove={e => { if (isElevDragging.current) handleElevPointer(e) }}
          onPointerUp={() => { isElevDragging.current = false }}
        >
          {/* Track */}
          <div className="absolute left-1/2 -translate-x-1/2 w-px bg-white/10 rounded-full" style={{ top: 0, height: ELEV_H }} />
          {/* Horizon marker */}
          <div className="absolute left-0 right-0 h-px bg-white/15" style={{ top: ELEV_H / 2 }} />
          {/* Dot */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40 transition-none"
            style={{
              top: elevDotY,
              background: lightColor,
              boxShadow: `0 0 8px ${lightColor}`,
            }}
          />
        </div>
        <span className="text-[9px] text-white/20 font-mono">LO</span>
      </div>

      {/* Current values */}
      <div className="flex flex-col gap-2 text-[10px] font-mono text-white/30">
        <div>
          <div className="text-[8px] text-white/20 uppercase tracking-wider">AZ</div>
          <div className="text-white/60">{Math.round(azimuth)}°</div>
        </div>
        <div>
          <div className="text-[8px] text-white/20 uppercase tracking-wider">EL</div>
          <div className="text-white/60">{Math.round(elevation)}°</div>
        </div>
      </div>
    </div>
  )
}

// ─── MaskLayerCard ────────────────────────────────────────────────────────────

function MaskLayerCard({
  layer, isActive, onSelect, onUpdatePrompt, onAttachRef, onClearStrokes, onDelete,
}: {
  layer: MaskLayer
  isActive: boolean
  onSelect: () => void
  onUpdatePrompt: (p: string) => void
  onAttachRef: (url: string | null) => void
  onClearStrokes: () => void
  onDelete: () => void
}) {
  const refInputRef = useRef<HTMLInputElement>(null)

  const handleRefFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/images/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.image?.url) onAttachRef(data.image.url)
      else onAttachRef(URL.createObjectURL(file))  // fallback to local
    } catch {
      onAttachRef(URL.createObjectURL(file))
    }
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        'rounded-xl border p-3 cursor-pointer transition-all',
        isActive ? 'border-white/25 bg-white/[0.05]' : 'border-white/8 bg-white/[0.02] hover:border-white/15'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-1 ring-white/20"
          style={{ background: layer.color }} />
        <span className="text-xs text-white/60 capitalize flex-1 font-medium">{layer.colorName} mask</span>
        {isActive && <span className="text-[10px] text-[#FFFF00]/60 font-bold uppercase tracking-wider">active</span>}
        <button onClick={e => { e.stopPropagation(); onClearStrokes() }}
          className="text-[10px] text-white/20 hover:text-white/50 transition-colors px-1 py-0.5 rounded">
          clear
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete() }}
          className="text-white/20 hover:text-red-400 transition-colors p-0.5 rounded">
          <IconTrash className="w-3 h-3" />
        </button>
      </div>

      {/* Prompt */}
      <textarea
        value={layer.prompt}
        onChange={e => onUpdatePrompt(e.target.value)}
        onClick={e => e.stopPropagation()}
        placeholder={`What to change in the ${layer.colorName} area…`}
        rows={2}
        className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors leading-relaxed"
      />

      {/* Reference image row */}
      <div className="mt-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {layer.referenceImageUrl ? (
          <div className="flex items-center gap-2 flex-1">
            <img src={layer.referenceImageUrl} alt="" className="w-8 h-8 object-cover rounded-md border border-white/10" />
            <span className="text-[10px] text-white/40 flex-1">Ref image attached</span>
            <button onClick={() => onAttachRef(null)}
              className="text-white/20 hover:text-red-400 transition-colors p-0.5">
              <IconX className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-white/30 hover:text-white/60 transition-colors">
            <IconPhoto className="w-3 h-3" />
            Attach reference image
            <input ref={refInputRef} type="file" accept="image/*" className="hidden" onChange={handleRefFile} />
          </label>
        )}
      </div>
    </div>
  )
}

// ─── Results Dock + Modal ─────────────────────────────────────────────────────

function ResultModal({
  result, onClose, onUseAsInput,
}: { result: GenerationResult; onClose: () => void; onUseAsInput: (r: GenerationResult) => void }) {
  return (
    <div
      className="fixed inset-0 z-[10001] bg-black/95 backdrop-blur-xl flex flex-col"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
        <div>
          <h3 className="text-sm font-bold text-white">Generation Result</h3>
          <p className="text-[11px] text-white/30 mt-0.5 font-mono">{result.mode} · {new Date(result.timestamp).toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUseAsInput(result)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFFF00]/10 border border-[#FFFF00]/25 text-[#FFFF00] text-sm font-semibold hover:bg-[#FFFF00]/20 transition-colors"
          >
            <IconBrush className="w-4 h-4" />
            Use as Input
          </button>
          <a
            href={result.url}
            download="sharpii-edit.jpg"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:text-white transition-colors"
          >
            <IconDownload className="w-4 h-4" />
            Download
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <img src={result.url} alt="Generated result" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
      </div>
      <div className="px-5 py-3 border-t border-white/5 flex-shrink-0">
        <p className="text-[11px] text-white/25 font-mono leading-relaxed line-clamp-2">{result.prompt}</p>
      </div>
    </div>
  )
}

// ─── Main EditPage ────────────────────────────────────────────────────────────

export default function EditPage() {
  // ── Image state ──────────────────────────────────────────────────────────────
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null)

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('edit')
  const [activeTool, setActiveTool] = useState<Tool>('brush')
  const [brushSize, setBrushSize] = useState(28)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('nano-banana-2')
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  // ── Edit mode ─────────────────────────────────────────────────────────────────
  const [layers, setLayers] = useState<MaskLayer[]>([])
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([])
  const [textInput, setTextInput] = useState<{ visible: boolean; x: number; y: number; screenX: number; screenY: number }>({
    visible: false, x: 0, y: 0, screenX: 0, screenY: 0,
  })
  const [textValue, setTextValue] = useState('')
  const [rectDraw, setRectDraw] = useState<{ screenX: number; screenY: number; screenW: number; screenH: number; x: number; y: number; w: number; h: number } | null>(null)

  // ── Relight state ─────────────────────────────────────────────────────────────
  const [lightSettings, setLightSettings] = useState<LightSettings>({
    azimuth: 45, elevation: 35, color: '#ffffff', intensity: 70, softness: 'soft', sceneLock: true,
  })

  // ── Prompt mode ───────────────────────────────────────────────────────────────
  const [promptText, setPromptText] = useState('')
  const [promptRefUrl, setPromptRefUrl] = useState<string | null>(null)

  // ── Results ───────────────────────────────────────────────────────────────────
  const [results, setResults] = useState<GenerationResult[]>([])
  const [selectedResult, setSelectedResult] = useState<GenerationResult | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [dockOpen, setDockOpen] = useState(true)

  // ── Credits ───────────────────────────────────────────────────────────────────
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const creditCost = MODEL_REGISTRY[selectedModel]?.credits ?? 20

  // ── Canvas refs ───────────────────────────────────────────────────────────────
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const canvasSizeRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 })
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const promptRefInputRef = useRef<HTMLInputElement>(null)

  // Drawing refs (no re-render on each stroke)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef<Point | null>(null)
  const rectStartRef = useRef<Point | null>(null)
  const rectStartScreenRef = useRef<Point | null>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  // ── Credits fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/user/credits')
      .then(r => r.json())
      .then(c => setCreditBalance((c.subscription_credits ?? 0) + (c.permanent_credits ?? 0)))
      .catch(() => {})
  }, [])

  // ── Canvas rendering ──────────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = displayCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background image
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height)
    } else {
      // Checkerboard placeholder
      const sq = 20
      for (let y = 0; y < canvas.height; y += sq) {
        for (let x = 0; x < canvas.width; x += sq) {
          ctx.fillStyle = ((x / sq + y / sq) % 2 === 0) ? '#1a1a1a' : '#141414'
          ctx.fillRect(x, y, sq, sq)
        }
      }
    }

    // Draw each layer's mask canvas at 55% opacity
    for (const layer of layers) {
      const lc = layerCanvasesRef.current.get(layer.id)
      if (!lc) continue
      ctx.save()
      ctx.globalAlpha = 0.55
      ctx.drawImage(lc, 0, 0)
      ctx.restore()
    }

    // Draw text annotations
    for (const ann of textAnnotations) {
      ctx.font = `${ann.fontSize}px sans-serif`
      ctx.fillStyle = ann.color
      ctx.shadowColor = 'rgba(0,0,0,0.9)'
      ctx.shadowBlur = 5
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      ctx.fillText(ann.text, ann.x, ann.y)
    }
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }, [layers, textAnnotations])

  useEffect(() => { renderCanvas() }, [renderCanvas])

  // ── Load image onto canvas ────────────────────────────────────────────────────
  const loadImage = useCallback((src: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      bgImageRef.current = img
      const { w, h } = computeDisplaySize(img.naturalWidth, img.naturalHeight)
      canvasSizeRef.current = { w, h }
      setImageDims({ w: img.naturalWidth, h: img.naturalHeight })

      const canvas = displayCanvasRef.current
      if (!canvas) return
      canvas.width = w
      canvas.height = h

      // Resize existing layer canvases
      for (const [, lc] of layerCanvasesRef.current) {
        lc.width = w; lc.height = h
      }
      renderCanvas()
    }
    img.onerror = () => { img.crossOrigin = ''; img.src = src }
    img.src = src
  }, [renderCanvas])

  // ── File handling ─────────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const localUrl = URL.createObjectURL(file)
    setImageUrl(localUrl)
    loadImage(localUrl)
    setError(null)
    setResults([])

    // Upload to Bunny in background
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/images/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.image?.url) setImageUrl(data.image.url)
    } catch { /* keep local URL */ }
  }, [loadImage])

  // ── Layer management ──────────────────────────────────────────────────────────
  const addLayer = useCallback(() => {
    const usedColors = new Set(layers.map(l => l.color))
    const nextColor = LAYER_COLORS.find(c => !usedColors.has(c.hex)) ?? LAYER_COLORS[layers.length % LAYER_COLORS.length]!
    const id = uid()
    const { w, h } = canvasSizeRef.current
    const lc = document.createElement('canvas')
    lc.width = w; lc.height = h
    layerCanvasesRef.current.set(id, lc)
    const newLayer: MaskLayer = { id, color: nextColor.hex, colorName: nextColor.name, prompt: '', referenceImageUrl: null }
    setLayers(prev => [...prev, newLayer])
    setActiveLayerId(id)
  }, [layers])

  const removeLayer = useCallback((id: string) => {
    layerCanvasesRef.current.delete(id)
    setLayers(prev => prev.filter(l => l.id !== id))
    setActiveLayerId(prev => prev === id ? null : prev)
    setTimeout(renderCanvas, 0)
  }, [renderCanvas])

  const clearLayerStrokes = useCallback((id: string) => {
    const lc = layerCanvasesRef.current.get(id)
    if (lc) { lc.getContext('2d')?.clearRect(0, 0, lc.width, lc.height); renderCanvas() }
  }, [renderCanvas])

  const updateLayerPrompt = useCallback((id: string, prompt: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, prompt } : l))
  }, [])

  const updateLayerRefImage = useCallback((id: string, url: string | null) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, referenceImageUrl: url } : l))
  }, [])

  // ── Canvas coordinate helper ──────────────────────────────────────────────────
  const getCanvasPos = useCallback((e: React.MouseEvent): Point | null => {
    const canvas = displayCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * canvas.width / rect.width,
      y: (e.clientY - rect.top) * canvas.height / rect.height,
    }
  }, [])

  const getScreenPos = useCallback((e: React.MouseEvent): Point => ({
    x: e.clientX,
    y: e.clientY,
  }), [])

  // ── Drawing ────────────────────────────────────────────────────────────────────
  const paintAt = useCallback((x: number, y: number, prevX: number | null, prevY: number | null) => {
    if (!activeLayerId || activeTool === 'rect' || activeTool === 'text') return
    const lc = layerCanvasesRef.current.get(activeLayerId)
    if (!lc) return
    const ctx = lc.getContext('2d')
    if (!ctx) return
    const layer = layers.find(l => l.id === activeLayerId)
    if (!layer) return

    ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = layer.color
    ctx.fillStyle = layer.color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = 1

    ctx.beginPath()
    ctx.moveTo(prevX ?? x, prevY ?? y)
    ctx.lineTo(x, y)
    ctx.stroke()
    renderCanvas()
  }, [activeLayerId, activeTool, brushSize, layers, renderCanvas])

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!bgImageRef.current || !activeLayerId) return
    e.preventDefault()
    const pos = getCanvasPos(e)
    if (!pos) return

    if (activeTool === 'text') {
      const canvas = displayCanvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      setTextInput({ visible: true, x: pos.x, y: pos.y, screenX: e.clientX - rect.left, screenY: e.clientY - rect.top })
      setTextValue('')
      setTimeout(() => textInputRef.current?.focus(), 50)
      return
    }

    if (activeTool === 'rect') {
      isDrawingRef.current = true
      rectStartRef.current = pos
      rectStartScreenRef.current = { x: e.clientX, y: e.clientY }
      return
    }

    isDrawingRef.current = true
    lastPosRef.current = pos
    paintAt(pos.x, pos.y, null, null)
  }, [activeLayerId, activeTool, getCanvasPos, paintAt])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const pos = getCanvasPos(e)
    if (!pos) return

    if (activeTool === 'rect' && rectStartRef.current) {
      const canvas = displayCanvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scale = canvas.width / rect.width
      const startScreen = rectStartScreenRef.current!
      setRectDraw({
        screenX: Math.min(e.clientX, startScreen.x) - rect.left,
        screenY: Math.min(e.clientY, startScreen.y) - rect.top,
        screenW: Math.abs(e.clientX - startScreen.x),
        screenH: Math.abs(e.clientY - startScreen.y),
        x: Math.min(pos.x, rectStartRef.current.x),
        y: Math.min(pos.y, rectStartRef.current.y),
        w: Math.abs(pos.x - rectStartRef.current.x),
        h: Math.abs(pos.y - rectStartRef.current.y),
      })
      return
    }

    paintAt(pos.x, pos.y, lastPosRef.current?.x ?? null, lastPosRef.current?.y ?? null)
    lastPosRef.current = pos
  }, [activeTool, getCanvasPos, paintAt])

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    if (activeTool === 'rect' && rectDraw && activeLayerId) {
      const lc = layerCanvasesRef.current.get(activeLayerId)
      if (lc) {
        const ctx = lc.getContext('2d')
        if (ctx) {
          const layer = layers.find(l => l.id === activeLayerId)
          if (layer) {
            ctx.fillStyle = layer.color
            ctx.globalCompositeOperation = 'source-over'
            ctx.globalAlpha = 1
            ctx.fillRect(rectDraw.x, rectDraw.y, rectDraw.w, rectDraw.h)
            renderCanvas()
          }
        }
      }
    }

    setRectDraw(null)
    rectStartRef.current = null
    rectStartScreenRef.current = null
    lastPosRef.current = null
  }, [activeTool, rectDraw, activeLayerId, layers, renderCanvas])

  // ── Text annotation commit ────────────────────────────────────────────────────
  const commitText = useCallback(() => {
    if (!textValue.trim()) { setTextInput(prev => ({ ...prev, visible: false })); return }
    const ann: TextAnnotation = {
      id: uid(), text: textValue, x: textInput.x, y: textInput.y, color: '#FFFF00', fontSize: 20,
    }
    setTextAnnotations(prev => [...prev, ann])
    setTextInput(prev => ({ ...prev, visible: false }))
    setTextValue('')
  }, [textValue, textInput])

  // ── Generate ──────────────────────────────────────────────────────────────────
  const canGenerate = useMemo(() => {
    if (!imageUrl || isGenerating) return false
    if (mode === 'edit') return layers.some(l => l.prompt.trim())
    if (mode === 'relight') return true
    if (mode === 'prompt') return !!promptText.trim()
    return false
  }, [imageUrl, isGenerating, mode, layers, promptText])

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !imageUrl) return
    setIsGenerating(true)
    setError(null)

    try {
      let compositeDataUrl: string | undefined
      let combinedPrompt = ''
      const referenceImages: string[] = []

      if (mode === 'edit') {
        // Export the current display canvas (image + colored mask overlays) — ALL masks in ONE image
        compositeDataUrl = displayCanvasRef.current?.toDataURL('image/png') ?? undefined

        const activeLayers = layers.filter(l => l.prompt.trim())
        combinedPrompt =
          activeLayers.map(l => `In the ${l.colorName} highlighted region: ${l.prompt.trim()}`).join('. ') +
          '. Keep all non-highlighted areas completely unchanged.'

        // Collect per-layer reference images
        for (const l of layers) {
          if (l.referenceImageUrl) referenceImages.push(l.referenceImageUrl)
        }
      } else if (mode === 'relight') {
        combinedPrompt = generateRelightPrompt(lightSettings)
      } else {
        combinedPrompt = promptText.trim()
        if (promptRefUrl) referenceImages.push(promptRefUrl)
      }

      const res = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositeDataUrl,
          originalImageUrl: imageUrl,
          masks: layers.map(l => ({ color: l.color, colorName: l.colorName, prompt: l.prompt })),
          model: selectedModel,
          combinedPrompt,
          referenceImages,
          mode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) setError('Not enough credits — please top up to continue.')
        else setError(data.error ?? 'Generation failed. Please try again.')
        return
      }

      const result: GenerationResult = {
        id: uid(), url: data.outputUrl, mode, timestamp: Date.now(),
        inputUrl: imageUrl, prompt: combinedPrompt,
      }
      setResults(prev => [result, ...prev])
      setDockOpen(true)

      // Refresh credits
      fetch('/api/user/credits').then(r => r.json())
        .then(c => setCreditBalance((c.subscription_credits ?? 0) + (c.permanent_credits ?? 0)))
        .catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsGenerating(false)
    }
  }, [canGenerate, imageUrl, mode, layers, lightSettings, promptText, promptRefUrl, selectedModel])

  // ── Use result as new input ────────────────────────────────────────────────────
  const useAsInput = useCallback((result: GenerationResult) => {
    setImageUrl(result.url)
    loadImage(result.url)
    setLayers([])
    layerCanvasesRef.current.clear()
    setActiveLayerId(null)
    setTextAnnotations([])
    setShowResultModal(false)
    setError(null)
  }, [loadImage])

  // ── Cursor style ───────────────────────────────────────────────────────────────
  const canvasCursor = !bgImageRef.current ? 'default'
    : !activeLayerId || mode !== 'edit' ? 'not-allowed'
    : activeTool === 'eraser' ? 'cell'
    : activeTool === 'text' ? 'text'
    : activeTool === 'rect' ? 'crosshair'
    : 'crosshair'

  // ── Active layer color ─────────────────────────────────────────────────────────
  const activeLayer = layers.find(l => l.id === activeLayerId)

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-white selection:bg-[#FFFF00] selection:text-black">
      <div className="flex-1 pt-16 w-full grid grid-cols-1 lg:grid-cols-[420px_1fr] items-start">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <div className="flex flex-col border-r border-white/5 bg-[#0c0c0e] z-20 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] order-2 lg:order-1">

          {/* Input image + right cell */}
          <div className="border-b border-white/5">
            <div className="grid grid-cols-[40%_60%] gap-4 px-5 pt-5 pb-[0.3rem]">
              <div className="flex items-center justify-between h-6">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Source Image</span>
                {imageUrl && (
                  <button
                    onClick={() => { setImageUrl(null); bgImageRef.current = null; setLayers([]); layerCanvasesRef.current.clear(); setTextAnnotations([]); renderCanvas() }}
                    className="p-2 -mr-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center h-6">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                  {mode === 'edit' ? 'Draw Tools' : mode === 'relight' ? 'Quick Presets' : 'Instruction'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[40%_60%] gap-4 px-5 pt-1 pb-4">
              {/* Image thumbnail */}
              <label className="aspect-square rounded-xl bg-[#050505] border border-white/5 overflow-hidden cursor-pointer hover:border-[#FFFF00]/20 transition-colors relative">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <IconUpload className="w-6 h-6 text-white/20" />
                    <span className="text-[10px] text-white/20">Upload</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </label>

              {/* Right cell — mode-dependent */}
              {mode === 'edit' && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    {getCanvasTools().map(t => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTool(t.id)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all',
                          activeTool === t.id
                            ? 'bg-[#FFFF00] border-[#FFFF00] text-black'
                            : 'bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/20 hover:text-white'
                        )}
                      >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-white/30">Size</span>
                    <input
                      type="range" min={4} max={80} value={brushSize}
                      onChange={e => setBrushSize(Number(e.target.value))}
                      className="flex-1 accent-[#FFFF00]"
                    />
                    <span className="text-[10px] text-white/40 w-5 tabular-nums">{brushSize}</span>
                  </div>
                </div>
              )}

              {mode === 'relight' && (
                <div className="grid grid-cols-2 gap-1.5">
                  {RELIGHT_PRESETS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => setLightSettings(prev => ({ ...prev, azimuth: p.azimuth, elevation: p.elevation }))}
                      className={cn(
                        'px-2 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all',
                        lightSettings.azimuth === p.azimuth && lightSettings.elevation === p.elevation
                          ? 'bg-white/[0.09] border-white/20 text-[#FFFF00]'
                          : 'bg-white/[0.02] border-white/5 text-gray-500 hover:text-white hover:border-white/15'
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {mode === 'prompt' && (
                <div className="flex items-start pt-1">
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Edit the entire image using a text instruction — no masking needed.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mode tabs (Tier 2 segmented control) */}
          <div className="flex bg-[rgb(255_255_255_/_0.04)] mx-5 my-3 p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)]">
            {(['edit', 'relight', 'prompt'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 py-2 text-[11px] font-black rounded-md uppercase tracking-wider transition-all',
                  mode === m ? 'bg-white/[0.09] text-[#FFFF00] shadow-sm' : 'text-gray-500 hover:text-white'
                )}
              >
                {m === 'edit' ? 'Edit' : m === 'relight' ? 'Relight' : 'Prompt'}
              </button>
            ))}
          </div>

          {/* Scrollable controls */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-28">

            {/* ── Edit mode: mask layers ───────────────────────────────────── */}
            {mode === 'edit' && (
              <>
                {layers.map(layer => (
                  <MaskLayerCard
                    key={layer.id}
                    layer={layer}
                    isActive={activeLayerId === layer.id}
                    onSelect={() => setActiveLayerId(layer.id)}
                    onUpdatePrompt={p => updateLayerPrompt(layer.id, p)}
                    onAttachRef={url => updateLayerRefImage(layer.id, url)}
                    onClearStrokes={() => clearLayerStrokes(layer.id)}
                    onDelete={() => removeLayer(layer.id)}
                  />
                ))}
                <button
                  onClick={addLayer}
                  disabled={!imageUrl}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-white/10 text-white/30 hover:border-[#FFFF00]/35 hover:text-[#FFFF00]/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed text-sm"
                >
                  <IconPlus className="w-4 h-4" />
                  Add Mask Layer
                </button>
                {layers.length > 0 && (
                  <p className="text-[10px] text-white/20 text-center px-2 leading-relaxed">
                    All {layers.length} layer{layers.length !== 1 ? 's' : ''} sent in a single generation — one credit charge total.
                  </p>
                )}
              </>
            )}

            {/* ── Relight mode ─────────────────────────────────────────────── */}
            {mode === 'relight' && (
              <div className="space-y-3">
                {/* 3D Light Orb */}
                <div className="rounded-xl bg-[#07071a] border border-white/5 p-4 flex flex-col items-center gap-3">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider self-start">Light Position</span>
                  <LightOrb
                    azimuth={lightSettings.azimuth}
                    elevation={lightSettings.elevation}
                    lightColor={lightSettings.color}
                    onAzimuthChange={az => setLightSettings(prev => ({ ...prev, azimuth: az }))}
                    onElevationChange={el => setLightSettings(prev => ({ ...prev, elevation: el }))}
                  />
                </div>

                {/* Light color */}
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 space-y-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Light Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color" value={lightSettings.color}
                      onChange={e => setLightSettings(prev => ({ ...prev, color: e.target.value }))}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
                      style={{ outline: 'none' }}
                    />
                    <input
                      type="text" value={lightSettings.color}
                      onChange={e => setLightSettings(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-white/25"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {LIGHT_COLOR_PRESETS.map(c => (
                      <button
                        key={c}
                        onClick={() => setLightSettings(prev => ({ ...prev, color: c }))}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-all',
                          lightSettings.color === c ? 'border-white/70 scale-110' : 'border-white/15 hover:border-white/40'
                        )}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Intensity */}
                <div className="space-y-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-semibold text-white">Intensity</span>
                    <span className="font-mono text-[12px] text-white bg-white/5 px-1.5 py-0.5 rounded">{lightSettings.intensity}%</span>
                  </div>
                  <MechanicalSlider
                    value={[lightSettings.intensity]} min={10} max={100} step={5}
                    leftLabel="Dim" rightLabel="Bright"
                    onChange={([v]) => setLightSettings(prev => ({ ...prev, intensity: v }))}
                  />
                </div>

                {/* Hard / Soft + Scene Lock */}
                <div className="flex gap-2">
                  {(['soft', 'hard'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setLightSettings(prev => ({ ...prev, softness: type }))}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all',
                        lightSettings.softness === type
                          ? 'bg-white/[0.09] border-white/20 text-[#FFFF00]'
                          : 'bg-transparent border-white/5 text-gray-500 hover:text-white'
                      )}
                    >
                      {type} Light
                    </button>
                  ))}
                </div>

                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Scene Lock</span>
                    <p className="text-[11px] text-white/30 mt-0.5">Preserve character pose & consistency</p>
                  </div>
                  <Switch
                    checked={lightSettings.sceneLock}
                    onCheckedChange={v => setLightSettings(prev => ({ ...prev, sceneLock: v }))}
                    className="scale-90 origin-right"
                  />
                </div>

                {/* Prompt preview */}
                <div className="rounded-xl bg-black/40 border border-white/5 p-3">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider block mb-1.5">Generated Prompt</span>
                  <p className="text-[11px] text-white/35 leading-relaxed font-mono">{generateRelightPrompt(lightSettings)}</p>
                </div>
              </div>
            )}

            {/* ── Prompt mode ──────────────────────────────────────────────── */}
            {mode === 'prompt' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider px-1">Edit Instruction</label>
                  <textarea
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    rows={5}
                    placeholder="e.g. Change the background to a sunset beach, make the jacket red, add dramatic shadows..."
                    className="w-full bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors leading-relaxed"
                  />
                </div>

                {/* Optional reference image */}
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 space-y-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Reference Image (optional)</span>
                  {promptRefUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={promptRefUrl} alt="" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                      <span className="text-xs text-white/40 flex-1">Reference attached</span>
                      <button onClick={() => setPromptRefUrl(null)} className="text-white/20 hover:text-red-400 transition-colors">
                        <IconX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white/30 hover:text-white/60 transition-colors py-1">
                      <IconPhoto className="w-4 h-4" />
                      Attach style / reference image
                      <input
                        ref={promptRefInputRef}
                        type="file" accept="image/*" className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const fd = new FormData(); fd.append('file', file)
                          try {
                            const res = await fetch('/api/images/upload', { method: 'POST', body: fd })
                            const d = await res.json()
                            setPromptRefUrl(d.image?.url ?? URL.createObjectURL(file))
                          } catch { setPromptRefUrl(URL.createObjectURL(file)) }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Model selector (all modes) */}
            <div className="rounded-xl overflow-hidden border border-white/5">
              <div className="flex items-center gap-2 p-3 border-b border-white/5 bg-white/[0.02]">
                <div className="p-1.5 rounded bg-black/20 text-[#FFFF00]">
                  <IconSparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Model</span>
              </div>
              <div className="p-2 bg-black/20">
                <div className="flex flex-col gap-1 bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)]">
                  {EDIT_MODELS.map(id => {
                    const m = MODEL_REGISTRY[id]
                    if (!m) return null
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedModel(id)}
                        className={cn(
                          'w-full py-2.5 px-3 text-xs font-[900] rounded-md uppercase tracking-wider flex items-center justify-between transition-all',
                          selectedModel === id ? 'bg-[#FFFF00] text-black shadow-md' : 'text-gray-400 hover:text-white'
                        )}
                      >
                        <span>{m.label}{m.qualityTier ? ` · ${m.qualityTier}` : ''}</span>
                        <div className={cn('flex items-center gap-1', selectedModel === id ? 'text-black/50' : 'text-white/30')}>
                          <CreditIcon className="w-3 h-3" />
                          <span>{m.credits}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-300 flex items-start gap-2">
                <IconX className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ── Fixed footer CTA ─────────────────────────────────────────── */}
          <div className="lg:fixed lg:bottom-0 lg:left-0 lg:w-[420px] relative w-full bg-[#0c0c0e] border-t border-white/5 z-40">
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Estimated Cost</span>
                <div className="flex items-center gap-2">
                  <CreditIcon className="w-5 h-5 rounded-md" />
                  <span className="font-mono font-medium text-white/90">{creditCost}</span>
                  {creditBalance !== null && (
                    <span className="text-white/25 text-xs">/ {creditBalance.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full bg-[#FFFF00] hover:bg-[#e6e600] text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.25)] disabled:opacity-25 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
              >
                {isGenerating ? (
                  <><IconLoader2 className="w-5 h-5 animate-spin" /> Generating…</>
                ) : (
                  <><IconWand className="w-5 h-5 fill-black" /> Apply Edit</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT CANVAS ──────────────────────────────────────────────────── */}
        <div
          className="relative flex flex-col px-4 pt-2 pb-4 lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-4.5rem)] overflow-y-auto order-1 lg:order-2"
          onDragOver={e => { e.preventDefault(); setIsDraggingFile(true) }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={e => {
            e.preventDefault(); setIsDraggingFile(false)
            const f = e.dataTransfer.files[0]; if (f) handleFile(f)
          }}
        >
          {/* Canvas toolbar */}
          {imageUrl && mode === 'edit' && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {getCanvasTools().map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTool(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                    activeTool === t.id
                      ? 'bg-[#FFFF00]/10 border-[#FFFF00]/40 text-[#FFFF00]'
                      : 'bg-white/5 border-white/8 text-white/50 hover:text-white hover:border-white/25'
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
              <div className="h-5 w-px bg-white/10" />
              {activeLayer && (
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: activeLayer.color }} />
                  Painting: <span className="text-white/70">{activeLayer.colorName}</span>
                </div>
              )}
              {!activeLayerId && layers.length > 0 && (
                <span className="text-white/25 text-xs">Select a layer to paint</span>
              )}
              {layers.length === 0 && (
                <span className="text-white/25 text-xs">Add a layer in the panel →</span>
              )}
            </div>
          )}

          {/* Canvas area */}
          <div
            ref={containerRef}
            className={cn(
              'w-full relative flex items-center justify-center bg-[#050505] rounded-2xl border transition-colors flex-1 min-h-[400px] overflow-hidden',
              isDraggingFile ? 'border-[#FFFF00]/40' : 'border-white/5'
            )}
          >
            {!imageUrl ? (
              /* Upload drop zone */
              <label className="flex flex-col items-center justify-center gap-4 cursor-pointer w-full h-full">
                <div className={cn(
                  'flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed transition-all',
                  isDraggingFile ? 'border-[#FFFF00]/60 bg-[#FFFF00]/5' : 'border-white/10'
                )}>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                    <IconUpload className="w-7 h-7 text-white/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-white/60 font-medium">Drop an image here or click to upload</p>
                    <p className="text-white/25 text-sm mt-1">PNG, JPG, WebP — max 10MB</p>
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </label>
            ) : (
              <>
                <canvas
                  ref={displayCanvasRef}
                  className="block max-w-full max-h-full"
                  style={{ cursor: canvasCursor, touchAction: 'none' }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={e => { if (isDrawingRef.current) onMouseUp(e) }}
                />

                {/* Floating text input */}
                {textInput.visible && (
                  <div className="absolute z-20" style={{ left: textInput.screenX, top: textInput.screenY }}>
                    <input
                      ref={textInputRef}
                      value={textValue}
                      onChange={e => setTextValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitText()
                        if (e.key === 'Escape') { setTextInput(p => ({ ...p, visible: false })); setTextValue('') }
                      }}
                      onBlur={commitText}
                      className="bg-black/90 border border-[#FFFF00]/40 text-[#FFFF00] text-sm px-3 py-1.5 rounded-lg outline-none min-w-[160px] placeholder-white/30 shadow-xl"
                      placeholder="Type & Enter…"
                    />
                  </div>
                )}

                {/* Rect drawing preview */}
                {rectDraw && activeLayer && (
                  <div
                    className="absolute pointer-events-none border-2 rounded-sm"
                    style={{
                      left: rectDraw.screenX,
                      top: rectDraw.screenY,
                      width: rectDraw.screenW,
                      height: rectDraw.screenH,
                      borderColor: activeLayer.color,
                      background: `${activeLayer.color}22`,
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* Status bar */}
          <div className="mt-3 flex justify-between items-center text-[10px] text-gray-700 font-mono uppercase tracking-wider">
            <div>
              {imageDims ? `Source: ${imageDims.w}×${imageDims.h}` : 'No image loaded'}
            </div>
            <div>Sharpii Edit v2.0</div>
          </div>
        </div>
      </div>

      {/* ── RESULTS DOCK ──────────────────────────────────────────────────────── */}
      {results.length > 0 && (
        <div className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/8 transition-all duration-300',
          dockOpen ? 'translate-y-0' : 'translate-y-[calc(100%-2.5rem)]'
        )}>
          {/* Dock header */}
          <button
            className="w-full flex items-center gap-3 px-4 h-10 hover:bg-white/[0.02] transition-colors"
            onClick={() => setDockOpen(p => !p)}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />
            <span className="text-xs font-bold text-white/70">
              {results.length} Result{results.length !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-white/25 font-mono">
              {new Date(results[0]!.timestamp).toLocaleTimeString()}
            </span>
            <div className="flex-1" />
            {dockOpen
              ? <IconChevronDown className="w-4 h-4 text-white/25" />
              : <IconChevronUp className="w-4 h-4 text-white/25" />}
          </button>

          {/* Thumbnails */}
          {dockOpen && (
            <div className="flex gap-3 px-4 pb-4 overflow-x-auto">
              {results.map(result => (
                <button
                  key={result.id}
                  onClick={() => { setSelectedResult(result); setShowResultModal(true) }}
                  className="flex-shrink-0 relative group"
                >
                  <img
                    src={result.url} alt=""
                    className="w-20 h-20 object-cover rounded-xl border border-white/10 group-hover:border-[#FFFF00]/50 transition-colors"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 rounded-xl transition-colors flex items-center justify-center">
                    <IconMaximize className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-1 left-1 bg-black/70 rounded px-1 py-0.5 text-[8px] text-white/50 uppercase">
                    {result.mode}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RESULT MODAL ──────────────────────────────────────────────────────── */}
      {showResultModal && selectedResult && (
        <ResultModal
          result={selectedResult}
          onClose={() => setShowResultModal(false)}
          onUseAsInput={useAsInput}
        />
      )}

      {/* Hidden file input for drag-drop */}
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

// alias for tabler icon used in MaskLayerCard
const IconBrush = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    <path d="M21 12h-8c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h8" />
  </svg>
)
