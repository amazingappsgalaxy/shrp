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

const ASPECT_CSS: Record<Aspect, string> = {
  "1:1": "1 / 1", "4:3": "4 / 3", "3:4": "3 / 4",
  "16:9": "16 / 9", "9:16": "9 / 16", "4:5": "4 / 5",
}

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

// Deterministic "random" rotation from id string
function getRotation(id: string): number {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return ((hash % 11) - 5) * 0.55 // –3° to +3°
}

const SEED: Generation[] = [
  {
    id:"g0", type:"generate",
    prompt:"a lone astronaut reading in an ancient library, volumetric dust, god-rays",
    aspect:"4:5", count:4, model:"Flux 1.1 Pro", style:"Cinematic",
    images:[
      {id:"g0-0",url:pic("astro1","4:5"),loading:false},
      {id:"g0-1",url:pic("astro2","4:5"),loading:false},
      {id:"g0-2",url:pic("astro3","4:5"),loading:false},
      {id:"g0-3",url:pic("astro4","4:5"),loading:false},
    ],
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
    aspect:"16:9", count:4, model:"Flux 1.1 Pro", style:"None",
    images:[
      {id:"g2-0",url:pic("coral1","16:9"),loading:false},
      {id:"g2-1",url:pic("coral2","16:9"),loading:false},
      {id:"g2-2",url:pic("coral3","16:9"),loading:false},
      {id:"g2-3",url:pic("coral4","16:9"),loading:false},
    ],
    createdAt: Date.now()-120_000,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Aspect picker (dark version for dock)
// ─────────────────────────────────────────────────────────────────────────────
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
              active ? "bg-black/10 text-black" : "text-black/25 hover:text-black/50 hover:bg-black/[0.06]"
            )}
          >
            <div className="rounded-[3px] border-[1.5px] transition-colors"
              style={{ width: w, height: h, borderColor: active ? "#000" : "currentColor" }} />
            <span className="text-[8.5px] font-bold tracking-wide leading-none">{a}</span>
          </button>
        )
      })}
    </div>
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
            ? "bg-black/10 border-black/25 text-black"
            : "bg-transparent border-black/15 text-black/40 hover:text-black/70 hover:border-black/25 hover:bg-black/[0.05]"
        )}
      >
        {label && <span className="text-[9px] text-black/25 uppercase tracking-wide font-black">{label}</span>}
        <span>{value}</span>
        <IconChevronDown size={11} className={cn("text-black/25 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 min-w-[156px] bg-white border border-black/10 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] overflow-hidden z-50">
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false) }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-[12.5px] transition-colors flex items-center justify-between gap-3",
                opt === value ? "text-black font-semibold bg-black/[0.05]" : "text-black/50 hover:text-black hover:bg-black/[0.04] font-medium"
              )}
            >
              {opt}
              {opt === value && <IconCheck size={11} className="text-black shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Polaroid card — white border, random tilt, lifts on hover
// ─────────────────────────────────────────────────────────────────────────────
function PolaroidCard({
  img, aspect, prompt, referenced, onRef, onUpscale, onVary,
}: {
  img: GenImage; aspect: Aspect; prompt: string; referenced: boolean
  onRef: () => void; onUpscale: () => void; onVary: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const rotation = getRotation(img.id)

  if (img.loading) {
    return (
      <div
        className="shrink-0 bg-white rounded-sm overflow-hidden"
        style={{ width: 180, padding: "10px 10px 36px 10px", opacity: 0.7 }}
      >
        <div style={{ aspectRatio: ASPECT_CSS[aspect] }} className="overflow-hidden">
          <GenerationAnimation />
        </div>
      </div>
    )
  }

  return (
    <div
      className="shrink-0 cursor-pointer select-none"
      style={{
        transform: hovered
          ? `rotate(0deg) translateY(-16px) scale(1.04)`
          : `rotate(${rotation}deg) translateY(0px) scale(1)`,
        transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        willChange: "transform",
        zIndex: hovered ? 10 : 1,
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Polaroid frame */}
      <div
        className="bg-white rounded-sm"
        style={{
          padding: "10px 10px 40px 10px",
          width: 180,
          boxShadow: hovered
            ? "0 20px 60px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)"
            : "0 4px 16px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)",
          transition: "box-shadow 0.4s ease",
          outline: referenced ? "2.5px solid #111" : "none",
        }}
      >
        {/* Photo area */}
        <div className="overflow-hidden" style={{ aspectRatio: ASPECT_CSS[aspect] }}>
          <img
            src={img.url} alt=""
            className="w-full h-full object-cover"
            style={{
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform 0.5s cubic-bezier(0.23,1,0.32,1)",
            }}
            loading="lazy"
          />
        </div>

        {/* Polaroid caption area */}
        <div className="pt-2 flex items-center justify-between gap-1">
          <p className="text-[9px] text-black/35 font-medium truncate flex-1 leading-tight">
            {prompt.slice(0, 22)}{prompt.length > 22 ? "…" : ""}
          </p>
          {referenced && (
            <div className="w-3 h-3 rounded-full bg-black flex items-center justify-center shrink-0">
              <IconCheck size={7} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Hover action tray — appears below card */}
      <div
        className="absolute left-1/2 -bottom-10 flex gap-1"
        style={{
          transform: "translateX(-50%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s ease 0.05s",
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        <button
          onClick={e => { e.stopPropagation(); onUpscale() }}
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-black text-white text-[10px] font-semibold hover:bg-black/80 transition-all shadow-lg"
        >
          <IconZoomIn size={10} /> Up
        </button>
        <button
          onClick={e => { e.stopPropagation(); onVary() }}
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-black text-white text-[10px] font-semibold hover:bg-black/80 transition-all shadow-lg"
        >
          <IconRefresh size={10} /> Vary
        </button>
        <button
          onClick={e => { e.stopPropagation() }}
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-black text-white text-[10px] font-semibold hover:bg-black/80 transition-all shadow-lg"
        >
          <IconDownload size={10} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onRef() }}
          className={cn(
            "flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-semibold transition-all shadow-lg",
            referenced ? "bg-black/70 text-white" : "bg-black text-white hover:bg-black/80"
          )}
        >
          {referenced ? <IconCheck size={10} /> : <IconPlus size={10} />}
        </button>
      </div>
    </div>
  )
}

// Group of polaroids for one generation — horizontal scroll strip
function PolaroidGroup({ gen, refIds, onRef, onUpscale, onVary }: {
  gen: Generation
  refIds: Set<string>
  onRef: (id: string) => void
  onUpscale: (img: GenImage, gen: Generation) => void
  onVary: (img: GenImage, gen: Generation) => void
}) {
  return (
    <div className="mb-16">
      {/* Handwritten-style label */}
      <p
        className="text-[13px] text-black/30 mb-6 px-1 max-w-[500px] leading-[1.5]"
        style={{ fontStyle: "italic", letterSpacing: "0.01em" }}
      >
        {gen.prompt.slice(0, 60)}{gen.prompt.length > 60 ? "…" : ""}
      </p>

      {/* Polaroid scatter row — items overlap slightly with negative margin */}
      <div className="flex flex-wrap gap-6 pb-12">
        {gen.images.map((img) => (
          <PolaroidCard
            key={img.id}
            img={img}
            aspect={gen.aspect}
            prompt={gen.prompt}
            referenced={refIds.has(img.id)}
            onRef={() => onRef(img.id)}
            onUpscale={() => onUpscale(img, gen)}
            onVary={() => onVary(img, gen)}
          />
        ))}
      </div>

      {/* Thin separator */}
      <div className="h-px bg-black/[0.08] mt-2" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page — Polaroid scatter on cream/paper background
// ─────────────────────────────────────────────────────────────────────────────
export default function ImageUIConcept3() {
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
      aspect, count, model, style, images: loading, createdAt: Date.now(), ...overrides,
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
    run({ type: "upscale", prompt: src.prompt, aspect: src.aspect, model: src.model, style: src.style, count: 4 },
      () => Array.from({ length: 4 }, (_, i) => ({
        id: `up${Date.now()}${i}`, url: pic(`up${Date.now()}${i}`, src.aspect), loading: false,
      })))
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
    /* Cream/paper background — completely different from dark themes */
    <div className="flex flex-col h-screen text-black overflow-hidden" style={{ background: "#f5f0e8" }}>

      {/* ── Canvas ── */}
      <div className="flex-1 overflow-y-auto pb-[230px]">
        <div className="max-w-[1060px] mx-auto px-8 pt-8">
          {gens.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <IconSparkles size={32} className="text-black/15" />
              <p className="text-sm text-black/25 italic">Describe what you want to create</p>
            </div>
          )}

          {gens.map(gen => (
            <PolaroidGroup
              key={gen.id} gen={gen} refIds={refIds}
              onRef={toggleRef} onUpscale={handleUpscale} onVary={handleVary}
            />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* ── Prompt dock — light version on cream ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-5 pt-14 pointer-events-none"
        style={{ background: "linear-gradient(to top, #f5f0e8 60%, rgba(245,240,232,0) 100%)" }}
      >
        <div className="max-w-[860px] mx-auto pointer-events-auto">
          <div className={cn(
            "rounded-2xl border transition-colors duration-200",
            "bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]",
            busy ? "border-black/20" : "border-black/[0.12]"
          )}>
            <div className="relative px-5 pt-4 pb-14">
              <textarea
                ref={taRef} value={prompt} onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate() }}
                placeholder="Describe what you want to create…"
                rows={2}
                className="w-full bg-transparent text-[14px] text-black placeholder:text-black/25 resize-none outline-none leading-[1.65]"
                style={{ minHeight: 48, maxHeight: 120, overflowY: "auto" }}
              />
              <button
                onClick={handleGenerate} disabled={busy || !prompt.trim()}
                className={cn(
                  "absolute bottom-3.5 right-4 flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-bold transition-all duration-150 select-none",
                  busy || !prompt.trim()
                    ? "bg-black/[0.05] text-black/20 cursor-not-allowed border border-black/[0.08]"
                    : "bg-black text-white hover:bg-black/85 active:scale-[0.97] shadow-[0_2px_16px_rgba(0,0,0,0.25)] cursor-pointer"
                )}
              >
                {busy ? <><IconLoader2 size={14} className="animate-spin" />Generating…</> : <><IconArrowUp size={14} strokeWidth={2.5} />Generate</>}
              </button>
            </div>
            <div className="h-px bg-black/[0.07] mx-4" />
            <div className="px-3 py-2 flex items-center gap-2">
              <AspectPicker value={aspect} onChange={setAspect} />
              <div className="w-px h-5 bg-black/[0.1] mx-1 shrink-0" />
              <Dropdown label="Style" value={style} options={STYLES as any} onChange={setStyle} />
              <Dropdown label="Model" value={model} options={MODELS as any} onChange={setModel} />
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-black/25 font-medium">Images</span>
                <div className="flex items-center gap-0.5 bg-black/[0.05] border border-black/[0.08] rounded-xl p-0.5">
                  {([1, 2, 4] as Count[]).map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className={cn(
                        "w-8 h-6 rounded-lg text-[12px] font-bold transition-all",
                        count === n ? "bg-black text-white" : "text-black/30 hover:text-black/65"
                      )}>{n}</button>
                  ))}
                </div>
              </div>
              <span className="text-[9px] text-black/15 font-mono pl-1">⌘↵</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
