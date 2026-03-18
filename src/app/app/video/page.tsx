"use client"
import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react"
import { useSWRConfig } from "swr"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-client-simple"
import { ElegantLoading } from "@/components/ui/elegant-loading"
import { useCredits } from "@/lib/hooks/use-credits"
import { APP_DATA_KEY } from "@/lib/hooks/use-app-data"
import { CreditIcon } from "@/components/ui/CreditIcon"
import { GenerationAnimation } from "@/components/ui/GenerationAnimation"
import { PillRangeSlider } from "@/components/ui/pill-range-slider"
import { getVideoModels } from "@/services/models"
import type { ModelConfig } from "@/services/models"
import {
  IconUpload, IconLoader2, IconSparkles, IconTrash, IconVideo, IconPhoto,
  IconChevronDown, IconMinus, IconCamera, IconWand, IconTransfer,
  IconPlayerPlay, IconPlayerPause, IconVolume, IconVolumeOff, IconDownload,
  IconPlus, IconClock, IconX, IconArrowUp, IconMaximize, IconMinimize,
  IconCheck, IconCopy,
} from "@tabler/icons-react"
import { createPortal } from "react-dom"
import { startSmartProgress, type TaskEntry } from "@/lib/task-progress"
import { generateMediaFilename, downloadMedia } from "@/lib/media-filename"
import MyLoadingProcessIndicator from "@/components/ui/MyLoadingProcessIndicator"

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoTab = 'generate' | 'edit' | 'motion'

interface VideoResult {
  id: string
  url: string | null
  aspect: string
  loading: boolean
  prompt?: string
  model?: string
  variant?: string
  dimensions?: string
  taskId?: string
  error?: string
}

// ─── Model groupings ──────────────────────────────────────────────────────────

const ALL_VIDEO_MODELS = getVideoModels()
const GENERATE_MODELS = ALL_VIDEO_MODELS.filter(
  m => !['kling-effects', 'kling-video-motion-control', 'kling-o3-video-edit', 'kling-o3-reference-to-video'].includes(m.id)
)
const EDIT_MODELS = ALL_VIDEO_MODELS.filter(m => m.id === 'kling-o3-video-edit')
const MOTION_MODELS = ALL_VIDEO_MODELS.filter(m =>
  m.id === 'kling-o3-reference-to-video' || m.variantGroupId === 'mirai-motion-replicate'
)

const MOTION_MODEL_GROUPS: { label: string; models: ModelConfig[] }[] = [
  { label: 'Kling', models: MOTION_MODELS.filter(m => m.id === 'kling-o3-reference-to-video') },
  { label: 'Mirai Motion', models: dedupeVariants(MOTION_MODELS.filter(m => m.variantGroupId === 'mirai-motion-replicate')) },
].filter(g => g.models.length > 0)

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
  { label: 'Mirai Motion', models: dedupeVariants(ALL_VIDEO_MODELS.filter(m => m.variantGroupId === 'mirai-motion-replicate')) },
].filter(g => g.models.length > 0)

const ASPECT_LABELS: Record<string, string> = {
  '16:9': 'Landscape', '9:16': 'Portrait', '1:1': 'Square',
}

const VIDEO_TASK_DURATION_SECS = 120

function getVideoDimensions(aspect: string, quality: '720p' | '1080p'): string {
  const s = quality === '1080p' ? 1080 : 720
  const l = quality === '1080p' ? 1920 : 1280
  const map: Record<string, string> = {
    '16:9': `${l}×${s}`, '9:16': `${s}×${l}`, '1:1': `${s}×${s}`,
    '4:3': quality === '1080p' ? '1440×1080' : '960×720',
    '3:4': quality === '1080p' ? '1080×1440' : '720×960',
  }
  return map[aspect] ?? `${l}×${s}`
}

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

// ─── Provider logos (webp — public/images/) ────────────────────────────────────

const GROUP_LOGOS: Record<string, string> = {
  'Kling':         '/images/kling_logo.webp',
  'Google Veo':    '/images/google_logo.webp',
  'OpenAI Sora':   '/images/openai_sora.webp',
  'ByteDance':     '/images/bytedance_logo.webp',
  'Mirai Motion':  '/images/mirai_logo.webp',
}

