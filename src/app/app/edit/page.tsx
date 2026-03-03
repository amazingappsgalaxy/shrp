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
  IconChevronDown, IconChevronUp, IconPencil, IconBulb, IconAi,
  IconCloudUpload, IconArrowBackUp, IconArrowForwardUp, IconPhotoPlus,
} from '@tabler/icons-react'
import { useTaskManager } from '@/components/providers/TaskManagerProvider'

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

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

function computeDisplaySize(nw: number, nh: number): { w: number; h: number } {
  const maxW = Math.min(window.innerWidth - 400, 860)  // reserve for inline left panel (280px) + gaps
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
        background: 'radial-gradient(circle at 42% 38%, #1e1e1e 0%, #080808 70%)',
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
          color: '#686868',
          pointerEvents: 'none',
          lineHeight: 1,
        }}>{l}</span>
      ))}

      {/* Drag hint text */}
      <div style={{
        position: 'absolute', bottom: '14%', left: 0, right: 0,
        textAlign: 'center', fontSize: 10, color: '#606060',
        pointerEvents: 'none', fontWeight: 700, letterSpacing: 1,
      }}>DRAG TO MOVE LIGHT</div>
    </div>
  )
}

// ─── Option A: Overhead Map ────────────────────────────────────────────────────
// Top-down view of the scene — drag the dot to position the light source.
// Angle from center = azimuth (North = Front). Distance from center maps to elevation
// (center = overhead 90°, edge = horizon 0°, beyond = below -20°).

function OverheadMap({
  azimuth, elevation, lightColor, intensity,
  onAzimuthChange, onElevationChange,
}: {
  azimuth: number; elevation: number; lightColor: string; intensity: number
  onAzimuthChange: (v: number) => void; onElevationChange: (v: number) => void
}) {
  const dragging = useRef(false)
  const mapRef = useRef<HTMLDivElement>(null)

  // Map az/el to dot position (% within circle)
  // elevation 90 → center, 0 → edge (75%), -20 → just outside edge
  const elevR = Math.max(0, Math.min(1, (90 - elevation) / 110)) * 0.76
  const azRad = azimuth * Math.PI / 180
  const dotX = 50 + Math.sin(azRad) * elevR * 50
  const dotY = 50 - Math.cos(azRad) * elevR * 50

  const applyPointer = (e: React.PointerEvent) => {
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const radius = rect.width / 2
    const dist = Math.sqrt(dx * dx + dy * dy)
    const az = ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360
    const el = Math.round(Math.max(-20, Math.min(90, 90 - (dist / radius) * 110)))
    onAzimuthChange(Math.round(az))
    onElevationChange(el)
  }

  return (
    <div
      ref={mapRef}
      style={{ width: 148, height: 148, position: 'relative', borderRadius: '50%', cursor: 'crosshair', touchAction: 'none', userSelect: 'none', overflow: 'hidden', background: '#080808', border: '1px solid #1e1e1e' }}
      onPointerDown={e => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); applyPointer(e) }}
      onPointerMove={e => { if (dragging.current) applyPointer(e) }}
      onPointerUp={() => { dragging.current = false }}
    >
      {/* Concentric rings for elevation hint */}
      {[0.38, 0.63, 0.88].map((r, i) => (
        <div key={i} style={{ position: 'absolute', borderRadius: '50%', border: '1px solid #1a1a1a', width: `${r * 100}%`, height: `${r * 100}%`, left: `${50 - r * 50}%`, top: `${50 - r * 50}%`, pointerEvents: 'none' }} />
      ))}
      {/* Crosshairs */}
      <div style={{ position: 'absolute', width: 1, top: 0, bottom: 0, left: '50%', background: '#141414', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', height: 1, left: 0, right: 0, top: '50%', background: '#141414', pointerEvents: 'none' }} />
      {/* Compass labels */}
      {[['FRONT', '50%', 4, undefined, undefined],
        ['BACK',  '50%', undefined, undefined, 4],
        ['L',     3,     '50%', undefined, undefined],
        ['R',     undefined, '50%', 3, undefined],
      ].map(([label, left, top, right, bottom]) => (
        <span key={String(label)} style={{ position: 'absolute', fontSize: 8, fontWeight: 900, color: '#353535', letterSpacing: 1, pointerEvents: 'none', lineHeight: 1,
          left: typeof left === 'string' ? left : left != null ? left as number : undefined,
          top: typeof top === 'string' ? top : top != null ? top as number : undefined,
          right: right != null ? right as number : undefined,
          bottom: bottom != null ? bottom as number : undefined,
          transform: typeof left === 'string' ? 'translateX(-50%)' : typeof top === 'string' ? 'translateY(-50%)' : undefined,
        }}>{label}</span>
      ))}
      {/* Glow halo where the light is */}
      <div style={{ position: 'absolute', width: 40, height: 40, borderRadius: '50%', background: lightColor, opacity: (0.06 + intensity / 400), filter: 'blur(14px)', left: `calc(${dotX}% - 20px)`, top: `calc(${dotY}% - 20px)`, pointerEvents: 'none' }} />
      {/* Light dot */}
      <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: lightColor, boxShadow: `0 0 8px 2px ${lightColor}88`, left: `calc(${dotX}% - 5px)`, top: `calc(${dotY}% - 5px)`, pointerEvents: 'none' }} />
    </div>
  )
}

