"use client"
import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { GenerationAnimation } from "@/components/ui/GenerationAnimation"
import {
  IconArrowUp, IconLoader2, IconDownload,
  IconCheck, IconPlus, IconChevronDown,
  IconZoomIn, IconRefresh, IconSparkles,
} from "@tabler/icons-react"

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────
type Count   = 1 | 2 | 4
type Aspect  = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "4:5"
type GenType = "generate" | "upscale" | "vary"

interface GenImage { id: string; url: string; loading: boolean }
interface Generation {
  id: string; type: GenType; prompt: string
  aspect: Aspect; count: Count; model: string; style: string
  images: GenImage[]; createdAt: number
}

const STYLES = ["None", "Cinematic", "Anime", "Neon", "Minimal", "Editorial"]
const MODELS = ["Flux 1.1 Pro", "Flux Schnell", "Ideogram 2"]

// CSS aspect-ratio per mode — images render at natural proportions
const ASPECT_CSS: Record<Aspect, string> = {
  "1:1": "1 / 1", "4:3": "4 / 3", "3:4": "3 / 4",
  "16:9": "16 / 9", "9:16": "9 / 16", "4:5": "4 / 5",
}

// Small visual [w, h] shapes for the aspect picker
const ASPECT_SHAPES: Record<Aspect, [number, number]> = {
  "1:1": [17, 17], "4:3": [22, 16], "3:4": [16, 22],
  "16:9": [26, 14], "9:16": [14, 26], "4:5": [17, 22],
}

const PX: Record<Aspect, [number, number]> = {
  "1:1":[512,512],"4:3":[640,480],"3:4":[480,640],
  "16:9":[768,432],"9:16":[432,768],"4:5":[480,600],
}

