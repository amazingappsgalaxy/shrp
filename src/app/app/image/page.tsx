"use client"
import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { GenerationAnimation } from "@/components/ui/GenerationAnimation"
import { CreditIcon } from "@/components/ui/CreditIcon"
import {
  IconArrowUp, IconSparkles,
  IconDownload, IconRefresh, IconX, IconPlus, IconChevronDown, IconCheck, IconBug, IconWand,
} from "@tabler/icons-react"
import { getImageModels } from "@/services/models"
import { uploadImageToCdn } from "@/lib/upload-image"
import { APP_DATA_KEY } from "@/lib/hooks/use-app-data"
import { generateMediaFilename, downloadMedia } from "@/lib/media-filename"
import { useSWRConfig } from "swr"
import MyLoadingProcessIndicator from "@/components/ui/MyLoadingProcessIndicator"
import { EditModal } from '@/components/app/edit/EditModal'

// ─── Types ────────────────────────────────────────────────────────────────────
type Count      = 1 | 2 | 4
type Aspect     = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "3:2" | "2:3" | "21:9"
type Resolution = "1K" | "2K" | "3K" | "4K"
type PickerType = "ratio" | "style" | "model" | "resolution" | null

interface GridImage {
  id: string
  url: string
  aspect: Aspect
  loading: boolean
  prompt?: string
  model?: string
  taskId?: string
  /** True if this image was generated with reference images — hides Vary button since refs are ephemeral */
  hasRefs?: boolean
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

const ASPECTS: Aspect[] = ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"]
const ASPECT_LABEL: Record<Aspect, string> = {
  "1:1": "Square", "4:3": "Landscape", "3:4": "Portrait",
  "16:9": "Wide", "9:16": "Story", "3:2": "Photo", "2:3": "Tall", "21:9": "Cinema",
}
const ASPECT_NUM: Record<Aspect, number> = {
  "1:1": 1, "4:3": 4/3, "3:4": 3/4, "16:9": 16/9, "9:16": 9/16,
  "3:2": 3/2, "2:3": 2/3, "21:9": 21/9,
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
function ImageModal({
  images, index, onClose, onNavigate, onAddImage, onAddLoadingImage,
}: {
  images: GridImage[]
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
  onAddImage?: (imageUrl: string, historyId: string, mode: string, prompt: string) => void
  onAddLoadingImage?: (historyId: string, mode: string) => void
}) {
  const img = index !== null ? images[index] ?? null : null

  const [dims,    setDims]    = useState<{ w: number; h: number } | null>(null)
  const [zoom,    setZoom]    = useState(1)
  const [pan,     setPan]     = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Memoize callbacks to prevent infinite re-renders in EditModal
  const handleGenerationStart = useCallback((historyId: string, mode: string) => {
    if (onAddLoadingImage) {
      onAddLoadingImage(historyId, mode)
    }
  }, [onAddLoadingImage])

  const handleGenerationComplete = useCallback((imageUrl: string, historyId: string, mode: string, prompt: string) => {
    if (onAddImage) {
      onAddImage(imageUrl, historyId, mode, prompt)
    }
  }, [onAddImage])

  // Reset zoom/pan when navigating
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setDims(null)
  }, [index])

  // Detect actual pixel dimensions
  useEffect(() => {
    if (!img?.url) { setDims(null); return }
    const image = new window.Image()
    image.onload = () => setDims({ w: image.naturalWidth, h: image.naturalHeight })
    image.onerror = () => setDims(null)
    image.src = img.url
  }, [img?.url])

