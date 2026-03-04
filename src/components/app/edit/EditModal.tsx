'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { CreditIcon } from '@/components/ui/CreditIcon'
import { MODEL_REGISTRY } from '@/services/models'
import { cn } from '@/lib/utils'
import {
  IconUpload, IconTrash, IconPlus, IconWand, IconEraser,
  IconBrush, IconLoader2, IconDownload, IconX, IconPhoto,
  IconTypography, IconSquare, IconSparkles, IconRefresh,
  IconChevronDown, IconChevronUp, IconPencil, IconBulb, IconAi,
  IconCloudUpload, IconArrowBackUp, IconArrowForwardUp, IconPhotoPlus,
} from '@tabler/icons-react'
import { useTaskManager } from '@/components/providers/TaskManagerProvider'
import { useCredits } from '@/lib/hooks/use-credits'

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'edit' | 'relight' | 'prompt'
type Tool = 'brush' | 'eraser' | 'rect' | 'text'

interface MaskLayer {
  id: string
  color: string
  colorName: string
  prompt: string
  referenceImageUrls: string[]
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

// ─── Component Props ──────────────────────────────────────────────────────────

export interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  initialImageUrl?: string
  sourceContext: 'standalone' | 'image-page' | 'history-page'
  onGenerationStart?: (historyId: string, mode: string) => void
  onGenerationComplete?: (imageUrl: string, historyId: string, mode: string, prompt: string) => void
}

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
  '#ffffff',  // studio white
  '#ffd080',  // golden hour
  '#7eb8ff',  // cool blue
  '#ff5533',  // fire red
  '#00ffaa',  // neon teal
]

const LIGHTING_STYLES = [
  { id: 'studio',    name: 'Studio',    color: '#ffffff', az: 0,   el: 55, intensity: 88, softness: 'soft' as const },
  { id: 'golden',    name: 'Golden Hr', color: '#ff8800', az: 275, el: 5,  intensity: 78, softness: 'soft' as const },
  { id: 'moonlight', name: 'Moonlight', color: '#8ab0e0', az: 210, el: 68, intensity: 45, softness: 'soft' as const },
  { id: 'campfire',  name: 'Campfire',  color: '#ff4400', az: 0,   el: -12, intensity: 88, softness: 'hard' as const },
  { id: 'spotlight', name: 'Spotlight', color: '#ffffff', az: 0,   el: 90, intensity: 100, softness: 'hard' as const },
  { id: 'window',    name: 'Window',    color: '#c8e0ff', az: 90,  el: 40, intensity: 58, softness: 'soft' as const },
  { id: 'neon',      name: 'Neon',      color: '#00ffcc', az: 180, el: 18, intensity: 75, softness: 'hard' as const },
  { id: 'horror',    name: 'Horror',    color: '#660000', az: 0,   el: -50, intensity: 95, softness: 'hard' as const },
  { id: 'sunset',    name: 'Sunset',    color: '#ff2200', az: 282, el: 4,  intensity: 82, softness: 'soft' as const },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return crypto.randomUUID() }

