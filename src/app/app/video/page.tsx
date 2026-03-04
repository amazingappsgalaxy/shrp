"use client"
import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-client-simple"
import { ElegantLoading } from "@/components/ui/elegant-loading"
import { useTaskManager } from "@/components/providers/TaskManagerProvider"
import { useCredits } from "@/lib/hooks/use-credits"
import { CreditIcon } from "@/components/ui/CreditIcon"
import { VideoCard, VideoModal } from "@/components/ui/VideoPlayer"
import { getVideoModels } from "@/services/models"
import type { ModelConfig } from "@/services/models"
import {
  IconUpload, IconLoader2, IconSparkles, IconTrash, IconVideo,
  IconChevronDown, IconMinus, IconCamera, IconWand, IconTransfer,
  IconPlayerPlay, IconVolume, IconMaximize, IconDownload,
  IconPlus, IconClock,
} from "@tabler/icons-react"
import { startSmartProgress, type TaskEntry } from "@/lib/task-progress"

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoTab = 'generate' | 'edit' | 'motion'

interface VideoResult {
  id: string
  url: string | null
  aspect: string
  loading: boolean
  prompt?: string
  model?: string
  taskId?: string
  error?: string
}

// ─── Model groupings ──────────────────────────────────────────────────────────

const ALL_VIDEO_MODELS = getVideoModels()
const GENERATE_MODELS = ALL_VIDEO_MODELS.filter(
  m => !['kling-effects', 'kling-video-motion-control'].includes(m.id)
)
const EDIT_MODELS = ALL_VIDEO_MODELS.filter(m => m.id === 'kling-effects')
const MOTION_MODELS = ALL_VIDEO_MODELS.filter(m => m.id === 'kling-video-motion-control')

// Deduplicate by variantGroupId — only show the default variant as the group representative
function dedupeVariants(models: ModelConfig[]): ModelConfig[] {
  const seen = new Set<string>()
  return models.filter(m => {
    if (!m.variantGroupId) return true
    if (seen.has(m.variantGroupId)) return false
    seen.add(m.variantGroupId)
    return true
  })
}

const MODEL_GROUPS: { label: string; models: ModelConfig[] }[] = [
  { label: 'Kling', models: dedupeVariants(GENERATE_MODELS.filter(m => m.id.startsWith('kling'))) },
  { label: 'Google Veo', models: dedupeVariants(GENERATE_MODELS.filter(m => m.id.startsWith('veo'))) },
  { label: 'OpenAI Sora', models: dedupeVariants(GENERATE_MODELS.filter(m => m.id.startsWith('sora'))) },
  { label: 'ByteDance', models: dedupeVariants(GENERATE_MODELS.filter(m => m.id.startsWith('doubao'))) },
].filter(g => g.models.length > 0)

const ASPECT_LABELS: Record<string, string> = {
  '16:9': 'Landscape', '9:16': 'Portrait', '1:1': 'Square',
}

const VIDEO_TASK_DURATION_SECS = 120

const TAG_COLORS: Record<string, string> = {
  Fast: 'bg-green-500/15 text-green-400',
  Google: 'bg-blue-500/15 text-blue-400',
  OpenAI: 'bg-purple-500/15 text-purple-400',
  ByteDance: 'bg-orange-500/15 text-orange-400',
  Latest: 'bg-sky-500/15 text-sky-400',
  Premium: 'bg-pink-500/15 text-pink-400',
  Advanced: 'bg-violet-500/15 text-violet-400',
  Edit: 'bg-amber-500/15 text-amber-400',
  Motion: 'bg-teal-500/15 text-teal-400',
}

// ─── Tick sound (Web Audio API — matches MechanicalSlider) ────────────────────

let _audioCtx: AudioContext | null = null
function getSharedAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!_audioCtx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    _audioCtx = new AC()
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

function playTick() {
  try {
    const ctx = getSharedAudioCtx(); if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.03)
    gain.gain.setValueAtTime(0.14, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.009, ctx.currentTime + 0.03)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.04)
  } catch { /* ignore */ }
}

// ─── PremiumSlider ─────────────────────────────────────────────────────────────

function PremiumSlider({ value, min, max, step, onChange, color = '#FFFF00', growing = false, segments = 16 }: {
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void; color?: string
  growing?: boolean; segments?: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const lastTickRef = useRef<number | null>(null)
  const pct = max === min ? 1 : (value - min) / (max - min)
  const filledCount = Math.max(0, Math.round(pct * segments))

  const update = (e: React.PointerEvent) => {
    const r = trackRef.current!.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    const next = Math.round((min + p * (max - min)) / step) * step
    if (next !== lastTickRef.current) { playTick(); lastTickRef.current = next }
    onChange(next)
  }

  return (
    <div
      ref={trackRef}
      className="flex items-center gap-[3px] w-full cursor-pointer select-none"
      style={{ touchAction: 'none', height: 22 }}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); update(e) }}
      onPointerMove={e => { if (e.buttons > 0) update(e) }}
    >
      {Array.from({ length: segments }, (_, i) => {
        const t = i / (segments - 1)
        const isFilled = i < filledCount
        const isEdge = isFilled && i === filledCount - 1
        const h = growing ? Math.round(6 + t * 16) : 22
        return (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: h,
              background: isFilled ? (isEdge ? '#ffffff' : color) : '#282828',
              opacity: isFilled && !isEdge ? 0.5 + t * 0.5 : 1,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none",
        checked ? "bg-[#FFFF00]" : "bg-[#2a2a2a]"
      )}
      style={{ width: 40, height: 22 }}
    >
      <span
        className={cn(
          "absolute top-[3px] left-[3px] w-4 h-4 rounded-full transition-transform duration-200 shadow-sm",
          checked ? "translate-x-[18px] bg-black" : "translate-x-0 bg-[#909090]"
        )}
      />
    </button>
  )
}

// ─── Aspect ratio picker (image-page style) ────────────────────────────────────

const VIDEO_ASPECT_LABELS: Record<string, string> = {
  '16:9': 'Wide', '9:16': 'Story', '1:1': 'Square', '4:3': 'Landscape', '3:4': 'Portrait',
}
const VIDEO_ASPECT_RATIO: Record<string, number> = {
  '16:9': 16/9, '9:16': 9/16, '1:1': 1, '4:3': 4/3, '3:4': 3/4,
}

function AspectShape({ ratio, active }: { ratio: string; active: boolean }) {
  const r = VIDEO_ASPECT_RATIO[ratio] ?? 1
  const BOX = 24
  const w = r >= 1 ? BOX : Math.round(BOX * r)
  const h = r >= 1 ? Math.round(BOX / r) : BOX
  return (
    <div style={{ width: BOX + 6, height: BOX + 6 }} className="flex items-center justify-center">
      <div
        style={{ width: w, height: h }}
        className={cn("rounded-[2px] transition-all", active ? "bg-[#FFFF00]" : "bg-white/[0.18] border border-white/25")}
      />
    </div>
  )
}