  // Keyboard: Escape, ArrowLeft, ArrowRight
  // Skip when EditModal is open — it handles its own Escape to prevent double-close
  useEffect(() => {
    if (index === null || isEditModalOpen) return
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape")      { onClose(); return }
      if (e.key === "ArrowLeft"  && index > 0)               onNavigate(index - 1)
      if (e.key === "ArrowRight" && index < images.length - 1) onNavigate(index + 1)
    }
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [index, images.length, onClose, onNavigate, isEditModalOpen])

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom(prev => {
      const next = prev - e.deltaY * 0.003
      const clamped = Math.min(5, Math.max(1, next))
      if (clamped === 1) setPan({ x: 0, y: 0 })
      return clamped
    })
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || !dragStart.current) return
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    })
  }

  function handleMouseUp() {
    setIsDragging(false)
    dragStart.current = null
  }

  if (!img || typeof document === "undefined") return null

  const hasPrev = index! > 0
  const hasNext = index! < images.length - 1

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/90" style={{ backdropFilter: "blur(20px)" }} onClick={onClose} />

      {/* Close button — top-right outside the modal box */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.12] text-white/50 hover:text-white hover:bg-white/[0.15] transition-all"
      >
        <IconX size={14} />
      </button>

      {/* Prev arrow — floating left of modal */}
      {hasPrev && (
        <button
          onClick={e => { e.stopPropagation(); onNavigate(index! - 1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/90 transition-all"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}

      {/* Next arrow — floating right of modal (left of the info panel gutter) */}
      {hasNext && (
        <button
          onClick={e => { e.stopPropagation(); onNavigate(index! + 1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/90 transition-all"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}

      <div
        className="relative z-10 flex w-full max-w-5xl bg-[#0c0c0e] border border-white/[0.08] rounded-xl overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.9)]"
        style={{ maxHeight: "88vh" }}
      >
        {/* ── Image pane ── */}
        <div
          className="flex-1 relative flex items-center justify-center bg-black/40 overflow-hidden min-h-[360px]"
          style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={img.url} alt=""
            className="max-w-full max-h-full object-contain rounded-lg select-none"
            draggable={false}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: isDragging ? "none" : "transform 0.15s ease-out",
              boxShadow: zoom === 1 ? "0 24px 64px rgba(0,0,0,0.8)" : "none",
              maxHeight: "calc(88vh - 4rem)",
            }}
          />

          {/* Zoom % indicator */}
          {zoom > 1 && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 text-white/50 text-[10px] font-mono pointer-events-none">
              {Math.round(zoom * 100)}%
            </div>
          )}

        </div>

        {/* ── Info pane ── */}
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
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Scroll to zoom</p>
              <p className="text-[11px] text-white/30">Drag to pan when zoomed in</p>
            </div>
          </div>
          <div className="p-5 border-t border-white/[0.06]">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full h-11 bg-white/[0.09] text-[#FFFF00] text-xs font-black uppercase tracking-wider rounded-lg hover:bg-white/[0.12] transition-all mb-2"
            >
              <IconWand size={13} /> Edit Image
            </button>
            <button
              onClick={() => { const ext = img.url.split('?')[0]?.match(/\.(\w+)$/)?.[1]?.toLowerCase() || 'jpg'; downloadMedia(img.url, generateMediaFilename(ext, img.prompt)) }}
              className="flex items-center justify-center gap-2 w-full h-11 bg-[#FFFF00] text-black text-xs font-black uppercase tracking-wider rounded-lg hover:bg-[#e6e600] transition-all">
              <IconDownload size={13} /> Download
            </button>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialImageUrl={img.url}
          sourceContext="image-page"
          onGenerationStart={handleGenerationStart}
          onGenerationComplete={handleGenerationComplete}
        />
      )}
    </div>,
    document.body,
  )
}

// ─── Justified grid ───────────────────────────────────────────────────────────
function JustifiedGrid({
  images, generatedIds, onOpen, onVary, selectedIds, onToggleSelect, showSelectButton, refsAtMax, isBusy,
}: {
  images: GridImage[]
  generatedIds: Set<string>
  onOpen: (img: GridImage) => void
  onVary: (img: GridImage) => void
  selectedIds: string[]
  onToggleSelect: (img: GridImage) => void
  showSelectButton: boolean
  refsAtMax: boolean
  isBusy: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(0)
  // React-state hover is more reliable than CSS group-hover at card edges
  const [hoveredId, setHoveredId] = useState<string | null>(null)

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
            const isSelected = selectedIds.includes(img.id)
            const isGenerated = generatedIds.has(img.id)
            const isHovered = hoveredId === img.id
            // Show overlay when hovered OR when selected (so user always sees the + checkmark)
            const showOverlay = isHovered || isSelected
            return (
              <div
                key={img.id}
                draggable={!img.loading}
                onDragStart={e => {
                  if (!img.loading) e.dataTransfer.setData("text/x-image-id", img.id)
                }}
                style={{
                  width: row.widths[ii], height: row.height, flexShrink: 0,
                  overflow: "hidden", borderRadius: 8, position: "relative",
                  boxShadow: isSelected ? "inset 0 0 0 2.5px #FFFF00" : "none",
                  cursor: img.loading ? "default" : "pointer",
                  animation: isGenerated ? "fadeIn 0.5s ease-out both" : undefined,
                }}
                onMouseEnter={() => !img.loading && setHoveredId(img.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => !img.loading && onOpen(img)}
              >
                {img.loading ? <GenerationAnimation /> : (
                  <img src={img.url} alt="" className="block w-full h-full object-cover select-none"
                    style={{ animation: isGenerated ? "fadeIn 0.5s ease-out both" : undefined }} />
                )}

                {!img.loading && (
                  <>
                    {/* Bottom gradient */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-10 transition-opacity duration-200"
                      style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 60%, transparent 100%)",
                        opacity: showOverlay ? 1 : 0,
                      }}
                    />

                    {/* Action row — hover-gated */}
                    <div
                      className="absolute bottom-0 inset-x-0 px-2 pb-2.5 flex items-end justify-between z-20 pointer-events-none transition-opacity duration-200"
                      style={{ opacity: showOverlay ? 1 : 0 }}
                    >
                      {/* Left: + add-as-reference */}
                      {showSelectButton ? (
                        <button
                          onClick={e => { e.stopPropagation(); onToggleSelect(img) }}
                          title={isSelected ? "Remove from references" : refsAtMax ? "Max references reached" : "Add as reference"}
                          className={cn(
                            "pointer-events-auto w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-lg",
                            isSelected ? "bg-[#FFFF00] text-black" : refsAtMax ? "bg-white/40 text-black/40 cursor-not-allowed" : "bg-white text-black hover:scale-110",
                          )}
                        >
                          {isSelected ? <IconCheck size={11} /> : <IconPlus size={11} />}
                        </button>
                      ) : <span />}

                      {/* Right: vary + download */}
                      <div className="pointer-events-auto flex gap-1">
                        {img.hasRefs === false && (
                          <button
                            onClick={e => { e.stopPropagation(); if (!isBusy) onVary(img) }}
                            title={isBusy ? "Generating…" : "Vary"}
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-lg",
                              isBusy ? "bg-white/50 text-black/40 cursor-not-allowed" : "bg-white text-black hover:scale-110",
                            )}
                          >
                            <IconRefresh size={11} />
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); const ext = img.url.split('?')[0]?.match(/\.(\w+)$/)?.[1]?.toLowerCase() || 'jpg'; downloadMedia(img.url, generateMediaFilename(ext, img.prompt)) }}
                          title="Download"
                          className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-all shadow-lg">
                          <IconDownload size={11} />
                        </button>
                      </div>
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

// ─── History helpers ───────────────────────────────────────────────────────────
interface HistoryItem {
  id: string
  outputUrls: Array<{ type: string; url: string } | string>
  status: string
  createdAt: string
  modelName?: string | null
  settings?: { prompt?: string; aspect_ratio?: string }
}

interface HistoryApiResp {
  items?: HistoryItem[]
  hasMore?: boolean
  nextCursor?: string | null
}

function parseHistItems(items: HistoryItem[]): { images: GridImage[]; pendingIds: string[] } {
  const images: GridImage[] = []
  const pendingIds: string[] = []
  for (const item of items) {
    const rawAspect = item.settings?.aspect_ratio
    const aspect: Aspect = (ASPECTS as readonly string[]).includes(rawAspect ?? '') ? rawAspect as Aspect : '1:1'
    if (item.status === 'completed') {
      item.outputUrls.forEach((out, index) => {
        const url = typeof out === 'string' ? out : out.url
        if (!url) return
        // Use index to ensure unique keys even if URLs are similar
        images.push({
          id: `hist-${item.id}-${index}`,
          url,
          aspect,
          loading: false,
          prompt: item.settings?.prompt,
          model: item.modelName ?? undefined,
          taskId: item.id,
        })
      })
    } else if (item.status === 'processing') {
      pendingIds.push(item.id)
      images.push({ id: `hist-proc-${item.id}`, url: '', aspect, loading: true, taskId: item.id })
    }
  }
  return { images, pendingIds }
}

// ─── Skeleton loading grid ─────────────────────────────────────────────────────
function SkeletonGrid() {
  const rows = [[1, 4/3, 9/16], [16/9, 1, 3/4]]
  return (
    <div className="w-full">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-[9px] mb-[9px]">
          {row.map((ratio, ii) => (
            <div key={ii} className="rounded-lg overflow-hidden" style={{ height: 200, flex: ratio }}>
              <div
                className="w-full h-full bg-white/[0.04] animate-pulse"
                style={{ animationDelay: `${(ri * 3 + ii) * 80}ms` }}
              />
            </div>
          ))}
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
  const [modalIndex,   setModalIndex]   = useState<number | null>(null)
  const [selectedIds,  setSelectedIds]  = useState<string[]>([])
  const [uploadedRefs, setUploadedRefs] = useState<{ id: string; url: string; cdnUrl?: string }[]>([])
  // Unified insertion-ordered list of ref IDs (uploaded + grid) — determines display/API order
  const [refOrder,     setRefOrder]     = useState<string[]>([])
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
  const [isDragOver,    setIsDragOver]    = useState(false)
  // Pending model switch when refs would be cleared (requires user confirmation)
  const [pendingModelId, setPendingModelId] = useState<string | null>(null)

  // History pagination
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore,    setIsLoadingMore]    = useState(false)
  const [hasMore,          setHasMore]          = useState(false)
  const [histCursor,       setHistCursor]       = useState<string | null>(null)
  const [processingDbIds,  setProcessingDbIds]  = useState<string[]>([])

  const [pillHover, setPillHover] = useState<{ text: string; url: string; rect: DOMRect } | null>(null)

  const taRef     = useRef<HTMLDivElement>(null)
  const endRef    = useRef<HTMLDivElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const dockRef   = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Scroll-preservation during history prepend
  const prependScrollHeight = useRef(0)
  // Always-fresh ref to loadMore (avoids stale closure in scroll handler)
  const loadMoreFnRef = useRef<(() => void) | null>(null)
  // Keep scroll area bottom-padding equal to full dock height (card + pt-3 + pb-5 outer wrapper = +32px) + breathing room
  useEffect(() => {
    const dock = dockRef.current; const scroll = scrollRef.current
    if (!dock || !scroll) return
    const update = () => {
      // outer wrapper: pt-3 (12px) + pb-5 (20px) = 32px extra on top of the card height
      scroll.style.paddingBottom = `${dock.offsetHeight + 32 + 24}px`
    }
    const ro = new ResizeObserver(update)
    ro.observe(dock)
    update()
    return () => ro.disconnect()
  }, [])

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
  // Browsable images for modal navigation (exclude loading placeholders)
  const browsableImages = useMemo(() => images.filter(img => !img.loading), [images])

  // When switching models: reset aspect/resolution if unsupported; clear refs if new model doesn't support them
  useEffect(() => {
    const supported = activeModel.controls.aspectRatios
    if (supported && !supported.includes(aspect)) {
      setAspect((supported[0] as Aspect) ?? "1:1")
    }
    if (!activeModel.controls.referenceImage) {
      setSelectedIds([])
      setUploadedRefs([])
      setRefOrder([])
    }
    // Reset imageSize resolution when switching models
    if (!activeModel.supportedImageSizes?.length) {
      setResolution("1K")
    } else if (!activeModel.supportedImageSizes.includes(resolution as never)) {
      setResolution(activeModel.supportedImageSizes[0] as Resolution)
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

  // ── loadMore: fetches older history and prepends to the grid ──────────────────
  async function loadMore() {
    if (isLoadingMore || !hasMore || !histCursor) return
    setIsLoadingMore(true)
    prependScrollHeight.current = scrollRef.current?.scrollHeight ?? 0
    try {
      const r = await fetch(`/api/history/list?page_name=app%2Fimage&limit=20&order=desc&cursor=${encodeURIComponent(histCursor)}`)
      const data = await r.json() as HistoryApiResp
      if (data.items?.length) {
        const { images: older, pendingIds } = parseHistItems(data.items.slice().reverse())
        setImages(prev => [...older, ...prev])
        setProcessingDbIds(prev => [...new Set([...prev, ...pendingIds])])
        setHasMore(data.hasMore ?? false)
        setHistCursor(data.nextCursor ?? null)
      } else {
        setHasMore(false)
        prependScrollHeight.current = 0
      }
    } catch {
      prependScrollHeight.current = 0
    } finally {
      setIsLoadingMore(false)
    }
  }
  // Keep loadMoreFnRef fresh so the scroll handler never has a stale closure
  useEffect(() => { loadMoreFnRef.current = loadMore })

  // Initial history load — newest 20 first, then scroll to bottom
  useEffect(() => {
    fetch('/api/history/list?page_name=app%2Fimage&limit=20&order=desc')
      .then(r => r.json() as Promise<HistoryApiResp>)
      .then(data => {
        if (data.items?.length) {
          const { images: loaded, pendingIds } = parseHistItems(data.items.slice().reverse())
          setImages(loaded)
          setProcessingDbIds(pendingIds)
          setHasMore(data.hasMore ?? false)
          setHistCursor(data.nextCursor ?? null)
        }
        setIsInitialLoading(false)
        // Scroll to bottom after images render (double rAF ensures layout is complete)
        requestAnimationFrame(() => requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
        }))
      })
      .catch(() => setIsInitialLoading(false))
  }, [])

  // Scroll up past the threshold → load older items
  useEffect(() => {
    const scroll = scrollRef.current
    if (!scroll) return
    const handler = () => {
      if (scroll.scrollTop < 120) loadMoreFnRef.current?.()
    }
    scroll.addEventListener('scroll', handler, { passive: true })
    return () => scroll.removeEventListener('scroll', handler)
  }, []) // stable — loadMoreFnRef.current is always fresh

  // After prepending older images, restore scroll so the view doesn't jump
  useLayoutEffect(() => {
    if (prependScrollHeight.current > 0 && scrollRef.current) {
      scrollRef.current.scrollTop += scrollRef.current.scrollHeight - prependScrollHeight.current
      prependScrollHeight.current = 0
    }
  })

  // Poll DB for processing items every 15 s — background cron keeps status updated
  useEffect(() => {
    if (processingDbIds.length === 0) return
    const timer = setInterval(async () => {
      try {
        const r = await fetch(`/api/history/list?ids=${processingDbIds.join(',')}`)
        const data = await r.json() as HistoryApiResp
        if (!data.items?.length) return
        const completedItems = data.items.filter(i => i.status === 'completed')
        const failedItems    = data.items.filter(i => i.status === 'failed')
        if (completedItems.length === 0 && failedItems.length === 0) return

        const resolvedIds = new Set([...completedItems, ...failedItems].map(i => i.id))

        // IMPORTANT: compute notifications BEFORE calling setImages.
        // React state updater callbacks run asynchronously after setImages() returns,
        // so any push() inside the updater would not be visible to code that runs after.
        const notifications: { id: string; status: 'success' | 'error'; message: string }[] = []
        for (const item of completedItems) {
          const urlCount = item.outputUrls.filter(out => !!(typeof out === 'string' ? out : out.url)).length
          notifications.push({ id: `poll-ok-${item.id}`, status: 'success', message: urlCount > 1 ? `${urlCount} images ready` : 'Image ready' })
        }
        for (const item of failedItems) {
          notifications.push({ id: `poll-err-${item.id}`, status: 'error', message: 'Generation failed' })
        }

        setImages(prev => {
          const updated = [...prev]

          for (const item of completedItems) {
            const rawAspect = item.settings?.aspect_ratio
            const aspect: Aspect = (ASPECTS as readonly string[]).includes(rawAspect ?? '') ? rawAspect as Aspect : '1:1'
            // Build resolved images with index-based keys (matches parseHistItems format)
            const newImgs: GridImage[] = []
            item.outputUrls.forEach((out, urlIdx) => {
              const url = typeof out === 'string' ? out : out.url
              if (!url) return
              newImgs.push({ id: `hist-${item.id}-${urlIdx}`, url, aspect, loading: false, prompt: item.settings?.prompt, model: item.modelName ?? undefined, taskId: item.id })
            })

            // Find ALL placeholder images linked to this taskId
            const placeholderIdxs: number[] = []
            for (let i = 0; i < updated.length; i++) {
              if (updated[i]!.taskId === item.id) placeholderIdxs.push(i)
            }

            if (placeholderIdxs.length > 0 && newImgs.length > 0) {
              // Remove extra placeholders from end→beginning first (preserves earlier indices),
              // then replace the first placeholder with all resolved images.
              for (let j = placeholderIdxs.length - 1; j >= 1; j--) {
                updated.splice(placeholderIdxs[j]!, 1)
              }
              updated.splice(placeholderIdxs[0]!, 1, ...newImgs)
            } else if (newImgs.length > 0) {
              updated.push(...newImgs)
            }
          }

          // Remove loading placeholders for failed tasks
          for (const item of failedItems) {
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i]!.taskId === item.id) updated.splice(i, 1)
            }
          }

          return updated
        })

        // Show notifications and refresh credits for completed tasks
        for (const n of notifications) {
          setGenTasks(prev => [...prev, { id: n.id, status: n.status, progress: n.status === 'success' ? 100 : 0, message: n.message }])
          setTimeout(() => setGenTasks(prev => prev.filter(t => t.id !== n.id)), n.status === 'success' ? 4000 : 6000)
        }
        if (completedItems.length > 0) {
          setGeneratedIds(prev => {
            const next = new Set(prev)
            completedItems.forEach(item => item.outputUrls.forEach((_, idx) => next.add(`hist-${item.id}-${idx}`)))
            return next
          })
          mutate(APP_DATA_KEY)
        }

        setProcessingDbIds(prev => prev.filter(id => !resolvedIds.has(id)))
      } catch { /* ignore — retry next tick */ }
    }, 15000)
    return () => clearInterval(timer)
  }, [processingDbIds])

  function scroll() {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80)
  }

  // Serialize contenteditable DOM → plain text (img-pill spans become their data-imgRef value)
  function serializeEditor(el: HTMLElement): string {
    let text = ''
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent ?? ''
      } else if (node instanceof HTMLElement) {
        if (node.dataset.imgRef) {
          text += node.dataset.imgRef
        } else if (node.tagName === 'BR') {
          text += '\n'
        } else {
          text += serializeEditor(node)
        }
      }
    }
    return text
  }

  // Insert an image-ref pill at the current cursor position in the contenteditable editor
  function insertAtCursor(text: string, refUrl?: string) {
    const el = taRef.current
    if (!el) return
    el.focus()

    const sel = window.getSelection()
    let range: Range
    if (sel && sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      range = sel.getRangeAt(0)
      range.deleteContents()
    } else {
      range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
    }

    const span = document.createElement('span')
    span.contentEditable = 'false'
    span.dataset.imgRef = text  // real text "Image [N]" — used for serialization and copy
    if (refUrl) span.dataset.refUrl = refUrl
    span.className = 'img-pill'
    // Display "Image @N" visually; the underlying data-imgRef stays "Image [N]"
    span.textContent = text.replace(/Image \[(\d+)\]/g, 'Image @$1')
    range.insertNode(span)

    // Place cursor just after the inserted pill
    const afterRange = document.createRange()
    afterRange.setStartAfter(span)
    afterRange.collapse(true)
    if (sel) { sel.removeAllRanges(); sel.addRange(afterRange) }

    setPrompt(serializeEditor(el))
  }

  function toggleSelect(img: GridImage) {
    if (!modelSupportsRef) return
    if (selectedIds.includes(img.id)) {
      // Deselect — remove from both lists
      setSelectedIds(prev => prev.filter(id => id !== img.id))
      setRefOrder(prev => prev.filter(id => id !== img.id))
    } else {
      if (selectedIds.length + uploadedRefs.length >= maxRefs) {
        toast.error(`This model supports up to ${maxRefs} reference image${maxRefs === 1 ? '' : 's'}`)
        return
      }
      // Append to end of both lists
      setSelectedIds(prev => [...prev, img.id])
      setRefOrder(prev => [...prev, img.id])
    }
  }

  function removeRef(id: string) {
    setSelectedIds(prev => prev.filter(sid => sid !== id))
    setUploadedRefs(prev => prev.filter(r => r.id !== id))
    setRefOrder(prev => prev.filter(rid => rid !== id))
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const slotsLeft = maxRefs - allRefs.length
    if (slotsLeft <= 0) {
      toast.error(`This model supports up to ${maxRefs} reference image${maxRefs === 1 ? '' : 's'}`)
      return
    }
    const allowed = files.slice(0, slotsLeft)
    if (files.length > slotsLeft) toast(`Only ${slotsLeft} more reference${slotsLeft === 1 ? '' : 's'} allowed — first ${slotsLeft} added`)
    allowed.forEach(async (file) => {
      const localUrl = URL.createObjectURL(file)
      const refId = `up-${Date.now()}-${file.name}`
      // Show local preview immediately, upload to CDN in background — append to end of order
      setUploadedRefs(prev => [...prev, { id: refId, url: localUrl }])
      setRefOrder(prev => [...prev, refId])
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

  // Add loading placeholder when generation starts — stable reference via useCallback
  const handleAddLoadingImage = useCallback((historyId: string, mode: string) => {
    const newId = `editing-${historyId}`
    const newImage: GridImage = {
      id: newId,
      url: "", // Empty URL for loading state
      aspect: "1:1",
      loading: true,
      prompt: "", // Hide prompt for edited images
      model: `Edit (${mode})`,
      hasRefs: false,
    }
    setImages(prev => [...prev, newImage])
    console.log('📝 Added loading placeholder for', historyId)
  }, [])

  // Replace loading placeholder or add edited image to the canvas grid — stable reference via useCallback
  const handleAddEditedImage = useCallback((imageUrl: string, historyId: string, mode: string, prompt: string) => {
    const loadingId = `editing-${historyId}`

    // Check if there's a loading placeholder to replace
    setImages(prev => {
      const loadingIndex = prev.findIndex(img => img.id === loadingId)
      if (loadingIndex !== -1) {
        // Replace loading placeholder
        const updated = [...prev]
        updated[loadingIndex] = {
          id: loadingId,
          url: imageUrl,
          aspect: "1:1",
          loading: false,
          prompt: "", // Hide prompt for edited images
          model: `Edit (${mode})`,
          hasRefs: false,
        }
        console.log('✅ Replaced loading placeholder with actual image', historyId)
        return updated
      } else {
        // No placeholder found, add new image (shouldn't happen but handle it)
        const newId = `edited-${Date.now()}-${historyId}`
        console.log('⚠️ No loading placeholder found, adding new image', historyId)
        return [...prev, {
          id: newId,
          url: imageUrl,
          aspect: "1:1",
          loading: false,
          prompt: "", // Hide prompt for edited images
          model: `Edit (${mode})`,
          hasRefs: false,
        }]
      }
    })

    setGeneratedIds(prev => new Set([...prev, loadingId]))
    mutate(APP_DATA_KEY) // Refresh credits
    toast.success("Edited image added to canvas")
  }, [mutate])

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
    // Build reference URLs in insertion order (same as allRefs display order)
    const referenceUrls: string[] = allRefs
      .map(ref => {
        if (ref.isUpload) return uploadedRefs.find(r => r.id === ref.id)?.cdnUrl ?? null
        return ref.url
      })
      .filter((u): u is string => u !== null)
    const fullPrompt = prompt.trim() + (STYLE_SUFFIX[style] ?? "")
    const supportsImageSize = !!activeModel.supportedImageSizes?.length

    const reqBody = {
      model: modelId,
      prompt: fullPrompt,
      aspect_ratio: aspect,
      count,
      ...(supportsImageSize ? { imageSize: resolution } : {}),
      ...(referenceUrls.length > 0 && modelSupportsRef ? { referenceUrls } : {}),
    }

    // Show request immediately — responses filled in when task completes
    setDebugEntries(prev => [...prev, {
      id: indicatorId,
      label: `${activeModel.label} — generating…`,
      requests: [reqBody],
      responses: [],
    }])

    fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    })
      .then(r => r.json() as Promise<{ success?: boolean; taskId?: string; status?: string; error?: string }>)
      .then(data => {
        if (!data.taskId) throw new Error(data.error ?? "Generation failed — no task ID returned")
        // Task is now processing in the background. Link placeholders to taskId so the
        // 15s poller can resolve them when the generation completes.
        setImages(prev => prev.map(img =>
          placeholders.some(p => p.id === img.id) ? { ...img, taskId: data.taskId! } : img
        ))
        setProcessingDbIds(prev => [...new Set([...prev, data.taskId!])])
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : "Generation failed"
        setImages(prev => prev.filter(img => !placeholders.some(p => p.id === img.id)))
        setGenTasks(prev => [...prev, { id: indicatorId, status: 'error', progress: 0, message: msg }])
        setTimeout(() => setGenTasks(prev => prev.filter(t => t.id !== indicatorId)), 6000)
        setDebugEntries(prev => prev.map(e => e.id === indicatorId ? { ...e, label: `${activeModel.label} — failed` } : e))
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
      .then(r => r.json() as Promise<{ taskId?: string; status?: string; error?: string }>)
      .then(data => {
        if (!data.taskId) throw new Error(data.error ?? "No task ID returned")
        // Link the variation placeholder to the taskId for the poller to resolve
        setImages(prev => prev.map(i =>
          i.id === placeholder.id ? { ...i, taskId: data.taskId! } : i
        ))
        setProcessingDbIds(prev => [...new Set([...prev, data.taskId!])])
      })
      .catch(err => {
        setImages(prev => prev.filter(i => i.id !== placeholder.id))
        const msg = err instanceof Error ? err.message : "Vary failed"
        setGenTasks(prev => [...prev, { id: indicatorId, status: 'error', progress: 0, message: msg }])
        setTimeout(() => setGenTasks(prev => prev.filter(t => t.id !== indicatorId)), 6000)
      })
      .finally(() => setInFlightCount(c => c - 1))
  }

  // Preserve selection order — map from selectedIds (insertion-ordered array) instead of filtering images
  const selectedImgObjs = selectedIds
    .map(id => images.find(img => img.id === id && !img.loading))
    .filter((img): img is GridImage => img !== undefined)
  // Build allRefs in insertion order using refOrder — so the first attached image is always Image [1]
  const allRefs = refOrder
    .map(id => {
      const uploaded = uploadedRefs.find(r => r.id === id)
      if (uploaded) return { id, url: uploaded.url, isUpload: true as const }
      const gridImg = images.find(img => img.id === id && !img.loading)
      if (gridImg) return { id, url: gridImg.url, isUpload: false as const }
      return null
    })
    .filter((r): r is { id: string; url: string; isUpload: boolean } => r !== null)
  const hasRefs   = allRefs.length > 0
  const maxRefs   = activeModel.controls.maxReferenceImages ?? 1
  const refsAtMax = modelSupportsRef && allRefs.length >= maxRefs

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
        @keyframes pillPop  { from { opacity: 0; transform: scale(0.72) } to { opacity: 1; transform: scale(1) } }
        .prompt-editor { min-height: 40px; max-height: 140px; overflow-y: auto; outline: none; line-height: 1.7; font-size: 14px; color: white; white-space: pre-wrap; word-break: break-word; }
        .prompt-editor:empty::before { content: attr(data-placeholder); color: rgba(255,255,255,0.2); pointer-events: none; }
        .prompt-editor .img-pill { display: inline-flex; align-items: center; background: #FFFF00; border: none; color: #111111; font-size: 11px; font-weight: 700; padding: 1px 6px 1px; border-radius: 100px; cursor: default; user-select: none; white-space: nowrap; vertical-align: middle; margin: 0 2px; line-height: 1.6; letter-spacing: 0.01em; transition: background 0.12s; }
        .prompt-editor .img-pill:hover { background: #e6e600; }
      `}</style>

      {/* ── Scroll area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-[88px]">


          {/* Initial skeleton — shown while history is loading */}
          {isInitialLoading && <SkeletonGrid />}

          {/* Load-more spinner — shown at top while fetching older items */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
            </div>
          )}

          {/* Empty state — only after history has loaded */}
          {!isInitialLoading && images.length === 0 && !anyGenerating && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
              <IconSparkles size={32} className="text-gray-700" />
              <p className="text-sm text-gray-600">Describe what you want to create</p>
            </div>
          )}

          <JustifiedGrid
            images={images}
            generatedIds={generatedIds}
            onOpen={img => {
              const idx = browsableImages.findIndex(i => i.id === img.id)
              if (idx !== -1) setModalIndex(idx)
            }}
            onVary={handleVary}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            showSelectButton={modelSupportsRef}
            refsAtMax={refsAtMax}
            isBusy={anyGenerating}
          />
          <div ref={endRef} />
        </div>
      </div>

      <ImageModal
        images={browsableImages}
        index={modalIndex}
        onClose={() => setModalIndex(null)}
        onNavigate={setModalIndex}
        onAddImage={handleAddEditedImage}
        onAddLoadingImage={handleAddLoadingImage}
      />

      {/* Pill hover preview — floating image preview above the hovered Image [N] token */}
      {pillHover && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[99999] pointer-events-none"
          style={{
            left: pillHover.rect.left + pillHover.rect.width / 2,
            top: pillHover.rect.top - 12,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="rounded-xl overflow-hidden border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.9)]"
            style={{ width: 112, height: 112 }}>
            <img src={pillHover.url} alt="" className="w-full h-full object-cover" />
          </div>
        </div>,
        document.body,
      )}

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
      {/* pointer-events-none on the outer shell so the transparent side areas don't block grid hover */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-6 pb-5 pt-3 pointer-events-none">
        <div ref={dockRef} className="max-w-[900px] mx-auto pointer-events-auto">
          {/* Model-switch warning: shown when new model doesn't support reference images but refs are attached */}
          {pendingModelId && (() => {
            const pending = IMAGE_MODELS.find(m => m.id === pendingModelId)
            const refCount = refOrder.length
            return (
              <div className="mb-2 flex items-center gap-3 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] text-amber-300 text-xs">
                <span className="flex-1">
                  <span className="font-semibold">{pending?.label}</span> doesn&apos;t support reference images.{' '}
                  {refCount} image{refCount !== 1 ? 's' : ''} will be removed.
                </span>
                <button
                  onClick={() => { setModelId(pendingModelId); setPendingModelId(null) }}
                  className="shrink-0 px-3 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 font-semibold transition-colors"
                >
                  Switch anyway
                </button>
                <button
                  onClick={() => setPendingModelId(null)}
                  className="shrink-0 px-3 py-1 rounded-md hover:bg-white/[0.05] text-white/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )
          })()}
          <div
            className="relative rounded-lg border bg-[#0c0c0e] transition-colors duration-150"
            style={{
              borderColor: isDragOver && modelSupportsRef ? 'rgba(255,255,0,0.55)' : 'rgba(255,255,255,0.10)',
              boxShadow: isDragOver && modelSupportsRef
                ? "0 -4px 32px rgba(255,255,0,0.08), 0 0 0 0.5px rgba(255,255,0,0.08)"
                : "0 -4px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.03)",
            }}
            onDragEnter={e => { e.preventDefault(); if (modelSupportsRef) setIsDragOver(true) }}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = modelSupportsRef ? "copy" : "none"; if (modelSupportsRef) setIsDragOver(true) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }}
            onDrop={e => {
              e.preventDefault()
              setIsDragOver(false)
              // Case 1: image dragged from the grid
              const draggedId = e.dataTransfer.getData("text/x-image-id")
              if (draggedId && modelSupportsRef) {
                const draggedImg = images.find(i => i.id === draggedId && !i.loading)
                if (draggedImg) { toggleSelect(draggedImg); return }
              }
              // Case 2: file dragged from OS file system
              const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))
              if (files.length > 0 && modelSupportsRef) {
                const syntheticEvent = { target: { files, value: "" }, currentTarget: { value: "" } } as unknown as React.ChangeEvent<HTMLInputElement>
                handleUpload(syntheticEvent)
              }
            }}
          >
            {/* Drag-over overlay */}
            {isDragOver && modelSupportsRef && (
              <div className="absolute inset-0 rounded-lg z-30 pointer-events-none flex items-center justify-center"
                style={{ background: "rgba(255,255,0,0.03)" }}>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFF00] text-black text-xs font-bold shadow-lg">
                  <IconPlus size={12} strokeWidth={2.5} /> Drop to add reference
                </div>
              </div>
            )}

            {/* Row 1: Reference images */}
            {hasRefs && (
              <div className="px-4 pt-3 pb-2.5 flex items-center flex-wrap gap-2 border-b border-white/5">
                {/* Ref count badge */}
                <div className="absolute top-3 right-4 flex items-center gap-1.5 pointer-events-none">
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", refsAtMax ? "text-[#FFFF00]/70" : "text-white/25")}>
                    {allRefs.length}/{maxRefs}
                  </span>
                </div>
                {allRefs.map((ref, idx) => (
                  <div
                    key={ref.id}
                    className="relative shrink-0 rounded-lg overflow-hidden cursor-pointer group/ref"
                    style={{ width: 64, height: 64 }}
                    onClick={() => insertAtCursor(`Image [${idx + 1}]`, ref.url)}
                    title={`Click to insert Image [${idx + 1}] reference into prompt`}
                  >
                    <img src={ref.url} className="w-full h-full object-cover" alt="" />

                    {/* Bottom badge — "Img N" at rest, "Add +" pill on hover */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent pt-5 pb-1.5 flex items-end justify-center pointer-events-none">
                      {/* default label — fades out on hover */}
                      <span className="absolute text-[8px] font-black text-white/75 uppercase tracking-widest transition-all duration-150 group-hover/ref:opacity-0 group-hover/ref:scale-75">
                        Img {idx + 1}
                      </span>
                      {/* hover pill — pops in */}
                      <span
                        className="opacity-0 scale-75 group-hover/ref:opacity-100 group-hover/ref:scale-100 bg-[#FFFF00] text-black text-[9px] font-bold px-2 py-[2px] rounded-full leading-tight"
                        style={{ transition: "opacity 0.13s, transform 0.13s" }}
                      >
                        Add +
                      </span>
                    </div>

                    {/* X button — top-right, always visible */}
                    <button
                      onClick={e => { e.stopPropagation(); removeRef(ref.id) }}
                      className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#FFFF00] hover:text-black transition-all"
                      title="Remove"
                    >
                      <IconX size={8} />
                    </button>
                  </div>
                ))}

                {/* Hint label */}
                <p className="text-[9px] text-white/40 self-end pb-1 ml-1 leading-tight">
                  Tap to insert image as reference
                </p>
              </div>
            )}

            {/* Row 2: Prompt editor (contenteditable — supports styled image-ref pills) */}
            <div className="px-4 pt-3 pb-3">
              <div
                ref={taRef}
                contentEditable
                suppressContentEditableWarning
                className="prompt-editor w-full bg-transparent"
                data-placeholder="Describe what you want to create…"
                onInput={e => setPrompt(serializeEditor(e.currentTarget))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleGenerate(); return }
                  // Atomic delete of img-pill on Backspace / Delete
                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    const sel = window.getSelection()
                    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return
                    const range = sel.getRangeAt(0)
                    const { startContainer, startOffset } = range
                    let pill: HTMLElement | null = null
                    if (e.key === 'Backspace') {
                      if (startOffset === 0) {
                        const prev = startContainer.previousSibling
                        if (prev instanceof HTMLElement && prev.dataset.imgRef) pill = prev
                      } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
                        const ch = (startContainer as Element).childNodes[startOffset - 1]
                        if (ch instanceof HTMLElement && ch.dataset.imgRef) pill = ch
                      }
                    } else {
                      if (startContainer.nodeType === Node.TEXT_NODE) {
                        const txt = startContainer.textContent ?? ''
                        if (startOffset === txt.length) {
                          const nxt = startContainer.nextSibling
                          if (nxt instanceof HTMLElement && nxt.dataset.imgRef) pill = nxt
                        }
                      } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
                        const ch = (startContainer as Element).childNodes[startOffset]
                        if (ch instanceof HTMLElement && ch.dataset.imgRef) pill = ch
                      }
                    }
                    if (pill) {
                      e.preventDefault()
                      pill.remove()
                      setPrompt(serializeEditor(taRef.current!))
                    }
                  }
                }}
                onCopy={e => {
                  // Pills display "Image @N" but we copy "Image [N]" from data-imgRef
                  const sel = window.getSelection()
                  if (!sel || sel.rangeCount === 0) return
                  const frag = sel.getRangeAt(0).cloneContents()
                  const tmp = document.createElement('div')
                  tmp.appendChild(frag)
                  const plain = serializeEditor(tmp)
                  if (plain) { e.preventDefault(); e.clipboardData.setData('text/plain', plain) }
                }}
                onCut={e => {
                  const sel = window.getSelection()
                  if (!sel || sel.rangeCount === 0) return
                  const frag = sel.getRangeAt(0).cloneContents()
                  const tmp = document.createElement('div')
                  tmp.appendChild(frag)
                  const plain = serializeEditor(tmp)
                  if (plain) { e.preventDefault(); e.clipboardData.setData('text/plain', plain); sel.getRangeAt(0).deleteContents(); setPrompt(serializeEditor(taRef.current!)) }
                }}
                onPaste={e => {
                  e.preventDefault()
                  const text = e.clipboardData.getData('text/plain')
                  document.execCommand('insertText', false, text)
                }}
                onMouseMove={e => {
                  const target = e.target as HTMLElement
                  if (target.dataset.imgRef && target.dataset.refUrl) {
                    const rect = target.getBoundingClientRect()
                    setPillHover({ text: target.dataset.imgRef, url: target.dataset.refUrl, rect })
                  } else if (pillHover) {
                    setPillHover(null)
                  }
                }}
                onMouseLeave={() => setPillHover(null)}
              />
            </div>

            {/* Row 3: Controls */}
            <div className="px-4 py-2.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center gap-2">

              <div className="flex items-center gap-2 sm:flex-1 min-w-0">
                <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />

                {/* Reference image upload */}
                {modelSupportsRef && (
                  <button
                    onClick={() => refsAtMax
                      ? toast.error(`Max ${maxRefs} reference image${maxRefs === 1 ? '' : 's'} for this model`)
                      : uploadRef.current?.click()
                    }
                    title={refsAtMax ? `Max ${maxRefs} references reached` : "Add reference image"}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-md border transition-all shrink-0",
                      refsAtMax
                        ? "border-white/[0.05] text-white/20 cursor-not-allowed"
                        : "text-white/50 hover:text-white border-white/10 hover:border-white/20 hover:bg-white/[0.02]",
                    )}
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
                                  onClick={() => {
                                    const hasRefs = refOrder.length > 0 || uploadedRefs.length > 0
                                    const newSupportsRef = !!m.controls.referenceImage
                                    if (!newSupportsRef && hasRefs) {
                                      setPendingModelId(m.id)
                                      setOpenPicker(null)
                                    } else {
                                      setModelId(m.id)
                                      setOpenPicker(null)
                                    }
                                  }}
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
                                        {r === '1K' ? '1024 × 1024' : r === '2K' ? '2048 × 2048' : r === '3K' ? '3072 × 3072' : '4096 × 4096'}
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
                  className="flex items-center gap-2 h-9 px-5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all select-none shrink-0 bg-[#FFFF00] text-black cursor-pointer hover:bg-[#e6e600] shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] active:scale-[0.97]"
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
