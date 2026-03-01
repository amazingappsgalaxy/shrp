"use client"
import React, { useState, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { GenerationAnimation } from "@/components/ui/GenerationAnimation"
import { CreditIcon } from "@/components/ui/CreditIcon"
import {
  IconArrowUp, IconSparkles,
  IconDownload, IconRefresh, IconX, IconPlus, IconChevronDown, IconCheck, IconBug,
} from "@tabler/icons-react"
import { getImageModels } from "@/services/models"
import { uploadImageToCdn } from "@/lib/upload-image"
import { APP_DATA_KEY } from "@/lib/hooks/use-app-data"
import { useSWRConfig } from "swr"
import MyLoadingProcessIndicator from "@/components/ui/MyLoadingProcessIndicator"

// ─── Types ────────────────────────────────────────────────────────────────────
type Count      = 1 | 2 | 4
type Aspect     = "1:1" | "4:3" | "3:4" | "16:9" | "9:16"
type Resolution = "1K" | "2K" | "4K"
type PickerType = "ratio" | "style" | "model" | "resolution" | null

interface GridImage {
  id: string
  url: string
  aspect: Aspect
  loading: boolean
  prompt?: string
  model?: string
  taskId?: string
}

interface JRow { images: GridImage[]; height: number; widths: number[] }

interface DebugEntry {
  id: string
  label: string
  requests: unknown[]
  responses: unknown[]
}

// ─── Model data (from registry) ───────────────────────────────────────────────
const IMAGE_MODELS = getImageModels()
const DEFAULT_MODEL = IMAGE_MODELS[0]!

// De-duplicated list for the model picker — show one entry per quality group
const PICKER_MODELS = IMAGE_MODELS.reduce<typeof IMAGE_MODELS>((acc, m) => {
  if (m.qualityGroupId) {
    if (!acc.find(a => a.qualityGroupId === m.qualityGroupId)) acc.push(m)
  } else {
    acc.push(m)
  }
  return acc
}, [])

// ─── Static data ──────────────────────────────────────────────────────────────
const STYLES = ["None", "Cinematic", "Anime", "Neon", "Minimal", "Editorial"]
const STYLE_DESC: Record<string, string> = {
  "None":      "No style applied",
  "Cinematic": "Film grain, dramatic lighting",
  "Anime":     "Japanese animation",
  "Neon":      "Cyberpunk neon vibes",
  "Minimal":   "Clean & simple",
  "Editorial": "Fashion magazine",
}
const STYLE_SUFFIX: Record<string, string> = {
  "None":      "",
  "Cinematic": ", cinematic lighting, film grain, anamorphic lens",
  "Anime":     ", anime style, Japanese animation",
  "Neon":      ", cyberpunk neon lighting, dark background",
  "Minimal":   ", minimal clean design, white background",
  "Editorial": ", fashion editorial, magazine quality",
}

const ASPECTS: Aspect[] = ["1:1", "4:3", "3:4", "16:9", "9:16"]
const ASPECT_LABEL: Record<Aspect, string> = {
  "1:1": "Square", "4:3": "Landscape", "3:4": "Portrait",
  "16:9": "Wide", "9:16": "Story",
}
const ASPECT_NUM: Record<Aspect, number> = {
  "1:1": 1, "4:3": 4/3, "3:4": 3/4, "16:9": 16/9, "9:16": 9/16,
}

const GAP = 9

// ─── Design tokens ────────────────────────────────────────────────────────────
const PILL_TRACK = "flex bg-[rgb(255_255_255_/_0.04)] border border-[rgb(255_255_255_/_0.04)] p-0.5 rounded-lg"
const PILL_BASE  = "px-2 py-1.5 text-[10.5px] font-black uppercase tracking-wide rounded-md transition-all whitespace-nowrap"
const PILL_ON    = "bg-white/[0.09] text-[#FFFF00] shadow-sm"
const PILL_OFF   = "text-gray-500 hover:text-white"

const TRIGGER_BASE = "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all shrink-0 whitespace-nowrap select-none"
const TRIGGER_OFF  = "border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:bg-white/[0.03]"
const TRIGGER_ON   = "bg-white/[0.05] border-white/20 text-white"

// ─── Layout algorithm ─────────────────────────────────────────────────────────
function buildRows(images: GridImage[], containerW: number, targetH: number): JRow[] {
  if (containerW === 0 || images.length === 0) return []
  const rows: JRow[] = []
  let rowImgs: GridImage[] = []
  let rowNatW = 0

  const flush = (last: boolean) => {
    if (rowImgs.length === 0) return
    const scale = last ? 1 : (containerW - GAP * (rowImgs.length - 1)) /
      rowImgs.reduce((s, img) => s + targetH * ASPECT_NUM[img.aspect], 0)
    const height = Math.round(targetH * scale)
    const widths = rowImgs.map(img => Math.round(targetH * ASPECT_NUM[img.aspect] * scale))
    if (!last) {
      const drift = containerW - widths.reduce((s, w) => s + w, 0) - GAP * (widths.length - 1)
      if (Math.abs(drift) <= widths.length) widths[widths.length - 1]! += drift
    }
    rows.push({ images: rowImgs, height, widths })
    rowImgs = []
    rowNatW = 0
  }

  for (const img of images) {
    const natW = targetH * ASPECT_NUM[img.aspect]
    if (rowImgs.length > 0 && rowNatW + GAP + natW > containerW * 1.05) flush(false)
    rowImgs.push(img)
    rowNatW += (rowImgs.length > 1 ? GAP : 0) + natW
  }
  flush(true)
  return rows
}

// ─── Aspect shape visual ──────────────────────────────────────────────────────
function AspectShape({ aspect, active }: { aspect: Aspect; active: boolean }) {
  const ratio = ASPECT_NUM[aspect]
  const BOX = 28
  const w = ratio >= 1 ? BOX : Math.round(BOX * ratio)
  const h = ratio >= 1 ? Math.round(BOX / ratio) : BOX
  return (
    <div style={{ width: BOX + 8, height: BOX + 8 }} className="flex items-center justify-center">
      <div
        style={{ width: w, height: h }}
        className={cn("rounded-[2px] transition-all", active ? "bg-[#FFFF00]" : "bg-white/[0.18] border border-white/25")}
      />
    </div>
  )
}

// ─── Image modal ──────────────────────────────────────────────────────────────
function ImageModal({ img, onClose }: { img: GridImage | null; onClose: () => void }) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    if (!img) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [img, onClose])

  // Detect actual pixel dimensions by loading the image
  useEffect(() => {
    if (!img?.url) { setDims(null); return }
    const image = new window.Image()
    image.onload = () => setDims({ w: image.naturalWidth, h: image.naturalHeight })
    image.onerror = () => setDims(null)
    image.src = img.url
  }, [img?.url])

  if (!img || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/90" style={{ backdropFilter: "blur(20px)" }} onClick={onClose} />
      <div
        className="relative z-10 flex w-full max-w-5xl bg-[#0c0c0e] border border-white/[0.08] rounded-xl overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.9)]"
        style={{ maxHeight: "88vh" }}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.1] transition-all">
          <IconX size={14} />
        </button>

        <div className="flex-1 flex items-center justify-center bg-black/40 p-8 min-h-[360px]">
          <img src={img.url} alt="" className="max-w-full max-h-full object-contain rounded-lg"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }} />
        </div>

        <div className="w-[260px] shrink-0 border-l border-white/[0.06] flex flex-col">
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {img.prompt && (
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Prompt</p>
                <p className="text-xs text-white/70 leading-relaxed">{img.prompt}</p>
              </div>
            )}
            {img.model && (
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Model</p>
                <p className="text-xs text-white/70">{img.model}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Aspect Ratio</p>
              <p className="text-sm text-white font-semibold">{img.aspect}</p>
            </div>
            {dims && (
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Dimensions</p>
                <p className="text-sm text-white font-semibold">{dims.w} × {dims.h}</p>
              </div>
            )}
          </div>
          <div className="p-5 border-t border-white/[0.06]">
            <a href={img.url} download target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 bg-[#FFFF00] text-black text-xs font-black uppercase tracking-wider rounded-lg hover:bg-[#e6e600] transition-all">
              <IconDownload size={13} /> Download
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Justified grid ───────────────────────────────────────────────────────────
function JustifiedGrid({
  images, generatedIds, onOpen, onVary, selectedIds, onToggleSelect, showSelectButton, isBusy,
}: {
  images: GridImage[]
  generatedIds: Set<string>
  onOpen: (img: GridImage) => void
  onVary: (img: GridImage) => void
  selectedIds: Set<string>
  onToggleSelect: (img: GridImage) => void
  showSelectButton: boolean
  isBusy: boolean
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

  const targetH = containerW < 480 ? 120 : containerW < 768 ? 200 : 360
  const rows = useMemo(() => buildRows(images, containerW, targetH), [images, containerW, targetH])

  return (
    <div ref={containerRef} className="w-full">
      {rows.map((row) => (
        <div key={row.images[0]!.id} style={{ display: "flex", gap: GAP, marginBottom: GAP, height: row.height }}>
          {row.images.map((img, ii) => {
            const isSelected = selectedIds.has(img.id)
            const isGenerated = generatedIds.has(img.id)
            return (
              <div key={img.id} className="group relative"
                style={{
                  width: row.widths[ii], height: row.height, flexShrink: 0,
                  overflow: "hidden", borderRadius: 8,
                  boxShadow: isSelected ? "inset 0 0 0 2.5px #FFFF00" : "none",
                  cursor: img.loading ? "default" : "pointer",
                  animation: isGenerated ? "fadeIn 0.5s ease-out both" : undefined,
                }}
                onClick={() => !img.loading && onOpen(img)}
              >
                {img.loading ? <GenerationAnimation /> : (
                  <img src={img.url} alt="" className="block w-full h-full object-cover select-none"
                    style={{ animation: isGenerated ? "fadeIn 0.5s ease-out both" : undefined }} />
                )}

                {!img.loading && (
                  <>
                    {showSelectButton && (
                      <button
                        onClick={e => { e.stopPropagation(); onToggleSelect(img) }}
                        title={isSelected ? "Remove from references" : "Use as reference"}
                        className={cn(
                          "absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center z-10",
                          "text-[10px] font-black border transition-all",
                          isSelected
                            ? "bg-[#FFFF00] border-[#FFFF00] text-black opacity-100"
                            : "bg-black/50 border-white/25 text-transparent opacity-0 group-hover:opacity-100",
                        )}
                        style={{ backdropFilter: isSelected ? "none" : "blur(6px)" }}
                      >
                        {isSelected ? "✓" : ""}
                      </button>
                    )}

                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                      <button
                        onClick={e => { e.stopPropagation(); if (!isBusy) onVary(img) }}
                        title={isBusy ? "Generating…" : "Vary"}
                        className={cn(
                          "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                          isBusy ? "text-white/20 cursor-not-allowed" : "text-white/70 hover:text-white",
                        )}
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <IconRefresh size={11} />
                      </button>
                      <a href={img.url} download target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()} title="Download"
                        className="w-7 h-7 rounded-md flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <IconDownload size={11} />
                      </a>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ImagePage() {
  const { mutate } = useSWRConfig()

  const [count,        setCount]        = useState<Count>(1)
  const [aspect,       setAspect]       = useState<Aspect>("1:1")
  const [resolution,   setResolution]   = useState<Resolution>("1K")
  const [style,        setStyle]        = useState("None")
  const [modelId,      setModelId]      = useState(DEFAULT_MODEL.id)
  const [prompt,       setPrompt]       = useState("")
  const [images,       setImages]       = useState<GridImage[]>([])
  const [modalImg,     setModalImg]     = useState<GridImage | null>(null)
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())
  const [uploadedRefs, setUploadedRefs] = useState<{ id: string; url: string; cdnUrl?: string }[]>([])
  const [openPicker,   setOpenPicker]   = useState<PickerType>(null)
  // Track which image IDs were user-generated (vs preloaded) for animation
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set())
  // Per-task done/error notifications (no loading entries — only added on completion)
  const [genTasks,     setGenTasks]     = useState<{ id: string; status: 'success' | 'error'; progress: number; message?: string }[]>([])
  // Tracks how many generations are currently in-flight (for border colour etc.)
  const [inFlightCount, setInFlightCount] = useState(0)
  // Debug: stores raw request/response from each generation task
  const [debugEntries,  setDebugEntries]  = useState<DebugEntry[]>([])
  const [debugOpenId,   setDebugOpenId]   = useState<string | null>(null)

  const taRef     = useRef<HTMLTextAreaElement>(null)
  const endRef    = useRef<HTMLDivElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const dockRef   = useRef<HTMLDivElement>(null)

  const activeModel = IMAGE_MODELS.find(m => m.id === modelId) ?? DEFAULT_MODEL
  const modelSupportsRef  = !!activeModel.controls.referenceImage
  const modelStrictRef    = !!activeModel.controls.strictReference

  // Quality group variants (nano-banana-2 family: separate model IDs per resolution)
  const qualityVariants = activeModel.qualityGroupId
    ? IMAGE_MODELS.filter(m => m.qualityGroupId === activeModel.qualityGroupId)
    : []

  // Unified resolution options: quality-group models OR models with supportedImageSizes (NB Pro)
  const resolutionOptions: Resolution[] =
    qualityVariants.length > 1
      ? (qualityVariants.map(v => v.qualityTier).filter(Boolean) as Resolution[])
      : (activeModel.supportedImageSizes ?? [])
  const showResolution = resolutionOptions.length > 0

  // For quality-group models the "active resolution" is read from the model's qualityTier;
  // for imageSize models it comes from the resolution state.
  const currentResolution: Resolution =
    (activeModel.qualityTier as Resolution | undefined) ?? resolution

  // True while any generation is in-flight
  const anyGenerating = inFlightCount > 0

  // When switching models: reset aspect/resolution if unsupported; clear refs if new model doesn't support them
  useEffect(() => {
    const supported = activeModel.controls.aspectRatios
    if (supported && !supported.includes(aspect)) {
      setAspect((supported[0] as Aspect) ?? "1:1")
    }
    if (!activeModel.controls.referenceImage) {
      setSelectedIds(new Set())
      setUploadedRefs([])
    }
    // Reset imageSize resolution when switching to a model that doesn't support it
    if (!activeModel.supportedImageSizes?.length) {
      setResolution("1K")
    }
  }, [modelId])

  // Close picker on outside click
  useEffect(() => {
    if (!openPicker) return
    const fn = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) setOpenPicker(null)
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [openPicker])

  // Load saved images from history on mount
  useEffect(() => {
    interface HistoryItem {
      id: string
      outputUrls: Array<{ type: string; url: string } | string>
      status: string
      createdAt: string
      modelName?: string
      settings?: { prompt?: string; aspect_ratio?: string }
    }
    fetch('/api/history/list?page_name=app%2Fimage&limit=200&order=asc')
      .then(r => r.json() as Promise<{ items: HistoryItem[] }>)
      .then(data => {
        if (!data.items?.length) return
        const loaded: GridImage[] = []
        for (const item of data.items) {
          if (item.status !== 'completed') continue
          const rawAspect = item.settings?.aspect_ratio
          const aspect: Aspect = (ASPECTS as readonly string[]).includes(rawAspect ?? '')
            ? rawAspect as Aspect
            : '1:1'
          for (const out of item.outputUrls) {
            const url = typeof out === 'string' ? out : out.url
            if (!url) continue
            loaded.push({
              id: `hist-${item.id}-${url.slice(-12)}`,
              url,
              aspect,
              loading: false,
              prompt: item.settings?.prompt,
              model: item.modelName ?? undefined,
            })
          }
        }
        setImages(loaded)
      })
      .catch(() => {}) // silently ignore — user can still generate
  }, [])

  // Textarea auto-resize
  useEffect(() => {
    const el = taRef.current; if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }, [prompt])

  function scroll() {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80)
  }

  function toggleSelect(img: GridImage) {
    if (!modelSupportsRef) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(img.id) ? next.delete(img.id) : next.add(img.id)
      return next
    })
  }

  function removeRef(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    setUploadedRefs(prev => prev.filter(r => r.id !== id))
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach(async (file) => {
      const localUrl = URL.createObjectURL(file)
      const refId = `up-${Date.now()}-${file.name}`
      // Show local preview immediately, upload to CDN in background
      setUploadedRefs(prev => [...prev, { id: refId, url: localUrl }])
      try {
        // Same pattern as editor/upscaler: dataUri → /api/upload (authed, real userId)
        const cdnUrl = await uploadImageToCdn(file)
        setUploadedRefs(prev => prev.map(r => r.id === refId ? { ...r, cdnUrl } : r))
      } catch (err) {
        // CDN upload failed — remove the ref and inform user
        setUploadedRefs(prev => prev.filter(r => r.id !== refId))
        toast.error("Failed to upload reference image. Please try again.")
      }
    })
    e.target.value = ""
  }

  // Each call is fully independent — no busy lock, multiple can run concurrently
  function handleGenerate() {
    if (!prompt.trim()) return
    setOpenPicker(null)

    const ts          = Date.now()
    const indicatorId = `gen-${ts}`
    const placeholders: GridImage[] = Array.from({ length: count }, (_, i) => ({
      id: `ld-${ts}-${i}`, url: "", aspect, loading: true,
    }))

    setImages(prev => [...prev, ...placeholders])
    setInFlightCount(c => c + 1)
    scroll()

    const label = count > 1 ? `${count} images ready` : "Image ready"
    const referenceUrls: string[] = [
      ...uploadedRefs.filter(r => r.cdnUrl).map(r => r.cdnUrl!),
      ...images.filter(img => selectedIds.has(img.id) && !img.loading).map(img => img.url),
    ]
    const fullPrompt = prompt.trim() + (STYLE_SUFFIX[style] ?? "")
    const supportsImageSize = !!activeModel.supportedImageSizes?.length

    fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        prompt: fullPrompt,
        aspect_ratio: aspect,
        count,
        ...(supportsImageSize ? { imageSize: resolution } : {}),
        ...(referenceUrls.length > 0 && modelSupportsRef ? { referenceUrls } : {}),
      }),
    })
      .then(r => r.json() as Promise<{ success?: boolean; outputUrls?: string[]; taskId?: string; error?: string; _debug?: Array<{ request?: unknown; response?: unknown }> }>)
      .then(data => {
        if (!data.outputUrls?.length) throw new Error(data.error ?? "Generation failed")

        if (data._debug?.length) {
          setDebugEntries(prev => [...prev, {
            id: indicatorId,
            label,
            requests: data._debug!.map(d => d.request),
            responses: data._debug!.map(d => d.response),
          }])
        }

        const newIds = new Set<string>()
        const resolveTs = Date.now()
        setImages(prev => {
          const updated = [...prev]
          let urlIdx = 0
          for (let i = 0; i < updated.length; i++) {
            const pi = placeholders.findIndex(p => p.id === updated[i]!.id)
            if (pi !== -1) {
              const url = data.outputUrls![urlIdx]
              if (url) {
                const newId = `gen-${resolveTs}-${pi}`
                newIds.add(newId)
                updated[i] = { id: newId, url, aspect, loading: false, prompt: fullPrompt, model: activeModel.label, taskId: data.taskId }
                urlIdx++
              } else {
                updated.splice(i, 1); i--
              }
            }
          }
          return updated
        })
        setGeneratedIds(prev => new Set([...prev, ...newIds]))
        mutate(APP_DATA_KEY)
        // Push done notification — auto-dismiss after 4 s
        setGenTasks(prev => [...prev, { id: indicatorId, status: 'success', progress: 100, message: label }])
        setTimeout(() => setGenTasks(prev => prev.filter(t => t.id !== indicatorId)), 4000)
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : "Generation failed"
        setImages(prev => prev.filter(img => !placeholders.some(p => p.id === img.id)))
        setGenTasks(prev => [...prev, { id: indicatorId, status: 'error', progress: 0, message: msg }])
        setTimeout(() => setGenTasks(prev => prev.filter(t => t.id !== indicatorId)), 6000)
      })
      .finally(() => setInFlightCount(c => c - 1))
  }

  function handleVary(img: GridImage) {
    const ts          = Date.now()
    const indicatorId = `vary-${ts}`
    const placeholder: GridImage = { id: `ld-vary-${ts}`, url: "", aspect: img.aspect, loading: true }
    setImages(prev => [...prev, placeholder])
    setInFlightCount(c => c + 1)
    scroll()

    const fullPrompt = (img.prompt ?? prompt.trim()) + (STYLE_SUFFIX[style] ?? "")

    fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelId, prompt: fullPrompt, aspect_ratio: img.aspect, count: 1 }),
    })
      .then(r => r.json() as Promise<{ outputUrls?: string[]; taskId?: string; error?: string }>)
      .then(data => {
        const url = data.outputUrls?.[0]
        if (!url) throw new Error(data.error ?? "No output")
        const newId = `gen-vary-${Date.now()}`
        setGeneratedIds(prev => new Set([...prev, newId]))
        setImages(prev => prev.map(i =>
          i.id === placeholder.id
            ? { id: newId, url, aspect: img.aspect, loading: false, prompt: fullPrompt, model: activeModel.label, taskId: data.taskId }
            : i
        ))
        mutate(APP_DATA_KEY)
        setGenTasks(prev => [...prev, { id: indicatorId, status: 'success', progress: 100, message: 'Variation ready' }])
        setTimeout(() => setGenTasks(prev => prev.filter(t => t.id !== indicatorId)), 4000)
      })
      .catch(err => {
        setImages(prev => prev.filter(i => i.id !== placeholder.id))
        const msg = err instanceof Error ? err.message : "Vary failed"
        setGenTasks(prev => [...prev, { id: indicatorId, status: 'error', progress: 0, message: msg }])
        setTimeout(() => setGenTasks(prev => prev.filter(t => t.id !== indicatorId)), 6000)
      })
      .finally(() => setInFlightCount(c => c - 1))
  }

  const selectedImgObjs = images.filter(img => selectedIds.has(img.id) && !img.loading)
  const allRefs = [
    ...uploadedRefs.map(r => ({ id: r.id, url: r.url, isUpload: true })),
    ...selectedImgObjs.map(img => ({ id: img.id, url: img.url, isUpload: false })),
  ]
  const hasRefs = allRefs.length > 0

  // Lock aspect ratio only for strict-reference models that use quality-group variants (nano-banana-2 family).
  // Models with supportedImageSizes (NB Pro via Gemini API) always let the user control aspect ratio —
  // the Gemini imageConfig.aspectRatio param is what drives the output, not the reference image dimensions.
  const aspectLocked = modelStrictRef && hasRefs && !activeModel.supportedImageSizes?.length

  const creditsPerImage = activeModel.credits
  const totalCredits    = creditsPerImage * count

  function handleResolutionChange(r: Resolution) {
    if (qualityVariants.length > 1) {
      // nano-banana family: resolution maps to distinct model IDs
      const variant = qualityVariants.find(m => m.qualityTier === r)
      if (variant) setModelId(variant.id)
    } else {
      // NB Pro (supportedImageSizes): same model, imageSize param
      setResolution(r)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-white overflow-hidden">
      <style>{`
        @keyframes fadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pickerIn { from { opacity: 0; transform: translateY(6px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>

      {/* ── Scroll area ── */}
      <div className="flex-1 overflow-y-auto pb-[200px]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-[88px]">


          {images.length === 0 && !anyGenerating && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
              <IconSparkles size={32} className="text-gray-700" />
              <p className="text-sm text-gray-600">Describe what you want to create</p>
            </div>
          )}

          <JustifiedGrid
            images={images}
            generatedIds={generatedIds}
            onOpen={setModalImg}
            onVary={handleVary}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            showSelectButton={modelSupportsRef}
            isBusy={anyGenerating}
          />
          <div ref={endRef} />
        </div>
      </div>

      <ImageModal img={modalImg} onClose={() => setModalImg(null)} />

      {/* Generation task indicator — plays success sound, auto-dismisses */}
      <MyLoadingProcessIndicator
        isVisible={genTasks.length > 0}
        tasks={genTasks}
        onCloseTask={id => setGenTasks(prev => prev.filter(t => t.id !== id))}
      />

      {/* ── Debug panel (dev only) ── */}
      {debugEntries.length > 0 && typeof document !== "undefined" && createPortal(
        <div className="fixed bottom-6 left-6 z-[9998] flex flex-col gap-2 max-w-[420px]"
          style={{ pointerEvents: "none" }}>
          {debugEntries.map(entry => (
            <div key={entry.id} className="rounded-lg border border-white/10 bg-[#0c0c0e]/95 overflow-hidden"
              style={{ backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.8)", pointerEvents: "all" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <IconBug size={11} className="text-[#FFFF00]/70" />
                  <span className="text-[10px] font-black text-[#FFFF00]/70 uppercase tracking-widest">Debug</span>
                  <span className="text-[9px] text-gray-600 truncate max-w-[180px]">{entry.label}</span>
                </div>
                <button
                  onClick={() => setDebugEntries(prev => prev.filter(e => e.id !== entry.id))}
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:text-white hover:bg-white/[0.05] transition-all">
                  <IconX size={10} />
                </button>
              </div>
              {/* Toggle expand */}
              <button
                onClick={() => setDebugOpenId(debugOpenId === entry.id ? null : entry.id)}
                className="w-full px-3 py-1.5 text-left text-[9px] text-gray-600 hover:text-gray-400 transition-colors">
                {debugOpenId === entry.id ? "▲ hide" : "▼ show request/response"}
              </button>
              {/* Expandable body */}
              {debugOpenId === entry.id && (
                <div className="max-h-[320px] overflow-y-auto px-3 pb-3 space-y-2">
                  {entry.requests.map((req, i) => (
                    <div key={i}>
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">
                        Request {entry.requests.length > 1 ? `#${i + 1}` : ""}
                      </p>
                      <pre className="text-[9px] text-green-400/80 bg-black/40 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(req, null, 2)}
                      </pre>
                    </div>
                  ))}
                  {entry.responses.map((res, i) => (
                    <div key={i}>
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">
                        Response {entry.responses.length > 1 ? `#${i + 1}` : ""}
                      </p>
                      <pre className="text-[9px] text-blue-400/80 bg-black/40 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(res, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>,
        document.body,
      )}

      {/* ══ Prompt dock ═══════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-6 pb-5 pt-3">
        <div ref={dockRef} className="max-w-[900px] mx-auto">
          <div className={cn(
            "rounded-lg border transition-colors duration-200 bg-[#0c0c0e]",
            anyGenerating ? "border-[#FFFF00]/25" : "border-white/10",
          )}
            style={{ boxShadow: "0 -4px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.03)" }}
          >

            {/* Row 1: Reference images */}
            {hasRefs && (
              <div className="px-4 pt-3 pb-2 flex items-center flex-wrap gap-1.5 border-b border-white/5">
                {allRefs.map(ref => (
                  <div key={ref.id}
                    className="relative shrink-0 group/ref rounded overflow-hidden"
                    style={{
                      width: 52, height: 52,
                      border: ref.isUpload
                        ? "1px solid rgba(255,255,255,0.10)"
                        : "1px solid rgba(255,255,0,0.35)",
                    }}
                  >
                    <img src={ref.url} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => removeRef(ref.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover/ref:opacity-100 transition-opacity">
                      <IconX size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Row 2: Prompt textarea */}
            <div className="px-4 pt-3 pb-3">
              <textarea
                ref={taRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate() }}
                placeholder="Describe what you want to create…"
                rows={2}
                className="w-full bg-transparent text-sm text-white placeholder:text-white/20 resize-none outline-none leading-[1.7]"
                style={{ minHeight: 40, maxHeight: 140, overflowY: "auto" }}
              />
            </div>

            {/* Row 3: Controls */}
            <div className="px-4 py-2.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center gap-2">

              <div className="flex items-center gap-2 sm:flex-1 min-w-0">
                <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />

                {/* Reference image upload */}
                {modelSupportsRef && (
                  <button
                    onClick={() => uploadRef.current?.click()}
                    title="Add reference image"
                    className="w-8 h-8 flex items-center justify-center rounded-md text-white/50 hover:text-white border border-white/10 hover:border-[#FFFF00]/50 hover:bg-white/[0.02] transition-all shrink-0"
                  >
                    <IconPlus size={14} strokeWidth={2.5} />
                  </button>
                )}

                {/* Aspect ratio picker */}
                {activeModel.controls.aspectRatios && (
                  <div className="relative shrink-0">
                    <button
                      onClick={() => !aspectLocked && setOpenPicker(openPicker === "ratio" ? null : "ratio")}
                      title={aspectLocked ? "Aspect ratio is set by the reference image" : undefined}
                      className={cn(
                        TRIGGER_BASE,
                        aspectLocked
                          ? "border-white/[0.05] text-white/25 cursor-not-allowed"
                          : openPicker === "ratio" ? TRIGGER_ON : TRIGGER_OFF,
                      )}
                    >
                      {aspect}
                      {aspectLocked
                        ? <span className="text-[8px] text-white/20 font-normal">locked</span>
                        : <IconChevronDown size={10} className={cn("transition-transform duration-150", openPicker === "ratio" && "rotate-180")} />
                      }
                    </button>
                    {openPicker === "ratio" && (
                      <div className="absolute bottom-full mb-2 left-0 z-50"
                        style={{ animation: "pickerIn 0.15s ease-out both" }}>
                        <div className="bg-[#0c0c0e] border border-white/10 rounded-lg shadow-[0_-8px_48px_rgba(0,0,0,0.9)] overflow-hidden">
                          <div className="p-3 w-[288px]">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Aspect Ratio</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {ASPECTS.filter(a =>
                                activeModel.controls.aspectRatios?.includes(a)
                              ).map(a => {
                                const active = aspect === a
                                return (
                                  <button key={a}
                                    onClick={() => { setAspect(a); setOpenPicker(null) }}
                                    className={cn(
                                      "flex flex-col items-center gap-1 p-2.5 rounded-md border transition-all",
                                      active
                                        ? "bg-white/[0.05] border-white/20"
                                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10",
                                    )}
                                  >
                                    <AspectShape aspect={a} active={active} />
                                    <span className={cn("text-[10px] font-black", active ? "text-[#FFFF00]" : "text-white/60")}>{a}</span>
                                    <span className={cn("text-[8.5px]", active ? "text-[#FFFF00]/50" : "text-gray-600")}>{ASPECT_LABEL[a]}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Style picker */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenPicker(openPicker === "style" ? null : "style")}
                    className={cn(TRIGGER_BASE, openPicker === "style" ? TRIGGER_ON : TRIGGER_OFF)}
                  >
                    {style === "None" ? "Style" : style}
                    <IconChevronDown size={10} className={cn("transition-transform duration-150", openPicker === "style" && "rotate-180")} />
                  </button>
                  {openPicker === "style" && (
                    <div className="absolute bottom-full mb-2 left-0 z-50"
                      style={{ animation: "pickerIn 0.15s ease-out both" }}>
                      <div className="bg-[#0c0c0e] border border-white/10 rounded-lg shadow-[0_-8px_48px_rgba(0,0,0,0.9)] overflow-hidden">
                        <div className="p-2 w-[210px]">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">Style</p>
                          <div className="flex flex-col">
                            {STYLES.map(s => {
                              const active = style === s
                              return (
                                <button key={s}
                                  onClick={() => { setStyle(s); setOpenPicker(null) }}
                                  className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-md transition-all text-left",
                                    active ? "bg-white/[0.05]" : "hover:bg-white/[0.03]",
                                  )}
                                >
                                  <div>
                                    <p className={cn("text-[11px] font-semibold", active ? "text-[#FFFF00]" : "text-white/80")}>{s}</p>
                                    <p className="text-[9px] text-gray-600 mt-0.5">{STYLE_DESC[s]}</p>
                                  </div>
                                  {active && <IconCheck size={11} className="text-[#FFFF00] shrink-0 ml-3" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Model picker — de-duplicated: one entry per quality group */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenPicker(openPicker === "model" ? null : "model")}
                    className={cn(TRIGGER_BASE, openPicker === "model" ? TRIGGER_ON : TRIGGER_OFF)}
                  >
                    {activeModel.label}
                    <IconChevronDown size={10} className={cn("transition-transform duration-150", openPicker === "model" && "rotate-180")} />
                  </button>
                  {openPicker === "model" && (
                    <div className="absolute bottom-full mb-2 left-0 z-50"
                      style={{ animation: "pickerIn 0.15s ease-out both" }}>
                      <div className="bg-[#0c0c0e] border border-white/10 rounded-lg shadow-[0_-8px_48px_rgba(0,0,0,0.9)] overflow-hidden">
                        <div className="p-2 w-[300px]">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">Model</p>
                          <div className="flex flex-col gap-1">
                            {PICKER_MODELS.map(m => {
                              // A model is "active" if it matches directly or shares the same quality group
                              const active = m.id === modelId ||
                                (!!m.qualityGroupId && m.qualityGroupId === activeModel.qualityGroupId)
                              return (
                                <button key={m.id}
                                  onClick={() => { setModelId(m.id); setOpenPicker(null) }}
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-md border transition-all text-left",
                                    active ? "bg-white/[0.05] border-white/10" : "border-transparent hover:bg-white/[0.03]",
                                  )}
                                >
                                  <div className={cn(
                                    "w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 transition-all",
                                    active ? "border-[#FFFF00] bg-[#FFFF00]" : "border-white/20",
                                  )} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className={cn("text-[11px] font-semibold", active ? "text-[#FFFF00]" : "text-white/80")}>{m.label}</p>
                                      <span className={cn(
                                        "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                                        active ? "bg-[#FFFF00]/15 text-[#FFFF00]" : "bg-white/[0.05] text-gray-500",
                                      )}>{m.tag}</span>
                                    </div>
                                    <p className="text-[9px] text-gray-600">{m.description}</p>
                                    <p className={cn("text-[8px] mt-0.5", active ? "text-[#FFFF00]/60" : "text-gray-700")}>
                                      {m.credits} credits / image
                                      {m.controls.referenceImage ? "  · ref ✓" : ""}
                                    </p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resolution picker — dropdown, shown right of model for models that support it */}
                {showResolution && (
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setOpenPicker(openPicker === "resolution" ? null : "resolution")}
                      className={cn(TRIGGER_BASE, openPicker === "resolution" ? TRIGGER_ON : TRIGGER_OFF)}
                    >
                      {currentResolution}
                      <IconChevronDown size={10} className={cn("transition-transform duration-150", openPicker === "resolution" && "rotate-180")} />
                    </button>
                    {openPicker === "resolution" && (
                      <div className="absolute bottom-full mb-2 left-0 z-50"
                        style={{ animation: "pickerIn 0.15s ease-out both" }}>
                        <div className="bg-[#0c0c0e] border border-white/10 rounded-lg shadow-[0_-8px_48px_rgba(0,0,0,0.9)] overflow-hidden">
                          <div className="p-2 w-[180px]">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">Output Resolution</p>
                            <div className="flex flex-col gap-0.5">
                              {resolutionOptions.map(r => {
                                const active = currentResolution === r
                                return (
                                  <button key={r}
                                    onClick={() => { handleResolutionChange(r); setOpenPicker(null) }}
                                    className={cn(
                                      "flex items-center justify-between px-3 py-2.5 rounded-md border transition-all text-left",
                                      active ? "bg-white/[0.05] border-white/10" : "border-transparent hover:bg-white/[0.03]",
                                    )}
                                  >
                                    <div>
                                      <p className={cn("text-[11px] font-semibold", active ? "text-[#FFFF00]" : "text-white/80")}>{r}</p>
                                      <p className="text-[9px] text-gray-600">
                                        {r === '1K' ? '1024 × 1024' : r === '2K' ? '2048 × 2048' : '4096 × 4096'}
                                      </p>
                                    </div>
                                    {active && <IconCheck size={11} className="text-[#FFFF00] shrink-0 ml-3" />}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action group */}
              <div className="flex items-center gap-2.5 shrink-0">

                <div className="flex items-center gap-1.5 shrink-0">
                  <CreditIcon className="w-5 h-5 rounded" iconClassName="w-2.5 h-2.5" />
                  <span className="font-mono text-sm font-medium text-white/70 tabular-nums">{totalCredits}</span>
                </div>

                <div className={cn(PILL_TRACK, "shrink-0")}>
                  {([1, 2, 4] as Count[]).map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className={cn(PILL_BASE, "w-8", count === n ? PILL_ON : PILL_OFF)}
                    >{n}</button>
                  ))}
                </div>

                <span className="hidden sm:inline text-[9px] text-gray-700 font-mono shrink-0">⌘↵</span>

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className={cn(
                    "flex items-center gap-2 h-9 px-5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all select-none shrink-0",
                    !prompt.trim()
                      ? "bg-[#FFFF00]/50 text-black/40 cursor-not-allowed"
                      : "bg-[#FFFF00] text-black cursor-pointer hover:bg-[#e6e600] shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] active:scale-[0.97]",
                  )}
                >
                  <IconArrowUp size={12} strokeWidth={2.8} /> Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
