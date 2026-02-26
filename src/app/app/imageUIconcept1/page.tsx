"use client"
import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { GenerationAnimation } from "@/components/ui/GenerationAnimation"
import {
  IconArrowUp, IconLoader2, IconChevronDown, IconCheck, IconSparkles,
  IconDownload, IconRefresh, IconX,
} from "@tabler/icons-react"

type Count  = 1 | 2 | 4
type Aspect = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "4:5"

interface GridImage {
  id: string
  url: string
  aspect: Aspect
  loading: boolean
  prompt?: string
  model?: string
}

const STYLES = ["None", "Cinematic", "Anime", "Neon", "Minimal", "Editorial"]
const MODELS = ["Flux 1.1 Pro", "Flux Schnell", "Ideogram 2"]

const ASPECT_NUM: Record<Aspect, number> = {
  "1:1": 1, "4:3": 4 / 3, "3:4": 3 / 4,
  "16:9": 16 / 9, "9:16": 9 / 16, "4:5": 4 / 5,
}
const ASPECTS: Aspect[] = ["1:1", "4:3", "3:4", "16:9", "9:16", "4:5"]
const PX: Record<Aspect, [number, number]> = {
  "1:1": [512, 512], "4:3": [640, 480], "3:4": [480, 640],
  "16:9": [768, 432], "9:16": [432, 768], "4:5": [480, 600],
}

const ROW_H = 260
const CELL_PAD = 8