function pic(seed: string, a: Aspect) {
  const [w, h] = PX[a]; return `https://picsum.photos/seed/${seed}/${w}/${h}`
}
function ago(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  return `${Math.floor(s/3600)}h ago`
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────
const SEED: Generation[] = [
  {
    id:"g0", type:"generate",
    prompt:"a lone astronaut reading in an ancient library, volumetric dust, god-rays",
    aspect:"4:5", count:1, model:"Flux 1.1 Pro", style:"Cinematic",
    images:[{id:"g0-0", url:pic("astro1","4:5"), loading:false}],
    createdAt: Date.now()-1_800_000,
  },
  {
    id:"g1", type:"generate",
    prompt:"neon bonsai in dark rain, puddle reflections, shallow depth of field",
    aspect:"1:1", count:4, model:"Flux 1.1 Pro", style:"None",
    images:[
      {id:"g1-0",url:pic("nb1","1:1"),loading:false},
      {id:"g1-1",url:pic("nb2","1:1"),loading:false},
      {id:"g1-2",url:pic("nb3","1:1"),loading:false},
      {id:"g1-3",url:pic("nb4","1:1"),loading:false},
    ],
    createdAt: Date.now()-900_000,
  },
  {
    id:"g2", type:"generate",
    prompt:"coral reef at golden hour, underwater cathedral light, wide angle",
    aspect:"16:9", count:2, model:"Flux 1.1 Pro", style:"None",
    images:[
      {id:"g2-0",url:pic("coral1","16:9"),loading:false},
      {id:"g2-1",url:pic("coral2","16:9"),loading:false},
    ],
    createdAt: Date.now()-120_000,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Aspect ratio picker — visual shape buttons
// ─────────────────────────────────────────────────────────────────────────────
function AspectPicker({ value, onChange }: { value: Aspect; onChange: (v: Aspect) => void }) {
  const all: Aspect[] = ["1:1", "4:3", "3:4", "16:9", "9:16", "4:5"]
  return (
    <div className="flex items-center gap-0.5">
      {all.map(a => {
        const [w, h] = ASPECT_SHAPES[a]
        const active = a === value
        return (
          <button
            key={a}
            onClick={() => onChange(a)}
            title={a}
            className={cn(
              "flex flex-col items-center gap-[5px] px-2.5 py-2 rounded-xl transition-all select-none",
              active
                ? "bg-[#FFFF00]/[0.09] text-[#FFFF00]"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
            )}
          >
            <div
              className="rounded-[3px] border-[1.5px] transition-colors"
              style={{
                width: w, height: h,
                borderColor: active ? "#FFFF00" : "currentColor",
              }}
            />
            <span className="text-[8.5px] font-bold tracking-wide leading-none">{a}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown
// ─────────────────────────────────────────────────────────────────────────────
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
      <button
        onClick={() => setOpen(v => !v)}
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
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
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

// ─────────────────────────────────────────────────────────────────────────────
// Image cell — actions split: top-right (download + ref), bottom (upscale + vary)
// ─────────────────────────────────────────────────────────────────────────────
function ImageCell({
  img, referenced, onRef, onUpscale, onVary,
}: {
  img: GenImage; referenced: boolean
  onRef: () => void; onUpscale: () => void; onVary: () => void
}) {
  if (img.loading) return <GenerationAnimation />

  return (
    <>
      <img
        src={img.url} alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-[1.04]"
        loading="lazy"
      />

      <div className="absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200">
        {/* Gradient top + bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

        {/* Top-right: icon buttons */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <button
            onClick={e => { e.stopPropagation() }}
            className="w-8 h-8 rounded-xl bg-black/55 backdrop-blur-md border border-white/[0.14] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.18] transition-all"
          >
            <IconDownload size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRef() }}
            className={cn(
              "w-8 h-8 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all",
              referenced
                ? "bg-[#FFFF00] border-[#FFFF00] text-black"
                : "bg-black/55 border-white/[0.14] text-white/70 hover:text-white hover:bg-white/[0.18]"
            )}
          >
            {referenced ? <IconCheck size={13} /> : <IconPlus size={13} />}
          </button>
        </div>

        {/* Bottom: Upscale + Vary */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onUpscale() }}
            className="flex-1 h-8 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.14] text-[11.5px] font-semibold text-white/80 hover:text-white hover:bg-white/[0.18] transition-all flex items-center justify-center gap-1.5"
          >
            <IconZoomIn size={12} strokeWidth={2} />
            Upscale
          </button>
          <button
            onClick={e => { e.stopPropagation(); onVary() }}
            className="flex-1 h-8 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.14] text-[11.5px] font-semibold text-white/80 hover:text-white hover:bg-white/[0.18] transition-all flex items-center justify-center gap-1.5"
          >
            <IconRefresh size={12} strokeWidth={2} />
            Vary
          </button>
        </div>
      </div>

      {referenced && (
        <div className="absolute inset-0 ring-2 ring-[#FFFF00] ring-inset rounded-xl pointer-events-none" />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Generation row — images use aspect-ratio CSS, no fixed height
// ─────────────────────────────────────────────────────────────────────────────
function GenRow({ gen, refIds, onRef, onUpscale, onVary }: {
  gen: Generation
  refIds: Set<string>
  onRef: (id: string) => void
  onUpscale: (img: GenImage, gen: Generation) => void
  onVary: (img: GenImage, gen: Generation) => void
}) {
  const cellBase = "relative rounded-2xl overflow-hidden bg-[#141416] group/img"
  // aspect-ratio drives height; maxHeight prevents absurdly tall portrait images
  const cellStyle = { aspectRatio: ASPECT_CSS[gen.aspect], maxHeight: 400 }

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3 px-0.5">
        {gen.type === "upscale" && (
          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md text-[#FFFF00] bg-[#FFFF00]/[0.08] border border-[#FFFF00]/20">
            ↑ Upscale
          </span>
        )}
        {gen.type === "vary" && (
          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md text-white/40 bg-white/[0.05] border border-white/[0.1]">
            ✦ Vary
          </span>
        )}
        <p className="flex-1 text-[12px] text-white/38 truncate">{gen.prompt}</p>
        <div className="flex items-center gap-2 shrink-0 text-[10px] text-white/22">
          <span>{gen.aspect}</span>
          <span className="opacity-50">·</span>
          <span>{gen.model}</span>
          <span className="opacity-50">·</span>
          <span>{ago(gen.createdAt)}</span>
        </div>
      </div>

      {/* 4-col grid — consistent aspect ratio per generation */}
      <div className="grid grid-cols-4 gap-3">
        {gen.count === 1 && (
          <>
            <div className="col-span-1" />
            <div className={cn("col-span-2", cellBase)} style={cellStyle}>
              <ImageCell
                img={gen.images[0]} referenced={refIds.has(gen.images[0].id)}
                onRef={() => onRef(gen.images[0].id)}
                onUpscale={() => onUpscale(gen.images[0], gen)}
                onVary={() => onVary(gen.images[0], gen)}
              />
            </div>
            <div className="col-span-1" />
          </>
        )}

        {gen.count === 2 && gen.images.map(img => (
          <div key={img.id} className={cn("col-span-2", cellBase)} style={cellStyle}>
            <ImageCell img={img} referenced={refIds.has(img.id)}
              onRef={() => onRef(img.id)}
              onUpscale={() => onUpscale(img, gen)}
              onVary={() => onVary(img, gen)}
            />
          </div>
        ))}

        {gen.count === 4 && gen.images.map(img => (
          <div key={img.id} className={cn("col-span-1", cellBase)} style={cellStyle}>
            <ImageCell img={img} referenced={refIds.has(img.id)}
              onRef={() => onRef(img.id)}
              onUpscale={() => onUpscale(img, gen)}
              onVary={() => onVary(img, gen)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
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
  function addGen(g: Generation) { setGens(p => [...p, g]); scroll() }
  function resolveGen(id: string, images: GenImage[]) {
    setGens(p => p.map(g => g.id === id ? { ...g, images } : g)); scroll()
  }

  function run(overrides: Partial<Generation>, finalImages: () => GenImage[]) {
    const cnt = (overrides.count ?? count) as Count
    const loading: GenImage[] = Array.from({ length: cnt }, (_, i) => ({
      id: `ld${Date.now()}${i}`, url: "", loading: true,
    }))
    const g: Generation = {
      id: `g${Date.now()}`, type: "generate", prompt: prompt.trim(),
      aspect, count, model, style, images: loading, createdAt: Date.now(),
      ...overrides,
    }
    addGen(g)
    setTimeout(() => { resolveGen(g.id, finalImages()) }, 2800)
  }

  function handleGenerate() {
    if (busy || !prompt.trim()) return
    setBusy(true)
    run({}, () => Array.from({ length: count }, (_, i) => ({
      id: `gn${Date.now()}${i}`, url: pic(`gen${Date.now()}${i}`, aspect), loading: false,
    })))
    setTimeout(() => setBusy(false), 2800)
  }

  function handleUpscale(img: GenImage, src: Generation) {
    run({ type: "upscale", prompt: src.prompt, aspect: src.aspect, model: src.model, style: src.style, count: 1 },
      () => [{ id: `up${Date.now()}`, url: pic(`up${Date.now()}`, src.aspect), loading: false }])
  }

  function handleVary(img: GenImage, src: Generation) {
    run({ type: "vary", prompt: src.prompt, aspect: src.aspect, model: src.model, style: src.style, count: 4 },
      () => Array.from({ length: 4 }, (_, i) => ({
        id: `v${Date.now()}${i}`, url: pic(`vary${Date.now()}${i}`, src.aspect), loading: false,
      })))
  }

  useEffect(() => {
    const el = taRef.current; if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }, [prompt])

  return (
    <div className="flex flex-col h-screen bg-[#0c0c0e] text-white overflow-hidden">

      {/* ── Canvas ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-[230px]">
        <div className="max-w-[980px] mx-auto px-6 pt-8">
          {gens.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
              <IconSparkles size={32} className="text-white/10" />
              <p className="text-sm text-white/20">Describe what you want to create</p>
            </div>
          )}
          {gens.map(gen => (
            <GenRow key={gen.id} gen={gen} refIds={refIds}
              onRef={toggleRef} onUpscale={handleUpscale} onVary={handleVary}
            />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* ── Prompt dock ─────────────────────────────────────── */}
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

            {/* ── Prompt ── */}
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

              {/* Generate button — inset bottom-right of prompt area */}
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

            {/* ── Divider ── */}
            <div className="h-px bg-white/[0.055] mx-4" />

            {/* ── Settings row ── */}
            <div className="px-3 py-2 flex items-center gap-2">

              {/* Visual aspect ratio picker */}
              <AspectPicker value={aspect} onChange={setAspect} />

              {/* Separator */}
              <div className="w-px h-5 bg-white/[0.1] mx-1 shrink-0" />

              {/* Style + Model dropdowns */}
              <Dropdown label="Style" value={style}  options={STYLES as any} onChange={setStyle} />
              <Dropdown label="Model" value={model}  options={MODELS as any} onChange={setModel} />

              <div className="flex-1" />

              {/* Count toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/25 font-medium">Images</span>
                <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5">
                  {([1, 2, 4] as Count[]).map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className={cn(
                        "w-8 h-6 rounded-lg text-[12px] font-bold transition-all",
                        count === n ? "bg-[#FFFF00] text-black" : "text-white/28 hover:text-white/65"
                      )}>
                      {n}
                    </button>
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
