"use client"
import React, { useState, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { GenerationAnimation } from "@/components/ui/GenerationAnimation"
import { CreditIcon } from "@/components/ui/CreditIcon"
import {
  IconArrowUp, IconLoader2, IconSparkles,
  IconDownload, IconRefresh, IconX, IconPlus, IconChevronDown, IconCheck,
} from "@tabler/icons-react"

type Count  = 1 | 2 | 4
type Aspect = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "4:5"
type PickerType = "ratio" | "style" | "model" | null

interface GridImage {
  id: string
  url: string
  aspect: Aspect
  loading: boolean
  prompt?: string
  model?: string
}
interface JRow { images: GridImage[]; height: number; widths: number[] }

// ─── Data ─────────────────────────────────────────────────────────────────────
const STYLES = ["None", "Cinematic", "Anime", "Neon", "Minimal", "Editorial"]
const STYLE_DESC: Record<string, string> = {
  "None":      "No style applied",
  "Cinematic": "Film grain, dramatic lighting",
  "Anime":     "Japanese animation",
  "Neon":      "Cyberpunk neon vibes",
  "Minimal":   "Clean & simple",
  "Editorial": "Fashion magazine",
}

const MODELS = ["Flux 1.1 Pro", "Flux Schnell", "Ideogram 2"]
type ModelInfo = { desc: string; credits: number; tag: string }
const MODEL_INFO: Record<string, ModelInfo> = {
  "Flux 1.1 Pro": { desc: "Best quality, photorealistic",  credits: 12, tag: "Premium"  },
  "Flux Schnell": { desc: "4× faster, great for drafts",   credits: 6,  tag: "Fast"     },
  "Ideogram 2":   { desc: "Typography & creative designs", credits: 10, tag: "Creative" },
}

const ASPECTS: Aspect[] = ["1:1", "4:3", "3:4", "16:9", "9:16", "4:5"]
const ASPECT_LABEL: Record<Aspect, string> = {
  "1:1": "Square", "4:3": "Landscape", "3:4": "Portrait",
  "16:9": "Wide", "9:16": "Story", "4:5": "Feed",
}
const ASPECT_NUM: Record<Aspect, number> = {
  "1:1": 1, "4:3": 4/3, "3:4": 3/4, "16:9": 16/9, "9:16": 9/16, "4:5": 4/5,
}
const PX: Record<Aspect, [number, number]> = {
  "1:1":  [512, 512], "4:3":  [640, 480], "3:4":  [480, 640],
  "16:9": [768, 432], "9:16": [432, 768], "4:5":  [480, 600],
}

// ─── Design tokens — strictly following appuicomponents.md ────────────────────

// Segmented count pills — Tier 2 (settings control): grey bg + yellow text when active
const PILL_TRACK = "flex bg-[rgb(255_255_255_/_0.04)] border border-[rgb(255_255_255_/_0.04)] p-0.5 rounded-lg"
const PILL_BASE  = "px-2 py-1.5 text-[10.5px] font-black uppercase tracking-wide rounded-md transition-all whitespace-nowrap"
const PILL_ON    = "bg-white/[0.09] text-[#FFFF00] shadow-sm"   // Tier 2: NOT full yellow fill
const PILL_OFF   = "text-gray-500 hover:text-white"

// Dropdown trigger buttons
const TRIGGER_BASE = "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all shrink-0 whitespace-nowrap select-none"
const TRIGGER_OFF  = "border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:bg-white/[0.03]"
const TRIGGER_ON   = "bg-white/[0.05] border-white/20 text-white"

const GAP = 9

function pic(seed: string, a: Aspect) {
  const [w, h] = PX[a]
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

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

// ─── Aspect ratio shape visual ────────────────────────────────────────────────
function AspectShape({ aspect, active }: { aspect: Aspect; active: boolean }) {
  const ratio = ASPECT_NUM[aspect]
  const BOX = 28
  const w = ratio >= 1 ? BOX : Math.round(BOX * ratio)
  const h = ratio >= 1 ? Math.round(BOX / ratio) : BOX
  return (
    <div style={{ width: BOX + 8, height: BOX + 8 }} className="flex items-center justify-center">
      <div
        style={{ width: w, height: h }}
        className={cn(
          "rounded-[2px] transition-all",
          active ? "bg-[#FFFF00]" : "bg-white/[0.18] border border-white/25",
        )}
      />
    </div>
  )
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED: GridImage[] = [
  { id: "s0",  url: pic("p1",  "4:5"),  aspect: "4:5",  loading: false },
  { id: "s1",  url: pic("p2",  "4:5"),  aspect: "4:5",  loading: false },
  { id: "s2",  url: pic("p3",  "16:9"), aspect: "16:9", loading: false },
  { id: "s3",  url: pic("p4",  "4:5"),  aspect: "4:5",  loading: false },
  { id: "s4",  url: pic("p5",  "1:1"),  aspect: "1:1",  loading: false },
  { id: "s5",  url: pic("p6",  "1:1"),  aspect: "1:1",  loading: false },
  { id: "s6",  url: pic("p7",  "1:1"),  aspect: "1:1",  loading: false },
  { id: "s7",  url: pic("p8",  "16:9"), aspect: "16:9", loading: false },
  { id: "s8",  url: pic("p9",  "9:16"), aspect: "9:16", loading: false },
  { id: "s9",  url: pic("p10", "4:3"),  aspect: "4:3",  loading: false },
  { id: "s10", url: pic("p11", "4:3"),  aspect: "4:3",  loading: false },
  { id: "s11", url: pic("p12", "9:16"), aspect: "9:16", loading: false },
  { id: "s12", url: pic("p13", "16:9"), aspect: "16:9", loading: false },
  { id: "s13", url: pic("p14", "3:4"),  aspect: "3:4",  loading: false },
  { id: "s14", url: pic("p15", "1:1"),  aspect: "1:1",  loading: false },
  { id: "s15", url: pic("p16", "4:5"),  aspect: "4:5",  loading: false },
  { id: "s16", url: pic("p17", "16:9"), aspect: "16:9", loading: false },
  { id: "s17", url: pic("p18", "16:9"), aspect: "16:9", loading: false },
  { id: "s18", url: pic("p19", "9:16"), aspect: "9:16", loading: false },
  { id: "s19", url: pic("p20", "4:5"),  aspect: "4:5",  loading: false },
  { id: "s20", url: pic("p21", "1:1"),  aspect: "1:1",  loading: false },
  { id: "s21", url: pic("p22", "4:3"),  aspect: "4:3",  loading: false },
  { id: "s22", url: pic("p23", "3:4"),  aspect: "3:4",  loading: false },
  { id: "s23", url: pic("p24", "16:9"), aspect: "16:9", loading: false },
  { id: "s24", url: pic("p25", "4:5"),  aspect: "4:5",  loading: false },
  { id: "s25", url: pic("p26", "9:16"), aspect: "9:16", loading: false },
  { id: "s26", url: pic("p27", "1:1"),  aspect: "1:1",  loading: false },
  { id: "s27", url: pic("p28", "4:3"),  aspect: "4:3",  loading: false },
  { id: "s28", url: pic("p29", "16:9"), aspect: "16:9", loading: false },
  { id: "s29", url: pic("p30", "3:4"),  aspect: "3:4",  loading: false },
]

// IDs that were already present on first render — never animate these
const SEED_IDS = new Set(SEED.map(s => s.id))

// ─── Image modal ──────────────────────────────────────────────────────────────
function ImageModal({ img, onClose }: { img: GridImage | null; onClose: () => void }) {
  useEffect(() => {
    if (!img) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [img, onClose])

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
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Aspect Ratio</p>
              <p className="text-sm text-white font-semibold">{img.aspect}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Resolution</p>
              <p className="text-[11px] text-white/50 font-mono">{PX[img.aspect][0]} × {PX[img.aspect][1]}</p>
            </div>
            {img.model && (
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Model</p>
                <p className="text-xs text-white/70">{img.model}</p>
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
  images, onOpen, onVary, selectedIds, onToggleSelect,
}: {
  images: GridImage[]
  onOpen: (img: GridImage) => void
  onVary: (img: GridImage) => void
  selectedIds: Set<string>
  onToggleSelect: (img: GridImage) => void
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
        // Key by first image id — stable across grid reflows so existing cells never remount
        <div key={row.images[0]!.id} style={{ display: "flex", gap: GAP, marginBottom: GAP, height: row.height }}>
          {row.images.map((img, ii) => {
            const isSelected = selectedIds.has(img.id)
            const isNew = !SEED_IDS.has(img.id)
            return (
              <div key={img.id} className="group relative"
                style={{
                  width: row.widths[ii], height: row.height, flexShrink: 0,
                  overflow: "hidden", borderRadius: 8,
                  boxShadow: isSelected ? "inset 0 0 0 2.5px #FFFF00" : "none",
                  cursor: img.loading ? "default" : "pointer",
                  // Only new (generated) cells animate in — seed images appear instantly
                  animation: isNew ? "fadeIn 0.5s ease-out both" : undefined,
                }}
                onClick={() => !img.loading && onOpen(img)}
              >
                {img.loading ? <GenerationAnimation /> : (
                  <img src={img.url} alt="" className="block w-full h-full object-cover select-none"
                    style={{ animation: "fadeIn 0.5s ease-out both" }} />
                )}

                {!img.loading && (
                  <>
                    {/* Select toggle — top-left */}
                    <button
                      onClick={e => { e.stopPropagation(); onToggleSelect(img) }}
                      title={isSelected ? "Remove from prompt" : "Add to prompt"}
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

                    {/* Hover actions — bottom-right */}
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                      <button onClick={e => { e.stopPropagation(); onVary(img) }} title="Vary"
                        className="w-7 h-7 rounded-md flex items-center justify-center text-white/70 hover:text-white transition-colors"
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
export default function ImageUIconcept1Copy2() {
  const [count,        setCount]        = useState<Count>(4)
  const [aspect,       setAspect]       = useState<Aspect>("1:1")
  const [style,        setStyle]        = useState("None")
  const [model,        setModel]        = useState("Flux 1.1 Pro")
  const [prompt,       setPrompt]       = useState("")
  const [images,       setImages]       = useState<GridImage[]>(SEED)
  const [busy,         setBusy]         = useState(false)
  const [modalImg,     setModalImg]     = useState<GridImage | null>(null)
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())
  const [uploadedRefs, setUploadedRefs] = useState<{ id: string; url: string }[]>([])
  const [openPicker,   setOpenPicker]   = useState<PickerType>(null)

  const taRef     = useRef<HTMLTextAreaElement>(null)
  const endRef    = useRef<HTMLDivElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const dockRef   = useRef<HTMLDivElement>(null)

  // Close picker on outside click
  useEffect(() => {
    if (!openPicker) return
    const fn = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setOpenPicker(null)
      }
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [openPicker])

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
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      setUploadedRefs(prev => [...prev, { id: `up-${Date.now()}-${file.name}`, url }])
    })
    e.target.value = ""
  }

  function handleGenerate() {
    if (busy || !prompt.trim()) return
    setBusy(true)
    setOpenPicker(null)
    const ts = Date.now()
    // Placeholders keep their IDs throughout — no ID swap, no row-key churn
    const placeholders: GridImage[] = Array.from({ length: count }, (_, i) => ({
      id: `ld-${ts}-${i}`, url: "", aspect, loading: true,
    }))
    setImages(prev => [...prev, ...placeholders])
    scroll()
    setTimeout(() => {
      const promptText = prompt.trim()
      const resolveTs  = Date.now()
      // Update in-place: same IDs, flip loading→false and set url
      setImages(prev => prev.map(img => {
        const idx = placeholders.findIndex(p => p.id === img.id)
        if (idx === -1) return img
        return { ...img, loading: false, url: pic(`gen${resolveTs}${idx}`, aspect), prompt: promptText, model }
      }))
      setBusy(false)
      // No scroll() here — prevents the jitter jump after completion
    }, 2800)
  }

  function handleVary(img: GridImage) {
    const placeholder: GridImage = { id: `ld-vary-${Date.now()}`, url: "", aspect: img.aspect, loading: true }
    setImages(prev => [...prev, placeholder])
    scroll()
    setTimeout(() => {
      const url = pic(`vary${Date.now()}`, img.aspect)
      // Update in-place — same ID, just flip loading off and set url
      setImages(prev => prev.map(i =>
        i.id === placeholder.id ? { ...i, loading: false, url, prompt: i.prompt, model: i.model } : i
      ))
      // No scroll() here — image is already in view
    }, 2800)
  }

  const selectedImgObjs = images.filter(img => selectedIds.has(img.id) && !img.loading)
  const allRefs = [
    ...uploadedRefs.map(r => ({ id: r.id, url: r.url, isUpload: true  })),
    ...selectedImgObjs.map(img => ({ id: img.id, url: img.url, isUpload: false })),
  ]
  const hasRefs = allRefs.length > 0

  const creditsPerImage = MODEL_INFO[model]?.credits ?? 10
  const totalCredits    = creditsPerImage * count

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-white overflow-hidden">
      <style>{`
        @keyframes fadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pickerIn { from { opacity: 0; transform: translateY(6px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>

      {/* ── Scroll area ── */}
      <div className="flex-1 overflow-y-auto pb-[200px]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-[88px]">
          {images.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
              <IconSparkles size={32} className="text-gray-700" />
              <p className="text-sm text-gray-600">Describe what you want to create</p>
            </div>
          )}
          <JustifiedGrid
            images={images} onOpen={setModalImg} onVary={handleVary}
            selectedIds={selectedIds} onToggleSelect={toggleSelect}
          />
          <div ref={endRef} />
        </div>
      </div>

      <ImageModal img={modalImg} onClose={() => setModalImg(null)} />

      {/* ══ Prompt dock — no top border, no gradient ═══════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-6 pb-5 pt-3">
        <div ref={dockRef} className="max-w-[900px] mx-auto">

          {/* ── Main dock card ── */}
          <div className={cn(
            "rounded-lg border transition-colors duration-200 bg-[#0c0c0e]",
            busy ? "border-[#FFFF00]/25" : "border-white/10",
          )}
            style={{ boxShadow: "0 -4px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.03)" }}
          >

            {/* Row 1: Reference images — ABOVE the textarea, only when present */}
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

              {/* Options group — no overflow-x:auto (it clips absolute picker panels) */}
              <div className="flex items-center gap-2 sm:flex-1 min-w-0">
                <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />

                {/* + icon-only reference button */}
                <button
                  onClick={() => uploadRef.current?.click()}
                  title="Add reference image"
                  className="w-8 h-8 flex items-center justify-center rounded-md text-white/50 hover:text-white border border-white/10 hover:border-[#FFFF00]/50 hover:bg-white/[0.02] transition-all shrink-0"
                >
                  <IconPlus size={14} strokeWidth={2.5} />
                </button>

                {/* Ratio picker */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenPicker(openPicker === "ratio" ? null : "ratio")}
                    className={cn(TRIGGER_BASE, openPicker === "ratio" ? TRIGGER_ON : TRIGGER_OFF)}
                  >
                    {aspect}
                    <IconChevronDown size={10} className={cn("transition-transform duration-150", openPicker === "ratio" && "rotate-180")} />
                  </button>
                  {openPicker === "ratio" && (
                    <div className="absolute bottom-full mb-2 left-0 z-50"
                      style={{ animation: "pickerIn 0.15s ease-out both" }}>
                      <div className="bg-[#0c0c0e] border border-white/10 rounded-lg shadow-[0_-8px_48px_rgba(0,0,0,0.9)] overflow-hidden">
                        <div className="p-3 w-[288px]">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Aspect Ratio</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {ASPECTS.map(a => {
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

                {/* Model picker */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenPicker(openPicker === "model" ? null : "model")}
                    className={cn(TRIGGER_BASE, openPicker === "model" ? TRIGGER_ON : TRIGGER_OFF)}
                  >
                    {model}
                    <IconChevronDown size={10} className={cn("transition-transform duration-150", openPicker === "model" && "rotate-180")} />
                  </button>
                  {openPicker === "model" && (
                    <div className="absolute bottom-full mb-2 left-0 z-50"
                      style={{ animation: "pickerIn 0.15s ease-out both" }}>
                      <div className="bg-[#0c0c0e] border border-white/10 rounded-lg shadow-[0_-8px_48px_rgba(0,0,0,0.9)] overflow-hidden">
                        <div className="p-2 w-[280px]">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">Model</p>
                          <div className="flex flex-col gap-1">
                            {MODELS.map(m => {
                              const info = MODEL_INFO[m]!
                              const active = model === m
                              return (
                                <button key={m}
                                  onClick={() => { setModel(m); setOpenPicker(null) }}
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-md border transition-all text-left",
                                    active
                                      ? "bg-white/[0.05] border-white/10"
                                      : "border-transparent hover:bg-white/[0.03]",
                                  )}
                                >
                                  <div className={cn(
                                    "w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 transition-all",
                                    active ? "border-[#FFFF00] bg-[#FFFF00]" : "border-white/20",
                                  )} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className={cn("text-[11px] font-semibold", active ? "text-[#FFFF00]" : "text-white/80")}>{m}</p>
                                      <span className={cn(
                                        "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                                        active ? "bg-[#FFFF00]/15 text-[#FFFF00]" : "bg-white/[0.05] text-gray-500",
                                      )}>{info.tag}</span>
                                    </div>
                                    <p className="text-[9px] text-gray-600">{info.desc}</p>
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
              </div>

              {/* Action group */}
              <div className="flex items-center gap-2.5 shrink-0">

                {/* Cost — using CreditIcon component */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <CreditIcon className="w-5 h-5 rounded" iconClassName="w-2.5 h-2.5" />
                  <span className="font-mono text-sm font-medium text-white/70 tabular-nums">{totalCredits}</span>
                </div>

                {/* Count pills — Tier 2: grey bg + yellow text */}
                <div className={cn(PILL_TRACK, "shrink-0")}>
                  {([1, 2, 4] as Count[]).map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className={cn(PILL_BASE, "w-8", count === n ? PILL_ON : PILL_OFF)}
                    >{n}</button>
                  ))}
                </div>

                <span className="hidden sm:inline text-[9px] text-gray-700 font-mono shrink-0">⌘↵</span>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={busy}
                  className={cn(
                    "flex items-center gap-2 h-9 px-5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all select-none shrink-0",
                    busy
                      ? "bg-[#FFFF00]/50 text-black/40 cursor-not-allowed"
                      : "bg-[#FFFF00] text-black cursor-pointer hover:bg-[#e6e600] shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] active:scale-[0.97]",
                  )}
                >
                  {busy
                    ? <><IconLoader2 size={12} className="animate-spin" /> Generating</>
                    : <><IconArrowUp size={12} strokeWidth={2.8} /> Generate</>
                  }
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