// ─── Option B: Compass Clock ────────────────────────────────────────────────────
// 8 directional buttons arranged in a clock/compass ring + 4 elevation preset buttons.

const CLOCK_DIRS = [
  { label: 'Front',  az: 0,   icon: '↑' },
  { label: 'F·R',    az: 45,  icon: '↗' },
  { label: 'Right',  az: 90,  icon: '→' },
  { label: 'B·R',    az: 135, icon: '↘' },
  { label: 'Back',   az: 180, icon: '↓' },
  { label: 'B·L',    az: 225, icon: '↙' },
  { label: 'Left',   az: 270, icon: '←' },
  { label: 'F·L',    az: 315, icon: '↖' },
]

const CLOCK_ELEVS = [
  { label: 'Top',   el: 75 },
  { label: 'High',  el: 45 },
  { label: 'Mid',   el: 20 },
  { label: 'Below', el: -25 },
]

function CompassClock({
  azimuth, elevation, lightColor,
  onAzimuthChange, onElevationChange,
}: {
  azimuth: number; elevation: number; lightColor: string
  onAzimuthChange: (v: number) => void; onElevationChange: (v: number) => void
}) {
  const activeAz = CLOCK_DIRS.find(d => d.az === azimuth)?.az
  const activeEl = CLOCK_ELEVS.find(e => e.el === elevation)?.el

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      {/* 8-direction ring */}
      <div style={{ position: 'relative', width: 118, height: 118, flexShrink: 0 }}>
        {CLOCK_DIRS.map((d, i) => {
          const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
          const r = 44
          const x = 59 + Math.cos(angle) * r
          const y = 59 + Math.sin(angle) * r
          const active = azimuth === d.az
          return (
            <button
              key={d.az}
              onClick={() => onAzimuthChange(d.az)}
              title={d.label}
              style={{
                position: 'absolute', width: 26, height: 26, borderRadius: 7,
                left: x - 13, top: y - 13,
                background: active ? '#1a1a00' : '#111',
                border: `1px solid ${active ? '#555500' : '#222'}`,
                color: active ? lightColor : '#555',
                fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.1s', padding: 0,
              }}
            >{d.icon}</button>
          )
        })}
        {/* Center ring */}
        <div style={{ position: 'absolute', width: 26, height: 26, borderRadius: '50%', background: '#0a0a0a', border: '1px solid #1e1e1e', left: 46, top: 46 }} />
      </div>

      {/* Elevation buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {CLOCK_ELEVS.map(e => {
          const active = activeEl === e.el
          return (
            <button key={e.label} onClick={() => onElevationChange(e.el)} style={{
              padding: '4px 8px', borderRadius: 5, fontSize: 9, fontWeight: 900,
              background: active ? '#1a1a00' : '#111',
              border: `1px solid ${active ? '#555500' : '#222'}`,
              color: active ? lightColor : '#555',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em',
              transition: 'all 0.1s',
            }}>{e.label}</button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Option C: Dual Sliders ──────────────────────────────────────────────────────
// Azimuth slider with a rotating mini-compass indicator + elevation slider with a sun
// height diagram. Gives precise numeric control.

function DualSliders({
  azimuth, elevation, lightColor,
  onAzimuthChange, onElevationChange,
}: {
  azimuth: number; elevation: number; lightColor: string
  onAzimuthChange: (v: number) => void; onElevationChange: (v: number) => void
}) {
  const azRad = (azimuth - 90) * Math.PI / 180
  const needleX2 = 12 + Math.cos(azRad) * 8
  const needleY2 = 12 + Math.sin(azRad) * 8

  // Sun vertical position: el=-90 → 22, el=90 → 2
  const sunY = 12 - (elevation / 90) * 10

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Direction */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" fill="#0a0a0a" stroke="#1e1e1e" strokeWidth="1" />
            <text x="12" y="6.5" textAnchor="middle" fontSize="3" fill="#333" fontWeight="bold">F</text>
            <text x="12" y="20.5" textAnchor="middle" fontSize="3" fill="#333" fontWeight="bold">B</text>
            <text x="5.5" y="13" textAnchor="middle" fontSize="3" fill="#333" fontWeight="bold">L</text>
            <text x="18.5" y="13" textAnchor="middle" fontSize="3" fill="#333" fontWeight="bold">R</text>
            <line x1="12" y1="12" x2={needleX2} y2={needleY2} stroke={lightColor} strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.2" fill={lightColor} />
          </svg>
          <div>
            <div style={{ fontSize: 9, color: '#555', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Direction</div>
            <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>{azimuth}°</div>
          </div>
        </div>
        <input type="range" min="0" max="359" step="1" value={azimuth}
          onChange={e => onAzimuthChange(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: lightColor, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#333', marginTop: 2 }}>
          <span>Front (0°)</span><span>Right (90°)</span><span>Back (180°)</span><span>Left (270°)</span>
        </div>
      </div>

      {/* Height */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <line x1="4" y1="18" x2="20" y2="18" stroke="#1e1e1e" strokeWidth="1" />
            <line x1="12" y1="4" x2="12" y2="18" stroke="#1a1a1a" strokeWidth="1" strokeDasharray="1,1.5" />
            <circle cx="12" cy={sunY} r="2.5" fill={lightColor} opacity="0.85" />
            <line x1="12" y1={sunY} x2="12" y2="18" stroke={lightColor} strokeWidth="0.7" strokeDasharray="1,1" opacity="0.35" />
          </svg>
          <div>
            <div style={{ fontSize: 9, color: '#555', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Height</div>
            <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>{elevation > 0 ? '+' : ''}{elevation}°</div>
          </div>
        </div>
        <input type="range" min="-85" max="85" step="1" value={elevation}
          onChange={e => onElevationChange(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: lightColor, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#333', marginTop: 2 }}>
          <span>Below (−85°)</span><span>Horizon (0°)</span><span>Overhead (+85°)</span>
        </div>
      </div>
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
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0c0c0c] border border-[#252525] shadow-lg hover:border-[#303030] transition-all"
      >
        <IconSparkles className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs font-black text-gray-300 uppercase tracking-wide">
          {m?.label ?? 'Model'}{m?.qualityTier ? ` · ${m.qualityTier}` : ''}
        </span>
        <IconChevronDown className={cn('w-3 h-3 text-gray-500 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-[220px] bg-[#0c0c0c] border border-[#252525] rounded-xl shadow-2xl overflow-hidden z-50">
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
                    ? 'bg-[#181818] text-[#FFFF00]'
                    : 'text-gray-400 hover:text-white hover:bg-[#141414]'
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

const CARD_H = 140  // approximate card height for Y clamping

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

  // Free positioning — no clamping so user can drag card anywhere
  const cardX = baseCentroidCss.x + 80 + layer.cardOffset.x
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
          x2={cardX + 8} y2={cardY + 20}
          stroke={layer.color}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.5}
        />
        <circle cx={baseCentroidCss.x} cy={baseCentroidCss.y} r={4} fill={layer.color} opacity={0.6} />
      </svg>

      {/* The card */}
      <div
        ref={cardRef}
        className="absolute w-[200px] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.7)] border"
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
        {/* Header — draggable */}
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
            {/* Solid color chip with layer name */}
            <span
              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm leading-none"
              style={{ background: layer.color, color: '#000' }}
            >
              {layer.colorName}
            </span>
          </div>
          {/* X = delete layer — stopPropagation on pointerDown prevents header drag from stealing the click */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-0.5 text-[#606060] hover:text-white transition-colors rounded"
          >
            <IconX className="w-3 h-3" />
          </button>
        </div>

        {/* Prompt textarea */}
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

        {/* Reference images — multiple, thumbnails + add button */}
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
            {/* Add more images */}
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

      {/* Scale handle — bottom-right corner, drag to resize */}
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
// Segmented bar slider — no separate thumb, the filled bars are the control.
// growing=true: bars ramp up in height left→right (for brush size)
// growing=false: uniform height (for intensity, etc.)

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
// Vertical segmented bar slider — bottom = min, top = max.
// Bars grow wider from bottom→top to visualise increasing brush size.

function PremiumSliderVertical({ value, min, max, step, onChange, color, segments = 14 }: {
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void; color: string; segments?: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pct = (value - min) / (max - min)
  const filledCount = Math.max(0, Math.round(pct * segments))

  const update = (e: React.PointerEvent) => {
    const r = trackRef.current!.getBoundingClientRect()
    // Inverted: dragging UP (smaller clientY) → higher value
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
        // i=0 → DOM first → visually BOTTOM (flex-col-reverse)
        const t = i / (segments - 1)  // 0=bottom, 1=top
        const isFilled = i < filledCount
        const isEdge = isFilled && i === filledCount - 1
        const w = 4 + t * 18   // 4px at bottom → 22px at top
        return (
          <div
            key={i}
            className="rounded-sm flex-shrink-0"
            style={{
              width: w,
              height: 4,
              background: isFilled ? (isEdge ? '#ffffff' : color) : '#252525',
              opacity: isFilled && !isEdge ? 0.55 + t * 0.45 : 1,  // min 55% so color is always vivid
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EditPage() {
  useAuth()
  const { addWatchedTask } = useTaskManager()

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

  // ── Undo / Redo  (snapshots of all layer canvas data URLs + layer meta)
  type HistoryEntry = { layers: MaskLayer[]; snapshots: Map<string, string> }
  const undoStack = useRef<HistoryEntry[]>([])
  const redoStack = useRef<HistoryEntry[]>([])
  // Use a ref so applyHistory doesn't depend on renderCanvas (which is defined later)
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
    // Save current state to redo
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

  // ── Annotations (text only — rect is now a canvas mask tool)
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([])
  const [selectedAnnotId, setSelectedAnnotId] = useState<string | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingTextValue, setEditingTextValue] = useState('')

  // ── Color picker ref (for relight)
  const colorPickerRef = useRef<HTMLInputElement>(null)

  // ── Light
  const [lightSettings, setLightSettings] = useState<LightSettings>({
    azimuth: 45, elevation: 35, color: '#ffffff', intensity: 70, softness: 'soft', sceneLock: true,
  })
  const [activeLightingStyle, setActiveLightingStyle] = useState<string | null>(null)
  const [relightUIOption, setRelightUIOption] = useState<'A' | 'B' | 'C'>('A')

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
  const [rectPreview, setRectPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [showBrushCursor, setShowBrushCursor] = useState(false)

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
      if (lc) {
        ctx.drawImage(lc, 0, 0)
      }
    }
    // Text and rect annotations rendered as HTML overlays (moveable)
  }, [layers])

  useEffect(() => { renderCanvas() }, [renderCanvas])
  // Keep renderCanvasRef in sync so applyHistory can call it without dep issues
  useEffect(() => { renderCanvasRef.current = renderCanvas }, [renderCanvas])

  // ── Clear floating text input whenever mode OR tool changes
  useEffect(() => {
    setTextInput({ visible: false, screenX: 0, screenY: 0, canvasX: 0, canvasY: 0 })
    setTextValue('')
  }, [mode, activeTool])

  // ── Keyboard shortcuts: Ctrl+Z undo, Ctrl+Shift+Z / Ctrl+Y redo
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
      const canvas = displayCanvasRef.current
      if (canvas) {
        canvas.width = nat.w
        canvas.height = nat.h
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0)
      }
      setLayers([])
      setTextAnnotations([])
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
    setLayers(prev => {
      // Stagger new card so it doesn't overlap existing ones
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
      // Auto-create a layer if none exists
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
      // Auto-create first layer so user doesn't need to click +
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
      // Paint the first dot using the new layer directly
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
  }, [activeTool, mode, activeLayerId, layers, getCanvasPoint, brushSize, scaleX, paintDot, renderCanvas])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Update custom brush cursor via DOM ref — zero re-renders
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
      // Paint the rectangle area onto the active layer canvas as a mask
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
    // Always hide the input first — even on empty submit
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

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !imageUrl) return
    setError(null)

    // ── Build shared image data (same for all variations) ──────────────────────
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

    // Variation suffixes — only when genCount > 1, to get distinct outputs
    const VARIATION_SUFFIXES = [
      '',
      ' Interpretation: lean toward a slightly warmer, more saturated look.',
      ' Interpretation: lean toward a slightly cooler, more desaturated look.',
      ' Interpretation: emphasize contrast and depth more than the base request.',
    ]

    // Launch all variations in parallel
    const variations = Array.from({ length: genCount }, (_, i) => i)
    setGeneratingCount(c => c + genCount)

    // Generate historyIds client-side so we can register with task manager immediately
    const historyIds = variations.map(() => uid())
    const modeLabel = mode === 'relight' ? 'Relighting' : mode === 'prompt' ? 'Editing' : 'Editing'
    historyIds.forEach(hid => addWatchedTask(hid, modeLabel))

    await Promise.all(variations.map(async (varIdx) => {
      const historyId = historyIds[varIdx]!
      const suffix = genCount > 1 ? (VARIATION_SUFFIXES[varIdx] ?? '') : ''
      const combinedPrompt = basePrompt + suffix

      try {
        const body: Record<string, unknown> = {
          mode, model: selectedModel,
          historyId,
          originalImageUrl: imageUrl,
          cleanOriginalDataUrl,
          combinedPrompt, referenceImages,
          compositeDataUrl,
        }
        const res = await fetch('/api/edit-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `HTTP ${res.status}`) }
        const data = await res.json()
        setResults(prev => [{ id: historyId, url: data.outputUrl, mode, timestamp: Date.now(), inputUrl: imageUrl!, prompt: combinedPrompt }, ...prev])
        setResultsDockOpen(true)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        setError(msg)
      } finally {
        setGeneratingCount(c => c - 1)
      }
    }))
  }, [canGenerate, imageUrl, mode, layers, lightSettings, promptText, promptRefUrls, selectedModel, genCount, flattenForExport])

  const creditCost = MODEL_REGISTRY[selectedModel]?.credits ?? 20
  const totalCost = creditCost * genCount

  const canvasCursor = !bgImageRef.current ? 'default'
    : mode !== 'edit' ? 'default'
    : activeTool === 'text' ? 'text'
    : (activeTool === 'brush' || activeTool === 'eraser') ? 'none'  // custom cursor ring takes over
    : 'crosshair'

  // ── Render
  return (
    <div className="fixed inset-0 pt-16 bg-[#070707] text-white overflow-hidden" style={{ userSelect: 'none', backgroundImage: 'radial-gradient(circle, rgb(255 255 255 / 20%) 1.2px, transparent 1.2px)', backgroundSize: '20px 20px' }}>

      {/* ── CANVAS WORKSPACE ─────────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center px-4" style={{ top: '3rem' }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        {!imageUrl ? (
          /* ── REDESIGNED EMPTY STATE ─────────────────────────────────── */
          <label className="group cursor-pointer flex flex-col items-center gap-8 select-none">
            <div className="relative w-48 h-44 rounded-xl border border-[#333333] group-hover:border-[#505050] bg-[#111111] group-hover:bg-[#161616] flex flex-col items-center justify-center gap-3 transition-all duration-300">
              <IconCloudUpload className="w-11 h-11 text-[#686868] group-hover:text-[#b0b0b0] transition-all duration-300 group-hover:-translate-y-1" strokeWidth={1.5} />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#686868] group-hover:text-[#b0b0b0] transition-colors">Upload Image</span>
            </div>
            <div className="text-center space-y-2.5">
              <p className="text-sm font-semibold text-[#787878] group-hover:text-[#c0c0c0] transition-colors">Drop an image or click to browse</p>
              <div className="flex items-center justify-center gap-2">
                {['PNG', 'JPG', 'WebP'].map(t => (
                  <span key={t} className="text-[10px] font-bold text-[#585858] px-2 py-0.5 rounded bg-[#141414] border border-[#252525] uppercase tracking-wide">{t}</span>
                ))}
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </label>
        ) : (
          /* flex row: left panel + canvas */
          <div className="flex items-center gap-4 h-full">

            {/* ── LEFT PANEL: EDIT TOOLS ───────────────────────── */}
            {mode === 'edit' && (
              <div className="flex-shrink-0 self-center flex flex-col items-center gap-1 p-2 rounded-xl bg-[#0d0d0d] border border-[#2c2c2c] shadow-xl">
                {/* Undo / Redo */}
                <div className="flex gap-0.5 mb-0.5">
                  <button onClick={undo} title="Undo (Ctrl+Z)"
                    className="w-8 h-7 rounded-md flex items-center justify-center text-[#a0a0a0] hover:text-white hover:bg-[#222222] transition-all">
                    <IconArrowBackUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={redo} title="Redo (Ctrl+Shift+Z)"
                    className="w-8 h-7 rounded-md flex items-center justify-center text-[#a0a0a0] hover:text-white hover:bg-[#222222] transition-all">
                    <IconArrowForwardUp className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-10 h-px bg-[#191919] mb-0.5" />

                {/* Active layer indicator */}
                {activeLayerId && (
                  <div className="w-6 h-1.5 rounded-full mb-0.5" style={{ background: layers.find(l => l.id === activeLayerId)?.color ?? '#fff' }} />
                )}

                {/* Tool buttons */}
                {[
                  { id: 'brush' as Tool, Icon: IconBrush, tip: 'Brush — paint mask area' },
                  { id: 'eraser' as Tool, Icon: IconEraser, tip: 'Eraser — remove mask paint' },
                  { id: 'rect' as Tool, Icon: IconSquare, tip: 'Rectangle — mark an area' },
                  { id: 'text' as Tool, Icon: IconTypography, tip: 'Text — add a label' },
                ].map(({ id, Icon, tip }) => (
                  <button key={id} onClick={() => setActiveTool(id)} title={tip}
                    className={cn('w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                      activeTool === id ? 'bg-[#FFFF00] text-black shadow-md' : 'text-[#c0c0c0] hover:text-white hover:bg-[#222222]'
                    )}>
                    <Icon className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                ))}

                {/* Brush size — vertical segmented slider */}
                {(activeTool === 'brush' || activeTool === 'eraser') && (
                  <>
                    <div className="w-5 h-px bg-[#1e1e1e] my-0.5" />
                    <div className="flex flex-col items-center gap-1.5">
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

                <div className="w-5 h-px bg-[#1e1e1e] my-1" />

                {/* Add layer — yellow circle CTA */}
                <button onClick={addLayer} title="Add new mask layer"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FFFF00] text-black hover:scale-105 active:scale-95 transition-all shadow-md">
                  <IconPlus className="w-4 h-4" strokeWidth={2.5} />
                </button>

                {/* Layer dots */}
                {layers.length > 0 && (<>
                  <div className="w-5 h-px bg-[#1e1e1e]" />
                  <div className="flex flex-col gap-1.5">
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

            {/* ── LEFT PANEL: RELIGHT ──────────────────────────── */}
            {mode === 'relight' && (
              <div className="flex-shrink-0 w-[280px] self-center overflow-y-auto rounded-xl bg-[#0d0d0d] border border-[#2c2c2c] shadow-xl" style={{ maxHeight: 'calc(100vh - 13rem)' }}>
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

                  {/* Light direction control — 3 UI design options */}
                  <div>
                    {/* Option selector tabs */}
                    <div className="flex items-center gap-1 mb-2.5">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-wider mr-1">UI</p>
                      {(['A', 'B', 'C'] as const).map((opt, i) => (
                        <button key={opt} onClick={() => setRelightUIOption(opt)}
                          className={cn('flex-1 py-1 text-[9px] font-black rounded transition-all border uppercase tracking-wider',
                            relightUIOption === opt
                              ? 'border-[#555500] bg-[#1a1a00] text-[#FFFF00]'
                              : 'border-[#1e1e1e] text-gray-600 hover:text-gray-400 hover:border-[#2a2a2a]'
                          )}>
                          {['Map', 'Clock', 'Sliders'][i]}
                        </button>
                      ))}
                    </div>

                    {/* Option A — Overhead Map (top-down drag) */}
                    {relightUIOption === 'A' && (
                      <div className="flex flex-col items-center gap-2">
                        <OverheadMap
                          azimuth={lightSettings.azimuth} elevation={lightSettings.elevation}
                          lightColor={lightSettings.color} intensity={lightSettings.intensity}
                          onAzimuthChange={az => { setLightSettings(p => ({ ...p, azimuth: az })); setActiveLightingStyle(null) }}
                          onElevationChange={el => { setLightSettings(p => ({ ...p, elevation: el })); setActiveLightingStyle(null) }}
                        />
                        <div className="flex gap-5 text-[10px] font-mono">
                          <span className="text-gray-600">AZ <span className="text-white">{lightSettings.azimuth}°</span></span>
                          <span className="text-gray-600">EL <span className="text-white">{lightSettings.elevation > 0 ? '+' : ''}{lightSettings.elevation}°</span></span>
                        </div>
                      </div>
                    )}

                    {/* Option B — Compass Clock (8-direction ring + elevation presets) */}
                    {relightUIOption === 'B' && (
                      <div className="flex flex-col items-center gap-2">
                        <CompassClock
                          azimuth={lightSettings.azimuth} elevation={lightSettings.elevation}
                          lightColor={lightSettings.color}
                          onAzimuthChange={az => { setLightSettings(p => ({ ...p, azimuth: az })); setActiveLightingStyle(null) }}
                          onElevationChange={el => { setLightSettings(p => ({ ...p, elevation: el })); setActiveLightingStyle(null) }}
                        />
                        <div className="flex gap-5 text-[10px] font-mono">
                          <span className="text-gray-600">AZ <span className="text-white">{lightSettings.azimuth}°</span></span>
                          <span className="text-gray-600">EL <span className="text-white">{lightSettings.elevation > 0 ? '+' : ''}{lightSettings.elevation}°</span></span>
                        </div>
                      </div>
                    )}

                    {/* Option C — Dual Sliders (precision azimuth + elevation) */}
                    {relightUIOption === 'C' && (
                      <DualSliders
                        azimuth={lightSettings.azimuth} elevation={lightSettings.elevation}
                        lightColor={lightSettings.color}
                        onAzimuthChange={az => { setLightSettings(p => ({ ...p, azimuth: az })); setActiveLightingStyle(null) }}
                        onElevationChange={el => { setLightSettings(p => ({ ...p, elevation: el })); setActiveLightingStyle(null) }}
                      />
                    )}
                  </div>

                  {/* Intensity + Falloff side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Intensity — MechanicalSlider */}
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
                    {/* Falloff */}
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

                  {/* Light Color — compact single row */}
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Light Color</p>
                    {/* Row: swatch → hex input → presets */}
                    <div className="flex items-center gap-2">
                      {/* Color swatch — click to open picker */}
                      <button
                        type="button"
                        onClick={() => colorPickerRef.current?.click()}
                        className="w-7 h-7 rounded-md border border-[#3e3e3e] flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-[#555555] transition-all"
                        style={{ background: lightSettings.color }}
                        title="Click to open color picker"
                      />
                      {/* Hidden native color input */}
                      <input
                        ref={colorPickerRef}
                        type="color"
                        value={lightSettings.color}
                        onChange={e => { setLightSettings(p => ({ ...p, color: e.target.value })); setActiveLightingStyle(null) }}
                        className="sr-only"
                        tabIndex={-1}
                      />
                      {/* Hex text input */}
                      <input type="text" value={lightSettings.color}
                        onChange={e => { setLightSettings(p => ({ ...p, color: e.target.value })); setActiveLightingStyle(null) }}
                        className="w-[72px] bg-[#141414] border border-[#2e2e2e] rounded-md px-2 py-1 text-[11px] text-white font-mono uppercase outline-none focus:border-[#3c3c3c] transition-all" />
                      {/* Preset swatches */}
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
              <div className="flex-shrink-0 w-[260px] self-center rounded-xl bg-[#0d0d0d] border border-[#2c2c2c] shadow-xl p-4 space-y-3">
                {/* Prompt textarea — top */}
                <textarea
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  placeholder={"e.g. 'Make the background a sunset beach'"}
                  className="w-full bg-[#141414] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#606060] resize-none outline-none focus:border-[#3c3c3c] leading-relaxed transition-all"
                  rows={5}
                />
                {/* Reference images — thumbnails row + plus button below */}
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
                        setPromptFileInputKey(k => k + 1)  // remount input so same files can be re-selected
                      }} />
                    </label>
                  </div>
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
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseEnter={() => setShowBrushCursor(true)}
              onMouseLeave={e => { setShowBrushCursor(false); if (isDrawingRef.current) onMouseUp(e) }}
            />

            {/* ── Custom brush cursor ring — zero-rerender, DOM-only updates ── */}
            {mode === 'edit' && (activeTool === 'brush' || activeTool === 'eraser') && showBrushCursor && (() => {
              const activeLayer = layers.find(l => l.id === activeLayerId)
              const cursorColor = activeTool === 'eraser' ? '#888888' : (activeLayer?.color ?? '#FFFF00')
              const cursorSize = brushSize  // in display pixels
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
                  className="bg-[#080808] border border-[#686800] text-[#FFFF00] text-sm px-3 py-2 rounded-xl outline-none min-w-[170px] shadow-2xl backdrop-blur-xl"
                  placeholder="Type & press Enter…"
                />
              </div>
            )}

            {/* Contextual hints */}
            {mode === 'edit' && (activeTool === 'brush' || activeTool === 'eraser') && !activeLayerId && layers.length === 0 && (
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-6">
                <div className="px-4 py-2 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] text-xs text-gray-300 font-semibold shadow-lg">
                  Paint anywhere to start masking — layer is created automatically
                </div>
              </div>
            )}
            {mode === 'edit' && activeTool === 'rect' && (
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-6">
                <div className="px-4 py-2 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] text-xs text-gray-300 font-semibold shadow-lg">
                  Draw a rectangle, then describe the change in the floating card
                </div>
              </div>
            )}
            {mode === 'edit' && activeTool === 'text' && (
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-6">
                <div className="px-4 py-2 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] text-xs text-gray-300 font-semibold shadow-lg">
                  Click anywhere on the image to add a text label
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
                onUpdateRefs={urls => setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, referenceImageUrls: urls } : l))}

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
                    onScale={newFontSize => setTextAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, fontSize: newFontSize } : a))}
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
        <div className="flex bg-[#0c0c0c] border border-[#2a2a2a] rounded-xl p-1 shadow-xl gap-0.5">
          {([
            { id: 'edit',    label: 'Edit',    Icon: IconPencil  },
            { id: 'relight', label: 'Relight', Icon: IconBulb    },
            { id: 'prompt',  label: 'Prompt',  Icon: IconSparkles },
          ] as { id: Mode; label: string; Icon: React.ComponentType<{ className?: string }> }[]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-black rounded-lg uppercase tracking-widest transition-all duration-200',
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


      {/* ── BOTTOM BAR — only visible when an image is loaded ───────── */}
      {imageUrl && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-2">
              {/* Replace image */}
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141414] border border-[#252525] cursor-pointer hover:border-[#303030] transition-all shrink-0">
                <IconCloudUpload className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.6} />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-wide">Replace</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </label>

              {/* Model selector */}
              <ModelDropdown selectedModel={selectedModel} onSelect={setSelectedModel} />

              <div className="w-px h-4 bg-[#252525] shrink-0" />

              {/* Credit cost — matches image page style */}
              <div className="flex items-center gap-1.5 shrink-0">
                <CreditIcon className="w-5 h-5 rounded" iconClassName="w-2.5 h-2.5" />
                <span className="font-mono text-sm font-medium text-white/70 tabular-nums">{totalCost}</span>
              </div>

              {/* Generation count — pill segmented control matching image page */}
              <div className="flex bg-[rgb(255_255_255_/_0.04)] border border-[rgb(255_255_255_/_0.04)] p-0.5 rounded-lg shrink-0">
                {([1, 2, 4] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setGenCount(n)}
                    className={cn(
                      'px-2 py-1.5 text-[10.5px] font-black uppercase tracking-wide rounded-md transition-all whitespace-nowrap w-8',
                      genCount === n ? 'bg-white/[0.09] text-[#FFFF00] shadow-sm' : 'text-gray-500 hover:text-white'
                    )}
                  >{n}</button>
                ))}
              </div>

              {/* Generate CTA */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="flex items-center gap-2 px-7 py-2 rounded-xl font-black text-sm uppercase tracking-wider bg-[#FFFF00] text-black shadow-[0_0_20px_rgba(255,255,0,0.15)] hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
              >
                <IconWand className="w-4 h-4" />
                Generate
              </button>
        </div>
        </div>
      )}

      {/* ── RESULTS DOCK (floating bottom-right) ─────────────────────── */}
      {results.length > 0 && (
        <div className="fixed right-5 bottom-6 z-40">
          <div className="bg-[#0c0c0c] border border-[#252525] rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#222222]">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Results ({results.length})</span>
              <button onClick={() => setResultsDockOpen(p => !p)} className="text-gray-500 hover:text-white transition-colors">
                {resultsDockOpen ? <IconChevronDown className="w-4 h-4" /> : <IconChevronUp className="w-4 h-4" />}
              </button>
            </div>
            {resultsDockOpen && (
              <div className="flex gap-2 p-2.5 overflow-x-auto" style={{ maxWidth: 340 }}>
                {results.map(r => (
                  <button
                    key={r.id} onClick={() => setModalResult(r)}
                    className="flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border border-[#282828] hover:border-[#505050] transition-all duration-150 hover:scale-105"
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
        <div className="fixed inset-0 z-50 bg-[#080808]  flex items-center justify-center" onClick={() => setModalResult(null)}>
          <div className="flex flex-col gap-4 max-w-4xl max-h-[90vh] items-center" onClick={e => e.stopPropagation()}>
            <img src={modalResult.url} alt="" className="rounded-2xl max-h-[74vh] object-contain shadow-[0_30px_80px_rgba(0,0,0,0.8)]" />
            <div className="flex items-center gap-3">
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
                    const canvas = displayCanvasRef.current
                    if (canvas) {
                      canvas.width = nat.w; canvas.height = nat.h
                      const ctx = canvas.getContext('2d')
                      ctx?.drawImage(img, 0, 0)
                    }
                    setLayers([])
                    setActiveLayerId(null)
                    layerCanvasesRef.current.clear()
                    nextColorIdx.current = 0
                    setTextAnnotations([])
                    setMode('edit')
                  }
                  img.src = resultUrl
                  setImageUrl(resultUrl)
                  setModalResult(null)
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FFFF00] text-black font-black text-sm hover:scale-105 transition-transform"
              >
                <IconPencil className="w-4 h-4" /> Edit this
              </button>
              <a href={modalResult.url} download="result.png" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1e1e1e] text-white font-bold text-sm hover:bg-[#202020] transition-colors">
                <IconDownload className="w-4 h-4" /> Download
              </a>
              <button onClick={() => setModalResult(null)} className="px-6 py-2.5 rounded-xl bg-[#141414] text-[#686868] font-bold text-sm hover:bg-[#1a1a1a] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task progress shown globally via TaskManagerProvider */}
    </div>
  )
}
