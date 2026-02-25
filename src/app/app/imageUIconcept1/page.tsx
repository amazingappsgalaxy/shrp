"use client"
import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { GenerationAnimation } from "@/components/ui/GenerationAnimation"
import {
  IconSparkles, IconX, IconArrowUp, IconLoader2,
  IconDownload, IconPlus, IconCheck, IconWand,
  IconPhoto, IconChevronDown,
} from "@tabler/icons-react"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Mode = "generate" | "edit"
type Count = 1 | 2 | 4
type Aspect = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "4:5"

interface GenImage { id: string; url: string; loading: boolean }
interface Generation {
  id: string; prompt: string; aspect: Aspect; model: string
  style: string; count: Count; images: GenImage[]; createdAt: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const ASPECTS: Aspect[] = ["1:1", "4:3", "3:4", "16:9", "9:16", "4:5"]
const STYLES = ["None", "Cinematic", "Anime", "Oil Paint", "Neon", "Editorial", "Minimal"]
const MODELS = ["Flux 1.1 Pro", "Flux Schnell", "Flux Dev", "Ideogram 2.0"]

// Fixed image height — consistent across all rows
const ROW_HEIGHT    = 260   // px — for 2 and 4 image rows
const HERO_HEIGHT   = 420   // px — for single-image rows (more visual weight)
const THUMB_HEIGHT  = 48    // px — for context thumbnails in command bar

const ASPECT_PX: Record<Aspect, [number, number]> = {
  "1:1": [512, 512], "4:3": [640, 480], "3:4": [480, 640],
  "16:9": [768, 432], "9:16": [432, 768], "4:5": [480, 600],
}

function parseAR(a: Aspect) { const [w, h] = a.split(":").map(Number); return w / h }
function picsum(seed: string, a: Aspect) { const [w, h] = ASPECT_PX[a]; return `https://picsum.photos/seed/${seed}/${w}/${h}` }
function ago(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────
const SEED: Generation[] = [
  {
    id: "g0", prompt: "a lone astronaut reading in an ancient crumbling library, volumetric dust, god-rays",
    aspect: "4:5", model: "Flux 1.1 Pro", style: "Cinematic", count: 1,
    images: [{ id: "g0-0", url: picsum("astro1", "4:5"), loading: false }],
    createdAt: Date.now() - 1_800_000,
  },
  {
    id: "g1", prompt: "neon bonsai tree in dark rain, puddle reflections, shallow depth of field, photorealistic",
    aspect: "1:1", model: "Flux 1.1 Pro", style: "Cinematic", count: 4,
    images: [
      { id: "g1-0", url: picsum("nb1", "1:1"), loading: false },
      { id: "g1-1", url: picsum("nb2", "1:1"), loading: false },
      { id: "g1-2", url: picsum("nb3", "1:1"), loading: false },
      { id: "g1-3", url: picsum("nb4", "1:1"), loading: false },
    ],
    createdAt: Date.now() - 900_000,
  },
  {
    id: "g2", prompt: "vast coral reef at golden hour, underwater cathedral light shafts, wide angle lens",
    aspect: "16:9", model: "Flux 1.1 Pro", style: "None", count: 2,
    images: [
      { id: "g2-0", url: picsum("coral1", "16:9"), loading: false },
      { id: "g2-1", url: picsum("coral2", "16:9"), loading: false },
    ],
    createdAt: Date.now() - 120_000,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// ImageCell — one image inside a generation row
// ─────────────────────────────────────────────────────────────────────────────
function ImageCell({
  img, height, referenced, onRef,
}: { img: GenImage; height: number; referenced: boolean; onRef: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl bg-[#1a1a1c] group/cell flex-shrink-0 flex-1"
      style={{ height }}
    >
      {img.loading ? (
        <GenerationAnimation />
      ) : (
        <>
          <img
            src={img.url} alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/cell:scale-[1.04]"
            loading="lazy"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-2.5 right-2.5 flex gap-1.5">
              <button
                onClick={e => e.stopPropagation()}
                className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <IconDownload size={13} />
              </button>
              <button
                onClick={onRef}
                className={cn(
                  "w-8 h-8 rounded-xl backdrop-blur-sm border flex items-center justify-center transition-all",
                  referenced
                    ? "bg-[#FFFF00] border-[#FFFF00] text-black"
                    : "bg-black/60 border-white/10 text-white/60 hover:text-white hover:border-white/25"
                )}
              >
                {referenced ? <IconCheck size={13} /> : <IconPlus size={13} />}
              </button>
            </div>
          </div>
          {/* Referenced ring */}
          {referenced && (
            <>
              <div className="absolute inset-0 rounded-xl ring-2 ring-[#FFFF00] pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FFFF00] shadow-[0_0_8px_rgba(255,255,0,1)] pointer-events-none" />
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GenerationRow
// ─────────────────────────────────────────────────────────────────────────────
function GenerationRow({ gen, index, referencedIds, onToggleRef }: {
  gen: Generation; index: number
  referencedIds: Set<string>; onToggleRef: (id: string) => void
}) {
  const height = gen.count === 1 ? HERO_HEIGHT : ROW_HEIGHT

  return (
    <div className="mb-8 last:mb-0">
      {/* Row label */}
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-[11px] font-mono text-white/20 tabular-nums w-5 text-right shrink-0 select-none">
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className="flex-1 text-[12px] text-white/50 leading-snug font-medium truncate">
          {gen.prompt}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {gen.style !== "None" && (
            <span className="text-[10px] text-white/25 border border-white/[0.08] rounded px-1.5 py-0.5">{gen.style}</span>
          )}
          <span className="text-[10px] text-white/25 border border-white/[0.08] rounded px-1.5 py-0.5">{gen.aspect}</span>
          <span className="text-[10px] text-white/20">{ago(gen.createdAt)}</span>
        </div>
      </div>

      {/* Images — always 4-column grid, spans vary by count */}
      <div className="grid grid-cols-4 gap-2">

        {gen.count === 1 && (
          <div className="col-span-4">
            <ImageCell
              img={gen.images[0]} height={height}
              referenced={referencedIds.has(gen.images[0].id)}
              onRef={e => { e.stopPropagation(); onToggleRef(gen.images[0].id) }}
            />
          </div>
        )}

        {gen.count === 2 && gen.images.map(img => (
          <div key={img.id} className="col-span-2">
            <ImageCell
              img={img} height={height}
              referenced={referencedIds.has(img.id)}
              onRef={e => { e.stopPropagation(); onToggleRef(img.id) }}
            />
          </div>
        ))}

        {gen.count === 4 && gen.images.map(img => (
          <div key={img.id} className="col-span-1">
            <ImageCell
              img={img} height={height}
              referenced={referencedIds.has(img.id)}
              onRef={e => { e.stopPropagation(); onToggleRef(img.id) }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Context thumbnail in command bar
// ─────────────────────────────────────────────────────────────────────────────
function CtxThumb({ img, ar, onRemove }: { img: GenImage; ar: number; onRemove: () => void }) {
  const w = Math.round(THUMB_HEIGHT * ar)
  return (
    <div className="relative group/t shrink-0 rounded-lg overflow-hidden" style={{ width: w, height: THUMB_HEIGHT }}>
      <img src={img.url} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 rounded-lg ring-[1.5px] ring-[#FFFF00]/60 pointer-events-none" />
      <button
        onClick={onRemove}
        className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover/t:opacity-100 transition-opacity"
      >
        <IconX size={12} className="text-white" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle pill — shows current value, cycles on click
// ─────────────────────────────────────────────────────────────────────────────
function CyclePill<T extends string>({
  label, value, options, onChange,
}: { label?: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  const next = () => {
    const i = options.indexOf(value)
    onChange(options[(i + 1) % options.length] as T)
  }
  return (
    <button
      onClick={next}
      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 hover:border-white/20 transition-all group"
    >
      {label && <span className="text-[9px] text-white/30 uppercase tracking-wider font-bold">{label}</span>}
      <span className="text-[12px] font-semibold text-white/75 group-hover:text-white transition-colors">{value}</span>
      <IconChevronDown size={10} className="text-white/30" />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ImageUIConcept1() {
  const [mode, setMode]   = useState<Mode>("generate")
  const [count, setCount] = useState<Count>(4)
  const [aspect, setAspect] = useState<Aspect>("1:1")
  const [style, setStyle]   = useState("None")
  const [model, setModel]   = useState(MODELS[0])
  const [prompt, setPrompt] = useState("")
  const [generations, setGenerations] = useState<Generation[]>(SEED)
  const [referencedIds, setReferencedIds] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)

  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const canvasEndRef = useRef<HTMLDivElement>(null)

  const allImages    = generations.flatMap(g => g.images.map(img => ({ img, gen: g })))
  const ctxImages    = allImages.filter(({ img }) => referencedIds.has(img.id))

  function toggleRef(id: string) {
    setReferencedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function scrollEnd() {
    setTimeout(() => canvasEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80)
  }

  function handleGenerate() {
    if (generating || !prompt.trim()) return
    setGenerating(true)

    const loadingImgs: GenImage[] = Array.from({ length: count }, (_, i) => ({
      id: `ld-${Date.now()}-${i}`, url: "", loading: true,
    }))
    const newGen: Generation = {
      id: `g-${Date.now()}`, prompt: prompt.trim(), aspect, model, style, count,
      images: loadingImgs, createdAt: Date.now(),
    }
    setGenerations(prev => [...prev, newGen])
    scrollEnd()

    setTimeout(() => {
      setGenerations(prev => prev.map(g =>
        g.id !== newGen.id ? g : {
          ...g,
          images: Array.from({ length: count }, (_, i) => ({
            id: `gn-${Date.now()}-${i}`,
            url: picsum(`gen${Date.now()}${i}`, aspect),
            loading: false,
          })),
        }
      ))
      setGenerating(false)
      scrollEnd()
    }, 2800)
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current; if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }, [prompt])

  return (
    <div className="flex flex-col h-screen bg-[#090909] text-white overflow-hidden">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-11 flex items-center justify-between px-6 border-b border-white/[0.07] bg-[#090909] z-10">
        <span className="text-[13px] font-black tracking-tight select-none">
          SHARPII <span className="text-[#FFFF00]">STUDIO</span>
        </span>
        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 bg-white/[0.05] border border-white/[0.08] p-0.5 rounded-lg">
          {(["generate", "edit"] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 h-6 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                mode === m ? "bg-[#FFFF00] text-black" : "text-white/35 hover:text-white/65"
              )}
            >
              {m === "generate" ? <IconSparkles size={10} /> : <IconWand size={10} />}
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── CANVAS ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-[198px]">
        <div className="px-6 py-7">
          {generations.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3 select-none">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <IconPhoto size={22} className="text-white/20" />
              </div>
              <p className="text-sm text-white/20">Type a prompt below to start</p>
            </div>
          )}
          {generations.map((gen, i) => (
            <GenerationRow
              key={gen.id} gen={gen} index={i}
              referencedIds={referencedIds} onToggleRef={toggleRef}
            />
          ))}
          <div ref={canvasEndRef} />
        </div>
      </div>

      {/* ── COMMAND BAR ──────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
        style={{ background: "linear-gradient(to top, #090909 60%, rgba(9,9,9,0.6) 85%, transparent)" }}
      >
        <div
          className="mx-auto px-5 pb-5 pt-6 pointer-events-auto"
          style={{ maxWidth: 960 }}
        >
          <div className={cn(
            "rounded-2xl border overflow-hidden transition-all duration-300",
            "bg-[#1c1c1f] shadow-[0_-2px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.02)]",
            generating ? "border-[#FFFF00]/30" : "border-white/[0.12]"
          )}>

            {/* ── Context strip ── */}
            {ctxImages.length > 0 && (
              <div className="flex items-center gap-3 px-4 pt-3 pb-2.5 border-b border-white/[0.07]">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/35 shrink-0">Using</span>
                <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
                  {ctxImages.map(({ img, gen }) => (
                    <CtxThumb key={img.id} img={img} ar={parseAR(gen.aspect)} onRemove={() => toggleRef(img.id)} />
                  ))}
                </div>
                <button onClick={() => setReferencedIds(new Set())}
                  className="shrink-0 text-[10px] text-white/30 hover:text-white/60 transition-colors font-medium">
                  Clear all
                </button>
              </div>
            )}

            {/* ── Prompt row ── */}
            <div className="flex items-end gap-2.5 px-4 pt-3.5 pb-3">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate() }}
                placeholder={
                  ctxImages.length > 0
                    ? "Describe what to do with the selected images…"
                    : mode === "generate"
                    ? "Describe what you want to create…"
                    : "Describe the edit to apply to selected images…"
                }
                rows={1}
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/35 resize-none outline-none leading-relaxed"
                style={{ minHeight: 24, maxHeight: 120, overflowY: "auto" }}
              />

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className={cn(
                  "shrink-0 h-9 px-5 rounded-xl flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider transition-all",
                  generating || !prompt.trim()
                    ? "bg-white/[0.05] text-white/20 cursor-not-allowed"
                    : "bg-[#FFFF00] text-black hover:bg-yellow-300 active:scale-[0.97] shadow-[0_0_24px_rgba(255,255,0,0.18)]"
                )}
              >
                {generating
                  ? <><IconLoader2 size={14} className="animate-spin" /> Creating</>
                  : <><IconArrowUp size={14} strokeWidth={2.5} /> {mode === "generate" ? "Generate" : "Apply"}</>
                }
              </button>
            </div>

            {/* ── Controls row ── */}
            <div className="flex items-center gap-2 px-4 pb-3">

              {/* Aspect ratio */}
              <CyclePill value={aspect} options={ASPECTS} onChange={setAspect} label="Ratio" />

              {/* Style */}
              <CyclePill value={style as any} options={STYLES as any} onChange={setStyle} label="Style" />

              {/* Model */}
              <CyclePill value={model as any} options={MODELS as any} onChange={setModel} label="Model" />

              {/* Divider */}
              <div className="flex-1" />

              {/* Image count */}
              <div className="flex items-center gap-0.5 bg-white/[0.05] border border-white/[0.09] p-0.5 rounded-lg">
                {([1, 2, 4] as Count[]).map(n => (
                  <button key={n} onClick={() => setCount(n)}
                    className={cn(
                      "w-9 h-7 rounded-md text-[12px] font-bold transition-all",
                      count === n ? "bg-[#FFFF00] text-black" : "text-white/35 hover:text-white/70"
                    )}>
                    {n}
                  </button>
                ))}
              </div>

              {/* Hint */}
              <span className="text-[10px] text-white/20 select-none pl-1 font-mono">⌘↵</span>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
