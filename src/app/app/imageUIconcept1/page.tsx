"use client"
import React, { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { GenerationAnimation } from "@/components/ui/GenerationAnimation"
import {
  IconArrowUp, IconLoader2, IconDownload,
  IconCheck, IconPlus, IconChevronDown,
  IconZoomIn, IconRefresh, IconSparkles,
} from "@tabler/icons-react"

type Count   = 1 | 2 | 4
type Aspect  = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "4:5"
type GenType = "generate" | "upscale" | "vary"

interface GenImage { id: string; url: string; loading: boolean; aspect: Aspect }
interface Generation {
  id: string; type: GenType; prompt: string
  aspect: Aspect; count: Count; model: string; style: string
  images: GenImage[]; createdAt: number
}

const STYLES = ["None", "Cinematic", "Anime", "Neon", "Minimal", "Editorial"]
const MODELS = ["Flux 1.1 Pro", "Flux Schnell", "Ideogram 2"]

// Numeric aspect ratio — used to size each ImageCard proportionally
const ASPECT_NUM: Record<Aspect, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "4:5": 4 / 5,
}

const ASPECT_SHAPES: Record<Aspect, [number, number]> = {
  "1:1": [17, 17], "4:3": [22, 16], "3:4": [16, 22],
  "16:9": [26, 14], "9:16": [14, 26], "4:5": [17, 22],
}

const PX: Record<Aspect, [number, number]> = {
  "1:1": [512, 512], "4:3": [640, 480], "3:4": [480, 640],
  "16:9": [768, 432], "9:16": [432, 768], "4:5": [480, 600],
}

// Fixed row height. ImageCard width = ROW_H × ratio (capped by max-width).
// This creates BoxFit.contain on the card itself — card matches image's natural ratio,
// centered in the uniform grid cell.
const ROW_H = 260
const CELL_PAD = 8  // padding inside each grid cell (shows the contain effect)