function computeDisplaySize(nw: number, nh: number): { w: number; h: number } {
  // Responsive canvas sizing — mobile-first approach
  const isMobile = window.innerWidth < 1024
  const maxW = isMobile
    ? Math.min(window.innerWidth - 32, 600)  // mobile: full width minus padding
    : Math.min(window.innerWidth - 400, 860)  // desktop: reserve for left panel + gaps
  const maxH = isMobile
    ? Math.min(window.innerHeight * 0.45, 500)  // mobile: use 45% of viewport height
    : Math.min(window.innerHeight - 210, 700)
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

function hexToRgbDesc(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (r > 220 && g > 220 && b > 220) return 'cool white'
  if (r > 220 && g > 160 && b < 120) return 'warm golden amber'
  if (r > 220 && g > 200 && b < 80) return 'bright yellow sunlight'
  if (r < 80 && g > 180 && b > 180) return 'cool cyan-teal'
  if (r > 200 && g < 100 && b < 100) return 'deep red'
  if (r > 200 && g < 100 && b > 200) return 'vivid magenta'
  if (r < 80 && g < 80 && b > 200) return 'electric blue neon'
  if (r > 150 && g > 200 && b < 80) return 'lime green neon'
  return `colored (${r},${g},${b})`
}

function generateRelightPrompt(s: LightSettings) {
  const colorDesc = hexToRgbDesc(s.color)
  const bright = s.intensity > 85 ? 'extremely powerful'
    : s.intensity > 65 ? 'strong'
    : s.intensity > 40 ? 'moderate'
    : 'dim and subtle'
  const dirDesc = azToDesc(s.azimuth)
  const elDesc = elToDesc(s.elevation)
  const lock = s.sceneLock
    ? 'Keep the exact subject pose, face, clothing, and all scene objects identical — only change the lighting and shadows. '
    : 'You may slightly adjust scene elements to make the lighting more convincing. '

  // Derive the geometric shadow direction from azimuth (light comes FROM dirDesc → shadow falls opposite)
  const az = ((s.azimuth % 360) + 360) % 360
  const shadowFallDir =
    az < 22.5 || az >= 337.5 ? 'directly behind the subject (away from camera)'
    : az < 67.5  ? 'toward the back-left of the scene'
    : az < 112.5 ? 'toward the left side of the scene'
    : az < 157.5 ? 'toward the front-left of the scene'
    : az < 202.5 ? 'directly in front of the subject (toward camera)'
    : az < 247.5 ? 'toward the front-right of the scene'
    : az < 292.5 ? 'toward the right side of the scene'
    : 'toward the back-right of the scene'

  // Elevation-based shadow length
  const shadowLen = s.elevation > 60 ? 'short, directly beneath objects (overhead light)'
    : s.elevation > 35 ? 'moderately short and angled'
    : s.elevation > 10 ? 'medium length, clearly angled'
    : s.elevation > -10 ? 'long, nearly horizontal (eye-level light)'
    : 'very long, stretched away from the light (uplighting)'

  const softEdge = s.softness === 'soft'
    ? 'soft-edged shadows with smooth penumbra transitions'
    : 'hard-edged shadows with sharp crisp terminator lines'

  return (
    `COMPLETELY REPLACE the entire lighting of this scene. STEP 1 — ELIMINATE all existing light sources: remove all ambient daylight, sunlight, artificial lights, and every shadow from the original image. The scene must appear as if it was never lit before. ` +
    `STEP 2 — RELIGHT from absolute scratch with a ${bright} ${colorDesc} light source coming from ${dirDesc}, ${elDesc}. ${lock}` +
    `This new light is the ONLY source — zero daylight leakage, zero residual brightness from the original scene, no mixing of old and new lighting. ` +
    `SHADOW PHYSICS: Cast new 3D contact shadows and directional cast-shadows falling ${shadowFallDir}, ${shadowLen}. ` +
    `Every vertical object must cast a shadow on the ground and adjacent surfaces in that direction. ` +
    `Every horizontal surface must show cast shadows from objects above. Shadow edges must be ${softEdge}. ` +
    `The lit face of every object (side facing ${dirDesc}) must be bright with ${colorDesc} tones; the unlit face must be significantly darker. ` +
    `SURFACE SHADING: Apply realistic diffuse shading across all curved surfaces following 3D geometry. ` +
    `Skin on the lit side gets ${colorDesc} specular highlights; skin on the shadow side gets deep shadow with a subtle bounce fill. ` +
    `Ambient occlusion: creases, folds, corners must stay darker regardless of light direction. ` +
    `COLOR TEMPERATURE: The entire scene — sky, background, walls, ambient — must completely transform to match ${colorDesc}. No trace of the original lighting's color temperature should remain. ` +
    `Final result must look like a physically-accurate re-render under only this new light — not a filter, tint, or overlay applied on top of the original photo.`
  )
}

// ─── WireframeSphere ─────────────────────────────────────────────────────────

const WIREFRAME_PRESETS = [
  { name: 'Top',   az: 0,   el: 85  },
  { name: 'Front', az: 0,   el: 25  },
  { name: 'Right', az: 90,  el: 25  },
  { name: 'Left',  az: 270, el: 25  },
  { name: 'Back',  az: 180, el: 25  },
  { name: 'Below', az: 0,   el: -60 },
]

function WireframeSphere({
  azimuth, elevation, lightColor, intensity,
  onAzimuthChange, onElevationChange,
  size = 180,
}: {
  azimuth: number; elevation: number; lightColor: string; intensity: number
  onAzimuthChange: (v: number) => void
  onElevationChange: (v: number) => void
  size?: number
}) {
  const svgRef  = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const startRef = useRef({ x: 0, y: 0, az: 0, el: 0 })

  const R   = (size / 2) - 9
  const cx  = size / 2
  const cy  = size / 2
  const CAM = 22 * Math.PI / 180

  const project = (x: number, y: number, z: number) => ({
    px:    cx + x * R,
    py:    cy - (y * Math.cos(CAM) - z * Math.sin(CAM)) * R,
    depth: y * Math.sin(CAM) + z * Math.cos(CAM),
  })

  const gridYaw   = azimuth   * 0.7  * Math.PI / 180
  const gridPitch = elevation * 0.25 * Math.PI / 180
  const gridProject = (x: number, y: number, z: number) => {
    const cosY = Math.cos(gridYaw),  sinY = Math.sin(gridYaw)
    const rx  =  x * cosY + z * sinY
    const rz  = -x * sinY + z * cosY
    const cosX = Math.cos(gridPitch), sinX = Math.sin(gridPitch)
    const ry2 = y * cosX - rz * sinX
    const rz2 = y * sinX + rz * cosX
    return {
      px:    cx + rx * R,
      py:    cy - (ry2 * Math.cos(CAM) - rz2 * Math.sin(CAM)) * R,
      depth: ry2 * Math.sin(CAM) + rz2 * Math.cos(CAM),
    }
  }

  const latPts = (elDeg: number, steps = 80) => {
    const el = elDeg * Math.PI / 180
    return Array.from({ length: steps + 1 }, (_, i) => {
      const az = (i / steps) * 2 * Math.PI
      return gridProject(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    })
  }

  const longPts = (azDeg: number, steps = 120) => {
    const az = azDeg * Math.PI / 180
    return Array.from({ length: steps + 1 }, (_, i) => {
      const el = -Math.PI / 2 + (i / steps) * 2 * Math.PI
      return gridProject(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    })
  }

  const splitSegs = (pts: Array<{ px: number; py: number; depth: number }>) => {
    const vis: string[] = [], hid: string[] = []
    const f = pts[0]; if (!f) return { vis, hid }
    let cur = `M${f.px.toFixed(1)},${f.py.toFixed(1)}`, isVis = f.depth >= 0
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i]; if (!p) continue
      const v = p.depth >= 0
      const c = `${p.px.toFixed(1)},${p.py.toFixed(1)}`
      if (v !== isVis) {
        if (cur.length > 1) (isVis ? vis : hid).push(cur)
        cur = `M${c}`; isVis = v
      } else { cur += ` L${c}` }
    }
    if (cur.length > 1) (isVis ? vis : hid).push(cur)
    return { vis, hid }
  }

  const azR  = azimuth   * Math.PI / 180
  const elR  = elevation * Math.PI / 180
  const lProj = project(
    Math.sin(azR) * Math.cos(elR),
    Math.sin(elR),
    Math.cos(azR) * Math.cos(elR),
  )
  const { px: lsx, py: lsy, depth: lDep } = lProj
  const onFront = lDep >= 0
  const intN    = intensity / 100
  const opM     = onFront ? 1 : 0.18

  const toCenter  = Math.atan2(cy - lsy, cx - lsx)
  const HALF_CONE = 17 * Math.PI / 180
  const N_RAYS    = 11
  const rays = Array.from({ length: N_RAYS }, (_, i) => {
    const t = i / (N_RAYS - 1)
    const a = toCenter + (t - 0.5) * 2 * HALF_CONE
    const d = Math.hypot(lsx - cx, lsy - cy) + 16
    return { x2: lsx + Math.cos(a) * d, y2: lsy + Math.sin(a) * d }
  })

  const latSegs  = [-60, -30, 0, 30, 60].map(e => splitSegs(latPts(e)))
  const longSegs = [0, 30, 60, 90, 120, 150].map(a => splitSegs(longPts(a)))

  const AZ_SENS = 180 / R
  const EL_SENS = 90  / R

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
    onAzimuthChange(Math.round(((startRef.current.az + dx * AZ_SENS) % 360 + 360) % 360))
    onElevationChange(Math.round(Math.max(-85, Math.min(85, startRef.current.el - dy * EL_SENS))))
  }
  const onPointerUp = () => { dragging.current = false }

  const uid = 'wfs'
  const bloomR = 16 + intN * 26

  return (
    <svg
      ref={svgRef}
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ cursor: 'grab', touchAction: 'none', userSelect: 'none', display: 'block' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <defs>
        <radialGradient id={`${uid}-bg`} cx="42%" cy="34%" r="70%">
          <stop offset="0%"   stopColor="#1d1d1d" />
          <stop offset="100%" stopColor="#020202" />
        </radialGradient>

        <radialGradient id={`${uid}-lit`} gradientUnits="userSpaceOnUse"
          cx={lsx.toFixed(1)} cy={lsy.toFixed(1)} r={`${(R * 1.3).toFixed(1)}`}
          fx={lsx.toFixed(1)} fy={lsy.toFixed(1)}>
          <stop offset="0%"   stopColor={lightColor}
            stopOpacity={((0.08 + intN * 0.22) * opM).toFixed(3)} />
          <stop offset="45%"  stopColor={lightColor} stopOpacity="0" />
        </radialGradient>

        <radialGradient id={`${uid}-bloom`} gradientUnits="userSpaceOnUse"
          cx={lsx.toFixed(1)} cy={lsy.toFixed(1)} r={`${bloomR.toFixed(1)}`}
          fx={lsx.toFixed(1)} fy={lsy.toFixed(1)}>
          <stop offset="0%"   stopColor="#ffffff"    stopOpacity={opM.toFixed(3)} />
          <stop offset="8%"   stopColor={lightColor} stopOpacity={((0.85 + intN * 0.15) * opM).toFixed(3)} />
          <stop offset="28%"  stopColor={lightColor} stopOpacity={((0.30 + intN * 0.25) * opM).toFixed(3)} />
          <stop offset="60%"  stopColor={lightColor} stopOpacity={(intN * 0.14 * opM).toFixed(3)} />
          <stop offset="100%" stopColor={lightColor} stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${uid}-ray`} gradientUnits="userSpaceOnUse"
          x1={lsx.toFixed(1)} y1={lsy.toFixed(1)}
          x2={cx.toFixed(1)}  y2={cy.toFixed(1)}>
          <stop offset="0%"   stopColor={lightColor} stopOpacity={((0.25 + intN * 0.55) * opM).toFixed(3)} />
          <stop offset="100%" stopColor={lightColor} stopOpacity="0" />
        </linearGradient>

        <clipPath id={`${uid}-clip`}>
          <circle cx={cx} cy={cy} r={R} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={R} fill={`url(#${uid}-bg)`} />
      <circle cx={cx} cy={cy} r={R} fill={`url(#${uid}-lit)`}
        clipPath={`url(#${uid}-clip)`} />

      <g clipPath={`url(#${uid}-clip)`}>
        {rays.map((ray, i) => (
          <line key={i}
            x1={lsx} y1={lsy} x2={ray.x2} y2={ray.y2}
            stroke={`url(#${uid}-ray)`}
            strokeWidth={i === (N_RAYS >> 1) ? 1.7 : 0.85}
            strokeLinecap="round"
          />
        ))}
      </g>

      <g clipPath={`url(#${uid}-clip)`}>
        {latSegs.map((s, i) => s.hid.map((d, j) => (
          <path key={`lh${i}${j}`} d={d} fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth="0.65" strokeDasharray="2,4" />
        )))}
        {longSegs.map((s, i) => s.hid.map((d, j) => (
          <path key={`mh${i}${j}`} d={d} fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth="0.65" strokeDasharray="2,4" />
        )))}
      </g>

      <g clipPath={`url(#${uid}-clip)`}>
        {latSegs.map((s, i) => s.vis.map((d, j) => (
          <path key={`lv${i}${j}`} d={d} fill="none"
            stroke="rgba(255,255,255,0.26)" strokeWidth="0.9" />
        )))}
        {longSegs.map((s, i) => s.vis.map((d, j) => (
          <path key={`mv${i}${j}`} d={d} fill="none"
            stroke="rgba(255,255,255,0.26)" strokeWidth="0.9" />
        )))}
      </g>

      <circle cx={cx} cy={cy} r={R} fill="none"
        stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

      <circle cx={cx} cy={cy} r={3.5} fill="rgba(255,255,255,0.08)" />
      <circle cx={cx} cy={cy} r={1.6} fill="rgba(255,255,255,0.55)" />

      {([
        ['F', cx,        cy - R + 11],
        ['B', cx,        cy + R - 4 ],
        ['L', cx - R + 7, cy + 3.5  ],
        ['R', cx + R - 5, cy + 3.5  ],
      ] as [string, number, number][]).map(([l, x, y]) => (
        <text key={l} x={x} y={y} textAnchor="middle" fontSize="7.5"
          fill="rgba(255,255,255,0.25)" fontWeight="bold"
          style={{ pointerEvents: 'none', fontFamily: 'monospace' }}>
          {l}
        </text>
      ))}

      <circle cx={lsx} cy={lsy} r={bloomR}
        fill={`url(#${uid}-bloom)`}
        style={{ pointerEvents: 'none' }} />

      <circle cx={lsx} cy={lsy} r={onFront ? (3 + intN * 2.5) : 2.5}
        fill={lightColor} opacity={((0.75 + intN * 0.25) * opM).toFixed(3)}
        style={{ pointerEvents: 'none' }} />

      <circle cx={lsx} cy={lsy} r={1.6}
        fill="white"
        opacity={onFront ? '0.95' : '0.22'}
        style={{ pointerEvents: 'none' }} />

      {!onFront && (
        <circle cx={lsx} cy={lsy} r={5.5}
          fill="none" stroke={lightColor} strokeWidth="1.2"
          strokeDasharray="3,2" opacity="0.45"
          style={{ pointerEvents: 'none' }} />
      )}
    </svg>
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
        className="flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-1.5 lg:py-2.5 rounded-lg lg:rounded-xl bg-[#0c0c0c] border border-[#252525] shadow-lg hover:border-[#303030] transition-all"
      >
        <IconSparkles className="w-3 lg:w-3.5 h-3 lg:h-3.5 text-gray-400" />
        <span className="text-[10px] lg:text-xs font-black text-gray-300 uppercase tracking-wide whitespace-nowrap">
          {m?.label ?? 'Model'}{m?.qualityTier ? ` · ${m.qualityTier}` : ''}
        </span>
        <IconChevronDown className={cn('w-2.5 lg:w-3 h-2.5 lg:h-3 text-gray-500 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-[180px] lg:w-[220px] bg-[#0c0c0c] border border-[#252525] rounded-lg lg:rounded-xl shadow-2xl overflow-hidden z-50">
          {EDIT_MODELS.map(id => {
            const mod = MODEL_REGISTRY[id]
            if (!mod) return null
            return (
              <button
                key={id}
                onClick={() => { onSelect(id); setOpen(false) }}
                className={cn(
                  'w-full flex items-center justify-between px-3 lg:px-4 py-2 lg:py-3 text-[10px] lg:text-xs font-bold transition-all',
                  selectedModel === id
                    ? 'bg-[#181818] text-[#FFFF00]'
                    : 'text-gray-400 hover:text-white hover:bg-[#141414]'
                )}
              >
                <span className="truncate">{mod.label}{mod.qualityTier ? ` · ${mod.qualityTier}` : ''}</span>
                <div className={cn('flex items-center gap-0.5 lg:gap-1 flex-shrink-0', selectedModel === id ? 'text-[#FFFF00]' : 'text-gray-500')}>
                  <CreditIcon className="w-2.5 lg:w-3 h-2.5 lg:h-3" />
                  <span className="text-[9px] lg:text-[10px]">{mod.credits}</span>
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

const CARD_H = 140

function FloatingMaskCard({
  layer, scaleX, scaleY, canvasW, canvasH, isActive,
  onSelect, onUpdatePrompt, onUpdateRefs, onDelete, onCardDrag,
}: {
  layer: MaskLayer
  scaleX: number; scaleY: number
  canvasW: number; canvasH: number
  isActive: boolean
  onSelect: () => void
  onUpdatePrompt: (p: string) => void
  onUpdateRefs: (urls: string[]) => void
  onDelete: () => void
  onCardDrag: (dx: number, dy: number) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ startX: 0, startY: 0, active: false })

  const baseCentroidCss = layer.centroid
    ? { x: layer.centroid.x * scaleX, y: layer.centroid.y * scaleY }
    : { x: canvasW * 0.5, y: canvasH * 0.5 }

  const cardX = baseCentroidCss.x + 80 + layer.cardOffset.x
  const cardY = baseCentroidCss.y - 50 + layer.cardOffset.y

  return (
    <>
      <svg
        className="absolute inset-0 pointer-events-none"
        width={canvasW} height={canvasH}
        style={{ overflow: 'visible' }}
      >
        <line
          x1={baseCentroidCss.x} y1={baseCentroidCss.y}
          x2={cardX + 8} y2={cardY + 20}
          stroke={layer.color}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.5}
        />
        <circle cx={baseCentroidCss.x} cy={baseCentroidCss.y} r={4} fill={layer.color} opacity={0.6} />
      </svg>

      <div
        ref={cardRef}
        className="absolute w-[180px] lg:w-[200px] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.7)] border text-xs lg:text-sm"
        style={{
          left: cardX,
          top: cardY,
          background: '#0d0d0d',
          zIndex: isActive ? 20 : 10,
          willChange: 'transform',
          borderColor: isActive ? layer.color : '#282828',
        }}
        onClick={onSelect}
      >
        <div
          className="flex items-center justify-between px-2.5 pt-2 pb-1.5 cursor-grab active:cursor-grabbing select-none border-b border-[#222222]"
          onPointerDown={e => {
            dragRef.current = { startX: e.clientX, startY: e.clientY, active: true }
            e.currentTarget.setPointerCapture(e.pointerId)
            e.stopPropagation()
          }}
          onPointerMove={e => {
            if (!dragRef.current.active) return
            const dx = e.clientX - dragRef.current.startX
            const dy = e.clientY - dragRef.current.startY
            if (cardRef.current) cardRef.current.style.transform = `translate(${dx}px,${dy}px)`
          }}
          onPointerUp={e => {
            if (!dragRef.current.active) return
            dragRef.current.active = false
            const dx = e.clientX - dragRef.current.startX
            const dy = e.clientY - dragRef.current.startY
            if (cardRef.current) cardRef.current.style.transform = ''
            onCardDrag(dx, dy)
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm leading-none"
              style={{ background: layer.color, color: '#000' }}
            >
              {layer.colorName}
            </span>
          </div>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-0.5 text-[#606060] hover:text-white transition-colors rounded"
          >
            <IconX className="w-3 h-3" />
          </button>
        </div>

        <div className="px-2.5 py-2">
          <textarea
            value={layer.prompt}
            onChange={e => onUpdatePrompt(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder="Describe the change…"
            className="w-full bg-[#111111] border border-[#252525] rounded-md px-2 py-1.5 text-[11px] text-white placeholder:text-[#585858] resize-none outline-none leading-relaxed focus:border-[#333333] transition-colors"
            style={{ minHeight: 48 }}
            rows={2}
          />
        </div>

        <div className="px-2.5 pb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {layer.referenceImageUrls.map((url, i) => (
              <div key={i} className="relative w-9 h-9 rounded-md overflow-hidden flex-shrink-0 border border-[#2e2e2e]">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onUpdateRefs(layer.referenceImageUrls.filter((_, j) => j !== i)) }}
                  className="absolute top-0 right-0 w-3.5 h-3.5 rounded-bl bg-[#0d0d0d] flex items-center justify-center text-[#a0a0a0] hover:text-white"
                >
                  <IconX className="w-2 h-2" />
                </button>
              </div>
            ))}
            <label className="cursor-pointer w-9 h-9 rounded-md border border-dashed border-[#333333] bg-[#111111] flex items-center justify-center hover:border-[#555555] hover:bg-[#161616] transition-all flex-shrink-0" onClick={e => e.stopPropagation()}>
              <IconPlus className="w-3 h-3 text-[#606060]" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={async e => {
                const files = Array.from(e.target.files ?? [])
                if (!files.length) return
                const urls: string[] = []
                for (const file of files) {
                  try {
                    const fd = new FormData(); fd.append('file', file)
                    const r = await fetch('/api/images/upload', { method: 'POST', body: fd })
                    const d = await r.json()
                    urls.push(d.image?.url ?? URL.createObjectURL(file))
                  } catch { urls.push(URL.createObjectURL(file)) }
                }
                onUpdateRefs([...layer.referenceImageUrls, ...urls])
                e.target.value = ''
              }} />
            </label>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── MovableTextAnnotation ────────────────────────────────────────────────────

function MovableTextAnnotation({
  ann, scaleX, scaleY, isSelected, isEditing, editValue,
  onSelect, onMove, onDelete, onStartEdit, onCommitEdit, onEditChange, onScale,
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
  onScale: (newFontSize: number) => void
}) {
  const dragRef = useRef({ x: 0, y: 0, active: false })
  const scaleDragRef = useRef({ x: 0, y: 0, active: false, startFontSize: 0 })
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
            background: '#0d0d0d',
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
          background: isSelected ? '#1a1a1a' : 'transparent',
        }}>
          {ann.text}
        </span>
      )}

      {isSelected && !isEditing && (
        <div
          style={{
            position: 'absolute', bottom: -6, right: -6,
            width: 12, height: 12, borderRadius: 3,
            background: '#FFFF00', border: '1.5px solid rgba(0,0,0,0.6)',
            cursor: 'se-resize', zIndex: 2, pointerEvents: 'auto',
            boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
          onPointerDown={e => {
            e.stopPropagation()
            scaleDragRef.current = { x: e.clientX, y: e.clientY, active: true, startFontSize: ann.fontSize }
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={e => {
            if (!scaleDragRef.current.active) return
            const delta = (e.clientX - scaleDragRef.current.x + e.clientY - scaleDragRef.current.y) / scaleY
            const newSize = Math.max(8, Math.min(120, scaleDragRef.current.startFontSize + delta))
            onScale(Math.round(newSize))
          }}
          onPointerUp={() => { scaleDragRef.current.active = false }}
        />
      )}

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
              background: '#141414', border: `1px solid ${ann.color}55`,
              borderRadius: 5, padding: '2px 7px', color: ann.color,
              fontSize: 9, fontWeight: 700, cursor: 'pointer', letterSpacing: 1,
            }}
          >EDIT</button>
          <button
            onPointerDown={e => { e.stopPropagation(); onDelete() }}
            style={{
              background: '#b41e1e', border: '1px solid #d44444',
              borderRadius: 5, padding: '2px 7px', color: 'white',
              fontSize: 9, fontWeight: 700, cursor: 'pointer',
            }}
          >✕</button>
        </div>
      )}
    </div>
  )
}

// ─── PremiumSlider ────────────────────────────────────────────────────────────

function PremiumSlider({ value, min, max, step, onChange, color, growing = false, segments = 20 }: {
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void; color: string
  growing?: boolean; segments?: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pct = (value - min) / (max - min)
  const filledCount = Math.max(0, Math.round(pct * segments))

  const update = (e: React.PointerEvent) => {
    const r = trackRef.current!.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    onChange(Math.round((min + p * (max - min)) / step) * step)
  }

  return (
    <div
      ref={trackRef}
      className="flex items-end gap-px w-full cursor-pointer select-none"
      style={{ touchAction: 'none', height: growing ? 18 : 10 }}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); update(e) }}
      onPointerMove={e => { if (e.buttons > 0) update(e) }}
    >
      {Array.from({ length: segments }, (_, i) => {
        const t = i / (segments - 1)
        const isFilled = i < filledCount
        const isEdge = isFilled && i === filledCount - 1
        const h = growing ? 2 + t * 16 : 8
        return (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: h,
              background: isFilled
                ? isEdge ? '#ffffff' : color
                : '#282828',
              opacity: isFilled && !isEdge ? 0.55 + t * 0.45 : 1,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── PremiumSliderVertical ────────────────────────────────────────────────────

function PremiumSliderVertical({ value, min, max, step, onChange, color, segments = 14 }: {
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void; color: string; segments?: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pct = (value - min) / (max - min)
  const filledCount = Math.max(0, Math.round(pct * segments))

  const update = (e: React.PointerEvent) => {
    const r = trackRef.current!.getBoundingClientRect()
    const p = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))
    onChange(Math.round((min + p * (max - min)) / step) * step)
  }

  return (
    <div
      ref={trackRef}
      className="flex flex-col-reverse items-center gap-[2px] cursor-ns-resize select-none"
      style={{ touchAction: 'none', width: 28, height: 84 }}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); update(e) }}
      onPointerMove={e => { if (e.buttons > 0) update(e) }}
    >
      {Array.from({ length: segments }, (_, i) => {
        const t = i / (segments - 1)
        const isFilled = i < filledCount
        const isEdge = isFilled && i === filledCount - 1
        const w = 4 + t * 18
        return (
          <div
            key={i}
            className="rounded-sm flex-shrink-0"
            style={{
              width: w,
              height: 4,
              background: isFilled ? (isEdge ? '#ffffff' : color) : '#252525',
              opacity: isFilled && !isEdge ? 0.55 + t * 0.45 : 1,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Main EditModal Component ─────────────────────────────────────────────────

export function EditModal({
  isOpen,
  onClose,
  initialImageUrl,
  sourceContext,
  onGenerationStart,
  onGenerationComplete,
}: EditModalProps) {
  const { addWatchedTask, resolveTask, failTask } = useTaskManager()
  const { total: creditBalance, isLoading: creditsLoading } = useCredits()

  // Debug logging - removed onGenerationComplete from deps to prevent infinite loops
  useEffect(() => {
    console.log('🚀 EditModal mounted/updated', {
      isOpen,
      sourceContext,
      initialImageUrl: initialImageUrl?.substring(0, 50) + '...',
      hasCallbacks: { start: !!onGenerationStart, complete: !!onGenerationComplete }
    })
  }, [isOpen, sourceContext, initialImageUrl])

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

  // ── Undo / Redo
  type HistoryEntry = { layers: MaskLayer[]; snapshots: Map<string, string> }
  const undoStack = useRef<HistoryEntry[]>([])
  const redoStack = useRef<HistoryEntry[]>([])
  const renderCanvasRef = useRef<(() => void) | null>(null)

  const captureHistory = useCallback(() => {
    const snapshots = new Map<string, string>()
    layerCanvasesRef.current.forEach((lc, id) => snapshots.set(id, lc.toDataURL()))
    setLayers(current => {
      undoStack.current.push({ layers: current, snapshots })
      if (undoStack.current.length > 20) undoStack.current.shift()
      redoStack.current = []
      return current
    })
  }, [])

  const applyHistory = useCallback((entry: HistoryEntry) => {
    const newMap = new Map<string, HTMLCanvasElement>()
    for (const layer of entry.layers) {
      const lc = document.createElement('canvas')
      const imgEl = new Image()
      const dataUrl = entry.snapshots.get(layer.id)
      if (dataUrl) {
        imgEl.onload = () => {
          lc.width = imgEl.width; lc.height = imgEl.height
          const ctx = lc.getContext('2d')
          ctx?.drawImage(imgEl, 0, 0)
          setTimeout(() => renderCanvasRef.current?.(), 0)
        }
        imgEl.src = dataUrl
      }
      newMap.set(layer.id, lc)
    }
    layerCanvasesRef.current = newMap
    setLayers(entry.layers)
  }, [])

  const undo = useCallback(() => {
    const entry = undoStack.current.pop()
    if (!entry) return
    const snapshots = new Map<string, string>()
    layerCanvasesRef.current.forEach((lc, id) => snapshots.set(id, lc.toDataURL()))
    setLayers(current => {
      redoStack.current.push({ layers: current, snapshots })
      return current
    })
    applyHistory(entry)
  }, [applyHistory])

  const redo = useCallback(() => {
    const entry = redoStack.current.pop()
    if (!entry) return
    const snapshots = new Map<string, string>()
    layerCanvasesRef.current.forEach((lc, id) => snapshots.set(id, lc.toDataURL()))
    setLayers(current => {
      undoStack.current.push({ layers: current, snapshots })
      return current
    })
    applyHistory(entry)
  }, [applyHistory])

  // ── Annotations
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([])
  const [selectedAnnotId, setSelectedAnnotId] = useState<string | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingTextValue, setEditingTextValue] = useState('')

  // ── Color picker ref
  const colorPickerRef = useRef<HTMLInputElement>(null)

  // ── Light
  const [lightSettings, setLightSettings] = useState<LightSettings>({
    azimuth: 45, elevation: 35, color: '#ffffff', intensity: 70, softness: 'soft', sceneLock: true,
  })
  const [activeLightingStyle, setActiveLightingStyle] = useState<string | null>(null)

  // ── Prompt mode
  const [promptText, setPromptText] = useState('')
  const [promptRefUrls, setPromptRefUrls] = useState<string[]>([])
  const [promptFileInputKey, setPromptFileInputKey] = useState(0)

  // ── Model
  const [selectedModel, setSelectedModel] = useState('nano-banana-2')

  // ── Generation
  const [generatingCount, setGeneratingCount] = useState(0)
  const isGenerating = generatingCount > 0
  const [genCount, setGenCount] = useState<1 | 2 | 4>(1)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalResult, setModalResult] = useState<GenerationResult | null>(null)
  const [resultsDockOpen, setResultsDockOpen] = useState(true)
  const [debugRelightPrompt, setDebugRelightPrompt] = useState<string | null>(null)

  // ── Canvas refs
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const brushCursorRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<Point | null>(null)
  const rectStartRef = useRef<Point | null>(null)
  const blobUrlsRef = useRef<Set<string>>(new Set()) // Track blob URLs for cleanup
  const [rectPreview, setRectPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [showBrushCursor, setShowBrushCursor] = useState(false)

  // ── Text input
  const [textInput, setTextInput] = useState({ visible: false, screenX: 0, screenY: 0, canvasX: 0, canvasY: 0 })
  const [textValue, setTextValue] = useState('')
  const textInputRef = useRef<HTMLInputElement>(null)

  // Scale factors
  const scaleX = displaySize && imageNaturalSize ? displaySize.w / imageNaturalSize.w : 1
  const scaleY = displaySize && imageNaturalSize ? displaySize.h / imageNaturalSize.h : 1

  // ── Load initial image if provided
  useEffect(() => {
    if (initialImageUrl && isOpen) {
      console.log('🖼️ EditModal: Loading initial image:', initialImageUrl)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        console.log('✅ EditModal: Image loaded successfully', {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          src: initialImageUrl
        })
        bgImageRef.current = img
        setImageUrl(initialImageUrl)
        const nat = { w: img.naturalWidth, h: img.naturalHeight }
        setImageNaturalSize(nat)
        const ds = computeDisplaySize(nat.w, nat.h)
        setDisplaySize(ds)

        // Clear all editor state when loading initial image
        setTextAnnotations([])
        layerCanvasesRef.current.clear()
        nextColorIdx.current = 0
        setActiveLayerId(null)
        setMode('edit')
        setActiveTool('brush')
        setLayers([])

        console.log('🧹 EditModal: Editor state cleared, canvas will be setup by useEffect')
      }
      img.onerror = (e) => {
        console.error('❌ EditModal: Failed to load initial image:', initialImageUrl, e)
        setError('Failed to load image. Please try again.')
      }
      img.src = initialImageUrl
    } else {
      console.log('⏭️ EditModal: Skipping image load', { hasInitialImageUrl: !!initialImageUrl, isOpen })
    }
  }, [initialImageUrl, isOpen])

  // ── Setup canvas when image and natural size are ready
  useEffect(() => {
    if (!bgImageRef.current || !imageNaturalSize) return

    console.log('🎨 EditModal: Setting up canvas with loaded image')
    const canvas = displayCanvasRef.current

    if (canvas) {
      canvas.width = imageNaturalSize.w
      canvas.height = imageNaturalSize.h
      const ctx = canvas.getContext('2d')

      if (ctx && bgImageRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(bgImageRef.current, 0, 0)
        console.log('✅ EditModal: Canvas initialized and image drawn', {
          canvasSize: `${canvas.width}x${canvas.height}`
        })
      } else {
        console.error('❌ EditModal: Failed to get canvas context')
      }
    } else {
      console.warn('⚠️ EditModal: Canvas ref not available yet, will retry on next render')
    }
  }, [imageNaturalSize])

  // ── Prevent body scroll when modal is open (non-standalone mode)
  useEffect(() => {
    if (sourceContext !== 'standalone' && isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
    return undefined
  }, [isOpen, sourceContext])

  // ── Cleanup state when modal closes
  useEffect(() => {
    if (!isOpen && sourceContext !== 'standalone') {
      // Reset state when modal closes to prevent stale data on next open
      setImageUrl(null)
      setImageNaturalSize(null)
      setDisplaySize(null)
      setLayers([])
      setTextAnnotations([])
      setActiveLayerId(null)
      setMode('edit')
      setActiveTool('brush')
      setResults([])
      setError(null)
      setBrushSize(28)
      layerCanvasesRef.current.clear()
      nextColorIdx.current = 0
      bgImageRef.current = null
      if (displayCanvasRef.current) {
        const ctx = displayCanvasRef.current.getContext('2d')
        ctx?.clearRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height)
      }
    }
  }, [isOpen, sourceContext])

  // ── Escape key handler for modal mode
  useEffect(() => {
    if (sourceContext !== 'standalone' && isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
    return undefined
  }, [isOpen, sourceContext, onClose])

  // ── Canvas rendering
  const renderCanvas = useCallback(() => {
    const canvas = displayCanvasRef.current
    if (!canvas || !bgImageRef.current) {
      console.log('⏭️ renderCanvas: Skipped', { hasCanvas: !!canvas, hasBgImage: !!bgImageRef.current })
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    console.log('🎨 renderCanvas: Drawing', {
      canvasSize: `${canvas.width}x${canvas.height}`,
      layerCount: layers.length
    })
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height)
    for (const layer of layers) {
      const lc = layerCanvasesRef.current.get(layer.id)
      if (lc) {
        ctx.drawImage(lc, 0, 0)
      }
    }
  }, [layers])

  useEffect(() => { renderCanvas() }, [renderCanvas])
  useEffect(() => { renderCanvasRef.current = renderCanvas }, [renderCanvas])

  // ── Clear floating text input whenever mode OR tool changes
  useEffect(() => {
    setTextInput({ visible: false, screenX: 0, screenY: 0, canvasX: 0, canvasY: 0 })
    setTextValue('')
  }, [mode, activeTool])

  // ── Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  // ── Resize handler
  useEffect(() => {
    if (!imageNaturalSize) return
    const handleResize = () => {
      const ds = computeDisplaySize(imageNaturalSize.w, imageNaturalSize.h)
      setDisplaySize(ds)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [imageNaturalSize])

  // ── Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen && sourceContext !== 'standalone') {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
    return undefined
  }, [isOpen, sourceContext])

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
    return tmp.toDataURL('image/png')
  }, [textAnnotations])

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

      // Clear editor state
      setTextAnnotations([])
      layerCanvasesRef.current.clear()
      nextColorIdx.current = 0
      setLayers([])
      // Canvas will be setup by the imageNaturalSize useEffect
    }
    img.src = url
  }, [])

  // ── Layer management
  const addLayer = useCallback(() => {
    if (!imageNaturalSize) return
    const colorData = LAYER_COLORS[nextColorIdx.current % LAYER_COLORS.length]!
    nextColorIdx.current++
    setLayers(prev => {
      const idx = prev.length
      const layer: MaskLayer = {
        id: uid(), color: colorData.hex, colorName: colorData.name,
        prompt: '', referenceImageUrls: [], centroid: null,
        cardOffset: { x: idx * 12, y: idx * 90 },
      }
      const lc = document.createElement('canvas')
      lc.width = imageNaturalSize.w; lc.height = imageNaturalSize.h
      layerCanvasesRef.current.set(layer.id, lc)
      setActiveLayerId(layer.id)
      return [...prev, layer]
    })
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
    if (erase) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,1)'
      ctx.beginPath(); ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2); ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      return
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(${colorRgb}, 0.85)`
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill()
  }, [])

  const paintLine = useCallback((ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, radius: number, colorRgb: string, erase: boolean) => {
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
    ctx.strokeStyle = erase ? 'rgba(0,0,0,1)' : `rgba(${colorRgb}, 0.85)`
    ctx.lineWidth = radius * 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
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
      if (!activeLayerId && layers.length === 0 && imageNaturalSize) {
        const colorData = LAYER_COLORS[nextColorIdx.current % LAYER_COLORS.length]!
        nextColorIdx.current++
        const newLayer: MaskLayer = {
          id: uid(), color: colorData.hex, colorName: colorData.name,
          prompt: '', referenceImageUrls: [], centroid: null, cardOffset: { x: 0, y: 0 },
        }
        const lc = document.createElement('canvas')
        lc.width = imageNaturalSize.w; lc.height = imageNaturalSize.h
        layerCanvasesRef.current.set(newLayer.id, lc)
        setLayers([newLayer])
        setActiveLayerId(newLayer.id)
      }
      isDrawingRef.current = true; rectStartRef.current = pt; return
    }

    if ((activeTool === 'brush' || activeTool === 'eraser') && mode === 'edit' && !activeLayerId && layers.length === 0 && imageNaturalSize) {
      const colorData = LAYER_COLORS[nextColorIdx.current % LAYER_COLORS.length]!
      nextColorIdx.current++
      const newLayer: MaskLayer = {
        id: uid(), color: colorData.hex, colorName: colorData.name,
        prompt: '', referenceImageUrls: [], centroid: null, cardOffset: { x: 0, y: 0 },
      }
      const lc = document.createElement('canvas')
      lc.width = imageNaturalSize.w; lc.height = imageNaturalSize.h
      layerCanvasesRef.current.set(newLayer.id, lc)
      setLayers([newLayer])
      setActiveLayerId(newLayer.id)
      const ctx = lc.getContext('2d')!
      const r = brushSize / (2 * scaleX)
      paintDot(ctx, pt.x, pt.y, r, colorData.rgb, activeTool === 'eraser')
      isDrawingRef.current = true
      lastPointRef.current = pt
      setTimeout(renderCanvas, 0)
      return
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
  }, [activeTool, mode, activeLayerId, layers, getCanvasPoint, brushSize, scaleX, paintDot, renderCanvas, imageNaturalSize])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (brushCursorRef.current) {
      const canvas = displayCanvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      brushCursorRef.current.style.transform = `translate(${cx}px, ${cy}px)`
    }

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
      paintLine(ctx, prev.x, prev.y, pt.x, pt.y, r, colorData?.rgb ?? '255,255,255', activeTool === 'eraser')
      lastPointRef.current = pt
      renderCanvas()
    }
  }, [activeTool, activeLayerId, layers, getCanvasPoint, brushSize, scaleX, paintLine, renderCanvas])

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    lastPointRef.current = null

    if (activeTool === 'rect' && rectStartRef.current) {
      const pt = getCanvasPoint(e)
      const s = rectStartRef.current
      const rx = Math.min(s.x, pt.x), ry = Math.min(s.y, pt.y)
      const rw = Math.abs(pt.x - s.x), rh = Math.abs(pt.y - s.y)
      if (rw > 5 && rh > 5 && activeLayerId) {
        const layer = layers.find(l => l.id === activeLayerId)
        const lc = layerCanvasesRef.current.get(activeLayerId)
        if (layer && lc) {
          const colorData = LAYER_COLORS.find(c => c.hex === layer.color)
          const ctx = lc.getContext('2d')!
          ctx.globalCompositeOperation = 'source-over'
          ctx.fillStyle = `rgba(${colorData?.rgb ?? '255,255,255'},0.55)`
          ctx.fillRect(rx, ry, rw, rh)
          captureHistory()
          updateLayerCentroid(activeLayerId)
        }
      }
      rectStartRef.current = null; setRectPreview(null)
      renderCanvas()
      return
    }

    if (activeTool === 'brush' && activeLayerId) {
      captureHistory()
      updateLayerCentroid(activeLayerId)
    }
  }, [activeTool, activeLayerId, layers, getCanvasPoint, renderCanvas, updateLayerCentroid, captureHistory])

  const commitText = useCallback(() => {
    setTextInput(p => ({ ...p, visible: false }))
    setTextValue('')
    if (!textValue.trim()) return
    const layer = layers.find(l => l.id === activeLayerId)
    setTextAnnotations(prev => [...prev, {
      id: uid(), text: textValue,
      x: textInput.canvasX, y: textInput.canvasY,
      color: layer?.color ?? '#FFFF00', fontSize: 20,
    }])
    setTimeout(renderCanvas, 0)
  }, [textValue, textInput, activeLayerId, layers, renderCanvas])

  // ── Generation
  const canGenerate = useMemo(() => {
    if (!imageUrl) return false
    if (mode === 'edit') return layers.some(l => l.prompt.trim())
    if (mode === 'relight') return true
    if (mode === 'prompt') return !!promptText.trim()
    return false
  }, [imageUrl, mode, layers, promptText])

  const creditCost = MODEL_REGISTRY[selectedModel]?.credits ?? 20
  const totalCost = creditCost * genCount

  const handleGenerate = useCallback(async () => {
    console.log('🎬 handleGenerate called', {
      canGenerate,
      hasImageUrl: !!imageUrl,
      mode,
      creditBalance,
      totalCost,
      creditsLoading,
      sourceContext,
    })

    if (!canGenerate) {
      console.warn('⚠️ Generation blocked: canGenerate is false', { mode, layersCount: layers.length, promptText })
      return
    }

    if (!imageUrl) {
      console.warn('⚠️ Generation blocked: no imageUrl')
      return
    }

    setError(null)

    if (!creditsLoading && totalCost > 0 && creditBalance < totalCost) {
      const errMsg = `Not enough credits (${creditBalance} available, ${totalCost} required). Top up from the dashboard.`
      console.error('⚠️ Generation blocked: insufficient credits', { creditBalance, totalCost })
      setError(errMsg)
      return
    }

    console.log('✅ All checks passed, starting generation...')

    let compositeDataUrl: string | undefined
    let cleanOriginalDataUrl: string | undefined
    let basePrompt = ''
    const referenceImages: string[] = []

    if (mode === 'edit') {
      if (bgImageRef.current) {
        const cleanCanvas = document.createElement('canvas')
        cleanCanvas.width = bgImageRef.current.naturalWidth
        cleanCanvas.height = bgImageRef.current.naturalHeight
        cleanCanvas.getContext('2d')!.drawImage(bgImageRef.current, 0, 0)
        cleanOriginalDataUrl = cleanCanvas.toDataURL('image/png')
      }
      compositeDataUrl = flattenForExport()
      const activeLayers = layers.filter(l => l.prompt.trim())
      basePrompt =
        'I am providing two images: image 1 is the original clean photo, image 2 is the same photo with semi-transparent colored overlays marking edit regions. ' +
        activeLayers.map(l => `In the ${l.colorName}-colored overlay region: ${l.prompt.trim()}`).join('. ') +
        '. Apply the edits to image 1 ONLY — use image 2 purely as a guide for WHERE to make changes. Keep everything outside the colored regions completely identical to image 1.'
      activeLayers.forEach(l => l.referenceImageUrls.forEach(u => referenceImages.push(u)))
    } else if (mode === 'relight') {
      if (bgImageRef.current) {
        const cleanCanvas = document.createElement('canvas')
        cleanCanvas.width = bgImageRef.current.naturalWidth
        cleanCanvas.height = bgImageRef.current.naturalHeight
        cleanCanvas.getContext('2d')!.drawImage(bgImageRef.current, 0, 0)
        cleanOriginalDataUrl = cleanCanvas.toDataURL('image/png')
      }
      basePrompt = generateRelightPrompt(lightSettings)
      setDebugRelightPrompt(basePrompt)
    } else {
      compositeDataUrl = flattenForExport()
      basePrompt = promptText
      promptRefUrls.forEach(u => referenceImages.push(u))
    }

    const VARIATION_SUFFIXES = [
      '',
      ' Interpretation: lean toward a slightly warmer, more saturated look.',
      ' Interpretation: lean toward a slightly cooler, more desaturated look.',
      ' Interpretation: emphasize contrast and depth more than the base request.',
    ]

    const variations = Array.from({ length: genCount }, (_, i) => i)
    setGeneratingCount(c => c + genCount)

    const historyIds = variations.map(() => uid())
    const modeLabel = mode === 'relight' ? 'Relighting' : mode === 'prompt' ? 'Editing' : 'Editing'
    historyIds.forEach(hid => {
      addWatchedTask(hid, modeLabel)
      // Notify parent that generation is starting
      if (onGenerationStart) {
        onGenerationStart(hid, mode)
      }
    })

    await Promise.all(variations.map(async (varIdx) => {
      const historyId = historyIds[varIdx]!
      const suffix = genCount > 1 ? (VARIATION_SUFFIXES[varIdx] ?? '') : ''
      const combinedPrompt = basePrompt + suffix

      try {
        // Determine page_name based on source context for proper history loading
        const pageName = sourceContext === 'image-page' ? 'app/image'
          : sourceContext === 'history-page' ? 'app/history'
          : 'app/edit'

        console.log(`📤 Sending API request for ${historyId}`, {
          mode,
          model: selectedModel,
          pageName,
          hasCleanOriginal: !!cleanOriginalDataUrl,
          hasComposite: !!compositeDataUrl,
          refImagesCount: referenceImages.length,
        })

        const body: Record<string, unknown> = {
          mode, model: selectedModel,
          historyId,
          originalImageUrl: imageUrl,
          cleanOriginalDataUrl,
          combinedPrompt, referenceImages,
          compositeDataUrl,
          pageName, // Send page_name so edits appear in correct history
        }
        const res = await fetch('/api/edit-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

        console.log(`📥 API response for ${historyId}:`, res.status, res.statusText)

        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          console.error(`❌ API error for ${historyId}:`, d)
          throw new Error(d.error || `HTTP ${res.status}`)
        }

        const data = await res.json()
        console.log(`✅ Generation successful for ${historyId}`, { outputUrl: data.outputUrl?.substring(0, 60) })

        resolveTask(historyId)
        setResults(prev => [{ id: historyId, url: data.outputUrl, mode, timestamp: Date.now(), inputUrl: imageUrl!, prompt: combinedPrompt }, ...prev])
        setResultsDockOpen(true)

        // Call completion callback if provided
        if (onGenerationComplete) {
          console.log(`🔔 Calling onGenerationComplete for ${historyId}`)
          onGenerationComplete(data.outputUrl, historyId, mode, combinedPrompt)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        console.error(`❌ Generation failed for ${historyId}:`, msg, err)
        failTask(historyId, msg)  // Pass error message to task manager
        setError(msg)
      } finally {
        setGeneratingCount(c => c - 1)
      }
    }))
  }, [canGenerate, imageUrl, mode, layers, lightSettings, promptText, promptRefUrls, selectedModel, genCount, flattenForExport, resolveTask, failTask, creditBalance, creditsLoading, totalCost, addWatchedTask, sourceContext, onGenerationStart, onGenerationComplete])

  const canvasCursor = !bgImageRef.current ? 'default'
    : mode !== 'edit' ? 'default'
    : activeTool === 'text' ? 'text'
    : (activeTool === 'brush' || activeTool === 'eraser') ? 'none'
    : 'crosshair'

  // Don't render if not open
  if (!isOpen) return null

  const content = (
    <div className="fixed inset-0 pt-16 bg-[#070707] text-white overflow-y-auto lg:overflow-hidden" style={{ userSelect: 'none', backgroundImage: 'radial-gradient(circle, rgb(255 255 255 / 20%) 1.2px, transparent 1.2px)', backgroundSize: '20px 20px' }}>

      {/* ── CANVAS WORKSPACE ─────────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center px-2 lg:px-4" style={{ top: '3rem' }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        {!imageUrl ? (
          <label className="group cursor-pointer flex flex-col items-center gap-4 lg:gap-8 select-none px-4">
            <div className="relative w-40 lg:w-48 h-36 lg:h-44 rounded-xl border border-[#333333] group-hover:border-[#505050] bg-[#111111] group-hover:bg-[#161616] flex flex-col items-center justify-center gap-2 lg:gap-3 transition-all duration-300">
              <IconCloudUpload className="w-9 lg:w-11 h-9 lg:h-11 text-[#686868] group-hover:text-[#b0b0b0] transition-all duration-300 group-hover:-translate-y-1" strokeWidth={1.5} />
              <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-[#686868] group-hover:text-[#b0b0b0] transition-colors">Upload Image</span>
            </div>
            <div className="text-center space-y-2 lg:space-y-2.5">
              <p className="text-xs lg:text-sm font-semibold text-[#787878] group-hover:text-[#c0c0c0] transition-colors">Drop an image or click to browse</p>
              <div className="flex items-center justify-center gap-1.5 lg:gap-2">
                {['PNG', 'JPG', 'WebP'].map(t => (
                  <span key={t} className="text-[9px] lg:text-[10px] font-bold text-[#585858] px-1.5 lg:px-2 py-0.5 rounded bg-[#141414] border border-[#252525] uppercase tracking-wide">{t}</span>
                ))}
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </label>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-4 h-full justify-center overflow-y-auto lg:overflow-y-visible">

            {/* ── LEFT PANEL: EDIT TOOLS ───────────────────────── */}
            {mode === 'edit' && (
              <div className="flex-shrink-0 self-center flex flex-row lg:flex-col items-center gap-1 p-2 rounded-xl bg-[#0d0d0d] border border-[#2c2c2c] shadow-xl order-2 lg:order-1">
                <div className="flex gap-0.5 mb-0 lg:mb-0.5">
                  <button onClick={undo} title="Undo (Ctrl+Z)"
                    className="w-7 lg:w-8 h-7 rounded-md flex items-center justify-center text-[#a0a0a0] hover:text-white hover:bg-[#222222] transition-all">
                    <IconArrowBackUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={redo} title="Redo (Ctrl+Shift+Z)"
                    className="w-7 lg:w-8 h-7 rounded-md flex items-center justify-center text-[#a0a0a0] hover:text-white hover:bg-[#222222] transition-all">
                    <IconArrowForwardUp className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-px lg:w-10 h-7 lg:h-px bg-[#191919] mb-0 lg:mb-0.5" />

                {activeLayerId && (
                  <div className="w-1.5 lg:w-6 h-6 lg:h-1.5 rounded-full mb-0 lg:mb-0.5" style={{ background: layers.find(l => l.id === activeLayerId)?.color ?? '#fff' }} />
                )}

                {[
                  { id: 'brush' as Tool, Icon: IconBrush, tip: 'Brush — paint mask area' },
                  { id: 'eraser' as Tool, Icon: IconEraser, tip: 'Eraser — remove mask paint' },
                  { id: 'rect' as Tool, Icon: IconSquare, tip: 'Rectangle — mark an area' },
                  { id: 'text' as Tool, Icon: IconTypography, tip: 'Text — add a label' },
                ].map(({ id, Icon, tip }) => (
                  <button key={id} onClick={() => setActiveTool(id)} title={tip}
                    className={cn('w-8 lg:w-9 h-8 lg:h-9 rounded-lg flex items-center justify-center transition-all',
                      activeTool === id ? 'bg-[#FFFF00] text-black shadow-md' : 'text-[#c0c0c0] hover:text-white hover:bg-[#222222]'
                    )}>
                    <Icon className="w-3.5 lg:w-4 h-3.5 lg:h-4" strokeWidth={1.8} />
                  </button>
                ))}

                {(activeTool === 'brush' || activeTool === 'eraser') && (
                  <>
                    <div className="w-px lg:w-5 h-7 lg:h-px bg-[#1e1e1e] my-0 lg:my-0.5 hidden lg:block" />
                    <div className="hidden lg:flex flex-col items-center gap-1.5">
                      <PremiumSliderVertical
                        min={4} max={80} step={2}
                        value={brushSize}
                        onChange={setBrushSize}
                        color={activeTool === 'eraser' ? '#606060' : (layers.find(l => l.id === activeLayerId)?.color ?? '#FFFF00')}
                      />
                      <span className="text-[9px] text-[#606060] font-mono leading-none">{brushSize}px</span>
                    </div>
                  </>
                )}

                <div className="w-px lg:w-5 h-7 lg:h-px bg-[#1e1e1e] my-0 lg:my-1" />

                <button onClick={addLayer} title="Add new mask layer"
                  className="w-8 lg:w-9 h-8 lg:h-9 rounded-full flex items-center justify-center bg-[#FFFF00] text-black hover:scale-105 active:scale-95 transition-all shadow-md">
                  <IconPlus className="w-3.5 lg:w-4 h-3.5 lg:h-4" strokeWidth={2.5} />
                </button>

                {layers.length > 0 && (<>
                  <div className="w-px lg:w-5 h-7 lg:h-px bg-[#1e1e1e]" />
                  <div className="flex flex-row lg:flex-col gap-1.5">
                    {layers.map(l => (
                      <button key={l.id} onClick={() => setActiveLayerId(l.id)}
                        title={`${l.colorName} layer`}
                        className={cn('w-4 h-4 rounded-full ring-2 ring-offset-1 ring-offset-[#0d0d0d] transition-all',
                          activeLayerId === l.id ? 'ring-[#FFFF00] scale-110' : 'ring-[#555555] hover:ring-[#888888]')}
                        style={{ background: l.color }} />
                    ))}
                  </div>
                </>)}
              </div>
            )}

            {/* Remaining panels and canvas - truncated for length... */}
            {/* The full implementation continues with relight panel, prompt panel, canvas, etc. */}
            {/* ── LEFT PANEL: RELIGHT ──────────────────────────── */}
            {mode === 'relight' && (
              <div className="flex-shrink-0 w-full lg:w-[280px] max-w-full lg:max-w-[320px] self-center overflow-y-auto overflow-x-hidden rounded-xl bg-[#0d0d0d] border border-[#2c2c2c] shadow-xl order-2 lg:order-1 max-h-[40vh] lg:max-h-[calc(100vh-13rem)]">
                <div className="p-4 space-y-4">

                  {/* Lighting Style grid */}
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Lighting Style</p>
                    <div className="grid grid-cols-3 gap-1">
                      {LIGHTING_STYLES.map(s => (
                        <button key={s.id} onClick={() => applyLightingStyle(s)}
                          className={cn('py-2 rounded-md border text-center transition-all',
                            activeLightingStyle === s.id
                              ? 'border-[#555500] bg-[#1a1a00] text-[#FFFF00]'
                              : 'border-[#222222] text-gray-500 hover:text-white hover:border-[#2e2e2e]'
                          )}>
                          <div className="w-3 h-3 rounded-full mx-auto mb-1 border border-[#2e2e2e]" style={{ background: s.color }} />
                          <span className="text-[9px] font-black uppercase tracking-wide leading-none">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Light direction */}
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Light Direction</p>
                    <div className="flex justify-center">
                      <WireframeSphere
                        azimuth={lightSettings.azimuth} elevation={lightSettings.elevation}
                        lightColor={lightSettings.color} intensity={lightSettings.intensity}
                        size={window.innerWidth < 1024 ? 140 : 180}
                        onAzimuthChange={az => { setLightSettings(p => ({ ...p, azimuth: az })); setActiveLightingStyle(null) }}
                        onElevationChange={el => { setLightSettings(p => ({ ...p, elevation: el })); setActiveLightingStyle(null) }}
                      />
                    </div>
                    <div className="flex justify-center gap-5 mt-1 mb-2.5">
                      <span className="text-[10px] text-gray-500 font-mono">AZ <span className="text-white font-bold">{lightSettings.azimuth}°</span></span>
                      <span className="text-[10px] text-gray-500 font-mono">EL <span className="text-white font-bold">{lightSettings.elevation > 0 ? '+' : ''}{lightSettings.elevation}°</span></span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-wider mb-2">Quick Presets</p>
                      <div className="flex gap-1.5 justify-between">
                        {WIREFRAME_PRESETS.map(p => {
                          const isActive = lightSettings.azimuth === p.az && lightSettings.elevation === p.el
                          const S = 28, miniR = 10.5, sx = S / 2, sy = S / 2
                          const miniCam = 22 * Math.PI / 180
                          const azR = p.az * Math.PI / 180, elR = p.el * Math.PI / 180
                          const dotX = sx + Math.sin(azR) * Math.cos(elR) * miniR
                          const dotY = sy - (Math.sin(elR) * Math.cos(miniCam) - Math.cos(azR) * Math.cos(elR) * Math.sin(miniCam)) * miniR
                          const dotDepth = Math.sin(elR) * Math.sin(miniCam) + Math.cos(azR) * Math.cos(elR) * Math.cos(miniCam)
                          const dotFront = dotDepth >= 0
                          return (
                            <button key={p.name}
                              onClick={() => { setLightSettings(prev => ({ ...prev, azimuth: p.az, elevation: p.el })); setActiveLightingStyle(null) }}
                              className={cn('flex flex-col items-center gap-1 py-1.5 px-0.5 rounded-xl border transition-all flex-1',
                                isActive
                                  ? 'border-[#FFFF00] bg-[#1a1a00]'
                                  : 'border-[#222222] hover:border-[#383838] hover:bg-[#0f0f0f]'
                              )}>
                              <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ overflow: 'visible' }}>
                                <circle cx={sx} cy={sy} r={miniR} fill="#111111" stroke={isActive ? 'rgba(255,255,0,0.25)' : 'rgba(255,255,255,0.12)'} strokeWidth="0.75" />
                                <ellipse cx={sx} cy={sy} rx={miniR} ry={miniR * Math.sin(miniCam)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
                                <ellipse cx={sx} cy={sy} rx={miniR * Math.sin(miniCam)} ry={miniR} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
                                {dotFront && (
                                  <circle cx={dotX} cy={dotY} r={4}
                                    fill={isActive ? 'rgba(255,255,0,0.15)' : 'rgba(255,255,255,0.06)'} />
                                )}
                                <circle cx={dotX} cy={dotY} r={dotFront ? 2 : 1.2}
                                  fill={dotFront
                                    ? (isActive ? '#FFFF00' : '#ffffff')
                                    : (isActive ? 'rgba(255,255,0,0.35)' : 'rgba(255,255,255,0.2)')}
                                />
                              </svg>
                              <span className={cn('text-[8px] font-black uppercase tracking-wider leading-none',
                                isActive ? 'text-[#FFFF00]' : 'text-[#555555]')}>{p.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <p className="text-[8px] text-gray-600 mt-2 text-center">Drag on globe to aim light</p>
                  </div>

                  {/* Intensity + Falloff */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Intensity</p>
                        <span className="font-mono text-[10px] text-white">{lightSettings.intensity}%</span>
                      </div>
                      <PremiumSlider
                        min={10} max={100} step={5}
                        value={lightSettings.intensity}
                        onChange={v => setLightSettings(p => ({ ...p, intensity: v }))}
                        color={lightSettings.color}
                        growing={false}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Falloff</p>
                      <div className="flex bg-[#141414] p-0.5 rounded-md border border-[#222222]">
                        {(['soft', 'hard'] as const).map(type => (
                          <button key={type} onClick={() => setLightSettings(p => ({ ...p, softness: type }))}
                            className={cn('flex-1 py-1 text-[10px] font-black rounded-sm transition-all uppercase tracking-wider',
                              lightSettings.softness === type ? 'bg-[#1c1c1c] text-[#FFFF00] shadow-sm' : 'text-gray-500 hover:text-white'
                            )}>{type}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Light Color */}
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Light Color</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => colorPickerRef.current?.click()}
                        className="w-7 h-7 rounded-md border border-[#3e3e3e] flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-[#555555] transition-all"
                        style={{ background: lightSettings.color }}
                        title="Click to open color picker"
                      />
                      <input
                        ref={colorPickerRef}
                        type="color"
                        value={lightSettings.color}
                        onChange={e => { setLightSettings(p => ({ ...p, color: e.target.value })); setActiveLightingStyle(null) }}
                        className="sr-only"
                        tabIndex={-1}
                      />
                      <input type="text" value={lightSettings.color}
                        onChange={e => { setLightSettings(p => ({ ...p, color: e.target.value })); setActiveLightingStyle(null) }}
                        className="w-[72px] bg-[#141414] border border-[#2e2e2e] rounded-md px-2 py-1 text-[11px] text-white font-mono uppercase outline-none focus:border-[#3c3c3c] transition-colors" />
                      <div className="flex gap-1 flex-1 flex-wrap justify-end">
                        {LIGHT_COLOR_PRESETS.map(c => (
                          <button key={c}
                            onClick={() => { setLightSettings(p => ({ ...p, color: c })); setActiveLightingStyle(null) }}
                            className={cn('w-4 h-4 rounded-full border-2 transition-all flex-shrink-0', lightSettings.color === c ? 'border-white scale-110' : 'border-[#333333] hover:border-[#505050]')}
                            style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Scene Lock */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#2e2e2e] transition-all">
                    <div>
                      <span className="text-xs font-black text-white">Scene Lock</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">Preserve pose & character</p>
                    </div>
                    <button onClick={() => setLightSettings(p => ({ ...p, sceneLock: !p.sceneLock }))}
                      className={cn('relative w-10 flex-shrink-0 rounded-full transition-colors', lightSettings.sceneLock ? 'bg-[#FFFF00]' : 'bg-[#1e1e1e]')}
                      style={{ height: 22 }}>
                      <span className={cn('absolute top-[3px] left-[3px] w-4 h-4 rounded-full transition-transform shadow-sm',
                        lightSettings.sceneLock ? 'translate-x-[18px]' : 'translate-x-0')}
                        style={{ background: lightSettings.sceneLock ? '#000' : '#909090' }} />
                    </button>
                  </div>

                  {/* DEBUG: live prompt preview */}
                  <div className="rounded-lg bg-[#0a0a0a] border border-[#252525] p-2.5">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Live Prompt Preview</p>
                    <p className="text-[9px] text-gray-400 leading-relaxed font-mono break-words">
                      {generateRelightPrompt(lightSettings)}
                    </p>
                    {debugRelightPrompt && (
                      <p className="mt-2 text-[9px] text-[#FFFF00]/70 font-mono break-words leading-relaxed">
                        ↳ Last sent: {debugRelightPrompt}
                      </p>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* ── LEFT PANEL: PROMPT ───────────────────────────── */}
            {mode === 'prompt' && (
              <div className="flex-shrink-0 w-full lg:w-[260px] max-w-full lg:max-w-[320px] self-center rounded-xl bg-[#0d0d0d] border border-[#2c2c2c] shadow-xl p-4 space-y-3 order-2 lg:order-1 max-h-[40vh] lg:max-h-[calc(100vh-13rem)] overflow-y-auto overflow-x-hidden">
                <textarea
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  placeholder={"e.g. 'Make the background a sunset beach'"}
                  className="w-full bg-[#141414] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#606060] resize-none outline-none focus:border-[#3c3c3c] leading-relaxed transition-colors"
                  rows={5}
                />
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Reference Images</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {promptRefUrls.map((url, i) => (
                      <div key={i} className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-[#2e2e2e]">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onPointerDown={e => e.stopPropagation()}
                          onClick={() => setPromptRefUrls(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#0d0d0d] flex items-center justify-center text-[#c0c0c0] hover:text-white"
                        >
                          <IconX className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <label key={promptFileInputKey} className="w-11 h-11 rounded-lg border border-dashed border-[#2e2e2e] bg-[#141414] flex items-center justify-center cursor-pointer hover:border-[#555555] hover:bg-[#1a1a1a] transition-colors flex-shrink-0" title="Add reference image(s)">
                      <IconPlus className="w-4 h-4 text-[#a0a0a0]" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={async e => {
                        const files = Array.from(e.target.files ?? [])
                        if (!files.length) return
                        const urls: string[] = []
                        for (const file of files) {
                          try {
                            const fd = new FormData(); fd.append('file', file)
                            const r = await fetch('/api/images/upload', { method: 'POST', body: fd })
                            const d = await r.json()
                            urls.push(d.image?.url ?? URL.createObjectURL(file))
                          } catch { urls.push(URL.createObjectURL(file)) }
                        }
                        setPromptRefUrls(prev => [...prev, ...urls])
                        setPromptFileInputKey(k => k + 1)
                      }} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── CANVAS WRAPPER ───────────────────────────────── */}
            <div ref={canvasWrapperRef} className="relative flex-shrink-0 order-1 lg:order-2" style={{ width: displaySize?.w, height: displaySize?.h }}>

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
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseEnter={() => setShowBrushCursor(true)}
              onMouseLeave={e => { setShowBrushCursor(false); if (isDrawingRef.current) onMouseUp(e) }}
            />

            {mode === 'edit' && (activeTool === 'brush' || activeTool === 'eraser') && showBrushCursor && (() => {
              const activeLayer = layers.find(l => l.id === activeLayerId)
              const cursorColor = activeTool === 'eraser' ? '#888888' : (activeLayer?.color ?? '#FFFF00')
              const cursorSize = brushSize
              return (
                <div
                  ref={brushCursorRef}
                  className="absolute top-0 left-0 pointer-events-none z-30"
                  style={{
                    width: cursorSize, height: cursorSize,
                    marginLeft: -cursorSize / 2, marginTop: -cursorSize / 2,
                    borderRadius: '50%',
                    border: `1.5px solid ${cursorColor}`,
                    boxShadow: `0 0 ${Math.max(8, cursorSize / 3)}px ${cursorColor}77, inset 0 0 ${Math.max(4, cursorSize / 6)}px ${cursorColor}33`,
                    willChange: 'transform',
                  }}
                />
              )
            })()}

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

            {textInput.visible && (
              <div className="absolute z-30" style={{ left: textInput.screenX, top: textInput.screenY }}>
                <input
                  ref={textInputRef}
                  value={textValue}
                  onChange={e => setTextValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') { setTextInput(p => ({ ...p, visible: false })); setTextValue('') } }}
                  onBlur={commitText}
                  className="bg-[#080808] border border-[#686800] text-[#FFFF00] text-sm px-3 py-2 rounded-xl outline-none min-w-[170px] shadow-2xl backdrop-blur-xl"
                  placeholder="Type & press Enter…"
                />
              </div>
            )}

            {mode === 'edit' && (activeTool === 'brush' || activeTool === 'eraser') && !activeLayerId && layers.length === 0 && (
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-4 lg:pb-6 px-2">
                <div className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] text-[10px] lg:text-xs text-gray-300 font-semibold shadow-lg text-center max-w-xs">
                  Paint anywhere to start masking — layer is created automatically
                </div>
              </div>
            )}
            {mode === 'edit' && activeTool === 'rect' && (
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-4 lg:pb-6 px-2">
                <div className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] text-[10px] lg:text-xs text-gray-300 font-semibold shadow-lg text-center max-w-xs">
                  Draw a rectangle, then describe the change in the floating card
                </div>
              </div>
            )}
            {mode === 'edit' && activeTool === 'text' && (
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-4 lg:pb-6 px-2">
                <div className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] text-[10px] lg:text-xs text-gray-300 font-semibold shadow-lg text-center max-w-xs">
                  Click anywhere on the image to add a text label
                </div>
              </div>
            )}

            {mode === 'edit' && displaySize && layers.map(layer => (
              <FloatingMaskCard
                key={layer.id}
                layer={layer}
                scaleX={scaleX} scaleY={scaleY}
                canvasW={displaySize.w} canvasH={displaySize.h}
                isActive={activeLayerId === layer.id}
                onSelect={() => setActiveLayerId(layer.id)}
                onUpdatePrompt={p => setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, prompt: p } : l))}
                onUpdateRefs={urls => setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, referenceImageUrls: urls } : l))}
                onDelete={() => removeLayer(layer.id)}
                onCardDrag={(dx, dy) => setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, cardOffset: { x: l.cardOffset.x + dx, y: l.cardOffset.y + dy } } : l))}
              />
            ))}

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
                    onScale={newFontSize => setTextAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, fontSize: newFontSize } : a))}
                  />
                ))}
              </div>
            )}
          </div>

          </div>
        )}
      </div>

      {/* ── MODE SWITCHER ──────────────────────── */}
      <div className="fixed top-[4.6rem] left-1/2 -translate-x-1/2 z-40 px-2">
        <div className="flex bg-[#0c0c0c] border border-[#2a2a2a] rounded-xl p-1 shadow-xl gap-0.5 text-center">
          {([
            { id: 'edit',    label: 'Edit',    Icon: IconPencil  },
            { id: 'relight', label: 'Relight', Icon: IconBulb    },
            { id: 'prompt',  label: 'Prompt',  Icon: IconSparkles },
          ] as { id: Mode; label: string; Icon: React.ComponentType<{ className?: string }> }[]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={cn(
                'flex items-center gap-1 lg:gap-1.5 px-2 lg:px-4 py-1.5 text-[10px] lg:text-[11px] font-black rounded-lg uppercase tracking-wider lg:tracking-widest transition-all duration-200',
                mode === id
                  ? 'bg-[#FFFF00] text-black shadow-sm'
                  : 'text-[#b0b0b0] hover:text-white'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOTTOM BAR ───────── */}
      {imageUrl && (
        <div className="fixed bottom-3 lg:bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-1.5 lg:gap-2 max-w-[calc(100vw-1rem)]">
          <label className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg lg:rounded-xl bg-[#141414] border border-[#252525] cursor-pointer hover:border-[#303030] transition-all shrink-0">
            <IconCloudUpload className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.6} />
            <span className="text-[10px] lg:text-[11px] font-black text-gray-400 uppercase tracking-wide hidden sm:inline">Replace</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </label>

          <ModelDropdown selectedModel={selectedModel} onSelect={setSelectedModel} />

          <div className="w-px h-3 lg:h-4 bg-[#252525] shrink-0 hidden sm:block" />

          <div className="flex items-center gap-1 lg:gap-1.5 shrink-0">
            <CreditIcon className="w-4 lg:w-5 h-4 lg:h-5 rounded" iconClassName="w-2 lg:w-2.5 h-2 lg:h-2.5" />
            <span className="font-mono text-xs lg:text-sm font-medium text-white/70 tabular-nums">{totalCost}</span>
          </div>

          <div className="flex bg-[#141414] border border-[#252525] p-0.5 rounded-lg shrink-0">
            {([1, 2, 4] as const).map(n => (
              <button
                key={n}
                onClick={() => setGenCount(n)}
                className={cn(
                  'px-1.5 lg:px-2 py-1 lg:py-1.5 text-[9px] lg:text-[10.5px] font-black uppercase tracking-wide rounded-md transition-all whitespace-nowrap w-6 lg:w-8',
                  genCount === n ? 'bg-[#222222] text-[#FFFF00] shadow-sm' : 'text-gray-500 hover:text-white'
                )}
              >{n}</button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex items-center gap-1.5 lg:gap-2 px-4 lg:px-7 py-1.5 lg:py-2 rounded-xl font-black text-xs lg:text-sm uppercase tracking-wider bg-[#FFFF00] text-black shadow-[0_0_20px_rgba(255,255,0,0.15)] hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <IconWand className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Generate</span>
            <span className="inline sm:hidden">Gen</span>
          </button>
        </div>
      )}

      {/* ── RESULTS DOCK ─────────────────────── */}
      {results.length > 0 && (
        <div className="fixed right-2 lg:right-5 bottom-20 lg:bottom-6 z-40 max-w-[calc(100vw-1rem)]">
          <div className="bg-[#0c0c0c] border border-[#252525] rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 lg:px-4 py-2 border-b border-[#222222]">
              <span className="text-[9px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest">Results ({results.length})</span>
              <button onClick={() => setResultsDockOpen(p => !p)} className="text-gray-500 hover:text-white transition-colors">
                {resultsDockOpen ? <IconChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : <IconChevronUp className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
              </button>
            </div>
            {resultsDockOpen && (
              <div className="flex gap-2 p-2.5 overflow-x-auto" style={{ maxWidth: 'min(340px, calc(100vw - 2rem))' }}>
                {results.map(r => (
                  <button
                    key={r.id} onClick={() => setModalResult(r)}
                    className="flex-shrink-0 w-[60px] h-[60px] lg:w-[72px] lg:h-[72px] rounded-lg lg:rounded-xl overflow-hidden border border-[#282828] hover:border-[#505050] transition-all duration-150 hover:scale-105"
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
        <div className="fixed inset-0 z-50 bg-[#080808] flex items-center justify-center p-4" onClick={() => setModalResult(null)}>
          <div className="flex flex-col gap-3 lg:gap-4 max-w-4xl max-h-[90vh] items-center w-full" onClick={e => e.stopPropagation()}>
            <img src={modalResult.url} alt="" className="rounded-xl lg:rounded-2xl max-h-[60vh] lg:max-h-[74vh] object-contain shadow-[0_30px_80px_rgba(0,0,0,0.8)] w-full" />
            <div className="flex flex-col sm:flex-row items-center gap-2 lg:gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  const resultUrl = modalResult.url
                  const img = new Image()
                  img.crossOrigin = 'anonymous'
                  img.onload = () => {
                    bgImageRef.current = img
                    const nat = { w: img.naturalWidth, h: img.naturalHeight }
                    setImageNaturalSize(nat)
                    const ds = computeDisplaySize(nat.w, nat.h)
                    setDisplaySize(ds)

                    // Clear editor state
                    setLayers([])
                    setActiveLayerId(null)
                    layerCanvasesRef.current.clear()
                    nextColorIdx.current = 0
                    setTextAnnotations([])
                    setMode('edit')
                    // Canvas will be setup by the imageNaturalSize useEffect
                  }
                  img.src = resultUrl
                  setImageUrl(resultUrl)
                  setModalResult(null)
                }}
                className="flex items-center justify-center gap-2 px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg lg:rounded-xl bg-[#FFFF00] text-black font-black text-xs lg:text-sm hover:scale-105 transition-transform w-full sm:w-auto"
              >
                <IconPencil className="w-3.5 lg:w-4 h-3.5 lg:h-4" /> Edit this
              </button>
              <a href={modalResult.url} download="result.png" className="flex items-center justify-center gap-2 px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg lg:rounded-xl bg-[#1e1e1e] text-white font-bold text-xs lg:text-sm hover:bg-[#202020] transition-colors w-full sm:w-auto">
                <IconDownload className="w-3.5 lg:w-4 h-3.5 lg:h-4" /> Download
              </a>
              <button onClick={() => setModalResult(null)} className="px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg lg:rounded-xl bg-[#141414] text-[#686868] font-bold text-xs lg:text-sm hover:bg-[#1a1a1a] transition-colors w-full sm:w-auto">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )

  // Wrap in modal overlay if not standalone
  if (sourceContext === 'standalone') {
    return content
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[10001] w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white hover:bg-[#222222] hover:border-[#444444] transition-all"
        title="Close"
      >
        <IconX className="w-5 h-5" />
      </button>

      {content}
    </div>
  )
}