function pic(seed: string, a: Aspect) {
  const [w, h] = PX[a]
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

const SEED: GridImage[] = [
  { id: "s0",  url: pic("astro1",  "4:5"),  aspect: "4:5",  loading: false },
  { id: "s1",  url: pic("astro2",  "4:5"),  aspect: "4:5",  loading: false },
  { id: "s2",  url: pic("astro3",  "4:5"),  aspect: "4:5",  loading: false },
  { id: "s3",  url: pic("astro4",  "4:5"),  aspect: "4:5",  loading: false },
  { id: "s4",  url: pic("nb1",     "1:1"),  aspect: "1:1",  loading: false },
  { id: "s5",  url: pic("nb2",     "1:1"),  aspect: "1:1",  loading: false },
  { id: "s6",  url: pic("nb3",     "1:1"),  aspect: "1:1",  loading: false },
  { id: "s7",  url: pic("nb4",     "1:1"),  aspect: "1:1",  loading: false },
  { id: "s8",  url: pic("coral1",  "16:9"), aspect: "16:9", loading: false },
  { id: "s9",  url: pic("coral2",  "16:9"), aspect: "16:9", loading: false },
  { id: "s10", url: pic("coral3",  "16:9"), aspect: "16:9", loading: false },
  { id: "s11", url: pic("coral4",  "16:9"), aspect: "16:9", loading: false },
  { id: "s12", url: pic("mix1",    "4:5"),  aspect: "4:5",  loading: false },
  { id: "s13", url: pic("mix2",    "16:9"), aspect: "16:9", loading: false },
  { id: "s14", url: pic("mix3",    "1:1"),  aspect: "1:1",  loading: false },
  { id: "s15", url: pic("mix4",    "9:16"), aspect: "9:16", loading: false },
  { id: "s16", url: pic("mist1",   "9:16"), aspect: "9:16", loading: false },
  { id: "s17", url: pic("mist2",   "9:16"), aspect: "9:16", loading: false },
  { id: "s18", url: pic("mist3",   "9:16"), aspect: "9:16", loading: false },
  { id: "s19", url: pic("mist4",   "9:16"), aspect: "9:16", loading: false },
  { id: "s20", url: pic("cyber1",  "16:9"), aspect: "16:9", loading: false },
  { id: "s21", url: pic("cyber2",  "4:3"),  aspect: "4:3",  loading: false },
  { id: "s22", url: pic("cyber3",  "3:4"),  aspect: "3:4",  loading: false },
  { id: "s23", url: pic("cyber4",  "1:1"),  aspect: "1:1",  loading: false },
  { id: "s24", url: pic("cherry1", "4:3"),  aspect: "4:3",  loading: false },
  { id: "s25", url: pic("cherry2", "16:9"), aspect: "16:9", loading: false },
  { id: "s26", url: pic("geo1",    "1:1"),  aspect: "1:1",  loading: false },
  { id: "s27", url: pic("geo2",    "4:5"),  aspect: "4:5",  loading: false },
]

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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90"
        style={{ backdropFilter: "blur(20px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 flex w-full max-w-5xl bg-[#0c0c0e] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.9)]"
        style={{ maxHeight: "88vh" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.1] text-white/40 hover:text-white hover:bg-white/[0.1] transition-all"
        >
          <IconX size={14} />
        </button>

        {/* Left — image preview */}
        <div className="flex-1 flex items-center justify-center bg-black/40 p-8 min-h-[360px]">
          <img
            src={img.url}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }}
          />
        </div>

        {/* Right — sidebar */}
        <div className="w-[260px] shrink-0 border-l border-white/[0.07] flex flex-col">
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {img.prompt && (
              <div>
                <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold mb-1.5">Prompt</p>
                <p className="text-[12px] text-white/70 leading-relaxed">{img.prompt}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold mb-1.5">Aspect Ratio</p>
              <p className="text-[13px] text-white font-semibold">{img.aspect}</p>
            </div>
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold mb-1.5">Resolution</p>
              <p className="text-[11px] text-white/55 font-mono">{PX[img.aspect][0]} × {PX[img.aspect][1]}</p>
            </div>
            {img.model && (
              <div>
                <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold mb-1.5">Model</p>
                <p className="text-[12px] text-white/70">{img.model}</p>
              </div>
            )}
          </div>

          {/* Download CTA */}
          <div className="p-5 border-t border-white/[0.07]">
            <a
              href={img.url}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 bg-white text-black text-[13px] font-bold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              <IconDownload size={14} /> Download
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Dropdown<T extends string>({ label, value, options, onChange }: {
  label?: string; value: T; options: T[]; onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[12px] font-semibold transition-all border",
          open
            ? "bg-white/[0.09] border-white/[0.15] text-white"
            : "bg-transparent border-white/[0.09] text-white/50 hover:text-white/80 hover:border-white/[0.15] hover:bg-white/[0.05]"
        )}
      >
        {label && <span className="text-[9px] text-white/25 uppercase tracking-wide font-black">{label}</span>}
        <span>{value}</span>
        <IconChevronDown size={11} className={cn("text-white/25 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 min-w-[156px] bg-[#1d1d22] border border-white/[0.1] rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden z-50">
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false) }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-[12.5px] transition-colors flex items-center justify-between gap-3",
                opt === value
                  ? "text-[#FFFF00] bg-[#FFFF00]/[0.06] font-semibold"
                  : "text-white/55 hover:text-white hover:bg-white/[0.04] font-medium"
              )}
            >
              {opt}
              {opt === value && <IconCheck size={11} className="text-[#FFFF00] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ImageCard ────────────────────────────────────────────────────────────────
function ImageCard({ img, onOpen, onVary }: {
  img: GridImage
  onOpen: () => void
  onVary: () => void
}) {
  const ratio = ASPECT_NUM[img.aspect]

  if (img.loading) {
    // Parent must be `relative` for GenerationAnimation (absolute inset-0)
    return (
      <div
        className="relative overflow-hidden rounded-[16px]"
        style={{
          width: `${ROW_H * ratio}px`,
          maxWidth: "100%",
          aspectRatio: ratio,
          border: "1.5px solid rgba(255,255,255,0.07)",
        }}
      >
        <GenerationAnimation />
      </div>
    )
  }

  return (
    <div
      className="relative group overflow-hidden rounded-[16px] cursor-pointer"
      onClick={onOpen}
      style={{
        width: `${ROW_H * ratio}px`,
        maxWidth: "100%",
        aspectRatio: ratio,
        border: "1.5px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 22px rgba(0,0,0,0.55), 0 1px 5px rgba(0,0,0,0.35)",
      }}
    >
      <img
        src={img.url} alt=""
        className="block w-full h-full object-cover select-none"
        loading="lazy"
      />

      {/* Minimal floating actions — no overlay, just small buttons bottom-right */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
        <button
          onClick={e => { e.stopPropagation(); onVary() }}
          title="Generate variation"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
          style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.14)" }}
        >
          <IconRefresh size={11} />
        </button>
        <a
          href={img.url}
          download
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          title="Download"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
          style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.14)" }}
        >
          <IconDownload size={11} />
        </a>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ImageUIConcept1() {
  const [count,    setCount]    = useState<Count>(4)
  const [aspect,   setAspect]   = useState<Aspect>("1:1")
  const [style,    setStyle]    = useState("None")
  const [model,    setModel]    = useState("Flux 1.1 Pro")
  const [prompt,   setPrompt]   = useState("")
  const [images,   setImages]   = useState<GridImage[]>(SEED)
  const [busy,     setBusy]     = useState(false)
  const [modalImg, setModalImg] = useState<GridImage | null>(null)

  const taRef  = useRef<HTMLTextAreaElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  function scroll() {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80)
  }

  function handleGenerate() {
    if (busy || !prompt.trim()) return
    setBusy(true)
    const placeholders: GridImage[] = Array.from({ length: count }, (_, i) => ({
      id: `ld-${Date.now()}-${i}`, url: "", aspect, loading: true,
    }))
    setImages(prev => [...prev, ...placeholders])
    scroll()
    setTimeout(() => {
      const resolved: GridImage[] = placeholders.map((_, i) => ({
        id: `img-${Date.now()}-${i}`,
        url: pic(`gen${Date.now()}${i}`, aspect),
        aspect, loading: false,
        prompt: prompt.trim(),
        model,
      }))
      setImages(prev => {
        const ids = new Set(placeholders.map(p => p.id))
        return [...prev.filter(img => !ids.has(img.id)), ...resolved]
      })
      setBusy(false)
      scroll()
    }, 2800)
  }

  function handleVary(img: GridImage) {
    const placeholder: GridImage = {
      id: `ld-vary-${Date.now()}`, url: "", aspect: img.aspect, loading: true,
    }
    setImages(prev => [...prev, placeholder])
    scroll()
    setTimeout(() => {
      const resolved: GridImage = {
        id: `vary-${Date.now()}`,
        url: pic(`vary${Date.now()}`, img.aspect),
        aspect: img.aspect, loading: false,
        prompt: img.prompt, model: img.model,
      }
      setImages(prev => prev.map(i => i.id === placeholder.id ? resolved : i))
      scroll()
    }, 2800)
  }

  useEffect(() => {
    const el = taRef.current; if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }, [prompt])

  return (
    <div className="flex flex-col h-screen bg-[#0c0c0e] text-white overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-[230px]">
        <div className="max-w-[1400px] mx-auto px-8 pt-6">
          {images.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
              <IconSparkles size={32} className="text-white/10" />
              <p className="text-sm text-white/20">Describe what you want to create</p>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gridAutoRows: ROW_H,
              gap: 8,
            }}
          >
            {images.map(img => (
              <div
                key={img.id}
                className="flex items-center justify-center"
                style={{ minWidth: 0, overflow: "hidden", padding: CELL_PAD }}
              >
                <ImageCard
                  img={img}
                  onOpen={() => !img.loading && setModalImg(img)}
                  onVary={() => handleVary(img)}
                />
              </div>
            ))}
          </div>

          <div ref={endRef} />
        </div>
      </div>

      <ImageModal img={modalImg} onClose={() => setModalImg(null)} />

      {/* Prompt dock */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-5 pt-14 pointer-events-none"
        style={{ background: "linear-gradient(to top, #0c0c0e 58%, rgba(12,12,14,0) 100%)" }}
      >
        <div className="max-w-[900px] mx-auto pointer-events-auto">
          <div className={cn(
            "rounded-2xl border transition-colors duration-200",
            "bg-[#17171b] shadow-[0_8px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.04)]",
            busy ? "border-[#FFFF00]/15" : "border-white/[0.1]"
          )}>
            <div className="relative px-5 pt-4 pb-14">
              <textarea
                ref={taRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate() }}
                placeholder="Describe what you want to create…"
                rows={2}
                className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 resize-none outline-none leading-[1.65]"
                style={{ minHeight: 48, maxHeight: 120, overflowY: "auto" }}
              />
              <button
                onClick={handleGenerate}
                disabled={busy || !prompt.trim()}
                className={cn(
                  "absolute bottom-3.5 right-4 flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-bold transition-all duration-150 select-none",
                  busy || !prompt.trim()
                    ? "bg-white/[0.04] text-white/20 cursor-not-allowed border border-white/[0.07]"
                    : "bg-[#FFFF00] text-black hover:bg-[#f8f800] active:scale-[0.97] shadow-[0_2px_28px_rgba(255,255,0,0.3)] cursor-pointer"
                )}
              >
                {busy
                  ? <><IconLoader2 size={14} className="animate-spin" />Generating…</>
                  : <><IconArrowUp size={14} strokeWidth={2.5} />Generate</>
                }
              </button>
            </div>
            <div className="h-px bg-white/[0.055] mx-4" />
            <div className="px-3 py-2 flex items-center gap-2">
              <Dropdown label="Ratio" value={aspect} options={ASPECTS as string[] as any} onChange={setAspect} />
              <Dropdown label="Style" value={style} options={STYLES as string[] as any} onChange={setStyle} />
              <Dropdown label="Model" value={model} options={MODELS as string[] as any} onChange={setModel} />
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/25 font-medium">Images</span>
                <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5">
                  {([1, 2, 4] as Count[]).map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className={cn(
                        "w-8 h-6 rounded-lg text-[12px] font-bold transition-all",
                        count === n ? "bg-[#FFFF00] text-black" : "text-white/28 hover:text-white/65"
                      )}
                    >{n}</button>
                  ))}
                </div>
              </div>
              <span className="text-[9px] text-white/[0.12] font-mono pl-1">⌘↵</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
