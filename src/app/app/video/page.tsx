"use client"
import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-client-simple"
import { ElegantLoading } from "@/components/ui/elegant-loading"
import { useTaskManager } from "@/components/providers/TaskManagerProvider"
import { useCredits } from "@/lib/hooks/use-credits"
import { CreditIcon } from "@/components/ui/CreditIcon"
import { VideoModal } from "@/components/ui/VideoPlayer"
import { GenerationAnimation } from "@/components/ui/GenerationAnimation"
import { PillRangeSlider } from "@/components/ui/pill-range-slider"
import { getVideoModels } from "@/services/models"
import type { ModelConfig } from "@/services/models"
import {
  IconUpload, IconLoader2, IconSparkles, IconTrash, IconVideo,
  IconChevronDown, IconMinus, IconCamera, IconWand, IconTransfer,
  IconPlayerPlay, IconVolume, IconVolumeOff, IconDownload,
  IconPlus, IconClock, IconX,
} from "@tabler/icons-react"
import { createPortal } from "react-dom"
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
  m => !['kling-effects', 'kling-video-motion-control', 'kling-o3-video-edit', 'kling-o3-reference-to-video'].includes(m.id)
)
const EDIT_MODELS = ALL_VIDEO_MODELS.filter(m => m.id === 'kling-o3-video-edit')
const MOTION_MODELS = ALL_VIDEO_MODELS.filter(m => m.id === 'kling-o3-reference-to-video')

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

// ─── Slider with tick sound ────────────────────────────────────────────────────