function pic(seed: string, a: Aspect) {
  const [w, h] = PX[a]
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

// ─── Seed data: 8 rows covering every ratio combination ──────────────────────
const SEED: Generation[] = [
  // Row 1 — all portrait 4:5
  {
    id: "g0", type: "generate",
    prompt: "lone astronaut reading in an ancient library, volumetric dust, god-rays",
    aspect: "4:5", count: 4, model: "Flux 1.1 Pro", style: "Cinematic",
    images: [
      { id: "g0-0", url: pic("astro1", "4:5"), loading: false, aspect: "4:5" },
      { id: "g0-1", url: pic("astro2", "4:5"), loading: false, aspect: "4:5" },
      { id: "g0-2", url: pic("astro3", "4:5"), loading: false, aspect: "4:5" },
      { id: "g0-3", url: pic("astro4", "4:5"), loading: false, aspect: "4:5" },
    ],
    createdAt: Date.now() - 7_200_000,
  },
  // Row 2 — all square 1:1
  {
    id: "g1", type: "generate",
    prompt: "neon bonsai in dark rain, puddle reflections, shallow depth of field",
    aspect: "1:1", count: 4, model: "Flux 1.1 Pro", style: "None",
    images: [
      { id: "g1-0", url: pic("nb1", "1:1"), loading: false, aspect: "1:1" },
      { id: "g1-1", url: pic("nb2", "1:1"), loading: false, aspect: "1:1" },
      { id: "g1-2", url: pic("nb3", "1:1"), loading: false, aspect: "1:1" },
      { id: "g1-3", url: pic("nb4", "1:1"), loading: false, aspect: "1:1" },
    ],
    createdAt: Date.now() - 5_400_000,
  },
  // Row 3 — all landscape 16:9
  {
    id: "g2", type: "generate",
    prompt: "coral reef at golden hour, underwater cathedral light, wide angle lens",
    aspect: "16:9", count: 4, model: "Flux 1.1 Pro", style: "None",
    images: [
      { id: "g2-0", url: pic("coral1", "16:9"), loading: false, aspect: "16:9" },
      { id: "g2-1", url: pic("coral2", "16:9"), loading: false, aspect: "16:9" },
      { id: "g2-2", url: pic("coral3", "16:9"), loading: false, aspect: "16:9" },
      { id: "g2-3", url: pic("coral4", "16:9"), loading: false, aspect: "16:9" },
    ],
    createdAt: Date.now() - 3_600_000,
  },
  // Row 4 — mixed: portrait + widescreen + square + tall vertical
  {
    id: "g3", type: "generate",
    prompt: "dreamy coastal city at dusk — four different framings in one generation",
    aspect: "1:1", count: 4, model: "Flux Schnell", style: "Editorial",
    images: [
      { id: "g3-0", url: pic("mix1", "4:5"),  loading: false, aspect: "4:5"  },
      { id: "g3-1", url: pic("mix2", "16:9"), loading: false, aspect: "16:9" },
      { id: "g3-2", url: pic("mix3", "1:1"),  loading: false, aspect: "1:1"  },
      { id: "g3-3", url: pic("mix4", "9:16"), loading: false, aspect: "9:16" },
    ],
    createdAt: Date.now() - 2_400_000,
  },
  // Row 5 — all tall vertical 9:16
  {
    id: "g4", type: "generate",
    prompt: "misty mountain peaks, golden fog, telephoto lens, serene minimalism",
    aspect: "9:16", count: 4, model: "Ideogram 2", style: "Minimal",
    images: [
      { id: "g4-0", url: pic("mist1", "9:16"), loading: false, aspect: "9:16" },
      { id: "g4-1", url: pic("mist2", "9:16"), loading: false, aspect: "9:16" },
      { id: "g4-2", url: pic("mist3", "9:16"), loading: false, aspect: "9:16" },
      { id: "g4-3", url: pic("mist4", "9:16"), loading: false, aspect: "9:16" },
    ],
    createdAt: Date.now() - 1_800_000,
  },
  // Row 6 — mixed: widescreen + 4:3 + 3:4 + square
  {
    id: "g5", type: "generate",
    prompt: "cyberpunk city at night, rain-slicked streets, neon signs glowing",
    aspect: "16:9", count: 4, model: "Flux 1.1 Pro", style: "Neon",
    images: [
      { id: "g5-0", url: pic("cyber1", "16:9"), loading: false, aspect: "16:9" },
      { id: "g5-1", url: pic("cyber2", "4:3"),  loading: false, aspect: "4:3"  },
      { id: "g5-2", url: pic("cyber3", "3:4"),  loading: false, aspect: "3:4"  },
      { id: "g5-3", url: pic("cyber4", "1:1"),  loading: false, aspect: "1:1"  },
    ],
    createdAt: Date.now() - 1_200_000,
  },
  // Row 7 — 2 images: 4:3 + 16:9 (empty cells 3 & 4 visible)
  {
    id: "g6", type: "generate",
    prompt: "cherry blossoms in moonlight, impressionist painting, pink and silver",
    aspect: "4:3", count: 2, model: "Ideogram 2", style: "Anime",
    images: [
      { id: "g6-0", url: pic("cherry1", "4:3"),  loading: false, aspect: "4:3"  },
      { id: "g6-1", url: pic("cherry2", "16:9"), loading: false, aspect: "16:9" },
    ],
    createdAt: Date.now() - 600_000,
  },
  // Row 8 — 1 image only: square (3 empty cells)
  {
    id: "g7", type: "generate",
    prompt: "abstract geometric luxury pattern, deep purple and gold, editorial",
    aspect: "1:1", count: 1, model: "Flux 1.1 Pro", style: "Editorial",
    images: [
      { id: "g7-0", url: pic("geo1", "1:1"), loading: false, aspect: "1:1" },
    ],
    createdAt: Date.now() - 120_000,
  },
]

// ─── AspectPicker ─────────────────────────────────────────────────────────────
function AspectPicker({ value, onChange }: { value: Aspect; onChange: (v: Aspect) => void }) {
  const all: Aspect[] = ["1:1", "4:3", "3:4", "16:9", "9:16", "4:5"]
  return (
    <div className="flex items-center gap-0.5">
      {all.map(a => {
        const [w, h] = ASPECT_SHAPES[a]
        const active = a === value
        return (
          <button key={a} onClick={() => onChange(a)} title={a}
            className={cn(
              "flex flex-col items-center gap-[5px] px-2.5 py-2 rounded-xl transition-all select-none",
              active
                ? "bg-[#FFFF00]/[0.09] text-[#FFFF00]"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
            )}
          >
            <div className="rounded-[3px] border-[1.5px] transition-colors"
              style={{ width: w, height: h, borderColor: active ? "#FFFF00" : "currentColor" }} />
            <span className="text-[8.5px] font-bold tracking-wide leading-none">{a}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown<T extends string>({
  label, value, options, onChange,
}: { label?: string; value: T; options: T[]; onChange: (v: T) => void }) {
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
// BoxFit.contain behavior on the card itself:
//   width  = ROW_H × aspectRatio   (desired natural size at full row height)
//   max-width: 100%                 (cap if landscape is wider than cell)
//   aspect-ratio                    (height adjusts from constrained width)
//
// The card is EXACTLY the image's natural proportions — no dead space inside the card.
// The grid cell (uniform size) holds it centered, with CELL_PAD breathing room.
// ─────────────────────────────────────────────────────────────────────────────
function ImageCard({
  img, referenced, onRef, onUpscale, onVary,
}: {
  img: GenImage; referenced: boolean
  onRef: () => void; onUpscale: () => void; onVary: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const ratio = ASPECT_NUM[img.aspect]

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    setTilt({
      x: ((e.clientY - r.top) / r.height - 0.5) * -10,
      y: ((e.clientX - r.left) / r.width - 0.5) * 10,
    })
  }, [])

  if (img.loading) {
    return (
      <div
        className="overflow-hidden rounded-[16px]"
        style={{
          width: `${ROW_H * ratio}px`,
          maxWidth: "100%",
          aspectRatio: ratio,
        }}
      >
        <GenerationAnimation />
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden cursor-pointer"
      style={{
        // ── BoxFit.contain sizing ──
        width: `${ROW_H * ratio}px`,
        maxWidth: "100%",
        aspectRatio: ratio,
        // ── Visual styling ──
        borderRadius: 16,
        border: referenced
          ? "2px solid #FFFF00"
          : "1.5px solid rgba(255,255,255,0.08)",
        boxShadow: hovered
          ? "0 20px 48px rgba(0,0,0,0.75), 0 4px 14px rgba(0,0,0,0.5)"
          : "0 4px 22px rgba(0,0,0,0.55), 0 1px 5px rgba(0,0,0,0.35)",
        // ── 3D tilt ──
        transform: hovered
          ? `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04)`
          : "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)",
        transition: hovered
          ? "transform 0.08s ease-out, box-shadow 0.22s ease"
          : "transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.22s ease",
        willChange: "transform",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false) }}
    >
      {/* Image fills the card exactly — no cropping, no empty space inside */}
      <img
        src={img.url} alt=""
        className="block w-full h-full object-cover select-none pointer-events-none"
        style={{
          transform: hovered ? "scale(1.06)" : "scale(1)",
          transition: "transform 0.55s cubic-bezier(0.23,1,0.32,1)",
        }}
        loading="lazy"
      />

      {/* Hover overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/20 pointer-events-none" />
        {/* Top-right actions */}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-10">
          <button
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-lg bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
          >
            <IconDownload size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRef() }}
            className={cn(
              "w-7 h-7 rounded-lg backdrop-blur-md border flex items-center justify-center transition-all",
              referenced
                ? "bg-[#FFFF00] border-[#FFFF00] text-black"
                : "bg-black/55 border-white/20 text-white/70 hover:text-white hover:bg-white/20"
            )}
          >
            {referenced ? <IconCheck size={12} /> : <IconPlus size={12} />}
          </button>
        </div>
        {/* Bottom actions */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex gap-1.5 z-10">
          <button
            onClick={e => { e.stopPropagation(); onUpscale() }}
            className="flex-1 h-7 rounded-lg bg-black/55 backdrop-blur-md border border-white/[0.18] text-[10.5px] font-semibold text-white/80 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center gap-1"
          >
            <IconZoomIn size={11} /> Upscale
          </button>
          <button
            onClick={e => { e.stopPropagation(); onVary() }}
            className="flex-1 h-7 rounded-lg bg-black/55 backdrop-blur-md border border-white/[0.18] text-[10.5px] font-semibold text-white/80 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center gap-1"
          >
            <IconRefresh size={11} /> Vary
          </button>
        </div>
      </div>

      {/* Selected ring */}
      {referenced && (
        <div className="absolute inset-0 ring-2 ring-[#FFFF00] ring-inset pointer-events-none"
          style={{ borderRadius: 16 }} />
      )}
    </div>
  )
}

// ─── GenRow ───────────────────────────────────────────────────────────────────
// Even 4-column grid (repeat(4, 1fr)) — all cells the same size.
// Each cell centers its ImageCard with CELL_PAD padding.
// The ImageCard does BoxFit.contain: sized to image ratio, never exceeds cell.
// ─────────────────────────────────────────────────────────────────────────────
function GenRow({
  gen, refIds, onRef, onUpscale, onVary,
}: {
  gen: Generation
  refIds: Set<string>
  onRef: (id: string) => void
  onUpscale: (img: GenImage, gen: Generation) => void
  onVary: (img: GenImage, gen: Generation) => void
}) {
  return (
    <div className="mb-5">
      {/* Prompt label */}
      <div className="flex items-center gap-2 mb-1.5 px-0.5">
        <div className="w-1.5 h-1.5 rounded-full bg-white/10 shrink-0" />
        <p className="text-[10.5px] text-white/20 font-medium truncate leading-none">{gen.prompt}</p>
        <span className="text-[9px] text-white/12 font-mono shrink-0 pl-1">{gen.model}</span>
      </div>

      {/* Uniform 4-column grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          height: ROW_H,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => {
          const img = gen.images[i]
          return (
            <div
              key={img?.id ?? `empty-${i}`}
              className="flex items-center justify-center w-full h-full"
              style={{ padding: CELL_PAD, minWidth: 0, overflow: "hidden" }}
            >
              {img ? (
                <ImageCard
                  img={img}
                  referenced={refIds.has(img.id)}
                  onRef={() => onRef(img.id)}
                  onUpscale={() => onUpscale(img, gen)}
                  onVary={() => onVary(img, gen)}
                />
              ) : (
                /* Empty cell ghost — visible to show grid structure */
                <div
                  className="w-full h-full rounded-[14px]"
                  style={{
                    border: "1.5px dashed rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.015)",
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ImageUIConcept1() {
  const [count,  setCount]  = useState<Count>(4)
  const [aspect, setAspect] = useState<Aspect>("1:1")
  const [style,  setStyle]  = useState("None")
  const [model,  setModel]  = useState("Flux 1.1 Pro")
  const [prompt, setPrompt] = useState("")
  const [gens,   setGens]   = useState<Generation[]>(SEED)
  const [refIds, setRefIds] = useState<Set<string>>(new Set())
  const [busy,   setBusy]   = useState(false)

  const taRef  = useRef<HTMLTextAreaElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  function toggleRef(id: string) {
    setRefIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  function scroll() {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80)
  }
  function addGen(g: Generation)    { setGens(p => [...p, g]); scroll() }
  function resolveGen(id: string, images: GenImage[]) {
    setGens(p => p.map(g => g.id === id ? { ...g, images } : g)); scroll()
  }

  function run(overrides: Partial<Generation>, finalImages: () => GenImage[]) {
    const a   = (overrides.aspect ?? aspect) as Aspect
    const cnt = (overrides.count  ?? count)  as Count
    const loading: GenImage[] = Array.from({ length: cnt }, (_, i) => ({
      id: `ld${Date.now()}${i}`, url: "", loading: true, aspect: a,
    }))
    const g: Generation = {
      id: `g${Date.now()}`, type: "generate", prompt: prompt.trim(),
      aspect, count, model, style, images: loading, createdAt: Date.now(), ...overrides,
    }
    addGen(g)
    setTimeout(() => resolveGen(g.id, finalImages()), 2800)
  }

  function handleGenerate() {
    if (busy || !prompt.trim()) return
    setBusy(true)
    run({}, () => Array.from({ length: count }, (_, i) => ({
      id: `gn${Date.now()}${i}`,
      url: pic(`gen${Date.now()}${i}`, aspect),
      loading: false, aspect,
    })))
    setTimeout(() => setBusy(false), 2800)
  }

  function handleUpscale(img: GenImage, src: Generation) {
    run(
      { type: "upscale", prompt: src.prompt, aspect: src.aspect, model: src.model, style: src.style, count: 4 },
      () => Array.from({ length: 4 }, (_, i) => ({
        id: `up${Date.now()}${i}`,
        url: pic(`up${Date.now()}${i}`, src.aspect),
        loading: false, aspect: src.aspect,
      }))
    )
  }

  function handleVary(img: GenImage, src: Generation) {
    run(
      { type: "vary", prompt: src.prompt, aspect: src.aspect, model: src.model, style: src.style, count: 4 },
      () => Array.from({ length: 4 }, (_, i) => ({
        id: `v${Date.now()}${i}`,
        url: pic(`vary${Date.now()}${i}`, src.aspect),
        loading: false, aspect: src.aspect,
      }))
    )
  }

  useEffect(() => {
    const el = taRef.current; if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }, [prompt])

  return (
    <div className="flex flex-col h-screen bg-[#0c0c0e] text-white overflow-hidden">
      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto pb-[230px]">
        <div className="max-w-[1040px] mx-auto px-4 pt-6">
          {gens.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
              <IconSparkles size={32} className="text-white/10" />
              <p className="text-sm text-white/20">Describe what you want to create</p>
            </div>
          )}
          {gens.map(gen => (
            <GenRow
              key={gen.id}
              gen={gen}
              refIds={refIds}
              onRef={toggleRef}
              onUpscale={handleUpscale}
              onVary={handleVary}
            />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Fixed prompt dock */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-5 pt-14 pointer-events-none"
        style={{ background: "linear-gradient(to top, #0c0c0e 58%, rgba(12,12,14,0) 100%)" }}
      >
        <div className="max-w-[860px] mx-auto pointer-events-auto">
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
              <AspectPicker value={aspect} onChange={setAspect} />
              <div className="w-px h-5 bg-white/[0.1] mx-1 shrink-0" />
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
              <span className="text-[9px] text-white/12 font-mono pl-1">⌘↵</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
