"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"
import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"
import { FAQSection } from "@/components/sections/FAQSection"
import { cn } from "@/lib/utils"
import {
  ArrowRight, ScanLine, ChevronDown, Sparkles,
  Video, Image as ImageIcon, Settings2,
  Cpu, Maximize2, Play, Wand2,
  Layers, Star, ArrowUpRight
} from "lucide-react"

// ─── ASSETS ──────────────────────────────────────────────────────────────────
const IMG = {
  before:      "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/comparison/comparebefore.jpeg",
  after:       "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/comparison/compareafter.jpeg",
  g1before:    "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg",
  g1after:     "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png",
  g2before:    "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+2+Before.jpg",
  bm1before:   "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+Before.jpg",
  bm1after:    "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+After.png",
  asian7after: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+after.png",
}

// ─── COMPARISON SLIDER HOOK ───────────────────────────────────────────────────
function useSlider(initial = 50, min = 15, max = 85, speed = 0.09) {
  const [pos, setPos] = useState(initial)
  const [paused, setPaused] = useState(false)
  const dir = useRef(1)
  const cur = useRef(initial)
  const raf = useRef(0)

  useEffect(() => {
    if (paused) return
    const tick = () => {
      cur.current += dir.current * speed
      if (cur.current >= max) dir.current = -1
      if (cur.current <= min) dir.current = 1
      setPos(cur.current)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [paused, min, max, speed])

  return { pos, cur, setPos, setPaused }
}

// Reusable comparison component
function ComparisonSlider({ before, after, beforeAlt, afterAlt, speed = 0.1, className = "" }: {
  before: string; after: string; beforeAlt: string; afterAlt: string; speed?: number; className?: string
}) {
  const { pos, cur, setPos, setPaused } = useSlider(50, 10, 90, speed)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(0, Math.min((cx - r.left) / r.width * 100, 100))
    setPos(cur.current)
  }, [cur, setPos])
  return (
    <div ref={ref} className={cn("absolute inset-0 cursor-ew-resize select-none", className)}
      onPointerDown={e => { setDrag(true); setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
      onPointerMove={e => drag && onMove(e.clientX)}
      onPointerUp={() => { setDrag(false); setPaused(false) }}>
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-700">
        <Image src={before} alt={beforeAlt} fill className="object-cover object-top" sizes="700px" />
      </div>
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-600 to-zinc-700">
          <Image src={after} alt={afterAlt} fill className="object-cover object-top" sizes="700px" />
        </div>
      </div>
      <div className="absolute top-0 bottom-0 pointer-events-none z-10" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-white/70 bg-black/50 backdrop-blur-xl flex items-center justify-center">
          <ScanLine className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HERO
// ─────────────────────────────────────────────────────────────────────────────
function Hero() {
  const { pos, cur, setPos, setPaused } = useSlider(50, 15, 85, 0.08)
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((clientX: number) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const p = Math.max(0, Math.min((clientX - rect.left) / rect.width * 100, 100))
    cur.current = p
    setPos(p)
  }, [cur, setPos])

  return (
    <section className="relative w-full overflow-hidden bg-black" style={{ height: "100svh", minHeight: 680 }}>
      <div ref={ref} className="absolute inset-0 select-none"
        style={{ cursor: dragging ? "grabbing" : "ew-resize" }}
        onPointerDown={e => { setDragging(true); setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
        onPointerMove={e => dragging && onMove(e.clientX)}
        onPointerUp={() => { setDragging(false); setPaused(false) }}
        onPointerLeave={() => { setDragging(false); setPaused(false) }}>
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800">
          <Image src={IMG.before} alt="Original" fill className="object-cover object-top" priority sizes="100vw" />
        </div>
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-600">
            <Image src={IMG.after} alt="AI Enhanced" fill className="object-cover object-top" priority sizes="100vw" />
          </div>
        </div>
        <div className="absolute top-0 bottom-0 z-30 pointer-events-none" style={{ left: `${pos}%` }}>
          <div className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-[1.5px] border-white/80 bg-black/60 backdrop-blur-xl flex items-center justify-center shadow-2xl">
            <ScanLine className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="absolute top-24 left-5 z-30 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFF00]/20 backdrop-blur-md border border-[#FFFF00]/30 text-[10px] font-black tracking-widest text-[#FFFF00] uppercase">AI Enhanced</span>
        </div>
        <div className="absolute top-24 right-5 z-30 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-black tracking-widest text-white/40 uppercase">Original</span>
        </div>
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-[52%] bg-gradient-to-t from-black via-black/95 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-40 pb-10 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-4 text-[11px] font-bold text-white/70 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />
              AI-Powered Visual Enhancement
            </div>
            <h1 className="font-heading font-black leading-[0.88] tracking-tight whitespace-nowrap">
              <span className="block text-white" style={{ fontSize: "clamp(2.8rem, 6.5vw, 6.2rem)" }}>MAKE IT</span>
              <span className="block text-[#FFFF00]" style={{ fontSize: "clamp(2.8rem, 6.5vw, 6.2rem)" }}>SHARP.</span>
            </h1>
          </div>
          <div className="lg:max-w-sm lg:pb-2 flex flex-col gap-4">
            <p className="text-white/55 text-base leading-relaxed">
              Transform blurry, low-res photos into breathtaking 8K visuals. Drag the line above — see the difference instantly.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/app/dashboard">
                <button className="bg-[#FFFF00] text-black font-bold px-7 py-3.5 rounded-xl text-sm inline-flex items-center gap-2 hover:scale-105 hover:shadow-[0_0_35px_rgba(255,255,0,0.4)] transition-all duration-300">
                  Start for Free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="#features">
                <button className="border border-white/20 text-white font-medium px-7 py-3.5 rounded-xl text-sm bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-200">
                  Explore Features
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
        <motion.div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/20"
          animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. YELLOW TICKER
// ─────────────────────────────────────────────────────────────────────────────
function Ticker() {
  const items = ["8K Upscaling", "Skin Editor", "Image Generation", "Video Generation", "Motion Transfer", "Lip Sync", "AI Portraits", "Dermatology AI", "Video Cloning"]
  const all = [...items, ...items, ...items]
  return (
    <div className="py-3.5 bg-[#FFFF00] overflow-hidden relative z-10">
      <motion.div className="flex gap-10 whitespace-nowrap w-max"
        animate={{ x: ["0%", "-33.33%"] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
        {all.map((item, i) => (
          <span key={i} className="text-black font-black text-xs uppercase tracking-[0.18em] inline-flex items-center gap-8">
            {item}<span className="text-black/20 font-light">◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BENTO FEATURE GRID — each card has a completely unique layout
// ─────────────────────────────────────────────────────────────────────────────
function BentoFeatures() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="features" className="py-24 bg-[#070707] relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-[#FFFF00]/[0.02] rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8">
        <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}
          className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5 text-[11px] font-bold text-white/50 uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5 text-[#FFFF00]" /> Full Creative Suite
          </div>
          <h2 className="font-heading text-4xl md:text-6xl font-black text-white leading-[0.9] mb-4">
            Everything Your<br /><span className="text-[#FFFF00]">Vision Needs.</span>
          </h2>
          <p className="text-white/40 text-lg max-w-lg mx-auto">
            One platform. Eight powerful AI tools. Unlimited creative possibilities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 max-w-[1400px] mx-auto">

          {/* ── UPSCALER — 4 cols, tall — before/after slider ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="lg:col-span-4 lg:row-span-2 relative rounded-3xl overflow-hidden border border-white/8 bg-[#0f0f0f]"
            style={{ minHeight: 560 }}>
            <ComparisonSlider before={IMG.g1before} after={IMG.g1after} beforeAlt="Original portrait" afterAlt="AI upscaled 8K" speed={0.08} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 z-30 pointer-events-none">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#FFFF00]/20 border border-[#FFFF00]/30">
                  <Maximize2 className="w-3.5 h-3.5 text-[#FFFF00]" />
                </div>
                <span className="text-[11px] font-black text-[#FFFF00] uppercase tracking-widest">Smart Upscaler</span>
              </div>
              <h3 className="text-white font-bold text-2xl mb-1.5">Up to 8K Resolution</h3>
              <p className="text-white/45 text-sm mb-4 max-w-sm">Not just scaled — truly rebuilt. AI reconstructs every pixel from millions of high-res references.</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-[11px] font-bold text-white/60">4K · 80 cr</span>
                <span className="px-3 py-1 rounded-lg bg-[#FFFF00]/15 border border-[#FFFF00]/25 text-[11px] font-bold text-[#FFFF00]">8K · 120 cr</span>
              </div>
            </div>
          </motion.div>

          {/* ── SKIN EDITOR — portrait split (before left / after right) ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-white/8 bg-[#0f0f0f]"
            style={{ minHeight: 270 }}>
            {/* Side by side: before (right half) | after (left half) */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 relative overflow-hidden">
                <Image src={IMG.bm1after} alt="Skin enhanced" fill className="object-cover object-top" sizes="200px" />
                <div className="absolute top-2.5 left-2.5 text-[8px] font-black bg-[#FFFF00]/20 border border-[#FFFF00]/30 px-1.5 py-0.5 rounded text-[#FFFF00] uppercase tracking-wider">After</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="flex-1 relative overflow-hidden">
                <Image src={IMG.bm1before} alt="Skin original" fill className="object-cover object-top" sizes="200px" />
                <div className="absolute top-2.5 right-2.5 text-[8px] font-black bg-black/60 border border-white/10 px-1.5 py-0.5 rounded text-white/40 uppercase tracking-wider">Before</div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded-md bg-blue-400/20 border border-blue-400/30">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Skin Editor</span>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">Dermatology<br />Grade Precision</h3>
            </div>
          </motion.div>

          {/* ── IMAGE GENERATION — 2×2 portrait grid ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-2 relative rounded-3xl border border-white/8 bg-[#0f0f0f] overflow-hidden"
            style={{ minHeight: 270 }}>
            {/* 2×2 portrait grid fills the card */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
              {[IMG.g1before, IMG.bm1before, IMG.g1after, IMG.asian7after].map((src, i) => (
                <div key={i} className="relative overflow-hidden bg-neutral-900">
                  <Image src={src} alt="AI portrait" fill className="object-cover object-top" sizes="180px" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded-md bg-amber-400/20 border border-amber-400/30">
                  <ImageIcon className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Image Generation</span>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">Words into Worlds</h3>
            </div>
          </motion.div>

          {/* ── VIDEO SUITE — cinematic dark card, no tabs ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-4 relative rounded-3xl border border-white/8 overflow-hidden bg-[#05030f]"
            style={{ minHeight: 270 }}>
            {/* Cinematic bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-950/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(120,80,255,0.15)_0%,transparent_60%)]" />
            {/* Big play button area on right */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-purple-400/15 border border-purple-400/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-purple-300 fill-purple-300 ml-0.5" />
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full border border-purple-400/10 scale-125" />
                <div className="absolute inset-0 rounded-full border border-purple-400/5 scale-150" />
              </div>
            </div>
            <div className="relative z-10 p-5 h-full flex flex-col justify-between" style={{ minHeight: 270 }}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-purple-400/20 border border-purple-400/30">
                    <Video className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest">Video Suite</span>
                </div>
                <h3 className="text-white font-bold text-xl mb-2 max-w-xs leading-tight">Generate. Clone.<br />Animate. Sync.</h3>
                <p className="text-white/35 text-xs max-w-xs leading-relaxed">
                  Full video AI pipeline — text-to-video, motion transfer, lip sync, and video cloning in one place.
                </p>
              </div>
              {/* Model logos strip */}
              <div className="flex items-center gap-2 mt-4">
                {[
                  { logo: "/images/openai_sora.webp", name: "Sora" },
                  { logo: "/images/google_logo.webp", name: "Veo" },
                  { logo: "/images/kling_logo.webp", name: "Kling" },
                  { logo: "/images/bytedance_logo.webp", name: "Doubao" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07]">
                    <div className="w-5 h-5 rounded flex items-center justify-center overflow-hidden bg-white/10 flex-shrink-0">
                      <Image src={m.logo} alt={m.name} width={14} height={14} className="object-contain" />
                    </div>
                    <span className="text-[10px] text-white/50 font-bold">{m.name}</span>
                  </div>
                ))}
                <span className="text-[10px] text-white/25 ml-1">+60 more</span>
              </div>
            </div>
          </motion.div>

          {/* ── IMAGE EDIT — comparison slider ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 relative rounded-3xl border border-white/8 bg-[#0f0f0f] flex flex-col overflow-hidden"
            style={{ minHeight: 270 }}>
            <div className="flex-1 relative">
              <ComparisonSlider before={IMG.bm1before} after={IMG.bm1after} beforeAlt="Before edit" afterAlt="After edit" speed={0.07} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10 pointer-events-none">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded-md bg-green-400/20 border border-green-400/30">
                  <Wand2 className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Image Edit</span>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">Prompt-Based Editing</h3>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPSCALER DEEP DIVE — comparison card + big copy
// ─────────────────────────────────────────────────────────────────────────────
function UpscalerSection() {
  const { pos, cur, setPos, setPaused } = useSlider(50, 5, 95, 0.07)
  const [drag, setDrag] = useState(false)
  const [res, setRes] = useState<"4K" | "8K">("8K")
  const ref = useRef<HTMLDivElement>(null)
  const secRef = useRef(null)
  const inView = useInView(secRef, { once: true, margin: "-100px" })

  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(0, Math.min((cx - r.left) / r.width * 100, 100))
    setPos(cur.current)
  }, [cur, setPos])

  const stats = [
    { v: "8192px", l: "Max Output", y: true },
    { v: "Up to 4×", l: "Scale Factor" },
    { v: "<90s", l: "Processing" },
    { v: "99.1%", l: "Quality Score" },
  ]

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 right-0 w-[800px] h-[700px] bg-[#FFFF00]/[0.03] rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-blue-600/[0.03] rounded-full blur-[100px]" />
      </div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-[1300px] mx-auto">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div ref={ref}
              className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-ew-resize select-none bg-neutral-900"
              style={{ aspectRatio: "4/5" }}
              onPointerDown={e => { setDrag(true); setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
              onPointerMove={e => drag && onMove(e.clientX)}
              onPointerUp={() => { setDrag(false); setPaused(false) }}>
              <div className="absolute inset-0 bg-neutral-900">
                <Image src={IMG.g2before} alt="Low-res original" fill className="object-cover object-top" sizes="700px" />
              </div>
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
                <div className="absolute inset-0 bg-neutral-800">
                  <Image src={IMG.g1after} alt="AI upscaled" fill className="object-cover object-top" sizes="700px" />
                </div>
              </div>
              <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${pos}%` }}>
                <div className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-2 border-white/70 bg-black/50 backdrop-blur-xl flex items-center justify-center shadow-xl">
                  <ScanLine className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-[#FFFF00]/20 backdrop-blur-md border border-[#FFFF00]/30 text-[10px] font-black text-[#FFFF00] uppercase tracking-widest pointer-events-none z-20">{res} AI</div>
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest pointer-events-none z-20">Original</div>
            </div>
          </motion.div>

          <motion.div ref={secRef} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="space-y-7">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFF00]/10 border border-[#FFFF00]/20 text-[#FFFF00] text-[11px] font-black uppercase tracking-widest mb-5">
                <Maximize2 className="w-3.5 h-3.5" /> Smart Upscaler
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-black text-white leading-[0.9] mb-4">
                240p to<br /><span className="text-[#FFFF00]">8K Clarity.</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed">
                Our AI doesn&apos;t just enlarge — it <em className="text-white not-italic font-semibold">reconstructs</em>. Every texture synthesized from millions of high-res references to produce output indistinguishable from native 8K.
              </p>
            </div>
            <div className="flex gap-3">
              {(["4K", "8K"] as const).map(r => (
                <button key={r} onClick={() => setRes(r)}
                  className={cn("flex-1 py-3.5 rounded-xl border font-black text-sm transition-all",
                    res === r ? "bg-[#FFFF00] border-[#FFFF00] text-black shadow-[0_0_28px_rgba(255,255,0,0.25)]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/25")}>
                  {r} · {r === "4K" ? "80" : "120"} credits
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 + 0.3 }}
                  className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                  <div className={cn("text-2xl font-black font-heading mb-1", s.y ? "text-[#FFFF00]" : "text-white")}>{s.v}</div>
                  <div className="text-[11px] text-white/35 uppercase tracking-wider font-medium">{s.l}</div>
                </motion.div>
              ))}
            </div>
            <Link href="/app/upscaler">
              <button className="w-full py-4 rounded-xl bg-[#FFFF00] text-black font-bold text-base inline-flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(255,255,0,0.3)] transition-all duration-300 mt-1">
                Try Upscaler Free <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SKIN EDITOR — THE ONE SECTION WITH SETTINGS UI
// ─────────────────────────────────────────────────────────────────────────────
function SkinEditorSection() {
  const [texture, setTexture] = useState(65)
  const [detail, setDetail] = useState(45)
  const [smooth, setSmooth] = useState(72)
  const [mode, setMode] = useState("natural")
  const [zones, setZones] = useState({ face: true, skin: true, nose: false, mouth: true, eyes: false, hair: false })
  const [processing, setProcessing] = useState(false)
  const coverage = Math.round(Object.values(zones).filter(Boolean).length / Object.keys(zones).length * 100)

  const sliders = [
    { label: "Texture Strength", v: texture, set: setTexture, c: "#FFFF00" },
    { label: "Micro Detail", v: detail, set: setDetail, c: "#60a5fa" },
    { label: "Transformation Depth", v: smooth, set: setSmooth, c: "#a78bfa" },
  ]
  const modes = [
    { id: "natural", l: "Natural", d: "Realistic pore texture" },
    { id: "smooth", l: "Smooth", d: "Refined skin tone" },
    { id: "detailed", l: "Detailed", d: "Enhanced micro-detail" },
  ]

  return (
    <section className="py-24 relative overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] bg-blue-700/[0.04] rounded-full blur-[150px]" />
      </div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5 text-[11px] font-bold text-white/40 uppercase tracking-widest">
            <Cpu className="w-3.5 h-3.5 text-blue-400" /> Skin Editor Pro
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Professional Grade <span className="text-[#FFFF00]">Control.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Surgical precision meets AI. Real-time visual feedback on every parameter.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-5 max-w-[1300px] mx-auto">
          {/* Preview — comparison with metrics overlay */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl" style={{ minHeight: 520 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1200] via-[#0d0d1a] to-[#001420]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(255,160,0,0.18)_0%,transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(96,165,250,0.15)_0%,transparent_55%)]" />
            <ComparisonSlider before={IMG.bm1before} after={IMG.bm1after} beforeAlt="Before skin edit" afterAlt="After skin edit" speed={0.06} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none z-20" />
            <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-30 pointer-events-none">
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">Live Preview</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 text-[11px] font-mono text-white/40">4K · 60FPS</div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#FFFF00]/15 backdrop-blur-xl border border-[#FFFF00]/25 text-[11px] font-black text-[#FFFF00] capitalize">{mode} Mode</div>
            </div>
            <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-3 z-30 pointer-events-none">
              {sliders.map((s, i) => (
                <div key={i} className="bg-black/65 backdrop-blur-xl border border-white/10 p-3.5 rounded-xl">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{s.label.split(" ")[0]}</span>
                    <span className="text-xl font-black font-heading" style={{ color: s.c }}>{s.v}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: s.c }} animate={{ width: `${s.v}%` }} transition={{ duration: 0.4 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Controls panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex-1 bg-[#111] border border-white/8 rounded-3xl p-5 flex flex-col gap-5 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-[#FFFF00]" />
                  <span className="font-bold text-white text-sm">Parameters</span>
                </div>
                <button onClick={() => { setTexture(65); setDetail(45); setSmooth(72) }} className="text-[10px] text-white/25 hover:text-white/60 transition-colors uppercase tracking-wider font-bold">Reset</button>
              </div>
              <div className="space-y-5">
                {sliders.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-white/60 font-medium">{s.label}</span>
                      <span className="font-mono text-white/35">{s.v}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={s.v} onChange={e => s.set(+e.target.value)}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" style={{ accentColor: s.c }} />
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-white/[0.06]">
                <span className="text-[10px] font-bold text-white/35 uppercase tracking-widest block mb-3">Processing Mode</span>
                <div className="space-y-1.5">
                  {modes.map(m => (
                    <button key={m.id} onClick={() => setMode(m.id)}
                      className={cn("w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all",
                        mode === m.id ? "bg-white/10 border-blue-400/40" : "bg-transparent border-white/[0.05] hover:bg-white/[0.04]")}>
                      <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center", mode === m.id ? "border-blue-400" : "border-white/20")}>
                        {mode === m.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </div>
                      <div>
                        <div className={cn("text-xs font-bold", mode === m.id ? "text-white" : "text-white/50")}>{m.l}</div>
                        <div className="text-[10px] text-white/25">{m.d}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-white/[0.06]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-white/35 uppercase tracking-widest">Target Zones</span>
                  <span className="text-[10px] font-mono text-[#FFFF00]">{coverage}% Active</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(zones) as Array<keyof typeof zones>).map(z => (
                    <button key={z} onClick={() => setZones(p => ({ ...p, [z]: !p[z] }))}
                      className={cn("px-2.5 py-1 rounded-lg border text-[11px] font-bold capitalize transition-all",
                        zones[z] ? "bg-blue-400/20 border-blue-400/35 text-blue-300" : "bg-white/[0.04] border-white/[0.07] text-white/30 hover:text-white/55")}>
                      {z}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => { setProcessing(true); setTimeout(() => setProcessing(false), 3000) }} disabled={processing}
              className="w-full py-4 rounded-2xl bg-[#FFFF00] text-black font-bold text-base hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {processing ? <><Cpu className="w-4 h-4 animate-spin" />Processing...</> : "Apply Enhancement"}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. IMAGE GEN — Editorial full-width gallery, NO controls
// ─────────────────────────────────────────────────────────────────────────────
function ImageGenSection() {
  const [activePrompt, setActivePrompt] = useState(0)
  const prompts = [
    "Cinematic portrait, golden hour, ultra-sharp 8K",
    "Fashion editorial, dramatic shadows, high contrast",
    "Studio portrait, skin detail, photorealistic",
    "AI skin restoration, natural glow, 4K output",
  ]
  useEffect(() => {
    const t = setInterval(() => setActivePrompt(i => (i + 1) % prompts.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="py-24 bg-[#040404] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-amber-500/[0.025] rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8">
        {/* Header — left headline + right description */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 max-w-[1300px] mx-auto">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[11px] font-black uppercase tracking-widest mb-5">
              <ImageIcon className="w-3.5 h-3.5" /> Image Generation
            </div>
            <h2 className="font-heading text-5xl md:text-7xl font-black text-white leading-[0.88]">
              Words into<br /><span className="text-[#FFFF00]">Worlds.</span>
            </h2>
          </div>
          <div className="lg:max-w-xs space-y-4">
            <p className="text-white/50 leading-relaxed">
              Describe anything. Our model suite — Google, ByteDance, OpenAI and more — turns text into publication-ready imagery.
            </p>
            <Link href="/app/image">
              <button className="inline-flex items-center gap-2 bg-[#FFFF00] text-black font-bold px-6 py-3 rounded-xl text-sm hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] transition-all">
                Generate Now <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Gallery — asymmetric mosaic, no settings */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.15 }}
          className="max-w-[1300px] mx-auto">
          <div className="grid grid-cols-12 grid-rows-2 gap-3" style={{ height: 520 }}>

            {/* Col 1-3 tall — g1after */}
            <div className="col-span-3 row-span-2 relative rounded-3xl overflow-hidden group" style={{ background: "linear-gradient(160deg, #1a0f00 0%, #0d0700 60%, #050005 100%)" }}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,140,0,0.25)_0%,transparent_60%)]" />
              <Image src={IMG.g1after} alt="AI portrait" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-700" sizes="320px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <AnimatePresence mode="wait">
                  <motion.div key={activePrompt} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    <div className="text-[9px] text-white/30 font-mono mb-1.5 leading-relaxed truncate">&ldquo;{prompts[activePrompt]}&rdquo;</div>
                  </motion.div>
                </AnimatePresence>
                <span className="px-2 py-0.5 rounded-md bg-[#FFFF00]/20 border border-[#FFFF00]/30 text-[9px] font-black text-[#FFFF00] uppercase tracking-wider">AI Enhanced</span>
              </div>
            </div>

            {/* Col 4-7 top — g1before */}
            <div className="col-span-4 row-span-1 relative rounded-3xl overflow-hidden group" style={{ background: "linear-gradient(135deg, #001030 0%, #000818 100%)" }}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(60,100,255,0.3)_0%,transparent_65%)]" />
              <Image src={IMG.g1before} alt="Original portrait" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-700" sizes="400px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="px-2 py-0.5 rounded-full bg-blue-400/20 border border-blue-400/25 text-[8px] font-black text-blue-300 uppercase tracking-wider">Portrait</span>
              </div>
            </div>

            {/* Col 8-12 top — bm1after */}
            <div className="col-span-5 row-span-1 relative rounded-3xl overflow-hidden group" style={{ background: "linear-gradient(135deg, #0d0008 0%, #050005 100%)" }}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(180,80,255,0.25)_0%,transparent_65%)]" />
              <Image src={IMG.bm1after} alt="AI enhanced portrait" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-700" sizes="500px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="px-2 py-0.5 rounded-full bg-purple-400/20 border border-purple-400/25 text-[8px] font-black text-purple-300 uppercase tracking-wider">Realism</span>
              </div>
            </div>

            {/* Col 4-8 bottom — g2before */}
            <div className="col-span-5 row-span-1 relative rounded-3xl overflow-hidden group" style={{ background: "linear-gradient(135deg, #061208 0%, #030a04 100%)" }}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(40,180,80,0.25)_0%,transparent_65%)]" />
              <Image src={IMG.g2before} alt="Natural portrait" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-700" sizes="500px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="px-2 py-0.5 rounded-full bg-green-400/20 border border-green-400/25 text-[8px] font-black text-green-300 uppercase tracking-wider">Natural</span>
              </div>
            </div>

            {/* Col 9-12 bottom — asian7after */}
            <div className="col-span-4 row-span-1 relative rounded-3xl overflow-hidden group" style={{ background: "linear-gradient(135deg, #0d0800 0%, #080500 100%)" }}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(255,180,0,0.2)_0%,transparent_65%)]" />
              <Image src={IMG.asian7after} alt="AI portrait" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-700" sizes="400px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00]" />
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/25 text-[8px] font-black text-amber-300 uppercase tracking-wider">Cinematic</span>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Model logos row */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-[1300px] mx-auto mt-6 flex items-center gap-4">
          <span className="text-[10px] text-white/25 uppercase tracking-widest font-bold whitespace-nowrap">Powered by</span>
          {["/images/google_logo.webp", "/images/bytedance_logo.webp", "/images/openai_sora.webp", "/images/kling_logo.webp"].map((logo, i) => (
            <div key={i} className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center overflow-hidden">
              <Image src={logo} alt="Model" width={18} height={18} className="object-contain" />
            </div>
          ))}
          <ArrowUpRight className="w-3.5 h-3.5 text-white/15 ml-1" />
          <span className="text-[10px] text-white/20 font-medium">50+ AI models</span>
        </motion.div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. STATS STRIP
// ─────────────────────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { v: "8K", l: "Max Output" },
    { v: "50+", l: "AI Models" },
    { v: "99.1%", l: "Quality Score" },
    { v: "20×", l: "Faster Processing" },
  ]
  return (
    <div className="py-16 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #050505 0%, #0a0a00 50%, #050505 100%)" }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,0,0.06)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FFFF00]/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FFFF00]/20 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="text-center">
              <div className="font-heading font-black text-6xl md:text-7xl text-[#FFFF00] mb-2 leading-none drop-shadow-[0_0_40px_rgba(255,255,0,0.3)]">{s.v}</div>
              <div className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. PRICING
// ─────────────────────────────────────────────────────────────────────────────
function PricingWrapper() {
  return (
    <section id="pricing" className="py-24 bg-[#050505] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#FFFF00]/[0.025] rounded-full blur-[140px]" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5 text-[11px] font-bold text-white/40 uppercase tracking-widest">
            <Star className="w-3.5 h-3.5 text-[#FFFF00]" /> Pricing Plans
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-black text-white mb-4">
            Start Free.<br /><span className="text-[#FFFF00]">Scale Fearlessly.</span>
          </h2>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            Credits that work across every tool. No feature gates. No surprises.
          </p>
        </motion.div>
        <MyPricingPlans2 />
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Home2Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <NavigationHero4 />
      <Hero />
      <Ticker />
      <BentoFeatures />
      <UpscalerSection />
      <SkinEditorSection />
      <ImageGenSection />
      <StatsStrip />
      <PricingWrapper />
      <FAQSection />
      <Footer />
    </main>
  )
}