function Slider({ value, min, max, step, onChange, segments = 40, pillHeight, autoWidth, fillFromZero }: {
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void; segments?: number; pillHeight?: number; autoWidth?: boolean; fillFromZero?: boolean
}) {
  const lastTickRef = useRef<number | null>(null)
  return (
    <PillRangeSlider
      value={value} min={min} max={max} step={step} segments={segments}
      pillHeight={pillHeight} autoWidth={autoWidth} fillFromZero={fillFromZero}
      onChange={v => {
        if (v !== lastTickRef.current) { playTick(); lastTickRef.current = v }
        onChange(v)
      }}
    />
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

// ─── Aspect ratio dropdown with visual icons ───────────────────────────────────

const VIDEO_ASPECT_LABELS: Record<string, string> = {
  '16:9': 'Wide', '9:16': 'Story', '1:1': 'Square', '4:3': 'Classic', '3:4': 'Portrait',
}
const VIDEO_ASPECT_RATIO_MAP: Record<string, number> = {
  '16:9': 16/9, '9:16': 9/16, '1:1': 1, '4:3': 4/3, '3:4': 3/4,
}

function AspectShape({ ratio, active }: { ratio: string; active: boolean }) {
  const r = VIDEO_ASPECT_RATIO_MAP[ratio] ?? 1
  const BOX = 18
  const w = r >= 1 ? BOX : Math.round(BOX * r)
  const h = r >= 1 ? Math.round(BOX / r) : BOX
  return (
    <div style={{ width: BOX + 4, height: BOX + 4 }} className="flex items-center justify-center shrink-0">
      <div
        style={{ width: w, height: h }}
        className={cn("rounded-[2px] transition-all", active ? "bg-[#FFFF00]" : "bg-white/[0.18] border border-white/25")}
      />
    </div>
  )
}

function AspectDropdown({ ratios, selected, onSelect, compact = false }: {
  ratios: string[]; selected: string; onSelect: (r: string) => void; compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-2 bg-[#111111] border border-[#1e1e1e] hover:border-[#2e2e2e] rounded-lg text-left transition-colors"
      >
        <AspectShape ratio={selected} active={true} />
        <span className="text-sm font-bold text-white">{selected}</span>
        {!compact && <span className="text-[10px] text-white/50 flex-1">{VIDEO_ASPECT_LABELS[selected] ?? ''}</span>}
        <IconChevronDown className={cn("w-3 h-3 text-white/40 transition-transform shrink-0 ml-auto", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0c0c0c] border border-[#1e1e1e] rounded-lg overflow-hidden z-30 shadow-xl">
          {ratios.map(r => (
            <button
              key={r}
              onClick={() => { onSelect(r); setOpen(false) }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 transition-colors",
                r === selected ? "bg-[#161616]" : "hover:bg-[#111111]"
              )}
            >
              <AspectShape ratio={r} active={r === selected} />
              <span className={cn("text-sm font-semibold", r === selected ? "text-[#FFFF00]" : "text-white/70")}>{r}</span>
              <span className="text-[10px] text-white/35">{VIDEO_ASPECT_LABELS[r] ?? ''}</span>
              {r === selected && <div className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Compact dropdown (for quality, etc.) ──────────────────────────────────────

function CompactDropdown({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-1.5 px-2.5 py-2 bg-[#111111] border border-[#1e1e1e] hover:border-[#2e2e2e] rounded-lg text-sm font-bold text-white transition-colors"
      >
        <span>{value}</span>
        <IconChevronDown className={cn("w-3 h-3 text-white/40 transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0c0c0c] border border-[#1e1e1e] rounded-lg overflow-hidden z-30 shadow-xl">
          {options.map(o => (
            <button
              key={o}
              onClick={() => { onChange(o); setOpen(false) }}
              className={cn(
                "w-full px-2.5 py-2 text-sm font-semibold text-left transition-colors",
                o === value ? "bg-[#161616] text-[#FFFF00]" : "text-white/70 hover:bg-[#111111] hover:text-white"
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Model picker (creative full-height panel via portal) ─────────────────────

function ModelPicker({
  groups, selected, onSelect,
}: {
  groups: { label: string; models: ModelConfig[] }[]
  selected: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const selectedModel = groups.flatMap(g => g.models).find(m => m.id === selected)
  const totalModels = groups.reduce((s, g) => s + g.models.length, 0)

  // Lock body scroll + close on Escape when panel is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', fn)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', fn)
    }
  }, [open])

  const panel = (
    <div className="fixed inset-0 z-[9990] flex" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel — slides in from left */}
      <div
        className="relative w-full max-w-sm bg-[#0c0c0e] border-r border-white/[0.08] flex flex-col h-full shadow-2xl animate-[slideInLeft_0.22s_ease-out]"
        onClick={e => e.stopPropagation()}
        style={{ animationFillMode: 'both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <p className="text-xs font-black text-white uppercase tracking-widest">Choose Model</p>
            <p className="text-[10px] text-white/35 mt-0.5">{totalModels} models available</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Model list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 px-4">
          {groups.map(group => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{group.label}</span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>
              <div className="space-y-1.5">
                {group.models.map(model => {
                  const isActive = selected === model.id
                  return (
                    <button
                      key={model.id}
                      onClick={() => { onSelect(model.id); setOpen(false) }}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left",
                        isActive
                          ? "bg-[#FFFF00]/[0.05] border-[#FFFF00]/25"
                          : "bg-[#0f0f0f] border-white/[0.05] hover:border-white/[0.15] hover:bg-[#151515]"
                      )}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0 transition-colors",
                        isActive ? "bg-[#FFFF00]" : "bg-white/20"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={cn("text-[13px] font-bold leading-tight", isActive ? "text-[#FFFF00]" : "text-white")}>
                            {model.label}
                          </span>
                          {model.tag && (
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0",
                              TAG_COLORS[model.tag] ?? "bg-white/10 text-gray-400"
                            )}>
                              {model.tag}
                            </span>
                          )}
                        </div>
                        <p className={cn("text-[10px] leading-relaxed", isActive ? "text-[#FFFF00]/50" : "text-white/35")}>
                          {model.description}
                        </p>
                      </div>
                      <div className={cn(
                        "flex-shrink-0 text-[10px] font-mono font-bold mt-0.5",
                        isActive ? "text-[#FFFF00]/70" : "text-white/30"
                      )}>
                        {model.credits}cr
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#111111] border border-[#222222] hover:border-[#FFFF00]/20 rounded-xl text-left transition-all group"
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
          <span className="text-[10px] text-white/45 truncate block">{selectedModel?.description}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-mono text-[#FFFF00]/50">{selectedModel?.credits}cr</span>
          <IconChevronDown className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
        </div>
      </button>

      {mounted && open && createPortal(panel, document.body)}
    </>
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
      {label && <span className="text-[10px] font-black text-white uppercase tracking-wider">{label}</span>}

      <div
        className={cn(
          "relative rounded-lg border overflow-hidden transition-all cursor-pointer",
          "h-28",
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
            {/* Delete button inside the box */}
            <button
              onClick={e => { e.stopPropagation(); onClear() }}
              className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white/60 hover:text-red-400 transition-colors"
            >
              <IconTrash className="w-3 h-3" />
            </button>
          </>
        ) : !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <IconVideo className="w-5 h-5 text-white/40 group-hover:text-white/65 transition-colors" />
            {hint && <p className="text-[9px] text-white/45">{hint}</p>}
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
      {label && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-white/65 uppercase tracking-wider">{label}</span>
          {optional && <span className="text-[9px] text-white/30 italic">(optional)</span>}
        </div>
      )}

      <div
        className={cn(
          "relative rounded-lg border overflow-hidden cursor-pointer transition-all group",
          "h-24",
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
            {/* Delete button inside the box */}
            <button
              onClick={e => { e.stopPropagation(); onClear() }}
              className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white/60 hover:text-red-400 transition-colors"
            >
              <IconTrash className="w-3 h-3" />
            </button>
          </>
        ) : !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <IconCamera className="w-5 h-5 text-white/40 group-hover:text-white/65 transition-colors" />
            {hint && <p className="text-[9px] text-white/45">{hint}</p>}
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

// ─── Multi-image upload (up to 4, for reference images) ───────────────────────

interface RefImage { preview: string; cdnUrl: string | null }

function MultiImageUpload({ images, uploading, onAdd, onRemove }: {
  images: RefImage[]
  uploading: boolean
  onAdd: (file: File) => void
  onRemove: (idx: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-black text-white/65 uppercase tracking-wider">Reference Images</span>
        <span className="text-[9px] text-white/30 italic">(optional · up to 4 · JPG/PNG/WEBP)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#333] flex-shrink-0">
            <img src={img.preview} alt="" className="w-full h-full object-cover" />
            {img.cdnUrl === null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="w-4 h-4 border border-[#555] border-t-[#FFFF00] rounded-full animate-spin" />
              </div>
            )}
            <button
              onClick={() => onRemove(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white/60 hover:text-red-400 transition-colors"
            >
              <IconTrash className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < 4 && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 rounded-lg border border-dashed border-[#2a2a2a] hover:border-[#3a3a3a] flex flex-col items-center justify-center gap-1 bg-[#0a0a0a] text-white/40 hover:text-white/65 transition-colors flex-shrink-0"
          >
            {uploading
              ? <div className="w-4 h-4 border border-[#333] border-t-[#FFFF00] rounded-full animate-spin" />
              : <><IconPlus className="w-4 h-4" /><span className="text-[8px] font-black uppercase">Add</span></>
            }
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) onAdd(e.target.files[0]) }}
      />
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
    const availableW = containerW - VGAP * (rowVids.length - 1)
    const totalNatW = rowVids.reduce((s, v) => s + targetH * asp(v), 0)
    // Last row: left-align at natural size but cap so tiles never overflow the container.
    // Non-last rows: always scale to fill container width exactly.
    const scale = last ? Math.min(1, availableW / totalNatW) : availableW / totalNatW
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
  const [isMuted, setIsMuted] = useState(true)

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
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return
    const next = !isMuted
    videoRef.current.muted = next
    setIsMuted(next)
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
        muted={isMuted} playsInline loop preload="metadata"
        onLoadedData={handleLoaded}
        onTimeUpdate={handleTimeUpdate}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Play icon when idle (not hovered) — glass effect with black tint */}
      {!isHovered && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <IconPlayerPlay className="w-4.5 h-4.5 fill-white text-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Progress bar (on hover) */}
      {isHovered && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-10">
          <div className="h-full bg-[#FFFF00] transition-none" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Mute/unmute button (on hover) — glass effect with black tint, bottom-left */}
      <button
        onClick={toggleMute}
        className="absolute bottom-3 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60"
      >
        {isMuted ? <IconVolumeOff className="w-3.5 h-3.5" /> : <IconVolume className="w-3.5 h-3.5" />}
      </button>

      {/* Download (on hover) */}
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

const DISPLAY_BATCH = 20

function VideoJustifiedGrid({ videos, onExpand }: {
  videos: VideoResult[]; onExpand: (v: VideoResult) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(0)
  const [displayCount, setDisplayCount] = useState(DISPLAY_BATCH)

  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const ro = new ResizeObserver(entries => setContainerW(entries[0]!.contentRect.width))
    ro.observe(el)
    setContainerW(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  // Reset display count when new videos added (in-flight loading cards stay visible)
  useEffect(() => {
    const hasLoading = videos.some(v => v.loading)
    if (hasLoading) setDisplayCount(prev => Math.max(prev, DISPLAY_BATCH))
  }, [videos])

  // Loading cards always shown; completed capped at displayCount
  const completedVideos = useMemo(() => videos.filter(v => !v.error && !v.loading), [videos])
  const loadingVideos = useMemo(() => videos.filter(v => v.loading), [videos])
  const displayVideos = useMemo(
    () => [...loadingVideos, ...completedVideos.slice(0, displayCount)],
    [loadingVideos, completedVideos, displayCount]
  )
  const hasMore = completedVideos.length > displayCount

  // Infinite scroll: re-run when hasMore changes so we observe the sentinel
  // element once it renders (it's conditionally rendered based on hasMore)
  useEffect(() => {
    const sentinel = sentinelRef.current; if (!sentinel) return
    const io = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        setDisplayCount(prev => prev + 10)
      }
    }, { threshold: 0.1 })
    io.observe(sentinel)
    return () => io.disconnect()
  }, [hasMore]) // re-connect observer whenever sentinel mounts/unmounts

  // -10% from previous 300/420/540
  const targetH = containerW < 480 ? 270 : containerW < 768 ? 380 : 490
  const rows = useMemo(() => buildVideoRows(displayVideos, containerW, targetH), [displayVideos, containerW, targetH])

  return (
    <div ref={containerRef} className="w-full overflow-x-hidden">
      {rows.map((row) => (
        <div key={row.videos[0]!.id} style={{ display: 'flex', gap: VGAP, marginBottom: VGAP }}>
          {row.videos.map((video, ii) => (
            video.loading ? (
              <div
                key={video.id}
                style={{ width: row.widths[ii], height: row.height, flexShrink: 0, borderRadius: 8, position: 'relative', overflow: 'hidden' }}
              >
                <GenerationAnimation label="Generating video" />
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
      {/* Scroll sentinel — triggers loading more completed videos */}
      {hasMore && <div ref={sentinelRef} className="w-full h-8 flex items-center justify-center">
        <div className="w-4 h-4 border border-white/10 border-t-white/30 rounded-full animate-spin" />
      </div>}
    </div>
  )
}

// ─── Section header helper ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black text-white uppercase tracking-wider mb-3">
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
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p'>('720p')
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
  // Edit/Motion: keep original sound from uploaded video
  const [keepOriginalSound, setKeepOriginalSound] = useState(true)

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
  const [editRefImages, setEditRefImages] = useState<RefImage[]>([])
  const [editRefUploading, setEditRefUploading] = useState(false)
  const [editAspect, setEditAspect] = useState('16:9')

  // Motion settings
  const [motionSourcePreview, setMotionSourcePreview] = useState<string | null>(null)
  const [motionSourceCdnUrl, setMotionSourceCdnUrl] = useState<string | null>(null)
  const [motionSourceUploading, setMotionSourceUploading] = useState(false)
  const [motionRefImages, setMotionRefImages] = useState<RefImage[]>([])
  const [motionRefUploading, setMotionRefUploading] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [videos, setVideos] = useState<VideoResult[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('sharpii_videos')
      if (!raw) return []
      const parsed: VideoResult[] = JSON.parse(raw)
      // Only restore completed videos, not loading states
      return parsed.filter(v => v.url && !v.loading).slice(0, 50)
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
        localStorage.setItem('sharpii_videos', JSON.stringify(completed.slice(0, 50)))
      } catch { /* ignore quota errors */ }
    }
  }, [videos])

  // Clamp duration + reset model-specific state when model changes
  useEffect(() => {
    const newModel = ALL_VIDEO_MODELS.find(m => m.id === resolvedGenerateModelId)
    const durations = (newModel?.controls?.durations ?? ['5', '15']).map(Number)
    const min = durations[0] ?? 5
    const max = durations[durations.length - 1] ?? 15
    setGenDuration(d => Math.max(min, Math.min(max, d)))
    // kling-o3 (and O3 family) only support 'customize' shot type
    if (['kling-o3', 'kling-o3-video-edit', 'kling-o3-reference-to-video'].includes(resolvedGenerateModelId)) {
      setShotType('customize')
    }
    // Reset audio when switching to a model that doesn't support it
    if (!newModel?.controls?.audioSync) setGenAudio(false)
  }, [resolvedGenerateModelId])

  useEffect(() => {
    return () => {
      taskIntervalsRef.current.forEach(clearInterval)
      pollIntervalsRef.current.forEach(clearInterval)
    }
  }, [])

  const openPlansPopup = () => window.dispatchEvent(new CustomEvent('sharpii:open-plans'))

  const showToast = useCallback((msg: string, type: 'error' | 'info' = 'error', duration = 5000) => {
    setToastMsg({ msg, type })
    setTimeout(() => setToastMsg(null), duration)
  }, [])

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

  // Multi-image upload handler for reference images
  const addRefImage = useCallback(async (
    file: File,
    setImages: React.Dispatch<React.SetStateAction<RefImage[]>>,
    setUploading: (b: boolean) => void
  ) => {
    const preview = URL.createObjectURL(file)
    setImages(prev => [...prev, { preview, cdnUrl: null }])
    setUploading(true)
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUri }),
      })
      const data = await res.json()
      if (data.imageUrl) {
        setImages(prev => prev.map(img => img.preview === preview ? { ...img, cdnUrl: data.imageUrl } : img))
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch {
      setImages(prev => prev.filter(img => img.preview !== preview))
      showToast('Image upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [showToast])

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
    setShotDurations(p => {
      const totalSoFar = p.reduce((s, d) => s + d, 0)
      const newDur = Math.max(3, Math.min(5, 15 - totalSoFar))
      return [...p, newDur]
    })
  }, [shotPrompts.length])

  const removeShot = useCallback((idx: number) => {
    if (shotPrompts.length <= 1) return
    setShotPrompts(p => p.filter((_, i) => i !== idx))
    setShotDurations(p => p.filter((_, i) => i !== idx))
  }, [shotPrompts.length])

  const adjustShotDuration = useCallback((idx: number, newVal: number) => {
    const durations = (selectedModel?.controls?.durations ?? ['1', '15']).map(Number)
    const minDur = durations[0] ?? 1
    const maxDur = durations[durations.length - 1] ?? 15
    setShotDurations(p => {
      const n = [...p]
      const otherSum = n.reduce((s, d, j) => j !== idx ? s + d : s, 0)
      const maxVal = Math.max(minDur, Math.min(maxDur, maxDur - otherSum))
      if (Math.round(newVal) > maxVal) {
        showToast(`Maximum ${maxDur}s for this model`, 'error', 1000)
      }
      n[idx] = Math.min(maxVal, Math.max(minDur, Math.round(newVal)))
      return n
    })
  }, [selectedModel])

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
      if (!motionSourceCdnUrl) { showToast('Please upload a reference video.'); return }
      // Style reference image is optional for kling-o3-reference-to-video
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
        if (hasAudio) body.audio_sync = genAudio
        if (!isKlingO3 && genNegPrompt.trim()) body.negative_prompt = genNegPrompt.trim()
        if (firstFrameCdnUrl) body.first_frame_url = firstFrameCdnUrl
        if (endFrameCdnUrl) body.end_frame_url = endFrameCdnUrl
        if (isEvolinkModel) {
          body.quality = videoQuality
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
          // Element list — for any Kling model with elementList capability
          if (selectedModel?.controls?.elementList) {
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
        body.video_url = editVideoCdnUrl
        body.keep_original_sound = keepOriginalSound
        const editImgUrls = editRefImages.map(i => i.cdnUrl).filter((u): u is string => !!u)
        if (editImgUrls.length) body.image_urls = editImgUrls
        if (isKlingO3VideoEdit) {
          body.quality = videoQuality
          if (selectedModel?.controls?.multiShot && multiShot) {
            body.multi_shot = true
            body.shot_type = 'customize'
            // Always send multi_prompt — shot_type is always 'customize' for this model
            body.multi_prompt = shotPrompts.map((p, i) => ({
              index: i + 1, prompt: p.trim(), duration: shotDurations[i] ?? 5,
            }))
          }
          if (selectedModel?.controls?.elementList) {
            const activeElements = elementIds.filter(id => id.trim() !== '').map(id => parseInt(id)).filter(n => !isNaN(n) && n > 0)
            if (activeElements.length > 0) body.element_list = activeElements
          }
        } else {
          body.aspect_ratio = editAspect
        }
      } else if (activeTab === 'motion') {
        body.video_url = motionSourceCdnUrl
        body.keep_original_sound = keepOriginalSound
        const motionImgUrls = motionRefImages.map(i => i.cdnUrl).filter((u): u is string => !!u)
        if (motionImgUrls.length) body.image_urls = motionImgUrls
        if (isKlingO3RefToVideo) {
          body.quality = videoQuality
          // Clamp to model's 3–10s range (genDuration may be set from generate tab)
          body.duration = Math.max(3, Math.min(10, genDuration))
          body.aspect_ratio = genAspect
          if (selectedModel?.controls?.multiShot && multiShot) {
            body.multi_shot = true
            body.shot_type = 'customize'
            // Always send multi_prompt — shot_type is always 'customize' for this model
            body.multi_prompt = shotPrompts.map((p, i) => ({
              index: i + 1, prompt: p.trim(), duration: shotDurations[i] ?? 5,
            }))
          }
          if (selectedModel?.controls?.elementList) {
            const activeElements = elementIds.filter(id => id.trim() !== '').map(id => parseInt(id)).filter(n => !isNaN(n) && n > 0)
            if (activeElements.length > 0) body.element_list = activeElements
          }
        }
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

      const pollStartTime = Date.now()
      const MAX_POLL_DURATION_MS = 45 * 60 * 1000 // 45 minutes hard timeout
      const MAX_CONSECUTIVE_ERRORS = 5
      let consecutiveErrors = 0

      const stopPoll = (reason: 'success' | 'failed', errMsg?: string) => {
        clearInterval(pollInterval)
        pollIntervalsRef.current.delete(localId)
        cleanupTask(localId)
        if (reason === 'failed') {
          failTask(dbTaskId)
          // Remove from grid — error shown as toast instead
          setVideos(prev => prev.filter(v => v.id !== localId))
          showToast(errMsg || 'Video generation failed')
          setActiveTasks(prev => { const m = new Map(prev); m.delete(localId); return m })
        }
      }

      const pollInterval = setInterval(async () => {
        // Hard timeout — stop polling and let cron handle it
        if (Date.now() - pollStartTime > MAX_POLL_DURATION_MS) {
          stopPoll('failed', 'Generation timed out. Check History for status.')
          return
        }
        try {
          const pollRes = await fetch(`/api/generate-video/poll?taskId=${dbTaskId}`)
          const pollData = await pollRes.json()
          consecutiveErrors = 0 // reset on any successful HTTP response

          if (pollData.status === 'success') {
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
            stopPoll('success')
          } else if (pollData.status === 'failed') {
            stopPoll('failed', pollData.error || 'Generation failed')
          }
        } catch {
          consecutiveErrors++
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            // Network is broken — stop polling, let cron finish the task
            stopPoll('failed', 'Lost connection. Check History for status.')
          }
        }
      }, 8000)

      pollIntervalsRef.current.set(localId, pollInterval)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection error'
      cleanupTask(localId)
      setVideos(prev => prev.filter(v => v.id !== localId))
      showToast(msg)
      setActiveTasks(prev => { const m = new Map(prev); m.delete(localId); return m })
    }
  }

  const ctaDisabled = isSubmitting
    || (activeTab === 'generate' && !prompt.trim())
    || (activeTab === 'edit' && (!editVideoCdnUrl || editVideoUploading))
    || (activeTab === 'motion' && (!motionSourceCdnUrl || motionSourceUploading))

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
  const isKlingModel = selectedModelId.startsWith('kling') && activeTab === 'generate'
  const isKlingO3 = selectedModelId === 'kling-o3'   // element_list, customize-only, no neg-prompt
  const isKlingV3 = selectedModelId === 'kling-3'    // intelligence shot type, negative_prompt
  const isKlingO3VideoEdit = selectedModelId === 'kling-o3-video-edit'
  const isKlingO3RefToVideo = selectedModelId === 'kling-o3-reference-to-video'
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
              {/* Model + optional Veo variant: one unified section */}
              <div className="px-5 pt-5 pb-5 border-b border-white/[0.05]">
                <SectionLabel>Model</SectionLabel>
                <ModelPicker groups={MODEL_GROUPS} selected={generateModel} onSelect={setGenerateModel} />
                {isVeoVariantGroup && veoVariants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {veoVariants.map(v => (
                      <button
                        key={v.variantTier}
                        title={v.description}
                        onClick={() => setVeoVariant(v.variantTier!)}
                        className={cn(
                          "px-3 py-1.5 text-[11px] font-black rounded-md transition-colors",
                          veoVariant === v.variantTier
                            ? "bg-white/[0.09] text-[#FFFF00]"
                            : "bg-white/[0.04] text-white/55 hover:text-white hover:bg-white/[0.07]"
                        )}
                      >
                        {v.variantTier}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── All settings: single block, no internal dividers ── */}
              <div className="px-5 py-5 space-y-5">

                {/* First frame + End frame */}
                {(hasFirstFrame || hasEndFrame) && (
                  <div className={cn("grid gap-3", hasEndFrame ? "grid-cols-2" : "grid-cols-1")}>
                    {hasFirstFrame && (
                      <div>
                        <SectionLabel>First Frame <span className="text-white/40 normal-case font-normal text-[9px] ml-1">(optional)</span></SectionLabel>
                        <ImageUploadBox
                          label="" preview={firstFramePreview} uploading={firstFrameUploading}
                          hint="First frame"
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
                          hint="End frame"
                          onFile={(f) => uploadImage(f, setEndFramePreview, setEndFrameCdnUrl, setEndFrameUploading)}
                          onClear={() => { setEndFramePreview(null); setEndFrameCdnUrl(null) }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt */}
                <div>
                  <SectionLabel>Prompt</SectionLabel>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="A sweeping cinematic shot of mountains at golden hour, camera slowly rising…"
                    rows={4}
                    className="w-full bg-[#111111] border border-[#1e1e1e] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#2e2e2e] transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Kling: Duration */}
                {isKlingModel && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-white uppercase tracking-wider block">Duration</span>
                      <span className="text-[9px] text-white/35 font-mono block mt-0.5">Min {durationMin}s – Max {durationMax}s</span>
                    </div>
                    <div className="shrink-0" style={{ width: 160 }}>
                      <Slider min={durationMin} max={durationMax} step={1} value={genDuration} onChange={setGenDuration} segments={16} fillFromZero />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-[#FFFF00] shrink-0 w-6 text-right">{genDuration}s</span>
                  </div>
                )}

                {/* Kling: Aspect + Quality + Sound */}
                {isKlingModel && (
                  <div className={cn("grid gap-2.5", hasAudio ? "grid-cols-3" : "grid-cols-2")}>
                    <div>
                      <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Aspect</span>
                      <AspectDropdown ratios={availableAspects} selected={genAspect} onSelect={setGenAspect} compact={true} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Quality</span>
                      <CompactDropdown value={videoQuality} options={['720p', '1080p']} onChange={v => setVideoQuality(v as '720p' | '1080p')} />
                    </div>
                    {hasAudio && (
                      <div>
                        <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Sound</span>
                        <div className="flex items-center justify-between px-2.5 py-2 bg-[#111111] border border-[#1e1e1e] rounded-lg">
                          <IconVolume className="w-3.5 h-3.5 text-white/55" />
                          <Toggle checked={genAudio} onChange={setGenAudio} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Non-Kling: Aspect (+ model-specific toggles) + Duration + Audio */}
                {!isKlingModel && (
                  <>
                    {/* Veo: Aspect + Enhance + Upsample in 3-col grid */}
                    {isVeoModel && (
                      <div className={cn("grid gap-2.5",
                        (selectedModel?.controls?.enhancePrompt && selectedModel?.controls?.enableUpsample) ? "grid-cols-3"
                          : (selectedModel?.controls?.enhancePrompt || selectedModel?.controls?.enableUpsample) ? "grid-cols-2"
                          : "grid-cols-1"
                      )}>
                        <div>
                          <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Aspect</span>
                          <AspectDropdown ratios={availableAspects} selected={genAspect} onSelect={setGenAspect} compact={true} />
                        </div>
                        {selectedModel?.controls?.enhancePrompt && (
                          <div>
                            <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Enhance</span>
                            <div className="flex items-center justify-between px-2.5 py-2 bg-[#111111] border border-[#1e1e1e] rounded-lg">
                              <IconSparkles className="w-3.5 h-3.5 text-white/55" />
                              <Toggle checked={enhancePrompt} onChange={setEnhancePrompt} />
                            </div>
                          </div>
                        )}
                        {selectedModel?.controls?.enableUpsample && (
                          <div>
                            <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Upscale</span>
                            <div className="flex items-center justify-between px-2.5 py-2 bg-[#111111] border border-[#1e1e1e] rounded-lg">
                              <IconUpload className="w-3.5 h-3.5 text-white/55" />
                              <Toggle checked={enableUpsample} onChange={setEnableUpsample} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Seedance: Aspect + Lock Camera in 2-col grid */}
                    {isSeedanceModel && (
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Aspect</span>
                          <AspectDropdown ratios={availableAspects} selected={genAspect} onSelect={setGenAspect} compact={true} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Camera</span>
                          <div className="flex items-center justify-between px-2.5 py-2 bg-[#111111] border border-[#1e1e1e] rounded-lg">
                            <IconCamera className="w-3.5 h-3.5 text-white/55" />
                            <Toggle checked={cameraFixed} onChange={setCameraFixed} />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Sora and others: full-width aspect dropdown */}
                    {!isVeoModel && !isSeedanceModel && (
                      <div>
                        <SectionLabel>Aspect Ratio</SectionLabel>
                        <AspectDropdown ratios={availableAspects} selected={genAspect} onSelect={setGenAspect} />
                      </div>
                    )}
                    {/* Duration row */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider block">Duration</span>
                        <span className="text-[9px] text-white/35 font-mono block mt-0.5">Min {durationMin}s – Max {durationMax}s</span>
                      </div>
                      <div className="shrink-0" style={{ width: 160 }}>
                        <Slider min={durationMin} max={durationMax} step={1} value={genDuration} onChange={setGenDuration} segments={16} fillFromZero />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#FFFF00] shrink-0 w-6 text-right">{genDuration}s</span>
                    </div>
                    {/* Audio toggle */}
                    {hasAudio && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconVolume className="w-3.5 h-3.5 text-white/55" />
                          <span className="text-[10px] font-black text-white uppercase tracking-wider">Audio</span>
                          <span className="text-[9px] text-white/45">native generation</span>
                        </div>
                        <Toggle checked={genAudio} onChange={setGenAudio} />
                      </div>
                    )}
                  </>
                )}

                {/* Kling: Multi-Shot */}
                {isKlingModel && selectedModel?.controls?.multiShot && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs font-black text-white">Multi-Shot</span>
                        <p className="text-[10px] text-white/50 mt-0.5">Control each scene independently</p>
                      </div>
                      <Toggle checked={multiShot} onChange={setMultiShot} />
                    </div>
                    {multiShot && (
                      <div className="space-y-2.5">
                        <div className="flex bg-white/[0.04] border border-white/[0.04] p-0.5 rounded-md gap-0.5">
                          {(isKlingO3
                            ? [['customize', 'Manual']] as const
                            : [['customize', 'Manual'], ['intelligence', 'AI Auto']] as const
                          ).map(([id, label]) => (
                            <button key={id} onClick={() => setShotType(id)}
                              className={cn("flex-1 py-2 text-[11px] font-black rounded transition-colors",
                                shotType === id ? "bg-white/[0.09] text-[#FFFF00]" : "text-white/55 hover:text-white")}>
                              {label}
                            </button>
                          ))}
                        </div>
                        {shotType === 'intelligence' && (
                          <p className="text-[10px] text-white/45 px-0.5">AI will automatically plan and sequence your shots based on the main prompt.</p>
                        )}
                        {shotType === 'customize' && (() => {
                          const totalShotDur = shotDurations.slice(0, shotPrompts.length).reduce((s, d) => s + d, 0)
                          const overLimit = totalShotDur > 15
                          return (
                            <div className="space-y-2">
                              {shotPrompts.map((sp, i) => {
                                const shotDur = shotDurations[i] ?? 5
                                const otherSum = shotDurations.reduce((s, d, j) => j !== i ? s + d : s, 0)
                                const maxForShot = Math.max(durationMin, Math.min(durationMax, durationMax - otherSum))
                                return (
                                  <div key={i} className="rounded-lg bg-[#0e0e0e] border border-white/[0.1] overflow-hidden">
                                    <div className="flex items-center justify-between px-3 pt-2 pb-0">
                                      <span className="text-[9px] font-black text-white/55 uppercase tracking-wider">Shot {i + 1}</span>
                                      {shotPrompts.length > 1 && (
                                        <button onClick={() => removeShot(i)} className="p-0.5 text-white/40 hover:text-red-400 transition-colors">
                                          <IconTrash className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <textarea
                                      value={sp}
                                      onChange={e => setShotPrompts(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
                                      placeholder={`Scene ${i + 1}…`}
                                      rows={2}
                                      className="w-full bg-transparent px-3 pb-2.5 pt-1.5 text-[12px] text-white placeholder:text-white/40 outline-none resize-none leading-relaxed"
                                    />
                                    <div className="px-3 py-2 border-t border-white/[0.07] flex items-center gap-2">
                                      <IconClock className="w-3 h-3 text-white/45 shrink-0" />
                                      <span className="text-[9px] font-black text-white/50 uppercase tracking-wider shrink-0">Duration</span>
                                      <Slider min={durationMin} max={durationMax} step={1} value={shotDur} onChange={v => adjustShotDuration(i, v)} pillHeight={13} autoWidth />
                                      <span className="font-mono text-[10px] font-bold text-[#FFFF00] shrink-0">{shotDur}s</span>
                                    </div>
                                  </div>
                                )
                              })}
                              {shotPrompts.length < 6 && totalShotDur <= 12 && (
                                <button
                                  onClick={addShot}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/[0.16] transition-colors group"
                                >
                                  <div className="w-4 h-4 rounded-full bg-white/[0.12] group-hover:bg-white/20 flex items-center justify-center transition-colors">
                                    <IconPlus className="w-2.5 h-2.5 text-white/70 group-hover:text-white transition-colors" />
                                  </div>
                                  <span className="text-[11px] font-black text-white/65 group-hover:text-white/90 uppercase tracking-wider transition-colors">Add Shot</span>
                                </button>
                              )}
                              <div className={cn("flex items-center justify-between text-[9px] px-0.5", overLimit ? "text-red-400" : "text-white/50")}>
                                <span>Total duration</span>
                                <span className="font-mono font-bold">{totalShotDur}s / 15s max</span>
                              </div>
                              {selectedModel?.controls?.elementList && (
                                <div className="pt-1">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Subject Elements</span>
                                    <span className="text-[9px] text-white/50 italic">(optional)</span>
                                  </div>
                                  <div className="flex gap-1.5">
                                    {[0, 1, 2].map(idx => (
                                      <input key={idx} type="number" min={1}
                                        value={elementIds[idx] ?? ''}
                                        onChange={e => setElementIds(prev => { const n = [...prev]; n[idx] = e.target.value; return n })}
                                        placeholder={`ID ${idx + 1}`}
                                        className="flex-1 bg-[#0d0d0d] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-white/40 outline-none focus:border-white/20 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none text-center"
                                      />
                                    ))}
                                  </div>
                                  <p className="text-[9px] text-white/50 mt-1">Reference in prompt as {`<<<element_1>>>`}</p>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}


                {/* Advanced: seed + negative prompt */}
                <div className="pt-1 border-t border-white/[0.04] space-y-3">
                  {hasSeed && (
                    <div>
                      <button
                        onClick={() => setShowAdvanced(p => !p)}
                        className="flex items-center gap-2 text-[10px] font-black text-white/55 uppercase tracking-wider hover:text-white/80 transition-colors w-full"
                      >
                        <IconMinus className="w-3.5 h-3.5" />
                        <span>Advanced</span>
                        <IconChevronDown className={cn("w-3 h-3 ml-auto transition-transform", showAdvanced && "rotate-180")} />
                      </button>
                      {showAdvanced && (
                        <div className="mt-3 space-y-2">
                          <label className="text-[10px] font-black text-white uppercase tracking-wider">Seed</label>
                          <input
                            type="number"
                            value={seed}
                            onChange={e => setSeed(e.target.value)}
                            placeholder="Random"
                            className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#2e2e2e] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <p className="text-[9px] text-white/50">Same seed reproduces identical results</p>
                        </div>
                      )}
                    </div>
                  )}
                  {!isKlingO3 && (
                    <>
                      <button
                        onClick={() => setShowNegPrompt(p => !p)}
                        className="flex items-center gap-2 text-[10px] font-black text-white/55 uppercase tracking-wider hover:text-white/80 transition-colors w-full"
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
                          className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#2e2e2e] transition-colors resize-none"
                        />
                      )}
                    </>
                  )}
                </div>

              </div>
            </>
          )}

          {/* ── EDIT TAB ──────────────────────────────────────────────────────── */}
          {activeTab === 'edit' && (
            <>
              <div className="px-5 py-5 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <IconWand className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Kling O3 Edit</span>
                  <span className={cn("text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-auto", TAG_COLORS['Edit'])}>Edit</span>
                </div>
                <p className="text-[10px] text-white/55 leading-relaxed mt-1">
                  AI-powered video editing — transform existing videos with natural language instructions.
                </p>
              </div>

              <div className="px-5 py-5 border-b border-white/5">
                <SectionLabel>Source Video</SectionLabel>
                <VideoUploadBox
                  label=""
                  preview={editVideoPreview}
                  uploading={editVideoUploading}
                  hint="MP4 / MOV · ≤200MB · ≥3s"
                  onFile={(f) => uploadVideo(f, setEditVideoPreview, setEditVideoCdnUrl, setEditVideoUploading)}
                  onClear={() => { setEditVideoPreview(null); setEditVideoCdnUrl(null) }}
                />
              </div>

              <div className="px-5 py-4 border-b border-white/5">
                <MultiImageUpload
                  images={editRefImages}
                  uploading={editRefUploading}
                  onAdd={f => addRefImage(f, setEditRefImages, setEditRefUploading)}
                  onRemove={i => setEditRefImages(prev => prev.filter((_, idx) => idx !== i))}
                />
              </div>

              {/* Edit settings: Quality + Keep Sound */}
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Quality</span>
                    <CompactDropdown value={videoQuality} options={['720p', '1080p']} onChange={v => setVideoQuality(v as '720p' | '1080p')} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Keep Audio</span>
                    <div className="flex items-center justify-between px-2.5 py-2 bg-[#111111] border border-[#1e1e1e] rounded-lg">
                      <IconVolume className="w-3.5 h-3.5 text-white/55" />
                      <Toggle checked={keepOriginalSound} onChange={setKeepOriginalSound} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Shot for Kling O3 Edit */}
              {selectedModel?.controls?.multiShot && (
                <div className="px-5 py-4 border-b border-white/[0.05]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-black text-white">Multi-Shot</span>
                      <p className="text-[10px] text-white/50 mt-0.5">Control each scene independently</p>
                    </div>
                    <Toggle checked={multiShot} onChange={setMultiShot} />
                  </div>
                  {multiShot && (
                    <div className="space-y-2.5">
                      <div className="space-y-2">
                        {shotPrompts.map((sp, i) => {
                          const shotDur = shotDurations[i] ?? 5
                          return (
                            <div key={i} className="rounded-lg bg-[#0e0e0e] border border-white/[0.1] overflow-hidden">
                              <div className="flex items-center justify-between px-3 pt-2 pb-0">
                                <span className="text-[9px] font-black text-white/55 uppercase tracking-wider">Shot {i + 1}</span>
                                {shotPrompts.length > 1 && (
                                  <button onClick={() => removeShot(i)} className="p-0.5 text-white/40 hover:text-red-400 transition-colors">
                                    <IconTrash className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <textarea
                                value={sp}
                                onChange={e => setShotPrompts(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
                                placeholder={`Scene ${i + 1}…`}
                                rows={2}
                                className="w-full bg-transparent px-3 pb-2.5 pt-1.5 text-[12px] text-white placeholder:text-white/40 outline-none resize-none leading-relaxed"
                              />
                              <div className="px-3 py-2 border-t border-white/[0.07] flex items-center gap-2">
                                <IconClock className="w-3 h-3 text-white/45 shrink-0" />
                                <span className="text-[9px] font-black text-white/50 uppercase tracking-wider shrink-0">Duration</span>
                                <Slider min={3} max={10} step={1} value={shotDur}
                                  onChange={v => setShotDurations(prev => { const n = [...prev]; n[i] = v; return n })}
                                  pillHeight={13} autoWidth />
                                <span className="font-mono text-[10px] font-bold text-[#FFFF00] shrink-0">{shotDur}s</span>
                              </div>
                            </div>
                          )
                        })}
                        {shotPrompts.length < 6 && (
                          <button
                            onClick={addShot}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/[0.16] transition-colors group"
                          >
                            <div className="w-4 h-4 rounded-full bg-white/[0.12] group-hover:bg-white/20 flex items-center justify-center transition-colors">
                              <IconPlus className="w-2.5 h-2.5 text-white/70 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[11px] font-black text-white/65 group-hover:text-white/90 uppercase tracking-wider transition-colors">Add Shot</span>
                          </button>
                        )}
                      </div>
                      {selectedModel?.controls?.elementList && (
                        <div className="pt-1">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">Subject Elements</span>
                            <span className="text-[9px] text-white/50 italic">(optional)</span>
                          </div>
                          <div className="flex gap-1.5">
                            {[0, 1, 2].map(idx => (
                              <input key={idx} type="number" min={1}
                                value={elementIds[idx] ?? ''}
                                onChange={e => setElementIds(prev => { const n = [...prev]; n[idx] = e.target.value; return n })}
                                placeholder={`ID ${idx + 1}`}
                                className="flex-1 bg-[#0d0d0d] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-white/40 outline-none focus:border-white/20 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none text-center"
                              />
                            ))}
                          </div>
                          <p className="text-[9px] text-white/50 mt-1">Reference in prompt as {`<<<element_1>>>`}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── MOTION TAB ──────────────────────────────────────────────────── */}
          {activeTab === 'motion' && (
            <>
              <div className="px-5 py-5 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <IconTransfer className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Reference to Video</span>
                  <span className={cn("text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-auto", TAG_COLORS['Motion'])}>Kling O3</span>
                </div>
                <p className="text-[10px] text-white/55 leading-relaxed mt-1">
                  Generate new videos guided by a reference video's style and motion.
                </p>
              </div>

              <div className="px-5 py-5 border-b border-white/5">
                <VideoUploadBox
                  label="Reference Video"
                  hint="MP4 / MOV · ≥3s · Required"
                  preview={motionSourcePreview}
                  uploading={motionSourceUploading}
                  onFile={(f) => uploadVideo(f, setMotionSourcePreview, setMotionSourceCdnUrl, setMotionSourceUploading)}
                  onClear={() => { setMotionSourcePreview(null); setMotionSourceCdnUrl(null) }}
                />
              </div>

              <div className="px-5 py-4 border-b border-white/5">
                <MultiImageUpload
                  images={motionRefImages}
                  uploading={motionRefUploading}
                  onAdd={f => addRefImage(f, setMotionRefImages, setMotionRefUploading)}
                  onRemove={i => setMotionRefImages(prev => prev.filter((_, idx) => idx !== i))}
                />
              </div>

              {/* Motion settings: Aspect + Duration + Quality + Keep Sound */}
              <div className="px-5 py-4 border-b border-white/[0.05] space-y-4">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Aspect</span>
                    <AspectDropdown ratios={['16:9', '9:16', '1:1']} selected={genAspect} onSelect={setGenAspect} compact={true} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Quality</span>
                    <CompactDropdown value={videoQuality} options={['720p', '1080p']} onChange={v => setVideoQuality(v as '720p' | '1080p')} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Keep Audio</span>
                    <div className="flex items-center justify-between px-2.5 py-2 bg-[#111111] border border-[#1e1e1e] rounded-lg">
                      <IconVolume className="w-3.5 h-3.5 text-white/55" />
                      <Toggle checked={keepOriginalSound} onChange={setKeepOriginalSound} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider block">Duration</span>
                    <span className="text-[9px] text-white/35 font-mono block mt-0.5">Min 3s – Max 10s</span>
                  </div>
                  <div className="shrink-0" style={{ width: 160 }}>
                    <Slider min={3} max={10} step={1} value={Math.min(genDuration, 10)} onChange={setGenDuration} segments={16} fillFromZero />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#FFFF00] shrink-0 w-6 text-right">{Math.min(genDuration, 10)}s</span>
                </div>
              </div>

              {/* Multi-Shot for Kling O3 Reference-to-Video */}
              {selectedModel?.controls?.multiShot && (
                <div className="px-5 py-4 border-b border-white/[0.05]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-black text-white">Multi-Shot</span>
                      <p className="text-[10px] text-white/50 mt-0.5">Control each scene independently</p>
                    </div>
                    <Toggle checked={multiShot} onChange={setMultiShot} />
                  </div>
                  {multiShot && (
                    <div className="space-y-2.5">
                      <div className="space-y-2">
                        {shotPrompts.map((sp, i) => {
                          const shotDur = shotDurations[i] ?? 5
                          return (
                            <div key={i} className="rounded-lg bg-[#0e0e0e] border border-white/[0.1] overflow-hidden">
                              <div className="flex items-center justify-between px-3 pt-2 pb-0">
                                <span className="text-[9px] font-black text-white/55 uppercase tracking-wider">Shot {i + 1}</span>
                                {shotPrompts.length > 1 && (
                                  <button onClick={() => removeShot(i)} className="p-0.5 text-white/40 hover:text-red-400 transition-colors">
                                    <IconTrash className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <textarea
                                value={sp}
                                onChange={e => setShotPrompts(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
                                placeholder={`Scene ${i + 1}…`}
                                rows={2}
                                className="w-full bg-transparent px-3 pb-2.5 pt-1.5 text-[12px] text-white placeholder:text-white/40 outline-none resize-none leading-relaxed"
                              />
                              <div className="px-3 py-2 border-t border-white/[0.07] flex items-center gap-2">
                                <IconClock className="w-3 h-3 text-white/45 shrink-0" />
                                <span className="text-[9px] font-black text-white/50 uppercase tracking-wider shrink-0">Duration</span>
                                <Slider min={3} max={10} step={1} value={shotDur}
                                  onChange={v => setShotDurations(prev => { const n = [...prev]; n[i] = v; return n })}
                                  pillHeight={13} autoWidth />
                                <span className="font-mono text-[10px] font-bold text-[#FFFF00] shrink-0">{shotDur}s</span>
                              </div>
                            </div>
                          )
                        })}
                        {shotPrompts.length < 6 && (
                          <button
                            onClick={addShot}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/[0.16] transition-colors group"
                          >
                            <div className="w-4 h-4 rounded-full bg-white/[0.12] group-hover:bg-white/20 flex items-center justify-center transition-colors">
                              <IconPlus className="w-2.5 h-2.5 text-white/70 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[11px] font-black text-white/65 group-hover:text-white/90 uppercase tracking-wider transition-colors">Add Shot</span>
                          </button>
                        )}
                      </div>
                      {selectedModel?.controls?.elementList && (
                        <div className="pt-1">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">Subject Elements</span>
                            <span className="text-[9px] text-white/50 italic">(optional)</span>
                          </div>
                          <div className="flex gap-1.5">
                            {[0, 1, 2].map(idx => (
                              <input key={idx} type="number" min={1}
                                value={elementIds[idx] ?? ''}
                                onChange={e => setElementIds(prev => { const n = [...prev]; n[idx] = e.target.value; return n })}
                                placeholder={`ID ${idx + 1}`}
                                className="flex-1 bg-[#0d0d0d] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-white/40 outline-none focus:border-white/20 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none text-center"
                              />
                            ))}
                          </div>
                          <p className="text-[9px] text-white/50 mt-1">Reference in prompt as {`<<<element_1>>>`}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── PROMPT (edit / motion only — generate tab has prompt at top) ─── */}
          {activeTab !== 'generate' && (
            <div className="px-5 py-5 flex-1">
              <SectionLabel>
                {activeTab === 'edit' ? 'Edit Instructions' : 'Guidance Prompt'}
                <span className="text-white/40 normal-case font-normal text-[9px] ml-1">(optional)</span>
              </SectionLabel>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={
                  activeTab === 'edit'
                    ? 'Apply warm cinematic color grading with smooth transitions…'
                    : 'Maintain the same motion style, switch to a snowy background…'
                }
                rows={4}
                className="w-full bg-[#111111] border border-[#1e1e1e] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#2e2e2e] transition-colors resize-none leading-relaxed"
              />
            </div>
          )}

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
                className="w-full bg-[#FFFF00] hover:bg-[#e6e600] text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] text-base uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <><IconLoader2 className="w-5 h-5 animate-spin" /><span>Starting…</span></>
                ) : (
                  <>
                    {activeTab === 'generate' ? <IconSparkles className="w-5 h-5" />
                      : activeTab === 'edit' ? <IconWand className="w-5 h-5" />
                      : <IconTransfer className="w-5 h-5" />}
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
        <div className="relative flex flex-col px-4 pt-2 pb-8 order-1 lg:order-2 lg:overflow-y-auto lg:overflow-x-hidden lg:h-[calc(100vh-4rem)] custom-scrollbar">

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
        <div className="fixed bottom-6 right-6 z-[10003] pointer-events-none">
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