function AspectPicker({ ratios, selected, onSelect }: {
  ratios: string[]; selected: string; onSelect: (r: string) => void
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(ratios.length, 4)}, 1fr)` }}>
      {ratios.map(r => (
        <button
          key={r}
          onClick={() => onSelect(r)}
          className={cn(
            "flex flex-col items-center gap-1 py-2 px-1 rounded-md border transition-all",
            selected === r
              ? "bg-white/[0.05] border-white/20"
              : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10",
          )}
        >
          <AspectShape ratio={r} active={selected === r} />
          <span className={cn("text-[9px] font-black", selected === r ? "text-[#FFFF00]" : "text-white/40")}>{r}</span>
          <span className={cn("text-[8px]", selected === r ? "text-[#FFFF00]/50" : "text-white/30")}>
            {VIDEO_ASPECT_LABELS[r] ?? r}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── Model dropdown ────────────────────────────────────────────────────────────

function ModelDropdown({
  groups, selected, onSelect,
}: {
  groups: { label: string; models: ModelConfig[] }[]
  selected: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selectedModel = groups.flatMap(g => g.models).find(m => m.id === selected)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#111111] border border-[#222222] hover:border-[#333333] rounded-lg text-left transition-all"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-white truncate">
              {selectedModel?.label ?? 'Select Model'}
            </span>
            {selectedModel?.tag && (
              <span className={cn(
                "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0",
                TAG_COLORS[selectedModel.tag] ?? "bg-white/10 text-gray-400"
              )}>
                {selectedModel.tag}
              </span>
            )}
          </div>
          <span className="text-[10px] text-white/55 truncate block">{selectedModel?.description}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <IconChevronDown className={cn("w-4 h-4 text-white/35 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0c0c0c] border border-[#222222] rounded-lg overflow-hidden z-30 shadow-2xl max-h-72 overflow-y-auto">
          {groups.map(group => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-[8px] font-black text-white/40 uppercase tracking-widest border-b border-[#1a1a1a] bg-[#080808]">
                {group.label}
              </div>
              {group.models.map(model => (
                <button
                  key={model.id}
                  onClick={() => { onSelect(model.id); setOpen(false) }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all",
                    selected === model.id
                      ? "bg-[#181818] text-[#FFFF00]"
                      : "text-white/55 hover:text-white hover:bg-[#141414]"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold leading-tight">{model.label}</div>
                    <div className="text-[9px] text-white/30 truncate mt-0.5 leading-tight">{model.description}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {model.tag && (
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                        TAG_COLORS[model.tag] ?? "bg-white/10 text-gray-400"
                      )}>
                        {model.tag}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-white/30">{model.credits}cr</span>
                    {selected === model.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFFF00]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Video upload area ─────────────────────────────────────────────────────────

interface VideoUploadBoxProps {
  label: string
  hint?: string
  preview: string | null
  uploading: boolean
  onFile: (file: File) => Promise<void>
  onClear: () => void
}

function VideoUploadBox({ label, hint, preview, uploading, onFile, onClear }: VideoUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('video/')) onFile(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-white/65 uppercase tracking-wider">{label}</span>
        {preview && (
          <button
            onClick={onClear}
            className="p-1 text-white/40 hover:text-red-400 transition-colors rounded"
          >
            <IconTrash className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div
        className={cn(
          "relative rounded-xl border overflow-hidden transition-all cursor-pointer",
          "aspect-video",
          dragging ? "border-[#FFFF00]/50 bg-[#1a1a00]" : "",
          preview
            ? "border-[#333333] bg-black"
            : "border-dashed border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#0a0a0a] group"
        )}
        onClick={() => !preview && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2 z-10">
            <div className="w-6 h-6 border-2 border-[#333] border-t-[#FFFF00] rounded-full animate-spin" />
            <span className="text-[10px] text-white/40">Uploading…</span>
          </div>
        )}
        {!uploading && preview ? (
          <>
            <video src={preview} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
              <IconUpload className="w-5 h-5 text-white" />
              <span className="text-xs text-white font-medium">Replace</span>
            </div>
          </>
        ) : !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center group-hover:border-[#3a3a3a] transition-colors">
              <IconVideo className="w-5 h-5 text-white/40" />
            </div>
            <div className="text-center">
              <p className="text-[11px] text-white/50 font-medium">Click or drag to upload</p>
              {hint && <p className="text-[9px] text-white/30 mt-0.5">{hint}</p>}
            </div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]) }}
      />
    </div>
  )
}

// ─── Image upload area ─────────────────────────────────────────────────────────

interface ImageUploadBoxProps {
  label: string
  optional?: boolean
  hint?: string
  preview: string | null
  uploading: boolean
  onFile: (file: File) => Promise<void>
  onClear: () => void
}

function ImageUploadBox({ label, optional, hint, preview, uploading, onFile, onClear }: ImageUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-white/65 uppercase tracking-wider">{label}</span>
          {optional && <span className="text-[9px] text-white/30 italic">(optional)</span>}
        </div>
        {preview && (
          <button onClick={onClear} className="p-1 text-white/40 hover:text-red-400 transition-colors rounded">
            <IconTrash className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div
        className={cn(
          "relative rounded-xl border overflow-hidden cursor-pointer transition-all group",
          "aspect-video",
          preview ? "border-[#333333] bg-black" : "border-dashed border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#0a0a0a]"
        )}
        onClick={() => !preview && inputRef.current?.click()}
      >
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2 z-10">
            <div className="w-5 h-5 border-2 border-[#333] border-t-[#FFFF00] rounded-full animate-spin" />
            <span className="text-[10px] text-white/40">Uploading…</span>
          </div>
        )}
        {!uploading && preview ? (
          <>
            <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
              <IconCamera className="w-5 h-5 text-white" />
              <span className="text-xs text-white font-medium">Replace</span>
            </div>
          </>
        ) : !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center group-hover:border-[#3a3a3a] transition-colors">
              <IconCamera className="w-5 h-5 text-white/40" />
            </div>
            <div className="text-center">
              <p className="text-[11px] text-white/50 font-medium">Click to upload image</p>
              {hint && <p className="text-[9px] text-white/30 mt-0.5">{hint}</p>}
            </div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]) }}
      />
    </div>
  )
}

// ─── Video skeleton ────────────────────────────────────────────────────────────

function VideoSkeleton({ aspect }: { aspect: string }) {
  const pad: Record<string, string> = {
    '16:9': '56.25%', '9:16': '177.78%', '1:1': '100%',
  }
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#0d0d0d] border border-[#1e1e1e]" style={{ paddingBottom: pad[aspect] ?? '56.25%' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#333] border-t-[#FFFF00]/60 rounded-full animate-spin" />
          <span className="text-[10px] text-white/25 font-mono">Generating video…</span>
        </div>
      </div>
    </div>
  )
}

// ─── Justified masonry grid ────────────────────────────────────────────────────

const VGAP = 9
const VIDEO_ASPECT_NUM: Record<string, number> = {
  '16:9': 16 / 9, '9:16': 9 / 16, '1:1': 1, '4:3': 4 / 3, '3:4': 3 / 4,
}
interface VJRow { videos: VideoResult[]; height: number; widths: number[] }

function buildVideoRows(videos: VideoResult[], containerW: number, targetH: number): VJRow[] {
  if (containerW === 0 || videos.length === 0) return []
  const rows: VJRow[] = []
  let rowVids: VideoResult[] = []
  let rowNatW = 0
  const asp = (v: VideoResult) => VIDEO_ASPECT_NUM[v.aspect] ?? (16 / 9)

  const flush = (last: boolean) => {
    if (rowVids.length === 0) return
    const scale = last ? 1 : (containerW - VGAP * (rowVids.length - 1)) /
      rowVids.reduce((s, v) => s + targetH * asp(v), 0)
    const height = Math.round(targetH * scale)
    const widths = rowVids.map(v => Math.round(targetH * asp(v) * scale))
    if (!last) {
      const drift = containerW - widths.reduce((s, w) => s + w, 0) - VGAP * (widths.length - 1)
      if (Math.abs(drift) <= widths.length) widths[widths.length - 1]! += drift
    }
    rows.push({ videos: rowVids, height, widths })
    rowVids = []; rowNatW = 0
  }

  for (const v of videos) {
    const natW = targetH * asp(v)
    if (rowVids.length > 0 && rowNatW + VGAP + natW > containerW * 1.05) flush(false)
    rowVids.push(v)
    rowNatW += (rowVids.length > 1 ? VGAP : 0) + natW
  }
  flush(true)
  return rows
}

function VideoGridTile({ video, width, height, onExpand }: {
  video: VideoResult; width: number; height: number; onExpand: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleEnter = () => {
    setIsHovered(true)
    if (videoRef.current && isLoaded) videoRef.current.play().catch(() => {})
  }
  const handleLeave = () => {
    setIsHovered(false)
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0 }
    setProgress(0)
  }
  const handleLoaded = () => {
    setIsLoaded(true)
    if (isHovered && videoRef.current) videoRef.current.play().catch(() => {})
  }
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const { currentTime, duration } = videoRef.current
    if (duration > 0) setProgress((currentTime / duration) * 100)
  }

  return (
    <div
      style={{ width, height, flexShrink: 0, overflow: 'hidden', borderRadius: 8, position: 'relative', cursor: 'pointer' }}
      className="group bg-[#0a0a0a] border border-white/[0.07] hover:border-white/20 transition-all duration-200"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onExpand}
    >
      <video
        ref={videoRef}
        src={video.url!}
        muted playsInline loop preload="metadata"
        onLoadedData={handleLoaded}
        onTimeUpdate={handleTimeUpdate}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-10">
        <div className="h-full bg-[#FFFF00] transition-none" style={{ width: `${progress}%` }} />
      </div>
      {/* Play icon on hover */}
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <IconPlayerPlay className="w-4 h-4 fill-white text-white ml-0.5" />
          </div>
        </div>
      )}
      {/* Expand icon */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
          <IconMaximize className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      {/* Download */}
      <div className="absolute bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <a
          href={video.url!} download target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-all shadow-lg"
        >
          <IconDownload className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}

function VideoJustifiedGrid({ videos, onExpand }: {
  videos: VideoResult[]; onExpand: (v: VideoResult) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(0)

  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const ro = new ResizeObserver(entries => setContainerW(entries[0]!.contentRect.width))
    ro.observe(el)
    setContainerW(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  const loading = videos.filter(v => v.loading)
  const done = videos.filter(v => !v.loading)
  const targetH = containerW < 480 ? 160 : containerW < 768 ? 220 : 300
  const rows = useMemo(() => buildVideoRows(done, containerW, targetH), [done, containerW, targetH])

  return (
    <div ref={containerRef} className="w-full">
      {/* Loading skeletons first */}
      {loading.map(v => (
        <div key={v.id} className="mb-[9px]">
          <VideoSkeleton aspect={v.aspect} />
        </div>
      ))}
      {/* Justified rows */}
      {rows.map((row) => (
        <div key={row.videos[0]!.id} style={{ display: 'flex', gap: VGAP, marginBottom: VGAP }}>
          {row.videos.map((video, ii) => (
            video.error ? (
              <div
                key={video.id}
                style={{ width: row.widths[ii], height: row.height, flexShrink: 0, overflow: 'hidden', borderRadius: 8 }}
                className="relative border border-red-900/40 bg-[#100505]"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-4">
                  <div className="text-red-500/80 text-[11px] font-semibold text-center">Generation failed</div>
                  <div className="text-red-900 text-[9px] text-center font-mono">{video.error}</div>
                </div>
              </div>
            ) : (
              <VideoGridTile
                key={video.id}
                video={video}
                width={row.widths[ii]!}
                height={row.height}
                onExpand={() => onExpand(video)}
              />
            )
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Section header helper ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black text-white/65 uppercase tracking-wider mb-3">
      {children}
    </p>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

function VideoPageContent() {
  const { user, isLoading, isDemo } = useAuth()
  const { addWatchedTask, resolveTask, failTask } = useTaskManager()
  const { total: creditBalance, isLoading: creditsLoading } = useCredits()

  const [activeTab, setActiveTab] = useState<VideoTab>('generate')
  const [generateModel, setGenerateModel] = useState(GENERATE_MODELS[0]?.id ?? '')
  const editModel = EDIT_MODELS[0]?.id ?? 'kling-effects'
  const motionModel = MOTION_MODELS[0]?.id ?? 'kling-video-motion-control'

  // Generate settings
  const [genAspect, setGenAspect] = useState('16:9')
  const [genDuration, setGenDuration] = useState(5)
  const [genAudio, setGenAudio] = useState(false)
  const [klingMode, setKlingMode] = useState<'std' | 'pro'>('std')
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p'>('720p')
  const [cfgScale, setCfgScale] = useState(0.5)
  const [cameraFixed, setCameraFixed] = useState(false)
  const [seed, setSeed] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [genNegPrompt, setGenNegPrompt] = useState('')
  const [showNegPrompt, setShowNegPrompt] = useState(false)
  const [firstFramePreview, setFirstFramePreview] = useState<string | null>(null)
  const [firstFrameCdnUrl, setFirstFrameCdnUrl] = useState<string | null>(null)
  const [firstFrameUploading, setFirstFrameUploading] = useState(false)
  const [endFramePreview, setEndFramePreview] = useState<string | null>(null)
  const [endFrameCdnUrl, setEndFrameCdnUrl] = useState<string | null>(null)
  const [endFrameUploading, setEndFrameUploading] = useState(false)
  // Veo variant within group (e.g. 'Fast' | 'Standard' | 'Pro' | 'Pro 4K' | 'Components')
  const [veoVariant, setVeoVariant] = useState('Fast')
  // Veo-specific
  const [enhancePrompt, setEnhancePrompt] = useState(false)
  const [enableUpsample, setEnableUpsample] = useState(false)
  // Kling multi-shot
  const [multiShot, setMultiShot] = useState(false)
  const [shotType, setShotType] = useState<'customize' | 'intelligence'>('customize')
  const [shotPrompts, setShotPrompts] = useState<string[]>(['', ''])
  const [shotDurations, setShotDurations] = useState<number[]>([5, 5])
  const [elementIds, setElementIds] = useState<string[]>(['', '', ''])

  // Resolve the actual model ID — for variant groups (Veo 3.1), pick by veoVariant
  const resolvedGenerateModelId = useMemo(() => {
    const base = ALL_VIDEO_MODELS.find(m => m.id === generateModel)
    if (!base?.variantGroupId) return generateModel
    const variant = ALL_VIDEO_MODELS.find(m => m.variantGroupId === base.variantGroupId && m.variantTier === veoVariant)
    return variant?.id ?? generateModel
  }, [generateModel, veoVariant])

  const selectedModelId = activeTab === 'generate' ? resolvedGenerateModelId
    : activeTab === 'edit' ? editModel : motionModel
  const selectedModel = ALL_VIDEO_MODELS.find(m => m.id === selectedModelId)

  // Edit settings
  const [editVideoPreview, setEditVideoPreview] = useState<string | null>(null)
  const [editVideoCdnUrl, setEditVideoCdnUrl] = useState<string | null>(null)
  const [editVideoUploading, setEditVideoUploading] = useState(false)
  const [editAspect, setEditAspect] = useState('16:9')

  // Motion settings
  const [motionSourcePreview, setMotionSourcePreview] = useState<string | null>(null)
  const [motionSourceCdnUrl, setMotionSourceCdnUrl] = useState<string | null>(null)
  const [motionSourceUploading, setMotionSourceUploading] = useState(false)
  const [motionTargetPreview, setMotionTargetPreview] = useState<string | null>(null)
  const [motionTargetCdnUrl, setMotionTargetCdnUrl] = useState<string | null>(null)
  const [motionTargetUploading, setMotionTargetUploading] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [videos, setVideos] = useState<VideoResult[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('sharpii_videos')
      if (!raw) return []
      const parsed: VideoResult[] = JSON.parse(raw)
      // Only restore completed videos, not loading states
      return parsed.filter(v => v.url && !v.loading).slice(0, 40)
    } catch { return [] }
  })
  const [modalVideo, setModalVideo] = useState<VideoResult | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ msg: string; type: 'error' | 'info' } | null>(null)
  const [activeTasks, setActiveTasks] = useState<Map<string, TaskEntry>>(new Map())
  const taskIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  // Persist completed videos to localStorage
  useEffect(() => {
    const completed = videos.filter(v => v.url && !v.loading)
    if (completed.length > 0) {
      try {
        localStorage.setItem('sharpii_videos', JSON.stringify(completed.slice(0, 40)))
      } catch { /* ignore quota errors */ }
    }
  }, [videos])

  // Clamp duration when model changes
  useEffect(() => {
    const durations = (ALL_VIDEO_MODELS.find(m => m.id === resolvedGenerateModelId)?.controls?.durations ?? ['5', '15']).map(Number)
    const min = durations[0] ?? 5
    const max = durations[durations.length - 1] ?? 15
    setGenDuration(d => Math.max(min, Math.min(max, d)))
    // kling-o3 doesn't support 'intelligence' shot type
    if (resolvedGenerateModelId === 'kling-o3') setShotType('customize')
  }, [resolvedGenerateModelId])

  useEffect(() => {
    return () => {
      taskIntervalsRef.current.forEach(clearInterval)
      pollIntervalsRef.current.forEach(clearInterval)
    }
  }, [])

  const openPlansPopup = () => window.dispatchEvent(new CustomEvent('sharpii:open-plans'))

  const showToast = (msg: string, type: 'error' | 'info' = 'error') => {
    setToastMsg({ msg, type })
    setTimeout(() => setToastMsg(null), 5000)
  }

  // Image upload
  const uploadImage = useCallback(async (
    file: File,
    setPreview: (s: string | null) => void,
    setCdnUrl: (s: string | null) => void,
    setUploading: (b: boolean) => void
  ) => {
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUri }),
      })
      const data = await res.json()
      if (data.imageUrl) setCdnUrl(data.imageUrl)
      else throw new Error(data.error || 'Upload failed')
    } catch {
      showToast('Image upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [])

  // Video upload
  const uploadVideo = useCallback(async (
    file: File,
    setPreview: (s: string | null) => void,
    setCdnUrl: (s: string | null) => void,
    setUploading: (b: boolean) => void
  ) => {
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-video', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.videoUrl) setCdnUrl(data.videoUrl)
      else throw new Error(data.error || 'Upload failed')
    } catch {
      showToast('Video upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [])

  const currentAspect = activeTab === 'generate' ? genAspect
    : activeTab === 'edit' ? editAspect : '16:9'

  const cleanupTask = (id: string) => {
    const pi = taskIntervalsRef.current.get(id)
    if (pi) { clearInterval(pi); taskIntervalsRef.current.delete(id) }
  }

  const removeLoadingCard = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  // Derived shot count
  const shotCount = shotPrompts.length

  const addShot = useCallback(() => {
    if (shotPrompts.length >= 6) return
    setShotPrompts(p => [...p, ''])
    setShotDurations(p => [...p, 5])
  }, [shotPrompts.length])

  const removeShot = useCallback((idx: number) => {
    if (shotPrompts.length <= 1) return
    setShotPrompts(p => p.filter((_, i) => i !== idx))
    setShotDurations(p => p.filter((_, i) => i !== idx))
  }, [shotPrompts.length])

  const adjustShotDuration = useCallback((idx: number, delta: number) => {
    setShotDurations(p => { const n = [...p]; n[idx] = Math.min(15, Math.max(3, (n[idx] ?? 5) + delta)); return n })
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim() && activeTab !== 'motion') return
    if (!creditsLoading && creditBalance <= 0) { openPlansPopup(); return }
    if (!creditsLoading && creditBalance < (selectedModel?.credits ?? 0)) {
      showToast('Not enough credits. Top up from the dashboard.')
      return
    }
    if (activeTab === 'edit' && !editVideoCdnUrl) {
      showToast('Please wait for video to finish uploading.')
      return
    }
    if (multiShot && shotType === 'customize') {
      const totalShotDur = shotDurations.reduce((s, d) => s + d, 0)
      if (totalShotDur > 15) {
        showToast(`Total shot duration (${totalShotDur}s) exceeds 15s limit.`)
        return
      }
    }
    if (activeTab === 'motion') {
      if (!motionSourceCdnUrl) { showToast('Please upload a motion source video.'); return }
      if (!motionTargetCdnUrl) { showToast('Please upload a target image or video.'); return }
    }

    setIsSubmitting(true)
    const localId = `vtask-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    setVideos(prev => [{ id: localId, url: null, aspect: currentAspect, loading: true, prompt: prompt.trim(), model: selectedModel?.label }, ...prev])
    const progressInterval = startSmartProgress(localId, VIDEO_TASK_DURATION_SECS, setActiveTasks)
    taskIntervalsRef.current.set(localId, progressInterval)
    setTimeout(() => setIsSubmitting(false), 800)

    try {
      const body: Record<string, unknown> = {
        model: selectedModelId, prompt: prompt.trim(), tab: activeTab,
      }
      if (activeTab === 'generate') {
        body.aspect_ratio = genAspect
        body.duration = genDuration
        body.audio_sync = genAudio
        if (genNegPrompt.trim()) body.negative_prompt = genNegPrompt.trim()
        if (firstFrameCdnUrl) body.first_frame_url = firstFrameCdnUrl
        if (endFrameCdnUrl) body.end_frame_url = endFrameCdnUrl
        if (isEvolinkModel) {
          body.quality = videoQuality
          const mp: Record<string, unknown> = {}
          if (isKlingModel) mp.mode = klingMode
          if (isKlingModel) mp.cfg_scale = cfgScale
          if (Object.keys(mp).length > 0) body.model_params = mp
          // Multi-shot
          if (isKlingModel && multiShot && selectedModel?.controls?.multiShot) {
            body.multi_shot = true
            body.shot_type = shotType
            if (shotType === 'customize') {
              body.multi_prompt = shotPrompts.map((p, i) => ({
                index: i + 1, prompt: p.trim(), duration: shotDurations[i] ?? Math.floor(genDuration / shotPrompts.length),
              }))
            }
          }
          // Element list — only for kling-o3
          if (isKlingO3) {
            const activeElements = elementIds.filter(id => id.trim() !== '').map(id => parseInt(id)).filter(n => !isNaN(n) && n > 0)
            if (activeElements.length > 0) body.element_list = activeElements
          }
        }
        if (isSeedanceModel) body.camera_fixed = cameraFixed
        if (hasSeed && seed.trim()) body.seed = parseInt(seed)
        // Veo-specific
        if (isVeoModel) {
          if (enhancePrompt) body.enhance_prompt = true
          if (enableUpsample) body.enable_upsample = true
        }
      } else if (activeTab === 'edit') {
        body.aspect_ratio = editAspect
        body.video_url = editVideoCdnUrl
      } else if (activeTab === 'motion') {
        body.video_url = motionSourceCdnUrl
        body.target_url = motionTargetCdnUrl
      }

      const res = await fetch('/api/generate-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (res.status === 402) { openPlansPopup(); cleanupTask(localId); removeLoadingCard(localId); return }
      if (!res.ok) throw new Error(data?.error || 'Generation failed')

      const dbTaskId: string = data.taskId
      addWatchedTask(dbTaskId, 'Video generating')
      setVideos(prev => prev.map(v => v.id === localId ? { ...v, taskId: dbTaskId } : v))

      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/generate-video/poll?taskId=${dbTaskId}`)
          const pollData = await pollRes.json()

          if (pollData.status === 'success') {
            clearInterval(pollInterval)
            pollIntervalsRef.current.delete(localId)
            cleanupTask(localId)
            const videoUrl = Array.isArray(pollData.outputs) && pollData.outputs[0]?.url ? pollData.outputs[0].url : null
            setVideos(prev => prev.map(v => v.id === localId ? { ...v, url: videoUrl, loading: false } : v))
            resolveTask(dbTaskId)
            setActiveTasks(prev => {
              const m = new Map(prev)
              const t = m.get(localId)
              if (t) m.set(localId, { ...t, progress: 100, status: 'success', message: 'Done!' })
              return m
            })
            setTimeout(() => setActiveTasks(prev => { const m = new Map(prev); m.delete(localId); return m }), 4000)
          } else if (pollData.status === 'failed') {
            clearInterval(pollInterval)
            pollIntervalsRef.current.delete(localId)
            cleanupTask(localId)
            failTask(dbTaskId)
            setVideos(prev => prev.map(v => v.id === localId ? { ...v, loading: false, error: pollData.error || 'Generation failed' } : v))
            setActiveTasks(prev => {
              const m = new Map(prev)
              const t = m.get(localId)
              if (t) m.set(localId, { ...t, progress: 100, status: 'error', message: pollData.error || 'Generation failed' })
              return m
            })
            setTimeout(() => setActiveTasks(prev => { const m = new Map(prev); m.delete(localId); return m }), 5000)
          }
        } catch { /* will retry */ }
      }, 8000)

      pollIntervalsRef.current.set(localId, pollInterval)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection error'
      cleanupTask(localId)
      setVideos(prev => prev.map(v => v.id === localId ? { ...v, loading: false, error: msg } : v))
      setActiveTasks(prev => {
        const m = new Map(prev)
        const t = m.get(localId)
        if (t) m.set(localId, { ...t, progress: 100, status: 'error', message: msg })
        return m
      })
      setTimeout(() => setActiveTasks(prev => { const m = new Map(prev); m.delete(localId); return m }), 5000)
    }
  }

  const ctaDisabled = isSubmitting
    || (activeTab !== 'motion' && !prompt.trim())
    || (activeTab === 'edit' && !editVideoCdnUrl && !editVideoPreview)
    || (activeTab === 'motion' && (!motionSourcePreview || !motionTargetPreview))

  if (isLoading) return <ElegantLoading message="Initializing Video Studio…" />
  if (!user && !isDemo) {
    if (typeof window !== 'undefined') window.location.href = '/app/signin'
    return <ElegantLoading message="Redirecting…" />
  }

  const availableAspects = selectedModel?.controls?.aspectRatios ?? ['16:9', '9:16', '1:1']
  const durationNums = (selectedModel?.controls?.durations ?? ['5', '15']).map(Number)
  const durationMin = durationNums[0] ?? 5
  const durationMax = durationNums[durationNums.length - 1] ?? 15
  const hasAudio = selectedModel?.controls?.audioSync === true
  const hasFirstFrame = selectedModel?.controls?.firstFrameImage === true
  const hasEndFrame = selectedModel?.controls?.endFrameImage === true
  const isKlingModel = selectedModelId.startsWith('kling')
  const isKlingO3 = selectedModelId === 'kling-o3'   // element_list, customize-only, no neg-prompt
  const isKlingV3 = selectedModelId === 'kling-3'    // intelligence shot type, negative_prompt
  const isEvolinkModel = selectedModel?.providers[0] === 'evolink'
  const isSeedanceModel = selectedModelId.startsWith('doubao')
  const isVeoModel = selectedModelId.startsWith('veo')
  const hasSeed = isSeedanceModel || isVeoModel
  // Veo variant group: the picker model chosen by user (before variant resolution)
  const baseGenerateModel = ALL_VIDEO_MODELS.find(m => m.id === generateModel)
  const isVeoVariantGroup = !!baseGenerateModel?.variantGroupId
  const veoVariants = isVeoVariantGroup
    ? ALL_VIDEO_MODELS.filter(m => m.variantGroupId === baseGenerateModel!.variantGroupId)
    : []

  const TABS: { id: VideoTab; label: string; Icon: React.ElementType }[] = [
    { id: 'generate', label: 'Generate', Icon: IconSparkles },
    { id: 'edit', label: 'Edit', Icon: IconWand },
    { id: 'motion', label: 'Motion', Icon: IconTransfer },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-white font-sans">
      <div className="flex-1 pt-16 w-full grid grid-cols-1 lg:grid-cols-[420px_1fr] items-start">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <div className="flex flex-col border-r border-white/5 bg-[#0c0c0e] z-20 relative min-h-[calc(100vh-4rem)] lg:pb-28 order-2 lg:order-1">

          {/* Mode tabs */}
          <div className="px-5 pt-5 pb-5 border-b border-white/5">
            <div className="flex bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)] gap-0.5">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-black rounded-md transition-all uppercase tracking-wider",
                    activeTab === id ? "bg-[#FFFF00] text-black shadow-md" : "text-white/50 hover:text-white"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── GENERATE TAB ────────────────────────────────────────────────── */}
          {activeTab === 'generate' && (
            <>
              {/* Model */}
              <div className="px-5 pt-5 pb-5 border-b border-white/5">
                <SectionLabel>Model</SectionLabel>
                <ModelDropdown groups={MODEL_GROUPS} selected={generateModel} onSelect={setGenerateModel} />
              </div>

              {/* Veo variant sub-picker */}
              {isVeoVariantGroup && veoVariants.length > 0 && (
                <div className="px-5 pt-3 pb-3 border-b border-white/5">
                  <div className="flex bg-[rgb(255_255_255_/_0.04)] border border-[rgb(255_255_255_/_0.04)] p-0.5 rounded-lg gap-0.5">
                    {veoVariants.map(v => (
                      <button
                        key={v.variantTier}
                        onClick={() => setVeoVariant(v.variantTier!)}
                        className={cn(
                          "flex-1 flex flex-col items-center py-1.5 px-1 rounded-md transition-all",
                          veoVariant === v.variantTier
                            ? "bg-white/[0.09] text-[#FFFF00]"
                            : "text-white/55 hover:text-white"
                        )}
                      >
                        <span className="text-[9px] font-black uppercase tracking-wider">{v.variantTier}</span>
                        <span className="text-[8px] font-mono text-current opacity-60">{v.credits}cr</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Aspect ratio */}
              <div className="px-5 py-4 border-b border-white/5">
                <SectionLabel>Aspect Ratio</SectionLabel>
                <AspectPicker ratios={availableAspects} selected={genAspect} onSelect={setGenAspect} />
              </div>

              {/* Kling: Duration + Quality in 2-col */}
              {isKlingModel && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left: Duration */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-white/65 uppercase tracking-wider">Duration</span>
                        <span className="font-mono text-[11px] font-bold text-[#FFFF00]">{genDuration}s</span>
                      </div>
                      <PremiumSlider min={durationMin} max={durationMax} step={1} value={genDuration} onChange={setGenDuration} color="#FFFF00" growing={false} />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[9px] font-mono text-white/50">{durationMin}s</span>
                        <span className="text-[9px] font-mono text-white/50">{durationMax}s</span>
                      </div>
                    </div>
                    {/* Right: Quality */}
                    <div>
                      <span className="text-[10px] font-black text-white/65 uppercase tracking-wider block mb-2">Quality</span>
                      <div className="flex bg-white/[0.04] border border-white/[0.04] p-0.5 rounded-lg gap-0.5">
                        {([['720p', '720p'], ['1080p', '1080p']] as const).map(([id, label]) => (
                          <button key={id} onClick={() => setVideoQuality(id)}
                            className={cn("flex-1 py-1.5 text-[10px] font-black rounded-md transition-all",
                              videoQuality === id ? "bg-white/[0.09] text-[#FFFF00]" : "text-white/55 hover:text-white")}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Kling: Scene Mode + Audio in 2-col */}
              {isKlingModel && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left: Scene Mode */}
                    <div>
                      <span className="text-[10px] font-black text-white/65 uppercase tracking-wider block mb-2">Scene Mode</span>
                      <div className="flex bg-white/[0.04] border border-white/[0.04] p-0.5 rounded-lg gap-0.5">
                        {([['std', 'Std'], ['pro', 'Pro']] as const).map(([id, label]) => (
                          <button key={id} onClick={() => setKlingMode(id)}
                            className={cn("flex-1 py-1.5 text-[10px] font-black rounded-md transition-all",
                              klingMode === id ? "bg-white/[0.09] text-[#FFFF00]" : "text-white/55 hover:text-white")}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Right: Audio (if supported) */}
                    {hasAudio && (
                      <div>
                        <span className="text-[10px] font-black text-white/65 uppercase tracking-wider block mb-2">Audio</span>
                        <div className="flex items-center justify-between h-[34px] px-3 bg-white/[0.04] border border-white/[0.04] rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <IconVolume className="w-3.5 h-3.5 text-white/55" />
                            <span className="text-[10px] font-black text-white">Sound</span>
                          </div>
                          <Toggle checked={genAudio} onChange={setGenAudio} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Non-Kling: Duration (full-width, with audio inside if supported) */}
              {!isKlingModel && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-white/65 uppercase tracking-wider">Duration</span>
                    <span className="font-mono text-[11px] font-bold text-[#FFFF00]">{genDuration}s</span>
                  </div>
                  <PremiumSlider min={durationMin} max={durationMax} step={1} value={genDuration} onChange={setGenDuration} color="#FFFF00" growing={false} />
                  <div className="flex justify-between mt-1.5 px-0.5">
                    <span className="text-[9px] font-mono text-white/50">{durationMin}s</span>
                    <span className="text-[9px] font-mono text-white/50">{durationMax}s</span>
                  </div>
                  {hasAudio && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <IconVolume className="w-3.5 h-3.5 text-white/55" />
                        <span className="text-xs font-medium text-white">Audio</span>
                        <span className="text-[9px] text-white/45">native generation</span>
                      </div>
                      <Toggle checked={genAudio} onChange={setGenAudio} />
                    </div>
                  )}
                </div>
              )}

              {/* Kling: cfg_scale */}
              {isKlingModel && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel>Prompt Adherence</SectionLabel>
                    <span className="font-mono text-[11px] text-[#FFFF00] -mt-3">{cfgScale.toFixed(2)}</span>
                  </div>
                  <PremiumSlider min={0} max={1} step={0.05} value={cfgScale} onChange={setCfgScale} color="#FFFF00" growing={false} />
                  <div className="flex justify-between mt-1.5 px-0.5">
                    <span className="text-[9px] font-mono text-white/50">Creative</span>
                    <span className="text-[9px] font-mono text-white/50">Strict</span>
                  </div>
                </div>
              )}

              {/* Kling multi-shot */}
              {isKlingModel && selectedModel?.controls?.multiShot && (
                <div className="px-5 py-4 border-b border-white/5">
                  {/* Toggle row */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-black text-white">Multi-Shot</span>
                      <p className="text-[10px] text-white/55 mt-0.5">Control each scene independently</p>
                    </div>
                    <Toggle checked={multiShot} onChange={setMultiShot} />
                  </div>

                  {multiShot && (
                    <div className="space-y-3">
                      {/* Shot type selector */}
                      <div className="flex bg-white/[0.04] border border-white/[0.04] p-0.5 rounded-lg gap-0.5">
                        {(isKlingO3
                          ? [['customize', 'Manual']] as const
                          : [['customize', 'Manual'], ['intelligence', 'AI Auto']] as const
                        ).map(([id, label]) => (
                          <button key={id} onClick={() => setShotType(id)}
                            className={cn("flex-1 py-2 text-[11px] font-black rounded-md transition-all",
                              shotType === id ? "bg-white/[0.09] text-[#FFFF00]" : "text-white/55 hover:text-white")}>
                            {label}
                          </button>
                        ))}
                      </div>

                      {shotType === 'intelligence' && (
                        <p className="text-[10px] text-white/50 px-1">AI will automatically plan and sequence your shots based on the main prompt.</p>
                      )}

                      {shotType === 'customize' && (() => {
                        const totalShotDur = shotDurations.slice(0, shotPrompts.length).reduce((s, d) => s + d, 0)
                        const overLimit = totalShotDur > 15
                        return (
                          <div className="space-y-2">
                            {shotPrompts.map((sp, i) => (
                              <div key={i} className="rounded-xl bg-[#0d0d0d] border border-white/[0.08] overflow-hidden">
                                {/* Card header */}
                                <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                                  <span className="text-[11px] font-black text-white/65">Shot {i + 1}</span>
                                  {shotPrompts.length > 1 && (
                                    <button onClick={() => removeShot(i)} className="p-1 text-white/35 hover:text-red-400 transition-colors">
                                      <IconTrash className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                {/* Prompt textarea */}
                                <textarea
                                  value={sp}
                                  onChange={e => setShotPrompts(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
                                  placeholder={`Describe scene ${i + 1}…`}
                                  rows={2}
                                  className="w-full bg-transparent px-3 pb-2 text-[12px] text-white placeholder:text-white/25 focus:outline-none resize-none leading-relaxed"
                                />
                                {/* Card footer */}
                                <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.06]">
                                  <div className="flex items-center gap-2">
                                    <IconClock className="w-3.5 h-3.5 text-white/50" />
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => adjustShotDuration(i, -1)} className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm font-bold">−</button>
                                      <span className="text-[12px] font-mono font-bold text-[#FFFF00] w-7 text-center">{shotDurations[i] ?? 5}s</span>
                                      <button onClick={() => adjustShotDuration(i, 1)} className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm font-bold">+</button>
                                    </div>
                                  </div>
                                  {isKlingO3 && (
                                    <span className="text-[10px] text-white/40 font-mono">@ Elements below</span>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Add shot button */}
                            {shotPrompts.length < 6 && (
                              <button
                                onClick={addShot}
                                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-white/15 text-[11px] text-white/45 hover:text-white hover:border-white/30 transition-all"
                              >
                                <IconPlus className="w-3.5 h-3.5" />
                                Add shot
                              </button>
                            )}

                            {/* Total duration */}
                            <div className={cn("flex items-center justify-between text-[9px] px-0.5", overLimit ? "text-red-400" : "text-white/45")}>
                              <span>Total duration</span>
                              <span className="font-mono font-bold">{totalShotDur}s / 15s max</span>
                            </div>

                            {/* Subject elements — only for kling-o3 */}
                            {isKlingO3 && (
                              <div className="pt-1">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-[10px] font-black text-white/65 uppercase tracking-wider">Subject Elements</span>
                                  <span className="text-[9px] text-white/40 italic">(optional)</span>
                                </div>
                                <div className="flex gap-1.5">
                                  {[0, 1, 2].map(idx => (
                                    <input
                                      key={idx}
                                      type="number"
                                      min={1}
                                      value={elementIds[idx] ?? ''}
                                      onChange={e => setElementIds(prev => { const n = [...prev]; n[idx] = e.target.value; return n })}
                                      placeholder={`ID ${idx + 1}`}
                                      className="flex-1 bg-[#0d0d0d] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none text-center"
                                    />
                                  ))}
                                </div>
                                <p className="text-[9px] text-white/40 mt-1">Reference in prompt as {`<<<element_1>>>`}</p>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Veo: enhance prompt + upsample */}
              {isVeoModel && (selectedModel?.controls?.enhancePrompt || selectedModel?.controls?.enableUpsample) && (
                <div className="px-5 py-4 border-b border-white/5 space-y-2">
                  {selectedModel?.controls?.enhancePrompt && (
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#111111] border border-[#222222] hover:border-[#2e2e2e] transition-all">
                      <div>
                        <span className="text-xs font-black text-white">Enhance Prompt</span>
                        <p className="text-[10px] text-white/55 mt-0.5">Auto-optimize and translate to English</p>
                      </div>
                      <Toggle checked={enhancePrompt} onChange={setEnhancePrompt} />
                    </div>
                  )}
                  {selectedModel?.controls?.enableUpsample && (
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#111111] border border-[#222222] hover:border-[#2e2e2e] transition-all">
                      <div>
                        <span className="text-xs font-black text-white">Upsample to 1080p</span>
                        <p className="text-[10px] text-white/55 mt-0.5">Enable resolution upsampling</p>
                      </div>
                      <Toggle checked={enableUpsample} onChange={setEnableUpsample} />
                    </div>
                  )}
                </div>
              )}

              {/* Camera fixed (Seedance) */}
              {isSeedanceModel && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-[#111111] border border-[#222222] hover:border-[#2e2e2e] transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <IconCamera className="w-3.5 h-3.5 text-white/55" />
                        <span className="text-xs font-black text-white">Lock Camera</span>
                      </div>
                      <p className="text-[10px] text-white/55 mt-0.5 ml-5">Disable camera movement for static shots</p>
                    </div>
                    <Toggle checked={cameraFixed} onChange={setCameraFixed} />
                  </div>
                </div>
              )}

              {/* Seed + Advanced (Veo / Seedance) */}
              {hasSeed && (
                <div className="px-5 py-5 border-b border-white/5">
                  <button
                    onClick={() => setShowAdvanced(p => !p)}
                    className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-wider hover:text-white transition-colors w-full"
                  >
                    <IconMinus className="w-3.5 h-3.5" />
                    <span>Advanced</span>
                    <IconChevronDown className={cn("w-3 h-3 ml-auto transition-transform", showAdvanced && "rotate-180")} />
                  </button>
                  {showAdvanced && (
                    <div className="mt-3 space-y-2">
                      <label className="text-[10px] font-black text-white/65 uppercase tracking-wider">Seed</label>
                      <input
                        type="number"
                        value={seed}
                        onChange={e => setSeed(e.target.value)}
                        placeholder="Random"
                        className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-md px-3 py-2 text-xs text-white placeholder:text-[#333] focus:outline-none focus:border-[#3a3a3a] transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <p className="text-[9px] text-white/40">Use the same seed to reproduce identical results</p>
                    </div>
                  )}
                </div>
              )}

              {/* First frame + End frame (combined when both available) */}
              {(hasFirstFrame || hasEndFrame) && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className={cn("grid gap-3", hasEndFrame ? "grid-cols-2" : "grid-cols-1")}>
                    {hasFirstFrame && (
                      <div>
                        <SectionLabel>First Frame <span className="text-white/40 normal-case font-normal text-[9px] ml-1">(optional)</span></SectionLabel>
                        <ImageUploadBox
                          label="" preview={firstFramePreview} uploading={firstFrameUploading}
                          hint="Opening frame"
                          onFile={(f) => uploadImage(f, setFirstFramePreview, setFirstFrameCdnUrl, setFirstFrameUploading)}
                          onClear={() => { setFirstFramePreview(null); setFirstFrameCdnUrl(null) }}
                        />
                      </div>
                    )}
                    {hasEndFrame && (
                      <div>
                        <SectionLabel>End Frame <span className="text-white/40 normal-case font-normal text-[9px] ml-1">(optional)</span></SectionLabel>
                        <ImageUploadBox
                          label="" preview={endFramePreview} uploading={endFrameUploading}
                          hint="Closing frame"
                          onFile={(f) => uploadImage(f, setEndFramePreview, setEndFrameCdnUrl, setEndFrameUploading)}
                          onClear={() => { setEndFramePreview(null); setEndFrameCdnUrl(null) }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Negative prompt */}
              <div className="px-5 py-5 border-b border-white/5">
                <button
                  onClick={() => setShowNegPrompt(p => !p)}
                  className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-wider hover:text-white transition-colors w-full"
                >
                  <IconMinus className="w-3.5 h-3.5" />
                  <span>Negative Prompt</span>
                  <IconChevronDown className={cn("w-3 h-3 ml-auto transition-transform", showNegPrompt && "rotate-180")} />
                </button>
                {showNegPrompt && (
                  <textarea
                    value={genNegPrompt}
                    onChange={e => setGenNegPrompt(e.target.value)}
                    placeholder="Describe what to avoid…"
                    rows={2}
                    className="w-full mt-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md px-3 py-2.5 text-xs text-white placeholder:text-[#333] focus:outline-none focus:border-[#3a3a3a] transition-all resize-none"
                  />
                )}
              </div>
            </>
          )}

          {/* ── EDIT TAB ──────────────────────────────────────────────────────── */}
          {activeTab === 'edit' && (
            <>
              <div className="px-5 py-5 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <IconWand className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Kling Effects</span>
                  <span className={cn("text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-auto", TAG_COLORS['Edit'])}>Edit</span>
                </div>
                <p className="text-[10px] text-white/55 leading-relaxed mt-1">
                  Apply AI visual transformations to existing videos. Upload your clip, then describe the effect.
                </p>
              </div>

              <div className="px-5 py-5 border-b border-white/5">
                <SectionLabel>Source Video</SectionLabel>
                <VideoUploadBox
                  label=""
                  preview={editVideoPreview}
                  uploading={editVideoUploading}
                  hint="MP4, WebM, MOV — max 200 MB"
                  onFile={(f) => uploadVideo(f, setEditVideoPreview, setEditVideoCdnUrl, setEditVideoUploading)}
                  onClear={() => { setEditVideoPreview(null); setEditVideoCdnUrl(null) }}
                />
              </div>

              <div className="px-5 py-4 border-b border-white/5">
                <SectionLabel>Output Aspect</SectionLabel>
                <AspectPicker ratios={['16:9', '9:16', '1:1']} selected={editAspect} onSelect={setEditAspect} />
              </div>
            </>
          )}

          {/* ── MOTION TAB ──────────────────────────────────────────────────── */}
          {activeTab === 'motion' && (
            <>
              <div className="px-5 py-5 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <IconTransfer className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Motion Control</span>
                  <span className={cn("text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-auto", TAG_COLORS['Motion'])}>Kling</span>
                </div>
                <p className="text-[10px] text-white/55 leading-relaxed mt-1">
                  Transfer motion from a reference video to your target subject.
                </p>
              </div>

              <div className="px-5 py-5 border-b border-white/5">
                <VideoUploadBox
                  label="Motion Source"
                  hint="The motion from this video will be applied to your target"
                  preview={motionSourcePreview}
                  uploading={motionSourceUploading}
                  onFile={(f) => uploadVideo(f, setMotionSourcePreview, setMotionSourceCdnUrl, setMotionSourceUploading)}
                  onClear={() => { setMotionSourcePreview(null); setMotionSourceCdnUrl(null) }}
                />
              </div>

              <div className="px-5 py-5 border-b border-white/5">
                <ImageUploadBox
                  label="Target Subject"
                  hint="This subject will receive the motion pattern"
                  preview={motionTargetPreview}
                  uploading={motionTargetUploading}
                  onFile={(f) => uploadImage(f, setMotionTargetPreview, setMotionTargetCdnUrl, setMotionTargetUploading)}
                  onClear={() => { setMotionTargetPreview(null); setMotionTargetCdnUrl(null) }}
                />
              </div>
            </>
          )}

          {/* ── PROMPT (shared) ──────────────────────────────────────────────── */}
          <div className="px-5 py-5 flex-1">
            <SectionLabel>
              {activeTab === 'generate' ? 'Prompt' : activeTab === 'edit' ? 'Effect Description' : 'Motion Guidance'}
              {activeTab === 'motion' && <span className="text-white/40 normal-case font-normal text-[9px] ml-1">(optional)</span>}
            </SectionLabel>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'generate'
                  ? 'A sweeping cinematic shot of mountains at golden hour, camera slowly rising…'
                  : activeTab === 'edit'
                  ? 'Apply a dramatic film grain effect with vintage color grading and light leaks…'
                  : 'A person walking gracefully through a forest…'
              }
              rows={5}
              className="w-full bg-[#0d0d0d] border border-[#222222] rounded-md px-4 py-3 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#333333] transition-all resize-none leading-relaxed"
            />
          </div>

          {/* ── FOOTER CTA ───────────────────────────────────────────────────── */}
          <div className="lg:fixed lg:bottom-0 lg:left-0 lg:w-[420px] relative w-full bg-[#0c0c0e] border-t border-white/5 z-40">
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300 font-medium">Estimated Cost</span>
                <div className="flex items-center gap-2">
                  <CreditIcon className="w-6 h-6 rounded-md" iconClassName="w-3 h-3" />
                  <span className="font-mono font-medium text-white/90">{selectedModel?.credits ?? 0}</span>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={handleGenerate}
                disabled={ctaDisabled}
                className="w-full bg-[#FFFF00] hover:bg-[#e6e600] text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] text-base uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <><IconLoader2 className="w-5 h-5 animate-spin" /><span>Starting…</span></>
                ) : (
                  <>
                    <IconPlayerPlay className="w-5 h-5 fill-black" />
                    <span>
                      {activeTab === 'generate' ? 'Generate Video'
                        : activeTab === 'edit' ? 'Apply Effect'
                        : 'Transfer Motion'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <div className="relative flex flex-col px-4 pt-2 pb-8 order-1 lg:order-2 lg:overflow-y-auto lg:h-[calc(100vh-4rem)] custom-scrollbar">

          {/* Panel header */}
          <div className="flex items-center justify-between py-3 mb-4 border-b border-white/5">
            <div>
              <h2 className="text-sm font-bold text-white">
                {activeTab === 'generate' ? 'Generated Videos' : activeTab === 'edit' ? 'Edited Videos' : 'Motion Results'}
              </h2>
              <p className="text-[10px] text-white/35 mt-0.5 font-mono">
                {videos.length === 0
                  ? 'Your videos will appear here'
                  : `${videos.filter(v => !v.loading && v.url).length} video${videos.filter(v => !v.loading && v.url).length !== 1 ? 's' : ''} ready`}
              </p>
            </div>
            {videos.length > 0 && (
              <button
                onClick={() => { setVideos([]); localStorage.removeItem('sharpii_videos') }}
                className="text-[10px] text-white/35 hover:text-white transition-colors font-mono uppercase tracking-wider"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Empty state */}
          {videos.length === 0 && (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-[280px]">
                <div className="w-20 h-20 rounded-2xl bg-[#0d0d0d] border border-[#1e1e1e] flex items-center justify-center mx-auto mb-5">
                  <IconVideo className="w-9 h-9 text-[#2a2a2a]" />
                </div>
                <h3 className="text-sm font-semibold text-white/60 mb-2">No videos yet</h3>
                <p className="text-xs text-white/35 leading-relaxed">
                  {activeTab === 'generate'
                    ? 'Choose a model, write a prompt, and click Generate Video.'
                    : activeTab === 'edit'
                    ? 'Upload a video, describe the effect you want, then click Apply Effect.'
                    : 'Upload a motion source and target subject, then click Transfer Motion.'}
                </p>
              </div>
            </div>
          )}

          {/* Video grid — justified masonry */}
          {videos.length > 0 && (
            <VideoJustifiedGrid
              videos={videos}
              onExpand={(video) => { setModalVideo(video); setIsModalOpen(true) }}
            />
          )}

          <div className="mt-8 flex justify-end text-[9px] text-[#1e1e1e] font-mono uppercase tracking-widest">
            Sharpii Video Engine v1.0
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10003] pointer-events-none">
          <div className={cn(
            "px-5 py-3 rounded-xl text-sm font-medium shadow-2xl border backdrop-blur-xl",
            toastMsg.type === 'error'
              ? "bg-[#1a0505] border-red-900/40 text-red-300"
              : "bg-[#111] border-[#222] text-white"
          )}>
            {toastMsg.msg}
          </div>
        </div>
      )}

      {/* Video Modal */}
      <VideoModal
        url={modalVideo?.url ?? ''}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setModalVideo(null) }}
      />
    </div>
  )
}

export default function VideoPage() {
  return (
    <Suspense fallback={<ElegantLoading message="Initializing Video Studio…" />}>
      <VideoPageContent />
    </Suspense>
  )
}