// ─── Model picker (premium side-panel via portal) ──────────────────────────────

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
  const selectedGroupLogo = groups.find(g => g.models.some(m => m.id === selected))
    ? GROUP_LOGOS[groups.find(g => g.models.some(m => m.id === selected))!.label]
    : null

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Panel — slides in from left */}
      <div
        className="relative w-full max-w-[340px] bg-[#080809] flex flex-col h-full shadow-2xl animate-[slideInLeft_0.2s_cubic-bezier(0.22,1,0.36,1)]"
        onClick={e => e.stopPropagation()}
        style={{ animationFillMode: 'both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5 flex-shrink-0">
          <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Select Model</p>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-md bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Model list */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-5 custom-scrollbar">
          {groups.map(group => {
            const logoSrc = GROUP_LOGOS[group.label]
            return (
              <div key={group.label}>
                {/* Group header — label + divider only, no logo, no count */}
                <div className="flex items-center gap-2.5 mb-2 px-1">
                  <span className="text-[10px] font-black text-white/35 uppercase tracking-widest shrink-0">{group.label}</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>

                {/* Model cards */}
                <div className="space-y-1">
                  {group.models.map(model => {
                    const isActive = selected === model.id
                    return (
                      <button
                        key={model.id}
                        onClick={() => { onSelect(model.id); setOpen(false) }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 transition-all text-left",
                          isActive
                            ? "border-2"
                            : "border border-transparent hover:border-white/[0.07] hover:bg-white/[0.03]"
                        )}
                        style={{
                          borderRadius: 14,
                          ...(isActive ? {
                            background: 'linear-gradient(to right, rgba(255,255,0,0.07) 0%, rgba(255,255,0,0) 100%)',
                            borderColor: 'rgb(47, 47, 47)',
                          } : {}),
                        }}
                      >
                        {/* Provider logo badge */}
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-[#0e0e0e]">
                          {logoSrc
                            ? <img src={logoSrc} alt={group.label} className="w-6 h-6 object-contain" />
                            : <div className="w-2 h-2 rounded-full bg-white/30" />
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={cn(
                              "text-[13px] font-bold leading-tight truncate",
                              isActive ? "text-[#FFFF00]" : "text-white/85"
                            )}>
                              {model.label}
                            </span>
                            {model.tag && (
                              <span className={cn(
                                "text-[7px] font-black uppercase tracking-wider px-1.5 py-[2px] rounded flex-shrink-0",
                                TAG_COLORS[model.tag] ?? "bg-white/10 text-gray-400"
                              )}>
                                {model.tag}
                              </span>
                            )}
                          </div>
                          <p className={cn(
                            "text-[10px] leading-snug truncate",
                            isActive ? "text-white/40" : "text-white/20"
                          )}>
                            {model.description}
                          </p>
                        </div>

                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Trigger button — shows logo, model name + tag, and description */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-3 bg-[#0f0f11] border border-white/[0.08] hover:border-white/[0.18] rounded-xl text-left transition-all group"
      >
        {/* Provider logo */}
        <div className="w-10 h-10 rounded-xl bg-[#161616] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {selectedGroupLogo
            ? <img src={selectedGroupLogo} alt="" className="w-7 h-7 object-contain" />
            : <div className="w-2 h-2 rounded-full bg-white/30" />
          }
        </div>

        {/* Model info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[13px] font-bold text-white truncate leading-none">
              {selectedModel?.label ?? 'Select Model'}
            </span>
            {selectedModel?.tag && (
              <span className={cn(
                "text-[7px] font-black uppercase tracking-wider px-1.5 py-[2px] rounded flex-shrink-0",
                TAG_COLORS[selectedModel.tag] ?? "bg-white/10 text-gray-400"
              )}>
                {selectedModel.tag}
              </span>
            )}
          </div>
          {selectedModel?.description && (
            <p className="text-[10px] text-white/35 truncate leading-snug">
              {selectedModel.description}
            </p>
          )}
        </div>

        <IconChevronDown className="w-3.5 h-3.5 text-white/25 group-hover:text-white/50 transition-colors flex-shrink-0 shrink-0" />
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
  tall?: boolean
}

function VideoUploadBox({ label, hint, preview, uploading, onFile, onClear, tall }: VideoUploadBoxProps) {
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
          tall ? "h-36" : "h-28",
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
            <video src={preview} className="absolute inset-0 w-full h-full object-contain" muted playsInline autoPlay loop />
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
            <IconVideo className="w-5 h-5 text-[#606060] group-hover:text-[#909090] transition-colors" />
            {hint && <p className="text-[9px] text-white/45 text-center px-2">{hint}</p>}
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
  required?: boolean
  hint?: string
  preview: string | null
  uploading: boolean
  onFile: (file: File) => Promise<void>
  onClear: () => void
  tall?: boolean
}

function ImageUploadBox({ label, optional, required, hint, preview, uploading, onFile, onClear, tall }: ImageUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px] font-black uppercase tracking-wider", required ? "text-white" : "text-white/65")}>{label}</span>
          {optional && <span className="text-[9px] text-white/30 italic">(optional)</span>}
        </div>
      )}

      <div
        className={cn(
          "relative rounded-lg border overflow-hidden cursor-pointer transition-all group",
          tall ? "h-36" : "h-24",
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
            <img src={preview} alt="" className="absolute inset-0 w-full h-full object-contain" />
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
            <IconPhoto className="w-5 h-5 text-[#606060] group-hover:text-[#909090] transition-colors" />
            {hint && <p className="text-[9px] text-white/45 text-center px-2">{hint}</p>}
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

/** Snap actual video pixel dimensions to the nearest known aspect-ratio label. */
function detectAspectLabel(vw: number, vh: number): string | null {
  if (!vw || !vh) return null
  const ratio = vw / vh
  let best = '', diff = Infinity
  for (const [key, val] of Object.entries(VIDEO_ASPECT_NUM)) {
    const d = Math.abs(ratio - val)
    if (d < diff) { diff = d; best = key }
  }
  return diff < 0.15 ? best : null
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

function VideoGridTile({ video, width, height, onExpand, onAspectCorrect }: {
  video: VideoResult; width: number; height: number; onExpand: () => void
  onAspectCorrect?: (id: string, aspect: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const tileRef = useRef<HTMLDivElement>(null)
  const isInViewRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  // Auto-play when tile enters viewport, pause + reset when it leaves
  useEffect(() => {
    const el = tileRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting
        const vid = videoRef.current
        if (!vid) return
        if (entry.isIntersecting) {
          if (vid.readyState >= 2) vid.play().catch(() => {})
        } else {
          vid.pause()
          vid.currentTime = 0
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleLoaded = () => {
    // Detect real aspect ratio and correct if needed
    const el = videoRef.current
    if (el && onAspectCorrect) {
      const detected = detectAspectLabel(el.videoWidth, el.videoHeight)
      if (detected && detected !== video.aspect) onAspectCorrect(video.id, detected)
    }
    // Play immediately if already in view
    if (isInViewRef.current) videoRef.current?.play().catch(() => {})
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
      ref={tileRef}
      style={{ width, height, flexShrink: 0, overflow: 'hidden', borderRadius: 8, position: 'relative', cursor: 'pointer' }}
      className="group bg-[#0a0a0a] border border-white/[0.07] hover:border-white/20 transition-all duration-200"
      onClick={onExpand}
    >
      <video
        ref={videoRef}
        src={video.url!}
        muted={isMuted} playsInline loop preload="metadata"
        onLoadedData={handleLoaded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Play icon overlay — shown only when not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <IconPlayerPlay className="w-4.5 h-4.5 fill-white text-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Mute/unmute button (on hover) */}
      <button
        onClick={toggleMute}
        className="absolute bottom-3 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60"
      >
        {isMuted ? <IconVolumeOff className="w-3.5 h-3.5" /> : <IconVolume className="w-3.5 h-3.5" />}
      </button>

      {/* Download (on hover) */}
      <div className="absolute bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={e => { e.stopPropagation(); downloadMedia(video.url!, generateMediaFilename('mp4', video.prompt)) }}
          className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-all shadow-lg"
        >
          <IconDownload className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

const DISPLAY_BATCH = 20

function VideoJustifiedGrid({ videos, onExpand, onAspectCorrect }: {
  videos: VideoResult[]; onExpand: (v: VideoResult) => void
  onAspectCorrect?: (id: string, aspect: string) => void
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

  const completedVideos = useMemo(() => videos.filter(v => !v.error && !v.loading), [videos])
  const loadingVideos = useMemo(() => videos.filter(v => v.loading), [videos])
  // Only completed videos go into the justified grid
  const displayVideos = useMemo(
    () => completedVideos.slice(0, displayCount),
    [completedVideos, displayCount]
  )
  const hasMore = completedVideos.length > displayCount

  // Infinite scroll: re-run when hasMore changes so we observe the sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current; if (!sentinel) return
    const io = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) setDisplayCount(prev => prev + 10)
    }, { threshold: 0.1 })
    io.observe(sentinel)
    return () => io.disconnect()
  }, [hasMore])

  // Cap targetH so a 16:9 tile is never wider than half the container → always 2 per row.
  const maxTHFor169 = Math.max(120, Math.floor((containerW - VGAP) / 2 * 9 / 16))
  const targetH = Math.min(containerW < 480 ? 220 : containerW < 768 ? 280 : 340, maxTHFor169)
  const rows = useMemo(() => buildVideoRows(displayVideos, containerW, targetH), [displayVideos, containerW, targetH])
  // Loading tiles use same layout algorithm as completed tiles so sizes match exactly
  const loadingRows = useMemo(() => buildVideoRows(loadingVideos, containerW, targetH), [loadingVideos, containerW, targetH])

  return (
    <div ref={containerRef} className="w-full">
      {/* Loading placeholders — same justified grid layout as completed tiles */}
      {loadingRows.map((row) => (
        <div key={row.videos[0]!.id} style={{ display: 'flex', gap: VGAP, marginBottom: VGAP }}>
          {row.videos.map((video, ii) => (
            <div
              key={video.id}
              style={{ width: row.widths[ii]!, height: row.height, borderRadius: 8, position: 'relative', overflow: 'hidden', flexShrink: 0 }}
              className="border border-white/[0.06]"
            >
              <GenerationAnimation size="sm" label="Generating video" />
            </div>
          ))}
        </div>
      ))}

      {/* Completed videos — justified masonry grid */}
      {rows.map((row) => (
        <div key={row.videos[0]!.id} style={{ display: 'flex', gap: VGAP, marginBottom: VGAP }}>
          {row.videos.map((video, ii) => (
            <VideoGridTile
              key={video.id}
              video={video}
              width={row.widths[ii]!}
              height={row.height}
              onExpand={() => onExpand(video)}
              onAspectCorrect={onAspectCorrect}
            />
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

// ─── Video Info Modal ──────────────────────────────────────────────────────────

function VideoInfoModal({ video, isOpen, onClose, onUseAsMotionSource, onUseAsEditInput }: {
  video: VideoResult | null
  isOpen: boolean
  onClose: () => void
  onUseAsMotionSource?: (url: string) => void
  onUseAsEditInput?: (url: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {
        if (videoRef.current) { videoRef.current.muted = true; setIsMuted(true); videoRef.current.play().catch(() => {}) }
      })
      setIsPlaying(true)
    }
    if (!isOpen && videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [isOpen])

  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', fn)
    return () => document.removeEventListener('fullscreenchange', fn)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isOpen, onClose])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false) }
    else { videoRef.current.play().catch(() => {}); setIsPlaying(true) }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    const next = !isMuted; videoRef.current.muted = next; setIsMuted(next)
  }, [isMuted])

  const toggleFullscreen = useCallback(async () => {
    if (!videoRef.current) return
    if (!document.fullscreenElement) await videoRef.current.requestFullscreen().catch(() => {})
    else await document.exitFullscreen().catch(() => {})
  }, [])

  const copyPrompt = useCallback(() => {
    if (!video?.prompt) return
    navigator.clipboard.writeText(video.prompt).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [video?.prompt])

  if (!isOpen || !mounted || !video) return null

  return createPortal(
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/90" style={{ backdropFilter: 'blur(20px)' }} onClick={onClose} />
      <button onClick={onClose} className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.12] text-white/50 hover:text-white hover:bg-white/[0.15] transition-all">
        <IconX className="w-3.5 h-3.5" />
      </button>
      <div className="relative z-10 flex w-full max-w-5xl bg-[#0c0c0e] border border-white/[0.08] rounded-xl overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.9)]" style={{ height: '80vh', maxHeight: '800px', minHeight: '400px' }}>
        {/* Video pane */}
        <div className="flex-1 relative flex items-center justify-center bg-black min-h-[280px] group cursor-pointer" onClick={togglePlay}>
          {video.url ? (
            <>
              <video
                ref={videoRef}
                src={video.url}
                loop playsInline muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="max-w-full max-h-full object-contain select-none"
                style={{ maxHeight: 'calc(88vh - 4rem)' }}
              />
              {/* Hover controls */}
              <div className="absolute inset-0 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1.5">
                  <button onClick={togglePlay} className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                    {isPlaying ? <IconPlayerPause className="w-3.5 h-3.5 fill-white" /> : <IconPlayerPlay className="w-3.5 h-3.5 fill-white ml-0.5" />}
                  </button>
                  <button onClick={toggleMute} className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                    {isMuted ? <IconVolumeOff className="w-3.5 h-3.5" /> : <IconVolume className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button onClick={toggleFullscreen} className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                  {isFullscreen ? <IconMinimize className="w-3.5 h-3.5" /> : <IconMaximize className="w-3.5 h-3.5" />}
                </button>
              </div>
              {/* Pause overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <IconPlayerPlay className="w-7 h-7 fill-white text-white ml-1" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-white/30 text-sm">No video available</div>
          )}
        </div>
        {/* Info sidebar */}
        <div className="w-[280px] shrink-0 border-l border-white/[0.06] flex flex-col">
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            {/* Model (with variant merged) */}
            {video.model && (
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Model</p>
                <p className="text-xs text-white/80 font-medium">
                  {video.variant ? `${video.model.replace('- Replicate', '').trim()} — ${video.variant}` : video.model}
                </p>
              </div>
            )}
            {/* Aspect ratio */}
            {video.aspect && (
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Aspect Ratio</p>
                <p className="text-xs text-white/70">{video.aspect}</p>
              </div>
            )}
            {/* Resolution */}
            {video.dimensions && (
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Resolution</p>
                <p className="text-xs text-white/70">{video.dimensions}</p>
              </div>
            )}
            {/* Prompt — scrollable if long */}
            {video.prompt && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Prompt</p>
                  <button onClick={copyPrompt} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 transition-colors" title="Copy prompt">
                    {copied ? <IconCheck className="w-3 h-3 text-green-400" /> : <IconCopy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="max-h-[140px] overflow-y-auto pr-0.5">
                  <p className="text-xs text-white/70 leading-relaxed">{video.prompt}</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-5 border-t border-white/[0.06] space-y-2">
            {onUseAsMotionSource && video.url && (
              <button
                onClick={() => { onUseAsMotionSource(video.url!); onClose() }}
                className="flex items-center justify-center gap-2 w-full h-11 bg-white/[0.09] text-[#FFFF00] text-xs font-black uppercase tracking-wider rounded-lg hover:bg-white/[0.12] transition-all"
              >
                <IconTransfer className="w-3.5 h-3.5" /> Use as Motion Input
              </button>
            )}
            {onUseAsEditInput && video.url && (
              <button
                onClick={() => { onUseAsEditInput(video.url!); onClose() }}
                className="flex items-center justify-center gap-2 w-full h-11 bg-white/[0.09] text-[#FFFF00] text-xs font-black uppercase tracking-wider rounded-lg hover:bg-white/[0.12] transition-all"
              >
                <IconWand className="w-3.5 h-3.5" /> Edit Video
              </button>
            )}
            {video.url && (
              <button
                onClick={() => downloadMedia(video.url!, generateMediaFilename('mp4', video.prompt))}
                className="flex items-center justify-center gap-2 w-full h-11 bg-[#FFFF00] text-black text-xs font-black uppercase tracking-wider rounded-lg hover:bg-[#e6e600] transition-all"
              >
                <IconDownload className="w-3.5 h-3.5" /> Download
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Video duration helper ─────────────────────────────────────────────────────

function getVideoDuration(file: File): Promise<number> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const vid = document.createElement('video')
    vid.preload = 'metadata'
    vid.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(vid.duration) }
    vid.onerror = () => { URL.revokeObjectURL(url); resolve(0) }
    vid.src = url
  })
}

// ─── Main page ─────────────────────────────────────────────────────────────────

function VideoPageContent() {
  const { user, isLoading, isDemo } = useAuth()
  const { mutate } = useSWRConfig()
  const { total: creditBalance, isLoading: creditsLoading } = useCredits()

  // ── Persisted settings (localStorage) ───────────────────────────────────────
  const [activeTab, setActiveTab] = useState<VideoTab>(() => {
    if (typeof window === 'undefined') return 'generate'
    try { const d = JSON.parse(localStorage.getItem('sharpii_video_prefs') ?? '{}'); return (['generate', 'edit', 'motion'] as VideoTab[]).includes(d.activeTab) ? d.activeTab : 'generate' } catch { return 'generate' }
  })
  const [generateModel, setGenerateModel] = useState(() => {
    if (typeof window === 'undefined') return GENERATE_MODELS[0]?.id ?? ''
    try { const d = JSON.parse(localStorage.getItem('sharpii_video_prefs') ?? '{}'); return GENERATE_MODELS.find(m => m.id === d.generateModel) ? d.generateModel : (GENERATE_MODELS[0]?.id ?? '') } catch { return GENERATE_MODELS[0]?.id ?? '' }
  })
  const editModel = EDIT_MODELS[0]?.id ?? 'kling-effects'
  const [motionModel, setMotionModel] = useState(() => {
    if (typeof window === 'undefined') return MOTION_MODELS[0]?.id ?? 'kling-o3-reference-to-video'
    try { const d = JSON.parse(localStorage.getItem('sharpii_video_prefs') ?? '{}'); return MOTION_MODELS.find(m => m.id === d.motionModel) ? d.motionModel : (MOTION_MODELS[0]?.id ?? 'kling-o3-reference-to-video') } catch { return MOTION_MODELS[0]?.id ?? 'kling-o3-reference-to-video' }
  })
  const [miraiSubModel, setMiraiSubModel] = useState<'Action' | 'Portrait' | 'Inhuman'>('Action')
  const [miraiImagePreview, setMiraiImagePreview] = useState<string | null>(null)
  const [miraiImageCdnUrl, setMiraiImageCdnUrl] = useState<string | null>(null)
  const [miraiImageUploading, setMiraiImageUploading] = useState(false)
  const [smartRecreate, setSmartRecreate] = useState(false)
  const [portraitMode, setPortraitMode] = useState<'replace' | 'smart-replace'>('replace')
  const [miraiNegPrompt, setMiraiNegPrompt] = useState('')
  const [showMiraiAdvanced, setShowMiraiAdvanced] = useState(false)

  // Generate settings
  const [genAspect, setGenAspect] = useState(() => {
    if (typeof window === 'undefined') return '16:9'
    try { const d = JSON.parse(localStorage.getItem('sharpii_video_prefs') ?? '{}'); return typeof d.genAspect === 'string' ? d.genAspect : '16:9' } catch { return '16:9' }
  })
  const [genDuration, setGenDuration] = useState(() => {
    if (typeof window === 'undefined') return 5
    try { const d = JSON.parse(localStorage.getItem('sharpii_video_prefs') ?? '{}'); return typeof d.genDuration === 'number' ? d.genDuration : 5 } catch { return 5 }
  })
  const [genAudio, setGenAudio] = useState(false)
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p'>(() => {
    if (typeof window === 'undefined') return '720p'
    try { const d = JSON.parse(localStorage.getItem('sharpii_video_prefs') ?? '{}'); return d.videoQuality === '1080p' ? '1080p' : '720p' } catch { return '720p' }
  })
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
  // Sora Pro-specific
  const [hdMode, setHdMode] = useState(false)
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

  // Resolve motion model — for Mirai Motion group, pick by miraiSubModel
  const resolvedMotionModelId = useMemo(() => {
    const base = ALL_VIDEO_MODELS.find(m => m.id === motionModel)
    if (!base?.variantGroupId) return motionModel
    const variant = ALL_VIDEO_MODELS.find(m => m.variantGroupId === base.variantGroupId && m.variantTier === miraiSubModel)
    return variant?.id ?? motionModel
  }, [motionModel, miraiSubModel])

  const selectedModelId = activeTab === 'generate' ? resolvedGenerateModelId
    : activeTab === 'edit' ? editModel : resolvedMotionModelId
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
      // Restore completed videos + in-progress tasks that have a DB taskId
      // (loading tasks without a taskId were not yet submitted and should be discarded)
      return parsed.filter(v => (v.url && !v.loading) || (v.loading && v.taskId)).slice(0, 50)
    } catch { return [] }
  })
  const [modalVideo, setModalVideo] = useState<VideoResult | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ msg: string; type: 'error' | 'info' } | null>(null)
  const [activeTasks, setActiveTasks] = useState<Map<string, TaskEntry>>(new Map())
  const taskIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  // Persist completed + in-progress (with DB taskId) videos to localStorage
  useEffect(() => {
    const completed = videos.filter(v => v.url && !v.loading)
    const inProgress = videos.filter(v => v.loading && v.taskId)
    const toSave = [...inProgress, ...completed].slice(0, 50)
    try {
      if (toSave.length > 0) {
        localStorage.setItem('sharpii_videos', JSON.stringify(toSave))
      }
    } catch { /* ignore quota errors */ }
  }, [videos])

  // DB sync fallback: when localStorage has no completed videos, fetch from history API
  useEffect(() => {
    if (!user) return
    const hasCompleted = videos.some(v => v.url && !v.loading)
    if (hasCompleted) return
    type HistoryApiItem = { id: string; outputUrls: Array<{ type: string; url: string }>; status: string }
    fetch('/api/history/list?limit=50', { cache: 'no-store' })
      .then((r): Promise<{ items: HistoryApiItem[] } | null> => r.ok ? r.json() : Promise.resolve(null))
      .then((data) => {
        if (!data?.items) return
        const dbVideos: VideoResult[] = data.items
          .filter((item) => item.status === 'completed' && item.outputUrls?.some((o) => o.type === 'video'))
          .map((item) => {
            const videoOutput = item.outputUrls.find((o) => o.type === 'video')!
            return { id: item.id, url: videoOutput.url, aspect: '16:9', loading: false, taskId: item.id }
          })
        if (dbVideos.length > 0) {
          setVideos((prev) => {
            const existingIds = new Set(prev.map((v) => v.id))
            const newOnes = dbVideos.filter((v) => !existingIds.has(v.id))
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev
          })
        }
      })
      .catch(() => {})
  // Only run on mount after user is available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
    // Reset aspect ratio if current selection isn't supported by the new model
    const supportedAspects = newModel?.controls?.aspectRatios
    if (supportedAspects && supportedAspects.length > 0) {
      setGenAspect(prev => supportedAspects.includes(prev) ? prev : (supportedAspects[0] ?? '16:9'))
    }
  }, [resolvedGenerateModelId])

  useEffect(() => {
    return () => {
      taskIntervalsRef.current.forEach(clearInterval)
      pollIntervalsRef.current.forEach(clearInterval)
    }
  }, [])

  // Save key settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('sharpii_video_prefs', JSON.stringify({ v: 1, activeTab, generateModel, genAspect, genDuration, videoQuality, motionModel }))
    } catch { /* ignore quota errors */ }
  }, [activeTab, generateModel, genAspect, genDuration, videoQuality, motionModel])

  // On mount: read cross-page animate payload (from image/history pages)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sharpii_animate_input')
      if (!raw) return
      const data = JSON.parse(raw)
      localStorage.removeItem('sharpii_animate_input')
      if (!data.url || Date.now() - data.ts > 60000) return
      if (data.type === 'image') {
        // Load image as first frame in the Create tab
        setFirstFramePreview(data.url)
        setFirstFrameCdnUrl(data.url)
        setActiveTab('generate')
      } else if (data.type === 'video') {
        setMotionSourcePreview(data.url)
        setMotionSourceCdnUrl(data.url)
        setActiveTab('motion')
      } else if (data.type === 'edit-video') {
        setEditVideoPreview(data.url); setEditVideoCdnUrl(data.url)
        setActiveTab('edit')
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Resume polling for any in-progress tasks that were restored from localStorage on refresh
  useEffect(() => {
    videos
      .filter(v => v.loading && v.taskId && !pollIntervalsRef.current.has(v.id))
      .forEach(v => {
        setActiveTasks(prev => {
          const m = new Map(prev)
          m.set(v.id, { id: v.id, progress: 0, status: 'loading', message: 'Generating video…', createdAt: Date.now(), inputImage: '' })
          return m
        })
        const progressInterval = startSmartProgress(v.id, VIDEO_TASK_DURATION_SECS, setActiveTasks)
        taskIntervalsRef.current.set(v.id, progressInterval)
        startVideoPoll(v.id, v.taskId!)
      })
  // Only run on mount — startVideoPoll is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Start polling for a video task. Returns immediately; interval runs in background.
  const startVideoPoll = useCallback((localId: string, dbTaskId: string, startTime = Date.now()) => {
    const MAX_POLL_DURATION_MS = 45 * 60 * 1000
    const MAX_CONSECUTIVE_ERRORS = 5
    let consecutiveErrors = 0

    const stopPoll = (reason: 'success' | 'failed', errMsg?: string) => {
      const pi = pollIntervalsRef.current.get(localId)
      if (pi) { clearInterval(pi); pollIntervalsRef.current.delete(localId) }
      cleanupTask(localId)
      if (reason === 'success') {
        mutate(APP_DATA_KEY) // refresh credits
      } else {
        setVideos(prev => prev.filter(v => v.id !== localId))
        showToast(errMsg || 'Video generation failed')
        setActiveTasks(prev => { const m = new Map(prev); m.delete(localId); return m })
      }
    }

    const interval = setInterval(async () => {
      if (Date.now() - startTime > MAX_POLL_DURATION_MS) {
        stopPoll('failed', 'Generation timed out. Check History for status.')
        return
      }
      try {
        const pollRes = await fetch(`/api/generate-video/poll?taskId=${dbTaskId}`)

        // Non-OK responses (401, 500, etc.) count as errors — they must not reset
        // consecutiveErrors, otherwise an expired auth or server error loops forever.
        if (!pollRes.ok) {
          consecutiveErrors++
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            stopPoll('failed', 'Lost connection. Check History for status.')
          }
          return
        }

        const pollData = await pollRes.json()
        consecutiveErrors = 0

        if (pollData.status === 'success') {
          const videoUrl = Array.isArray(pollData.outputs) && pollData.outputs[0]?.url
            ? pollData.outputs[0].url
            : null

          // If the server said success but gave no URL, remove the tile and tell the
          // user to check History (the video IS there, just the URL handoff failed).
          if (!videoUrl) {
            stopPoll('failed', 'Video ready — open History to view it.')
            return
          }

          setVideos(prev => prev.map(v => v.id === localId ? { ...v, url: videoUrl, loading: false } : v))
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
          stopPoll('failed', 'Lost connection. Check History for status.')
        }
      }
    }, 8000)

    pollIntervalsRef.current.set(localId, interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutate, showToast])

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
      // Mirai Motion requires a character image
      if (selectedModelId.startsWith('mirai-motion') && !miraiImageCdnUrl) {
        showToast('Please upload a character image.')
        return
      }
    }
    // Sora requires an input image (images[] is a required API field)
    if (activeTab === 'generate' && imageRequired && !firstFrameCdnUrl) {
      showToast('Please upload a reference image — Sora requires one to generate video.')
      return
    }

    setIsSubmitting(true)
    const localId = `vtask-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    // Mirai Motion: show a brief demand notice
    if (resolvedMotionModelId.startsWith('mirai-motion') && activeTab === 'motion') {
      showToast('Mirai Motion models are currently in high demand. Please expect a slightly longer wait.', 'info', 4500)
    }

    const isMiraiTab = resolvedMotionModelId.startsWith('mirai-motion') && activeTab === 'motion'
    setVideos(prev => [{
      id: localId, url: null, aspect: currentAspect, loading: true,
      prompt: prompt.trim(),
      model: selectedModel?.label,
      variant: isMiraiTab ? miraiSubModel : undefined,
      dimensions: getVideoDimensions(currentAspect, videoQuality),
    }, ...prev])
    setActiveTasks(prev => {
      const m = new Map(prev)
      m.set(localId, { id: localId, progress: 0, status: 'loading', message: 'Generating video…', createdAt: Date.now(), inputImage: '' })
      return m
    })
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
        // Sora-specific
        if (isSoraModel && hasHd && hdMode) body.hd = true
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
        if (isMiraiModel) {
          // Mirai Motion: character image + optional prompt/negative prompt
          if (miraiImageCdnUrl) body.image_url = miraiImageCdnUrl
          if (isMiraiInhuman) {
            body.prompt = '' // Inhuman has no prompt node
          } else {
            if (smartRecreate) body.smart_recreate = true
            if (isMiraiPortrait && smartRecreate) body.portrait_mode = portraitMode
            if (miraiNegPrompt.trim()) body.negative_prompt = miraiNegPrompt.trim()
            // body.prompt already set from body initializer
          }
        } else {
          // Kling O3 Reference-to-Video
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
      }

      const res = await fetch('/api/generate-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (res.status === 402) { openPlansPopup(); cleanupTask(localId); removeLoadingCard(localId); return }
      if (!res.ok) throw new Error(data?.error || 'Generation failed')

      const dbTaskId: string = data.taskId
      setVideos(prev => prev.map(v => v.id === localId ? { ...v, taskId: dbTaskId } : v))
      startVideoPoll(localId, dbTaskId)
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
    || (activeTab === 'motion' && resolvedMotionModelId.startsWith('mirai-motion') && (!miraiImageCdnUrl || miraiImageUploading))

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
  const isSoraModel = selectedModelId.startsWith('sora')
  const hasSeed = isSeedanceModel || isVeoModel
  const hasHd = selectedModel?.controls?.hd === true
  const imageRequired = selectedModel?.controls?.requiresImage === true
  // Veo variant group: the picker model chosen by user (before variant resolution)
  const baseGenerateModel = ALL_VIDEO_MODELS.find(m => m.id === generateModel)
  const isVeoVariantGroup = !!baseGenerateModel?.variantGroupId
  const veoVariants = isVeoVariantGroup
    ? ALL_VIDEO_MODELS.filter(m => m.variantGroupId === baseGenerateModel!.variantGroupId)
    : []
  // Mirai Motion derived booleans
  const isMiraiModel = resolvedMotionModelId.startsWith('mirai-motion') && activeTab === 'motion'
  const isMiraiPortrait = resolvedMotionModelId === 'mirai-motion-portrait'
  const isMiraiInhuman = resolvedMotionModelId === 'mirai-motion-inhuman'
  const isMiraiMotionGroup = ALL_VIDEO_MODELS.find(m => m.id === motionModel)?.variantGroupId === 'mirai-motion-replicate'
  const miraiVariants = isMiraiMotionGroup
    ? ALL_VIDEO_MODELS.filter(m => m.variantGroupId === 'mirai-motion-replicate')
    : []

  const TABS: { id: VideoTab; label: string; Icon: React.ElementType }[] = [
    { id: 'generate', label: 'Create', Icon: IconSparkles },
    { id: 'edit', label: 'Edit', Icon: IconWand },
    { id: 'motion', label: 'Motion', Icon: IconTransfer },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-white font-sans">
      <div className="flex-1 pt-16 w-full grid grid-cols-1 lg:grid-cols-[420px_1fr] items-start">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <div className="flex flex-col border-r border-white/5 bg-[#0c0c0e] z-20 relative min-h-[calc(100vh-4rem)] lg:pb-28 order-1">

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
                <ModelPicker
                  groups={MODEL_GROUPS}
                  selected={generateModel}
                  onSelect={(id) => {
                    const m = ALL_VIDEO_MODELS.find(v => v.id === id)
                    if (m?.variantGroupId === 'mirai-motion-replicate') {
                      setMotionModel(id)
                      setActiveTab('motion')
                    } else {
                      setGenerateModel(id)
                    }
                  }}
                />
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
                        <SectionLabel>
                          {imageRequired ? 'Input Image' : 'First Frame'}
                          {' '}
                          <span className={cn("normal-case font-normal text-[9px] ml-1", imageRequired ? "text-amber-400" : "text-white/40")}>
                            {imageRequired ? '(required)' : '(optional)'}
                          </span>
                        </SectionLabel>
                        <ImageUploadBox
                          label="" preview={firstFramePreview} uploading={firstFrameUploading}
                          hint={imageRequired ? 'Upload source image' : 'First frame'}
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
                              <IconWand className="w-3.5 h-3.5 text-white/55" />
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
                          <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Camera Lock</span>
                          <div className="flex items-center justify-between px-2.5 py-2 bg-[#111111] border border-[#1e1e1e] rounded-lg">
                            <IconCamera className="w-3.5 h-3.5 text-white/55" />
                            <Toggle checked={cameraFixed} onChange={setCameraFixed} />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Sora: Aspect + HD toggle */}
                    {isSoraModel && (
                      <div className={cn("grid gap-2.5", hasHd ? "grid-cols-2" : "grid-cols-1")}>
                        <div>
                          <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">Aspect</span>
                          <AspectDropdown ratios={availableAspects} selected={genAspect} onSelect={setGenAspect} compact={true} />
                        </div>
                        {hasHd && (
                          <div>
                            <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-2">HD Mode</span>
                            <div className="flex items-center justify-between px-2.5 py-2 bg-[#111111] border border-[#1e1e1e] rounded-lg">
                              <IconSparkles className="w-3.5 h-3.5 text-white/55" />
                              <Toggle checked={hdMode} onChange={setHdMode} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Others: full-width aspect dropdown */}
                    {!isVeoModel && !isSeedanceModel && !isSoraModel && (
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
              {/* Motion model picker */}
              <div className="px-5 pt-5 pb-5 border-b border-white/[0.05]">
                <SectionLabel>Model</SectionLabel>
                <ModelPicker groups={MOTION_MODEL_GROUPS} selected={motionModel} onSelect={setMotionModel} />
                {/* Mirai sub-model selector */}
                {isMiraiMotionGroup && miraiVariants.length > 0 && (
                  <div className="grid mt-3" style={{ gridTemplateColumns: `repeat(${miraiVariants.length}, 1fr)`, gap: '6px' }}>
                    {miraiVariants.map(v => (
                      <button
                        key={v.variantTier}
                        title={v.description}
                        onClick={() => setMiraiSubModel(v.variantTier as 'Action' | 'Portrait' | 'Inhuman')}
                        className={cn(
                          "w-full py-2.5 text-[11px] font-black rounded-lg transition-colors tracking-wide",
                          miraiSubModel === v.variantTier
                            ? "bg-white/[0.09] text-[#FFFF00] border border-[#FFFF00]/20"
                            : "bg-white/[0.04] text-white/55 border border-transparent hover:text-white hover:bg-white/[0.07]"
                        )}
                      >
                        {v.variantTier}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Video + Character Image uploads */}
              <div className="px-5 py-5 border-b border-white/5">
                {isMiraiModel ? (
                  /* Mirai: 2-column grid — video left, character image right */
                  <div className="grid grid-cols-2 gap-3">
                    <VideoUploadBox
                      label="Motion Video"
                      hint="MP4/MOV · Max 10s"
                      tall
                      preview={motionSourcePreview}
                      uploading={motionSourceUploading}
                      onFile={async (f) => {
                        const dur = await getVideoDuration(f)
                        if (dur > 10) {
                          showToast('Video must be 10 seconds or shorter for Mirai Motion. Please trim your clip and try again.', 'error')
                          return
                        }
                        uploadVideo(f, setMotionSourcePreview, setMotionSourceCdnUrl, setMotionSourceUploading)
                      }}
                      onClear={() => { setMotionSourcePreview(null); setMotionSourceCdnUrl(null) }}
                    />
                    <ImageUploadBox
                      label="Character"
                      required
                      hint="Subject to apply motion to"
                      tall
                      preview={miraiImagePreview}
                      uploading={miraiImageUploading}
                      onFile={(f) => uploadImage(f, setMiraiImagePreview, setMiraiImageCdnUrl, setMiraiImageUploading)}
                      onClear={() => { setMiraiImagePreview(null); setMiraiImageCdnUrl(null) }}
                    />
                  </div>
                ) : (
                  /* Kling: single full-width video upload */
                  <VideoUploadBox
                    label="Reference Video"
                    hint="MP4 / MOV · ≥3s · Required"
                    preview={motionSourcePreview}
                    uploading={motionSourceUploading}
                    onFile={(f) => uploadVideo(f, setMotionSourcePreview, setMotionSourceCdnUrl, setMotionSourceUploading)}
                    onClear={() => { setMotionSourcePreview(null); setMotionSourceCdnUrl(null) }}
                  />
                )}
              </div>

              {/* Mirai Action/Portrait: Smart Recreate + Portrait mode */}
              {isMiraiModel && !isMiraiInhuman && (
                <div className="px-5 py-4 border-b border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">Smart Recreate</span>
                      <p className="text-[10px] text-white/50 mt-0.5">Automatically replace the background</p>
                    </div>
                    <Toggle checked={smartRecreate} onChange={setSmartRecreate} />
                  </div>
                  {/* Portrait: sub-mode selector when Smart Recreate is ON */}
                  {isMiraiPortrait && smartRecreate && (
                    <div className="mt-3 flex gap-1.5">
                      {(['replace', 'smart-replace'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setPortraitMode(mode)}
                          className={cn(
                            "flex-1 py-2 text-[11px] font-black rounded-md transition-colors",
                            portraitMode === mode
                              ? "bg-white/[0.09] text-[#FFFF00]"
                              : "bg-white/[0.04] text-white/55 hover:text-white hover:bg-white/[0.07]"
                          )}
                        >
                          {mode === 'replace' ? 'Replace Character' : 'Smart Replace'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mirai Action/Portrait: Prompt + Negative Prompt */}
              {isMiraiModel && !isMiraiInhuman && (
                <div className="px-5 py-4 border-b border-white/[0.05]">
                  <SectionLabel>
                    Prompt
                    <span className="normal-case font-normal text-white/40 text-[9px] ml-1">(optional)</span>
                  </SectionLabel>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Describe the character style or motion you want…"
                    rows={3}
                    className="w-full bg-[#111111] border border-[#1e1e1e] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#2e2e2e] transition-colors resize-none leading-relaxed"
                  />
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <button
                      onClick={() => setShowMiraiAdvanced(p => !p)}
                      className="flex items-center gap-2 text-[10px] font-black text-white/55 uppercase tracking-wider hover:text-white/80 transition-colors w-full"
                    >
                      <IconMinus className="w-3.5 h-3.5" />
                      <span>Negative Prompt</span>
                      <IconChevronDown className={cn("w-3 h-3 ml-auto transition-transform", showMiraiAdvanced && "rotate-180")} />
                    </button>
                    {showMiraiAdvanced && (
                      <textarea
                        value={miraiNegPrompt}
                        onChange={e => setMiraiNegPrompt(e.target.value)}
                        placeholder="Describe what to avoid…"
                        rows={2}
                        className="mt-3 w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#2e2e2e] transition-colors resize-none"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Kling: Reference images + Settings + Multi-Shot */}
              {!isMiraiModel && (
                <>
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
            </>
          )}

          {/* ── PROMPT (edit tab + Kling motion — Mirai motion has its own prompt block above) ─── */}
          {activeTab !== 'generate' && !(activeTab === 'motion' && isMiraiModel) && (
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
                    <span>Generate Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <div className="relative flex flex-col min-h-0 px-4 pt-2 pb-8 order-2 lg:order-2 lg:overflow-y-auto lg:h-[calc(100vh-4rem)] custom-scrollbar">

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
                    ? 'Upload a video, describe the effect you want, then click Generate Video.'
                    : 'Upload a motion source and target subject, then click Generate Video.'}
                </p>
              </div>
            </div>
          )}

          {/* Video grid — justified masonry */}
          {videos.length > 0 && (
            <VideoJustifiedGrid
              videos={videos}
              onExpand={(video) => { setModalVideo(video); setIsModalOpen(true) }}
              onAspectCorrect={(id, aspect) => setVideos(prev => prev.map(v => v.id === id ? { ...v, aspect } : v))}
            />
          )}

          <div className="mt-8 flex justify-end text-[9px] text-[#1e1e1e] font-mono uppercase tracking-widest">
            Sharpii Video Engine v1.0
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[10003] pointer-events-none max-w-sm">
          <div className={cn(
            "px-5 py-3 rounded-xl text-sm font-medium shadow-2xl border backdrop-blur-xl",
            toastMsg.type === 'error'
              ? "bg-[#1a0505] border-red-900/40 text-red-300"
              : "bg-[#0c1014] border-teal-900/40 text-teal-200/90"
          )}>
            {toastMsg.msg}
          </div>
        </div>
      )}

      {/* Video Info Modal */}
      <VideoInfoModal
        video={modalVideo}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setModalVideo(null) }}
        onUseAsMotionSource={(url) => {
          setMotionSourcePreview(url)
          setMotionSourceCdnUrl(url)
          setActiveTab('motion')
        }}
        onUseAsEditInput={(url) => {
          setEditVideoPreview(url)
          setEditVideoCdnUrl(url)
          setActiveTab('edit')
        }}
      />

      {/* Done/error popup only — spinner hidden during generation */}
      {(() => {
        const doneTasks = Array.from(activeTasks.values())
          .filter(t => t.status === 'success' || t.status === 'error')
          .map(t => ({ id: t.id, progress: t.progress, status: t.status, message: t.message }))
        return (
          <MyLoadingProcessIndicator
            isVisible={doneTasks.length > 0}
            tasks={doneTasks}
            onCloseTask={id => setActiveTasks(prev => { const m = new Map(prev); m.delete(id); return m })}
          />
        )
      })()}
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
