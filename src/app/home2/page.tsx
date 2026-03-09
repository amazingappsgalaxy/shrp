"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"
import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"
import { FAQSection } from "@/components/sections/FAQSection"
import { cn } from "@/lib/utils"
import {
  ArrowRight, ChevronLeft, ChevronRight,
  Play, Maximize2, Sparkles, Wand2,
  Upload, Zap, Download, Camera,
  Users, Building2, Globe, CheckCircle2, Star
} from "lucide-react"

// ─── ASSETS ────────────────────────────────────────────────────────────────────
const IMG = {
  g1b:  "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg",
  g1a:  "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png",
  g2b:  "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+2+Before.jpg",
  bm1b: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+Before.jpg",
  bm1a: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+After.png",
  asian:"https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+after.png",
}

const VID = {
  createVideo:  "https://static.higgsfield.ai/explore/create-video.mp4",
  createVideoT: "https://static.higgsfield.ai/explore/create-video.webp",
  upscale:      "https://static.higgsfield.ai/explore/upscale.mp4",
  upscaleT:     "https://static.higgsfield.ai/explore/upscale.webp",
  lipsync:      "https://static.higgsfield.ai/explore/lipsync-studio.mp4",
  lipsyncT:     "https://static.higgsfield.ai/explore/lipsync-studio.webp",
  editVideo:    "https://static.higgsfield.ai/explore/edit-video.mp4",
  editVideoT:   "https://static.higgsfield.ai/explore/edit-video.webp",
  motion:       "https://static.higgsfield.ai/kling-motion-control-square.mp4",
  motionT:      "https://static.higgsfield.ai/kling-motion-control-square.webp",
  soulCin:      "https://static.higgsfield.ai/image/soul-cinematic-banner.mp4",
  soulCinT:     "https://static.higgsfield.ai/image/soul-cinematic-banner.webp",
  soul2:        "https://static.higgsfield.ai/soul2/soul2.mp4",
  soul2T:       "https://static.higgsfield.ai/soul2/soul2.webp",
  aiInfluencer: "https://static.higgsfield.ai/ai-influencer/ai-influencer-main.mp4",
  aiInfluencerT:"https://static.higgsfield.ai/ai-influencer/ai-influencer-main.webp",
  triple:       "https://static.higgsfield.ai/image/soul-cinematic-banner.mp4",
  tripleT:      "https://static.higgsfield.ai/image/soul-cinematic-banner.webp",
  nanoBanana:   "https://static.higgsfield.ai/flow/nano-banana-2-banner.mp4",
  nanoBananaT:  "https://static.higgsfield.ai/flow/nano-banana-2-banner.webp",
  kling3:       "https://static.higgsfield.ai/promotion/kling-3-hero.mp4",
  kling3T:      "https://static.higgsfield.ai/promotion/kling-3-hero.webp",
}

// ─── AUTOPLAY VIDEO ────────────────────────────────────────────────────────────
function AutoVid({ src, poster, className = "" }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => { ref.current?.play().catch(() => {}) }, [])
  return (
    <video ref={ref} src={src} poster={poster} muted loop playsInline autoPlay
      className={cn("w-full h-full object-cover", className)} />
  )
}

// ─── COMPARISON SLIDER ─────────────────────────────────────────────────────────
// Redesigned: white handle with arrows, thick visible divider, object-center for faces
function useSlider(init = 50, min = 20, max = 80, speed = 0.05) {
  const [pos, setPos] = useState(init)
  const [paused, setPaused] = useState(false)
  const dir = useRef(1)
  const cur = useRef(init)
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

function ComparisonSlider({
  before, after, beforeAlt, afterAlt, speed = 0.05, className = ""
}: {
  before: string; after: string; beforeAlt: string; afterAlt: string
  speed?: number; className?: string
}) {
  const { pos, cur, setPos, setPaused } = useSlider(50, 20, 80, speed)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(5, Math.min((cx - r.left) / r.width * 100, 95))
    setPos(cur.current)
  }, [cur, setPos])

  return (
    <div ref={ref}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ cursor: drag ? "grabbing" : "ew-resize" }}
      onPointerDown={e => { setDrag(true); setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
      onPointerMove={e => drag && onMove(e.clientX)}
      onPointerUp={() => { setDrag(false); setPaused(false) }}
      onPointerLeave={() => { if (drag) { setDrag(false); setPaused(false) } }}
    >
      {/* BEFORE — always full size */}
      <div className="absolute inset-0">
        <Image src={before} alt={beforeAlt} fill className="object-cover object-center" sizes="(max-width:768px) 100vw, 60vw" />
      </div>
      {/* AFTER — clipped with clipPath so image renders at full size */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={after} alt={afterAlt} fill className="object-cover object-center" sizes="(max-width:768px) 100vw, 60vw" />
      </div>
      {/* Divider — thick, always visible white line */}
      <div className="absolute top-0 bottom-0 pointer-events-none z-20"
        style={{ left: `${pos}%`, transform: "translateX(-50%)", width: 3, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 20px rgba(255,255,255,0.7)" }} />
      {/* Handle — large white circle with arrows */}
      <div className="absolute z-20 pointer-events-none flex items-center justify-center"
        style={{ left: `${pos}%`, top: "50%", transform: "translate(-50%,-50%)", width: 52, height: 52, borderRadius: "50%", background: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
        <ChevronLeft className="w-4 h-4 text-black absolute left-2" />
        <ChevronRight className="w-4 h-4 text-black absolute right-2" />
      </div>
      {/* Corner badges */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
        <span className="bg-black/70 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-md text-[10px] font-black text-white/60 uppercase tracking-widest">Before</span>
      </div>
      <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
        <span className="bg-[#FFFF00] px-2.5 py-1 rounded-md text-[10px] font-black text-black uppercase tracking-widest">After</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. HERO — full screen, face-centered images, prominent slider
// ══════════════════════════════════════════════════════════════════════════════
function Hero() {
  const { pos, cur, setPos, setPaused } = useSlider(50, 20, 80, 0.045)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(5, Math.min((cx - r.left) / r.width * 100, 95))
    setPos(cur.current)
  }, [cur, setPos])

  return (
    <section className="relative w-full bg-black overflow-hidden" style={{ height: "100svh", minHeight: 700 }}>
      {/* Comparison canvas */}
      <div ref={ref} className="absolute inset-0"
        style={{ cursor: drag ? "grabbing" : "ew-resize" }}
        onPointerDown={e => { setDrag(true); setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
        onPointerMove={e => drag && onMove(e.clientX)}
        onPointerUp={() => { setDrag(false); setPaused(false) }}
        onPointerLeave={() => { if (drag) { setDrag(false); setPaused(false) } }}
      >
        {/* BEFORE */}
        <div className="absolute inset-0 bg-neutral-900">
          {/* object-center: shows faces, not tops of heads */}
          <Image src={IMG.g1b} alt="Original photo" fill className="object-cover object-center" priority sizes="100vw" />
        </div>
        {/* AFTER */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <div className="absolute inset-0 bg-neutral-800">
            <Image src={IMG.g1a} alt="AI enhanced" fill className="object-cover object-center" priority sizes="100vw" />
          </div>
        </div>
        {/* Divider */}
        <div className="absolute top-0 bottom-0 z-30 pointer-events-none"
          style={{ left: `${pos}%`, transform: "translateX(-50%)", width: 3, background: "rgba(255,255,255,0.95)", boxShadow: "0 0 24px rgba(255,255,255,0.8)" }} />
        <div className="absolute z-30 pointer-events-none flex items-center justify-center"
          style={{ left: `${pos}%`, top: "50%", transform: "translate(-50%,-50%)", width: 56, height: 56, borderRadius: "50%", background: "white", boxShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
          <ChevronLeft className="w-4 h-4 text-black absolute left-2.5" />
          <ChevronRight className="w-4 h-4 text-black absolute right-2.5" />
        </div>
        {/* Corner labels */}
        <div className="absolute top-24 left-6 z-30 pointer-events-none">
          <span className="bg-black/65 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white/60 uppercase tracking-widest">Original</span>
        </div>
        <div className="absolute top-24 right-6 z-30 pointer-events-none">
          <span className="flex items-center gap-1.5 bg-[#FFFF00] px-3 py-1.5 rounded-lg text-[11px] font-black text-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-black/50 animate-pulse" />AI Enhanced
          </span>
        </div>
      </div>

      {/* Dark gradient from bottom for text */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* Hero content */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-6 md:px-14 lg:px-20 pb-12 max-w-[1440px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />
              <span className="text-[11px] font-bold text-white/65 uppercase tracking-[0.18em]">AI-Powered Visual Enhancement</span>
            </div>
            <h1 className="font-black text-white leading-[0.82] tracking-tight" style={{ fontSize: "clamp(3.5rem,8vw,8rem)" }}>
              MAKE IT<br /><span className="text-[#FFFF00]">SHARP.</span>
            </h1>
          </div>
          <div className="lg:max-w-[400px] flex flex-col gap-5">
            <p className="text-white/55 text-lg leading-relaxed">
              Transform any photo into breathtaking 8K detail. Drag the slider above — see the difference instantly.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/app/dashboard">
                <button className="bg-[#FFFF00] text-black font-bold h-14 px-8 rounded-xl text-sm inline-flex items-center gap-2 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,0,0.4)] transition-all duration-300">
                  Start for Free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="#video">
                <button className="border border-white/20 text-white font-medium h-14 px-7 rounded-xl text-sm bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
                  See All Tools
                </button>
              </Link>
            </div>
            <p className="text-white/30 text-xs">Drag slider above to compare · 8K output · 50+ AI models</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. TICKER
// ══════════════════════════════════════════════════════════════════════════════
function Ticker() {
  const items = ["8K Upscaling", "AI Skin Editor", "Image Generation", "Video Generation", "Motion Transfer", "Lip Sync", "AI Portraits", "Video Editing", "Image Restoration", "AI Influencer"]
  return (
    <div className="py-4 bg-[#FFFF00] overflow-hidden z-10 relative border-y border-black/10">
      <motion.div className="flex w-max" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
        {[...items, ...items].map((t, i) => (
          <span key={i} className="text-black font-black text-sm uppercase tracking-[0.2em] px-8 inline-flex items-center gap-8">
            {t}<span className="text-black/20 text-xs">◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. FEATURE STRIP — horizontal scroll cards, each feature unique
// ══════════════════════════════════════════════════════════════════════════════
function FeatureStrip() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const FEATURES = [
    {
      tag: "Smart Upscaler",
      headline: "Up to 8K\nResolution",
      sub: "AI reconstruction — every pore, strand rebuilt from scratch.",
      accent: "text-[#FFFF00]",
      bg: "bg-[#0c0c08]",
      credits: "80–120 cr",
      media: (
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            <Image src={IMG.g1b} alt="before" fill className="object-cover object-center" sizes="340px" />
            <div className="absolute inset-0" style={{ clipPath: "inset(0 40% 0 0)" }}>
              <Image src={IMG.g1a} alt="after" fill className="object-cover object-center" sizes="340px" />
            </div>
            {/* Static half divider */}
            <div className="absolute top-0 bottom-0" style={{ left: "60%", width: 2, background: "rgba(255,255,255,0.9)" }} />
            <div className="absolute" style={{ left: "60%", top: "50%", transform: "translate(-50%,-50%)", width: 36, height: 36, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
              <ChevronLeft className="w-3 h-3 text-black absolute left-1.5" />
              <ChevronRight className="w-3 h-3 text-black absolute right-1.5" />
            </div>
          </div>
        </div>
      ),
    },
    {
      tag: "Skin Editor",
      headline: "Pixel-Perfect\nSkin Control",
      sub: "Texture, tone, and depth — adjusted with precision sliders.",
      accent: "text-amber-400",
      bg: "bg-[#0c0a08]",
      credits: "60–100 cr",
      media: (
        <div className="absolute inset-0">
          <Image src={IMG.bm1a} alt="skin enhanced" fill className="object-cover object-center" sizes="340px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      ),
    },
    {
      tag: "Image Generation",
      headline: "Imagine.\nCreate.",
      sub: "50+ AI models. Any style, any subject, any resolution.",
      accent: "text-purple-400",
      bg: "bg-[#0a080c]",
      credits: "30–80 cr",
      media: (
        <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-0.5">
          <div className="relative rounded-sm overflow-hidden bg-neutral-800">
            <Image src={IMG.g2b} alt="gen" fill className="object-cover object-center" sizes="160px" />
          </div>
          <div className="relative rounded-sm overflow-hidden bg-neutral-800">
            <Image src={IMG.asian} alt="gen" fill className="object-cover object-center" sizes="160px" />
          </div>
          <div className="relative rounded-sm overflow-hidden bg-neutral-800">
            <Image src={IMG.bm1a} alt="gen" fill className="object-cover object-center" sizes="160px" />
          </div>
          <div className="relative rounded-sm overflow-hidden bg-neutral-800">
            <Image src={IMG.g1a} alt="gen" fill className="object-cover object-center" sizes="160px" />
          </div>
        </div>
      ),
    },
    {
      tag: "Video Generation",
      headline: "Generate\nVideos.",
      sub: "Text to video, lip sync, motion transfer and 8 more AI video tools.",
      accent: "text-violet-400",
      bg: "bg-[#08080c]",
      credits: "40–120 cr",
      media: (
        <div className="absolute inset-0">
          <AutoVid src={VID.soul2} poster={VID.soul2T} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      ),
    },
    {
      tag: "Image Editing",
      headline: "Edit with\nPrompts.",
      sub: "Describe changes in plain language. AI handles the rest.",
      accent: "text-cyan-400",
      bg: "bg-[#080c0c]",
      credits: "20–60 cr",
      media: (
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            <Image src={IMG.bm1b} alt="before edit" fill className="object-cover object-center" sizes="340px" />
            <div className="absolute inset-0" style={{ clipPath: "inset(0 35% 0 0)" }}>
              <Image src={IMG.bm1a} alt="after edit" fill className="object-cover object-center" sizes="340px" />
            </div>
            <div className="absolute top-0 bottom-0" style={{ left: "65%", width: 2, background: "rgba(255,255,255,0.9)" }} />
          </div>
        </div>
      ),
    },
  ]

  return (
    <section className="py-20 bg-[#050505]">
      <div className="px-6 md:px-14 lg:px-20 mb-10 max-w-[1440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="flex items-end justify-between"
        >
          <div>
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-3">01 / Feature Suite</p>
            <h2 className="font-black text-white leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5vw,5rem)" }}>
              Everything You<br /><span className="text-[#FFFF00]">Need.</span>
            </h2>
          </div>
          <div className="hidden lg:flex gap-2">
            <button onClick={() => scrollRef.current?.scrollBy({ left: -360, behavior: "smooth" })}
              className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/8 transition-colors">
              <ChevronLeft className="w-4 h-4 text-white/50" />
            </button>
            <button onClick={() => scrollRef.current?.scrollBy({ left: 360, behavior: "smooth" })}
              className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/8 transition-colors">
              <ChevronRight className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </motion.div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pl-6 md:pl-14 lg:pl-20 pr-6 pb-4"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
            className={cn("flex-shrink-0 rounded-2xl overflow-hidden border border-white/8 flex flex-col", f.bg)}
            style={{ width: 340, scrollSnapAlign: "start" }}
          >
            {/* Media area — portrait ratio */}
            <div className="relative flex-shrink-0" style={{ height: 320 }}>
              {f.media}
              {/* Tag */}
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-black/65 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-md text-[10px] font-black text-white/70 uppercase tracking-widest">{f.tag}</span>
              </div>
            </div>
            {/* Info */}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className={cn("font-black text-2xl leading-tight mb-3 whitespace-pre-line", f.accent)}>{f.headline}</h3>
              <p className="text-white/45 text-sm leading-relaxed flex-1">{f.sub}</p>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/8">
                <span className="text-white/30 text-xs font-semibold">{f.credits}</span>
                <ArrowRight className="w-4 h-4 text-white/25" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. VIDEO SUITE — HUGE main video + feature grid + strip
// ══════════════════════════════════════════════════════════════════════════════
const VIDEO_FEATURES = [
  { src: VID.createVideo, poster: VID.createVideoT, name: "AI Video Generation", desc: "Text to video in seconds" },
  { src: VID.lipsync,     poster: VID.lipsyncT,     name: "Lip Sync Studio",     desc: "Audio-driven face animation" },
  { src: VID.motion,      poster: VID.motionT,       name: "Motion Transfer",     desc: "Apply real-world motion" },
  { src: VID.editVideo,   poster: VID.editVideoT,    name: "AI Video Editor",     desc: "Edit clips with text prompts" },
]

const STRIP_VIDS = [
  { src: VID.soul2,        poster: VID.soul2T,        name: "Style Transfer" },
  { src: VID.aiInfluencer, poster: VID.aiInfluencerT, name: "AI Influencer" },
  { src: VID.soulCin,      poster: VID.soulCinT,      name: "Cinematic Mode" },
  { src: VID.nanoBanana,   poster: VID.nanoBananaT,   name: "Flow Animation" },
  { src: VID.kling3,       poster: VID.kling3T,       name: "Kling 3.0 Model" },
  { src: VID.upscale,      poster: VID.upscaleT,      name: "Video Upscaling" },
]

function VideoSection() {
  return (
    <section id="video" className="bg-[#030308] pt-20 pb-0">
      <div className="px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
        {/* Section header — editorial layout */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8"
        >
          <div>
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-3">02 / Video Suite</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3.5rem,7vw,7.5rem)" }}>
              GENERATE<br /><span className="text-violet-400">VIDEOS.</span>
            </h2>
          </div>
          <div className="lg:max-w-sm lg:pb-3">
            <p className="text-white/45 text-lg leading-relaxed mb-5">11 video AI tools in one subscription. Create, sync, edit, clone, and animate.</p>
            <Link href="/app/dashboard">
              <button className="bg-[#FFFF00] text-black font-bold h-13 px-7 py-3.5 rounded-xl text-sm inline-flex items-center gap-2 hover:scale-105 transition-all hover:shadow-[0_0_35px_rgba(255,255,0,0.35)]">
                Explore Video Tools <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* MASSIVE hero video — 21:9 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.9 }}
          className="relative rounded-2xl overflow-hidden mb-4 border border-white/8"
          style={{ aspectRatio: "21/9" }}
        >
          <AutoVid src={VID.soul2} poster={VID.soul2T} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-y-0 left-0 flex flex-col justify-center pl-10 md:pl-14 max-w-xs z-10">
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-[10px] font-bold text-white/70 uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
            </span>
            <h3 className="font-black text-3xl md:text-4xl text-white leading-tight mb-2">11 Video<br />AI Tools</h3>
            <p className="text-white/55 text-sm">From text to cinematic output</p>
          </div>
        </motion.div>

        {/* 4-card feature grid — each with proper 16:9 video */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {VIDEO_FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
              className="rounded-xl overflow-hidden border border-white/8 bg-[#080810] group"
            >
              {/* 16:9 video */}
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                <AutoVid src={f.src} poster={f.poster} />
                <div className="absolute inset-0 bg-black/20" />
              </div>
              <div className="p-4">
                <div className="font-bold text-white text-base mb-1">{f.name}</div>
                <div className="text-white/40 text-xs">{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full-bleed scrolling strip — edge to edge */}
      <div className="overflow-hidden bg-[#020205] border-t border-white/6 mt-4 py-3">
        <motion.div
          className="flex gap-3 w-max px-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
        >
          {[...STRIP_VIDS, ...STRIP_VIDS].map((v, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden flex-shrink-0 border border-white/8"
              style={{ width: 320, aspectRatio: "16/9" }}>
              <AutoVid src={v.src} poster={v.poster} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <span className="text-sm font-bold text-white">{v.name}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. SMART UPSCALER — dominant left comparison, details right
// ══════════════════════════════════════════════════════════════════════════════
function UpscalerSection() {
  return (
    <section className="bg-[#060606] py-20">
      <div className="px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-stretch" style={{ minHeight: 640 }}>

          {/* Left: LARGE comparison slider in portrait container */}
          <motion.div
            initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.9 }}
            className="relative rounded-2xl overflow-hidden border border-white/8 bg-neutral-900 lg:flex-[6]"
            style={{ minHeight: 580 }}
          >
            <ComparisonSlider
              before={IMG.bm1b} after={IMG.bm1a}
              beforeAlt="Low-res original" afterAlt="8K AI upscaled"
              speed={0.05}
            />
          </motion.div>

          {/* Right: text details */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.9 }}
            className="lg:flex-[4] flex flex-col justify-center"
          >
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-5">03 / Smart Upscaler</p>
            <h2 className="font-black text-white leading-[0.85] mb-6" style={{ fontSize: "clamp(2.5rem,4.5vw,4.5rem)" }}>
              NOT SCALED.<br /><span className="text-[#FFFF00]">REBUILT.</span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              Our AI doesn't just enlarge pixels. It synthesizes entirely new detail — skin texture, hair strands, micro-contrast — from scratch.
            </p>

            {/* Resolution tiers */}
            <div className="space-y-3 mb-8">
              {[
                { res: "4K", px: "3840 × 2160px", cr: "80 cr", color: "border-blue-500/30 bg-blue-500/5" },
                { res: "8K", px: "7680 × 4320px", cr: "120 cr", color: "border-[#FFFF00]/30 bg-[#FFFF00]/5" },
              ].map((r, i) => (
                <div key={i} className={cn("flex items-center justify-between p-4 rounded-xl border", r.color)}>
                  <div>
                    <div className="text-white font-bold text-base">{r.res} Output</div>
                    <div className="text-white/40 text-xs mt-0.5">{r.px}</div>
                  </div>
                  <div className="text-[#FFFF00] text-sm font-bold">{r.cr}</div>
                </div>
              ))}
            </div>

            <Link href="/app/upscaler">
              <button className="bg-[#FFFF00] text-black font-bold h-14 px-8 rounded-xl text-sm inline-flex items-center gap-2 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,0,0.35)] transition-all">
                Try Upscaler Free <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. SKIN EDITOR — reversed: controls LEFT, portrait image RIGHT
// ══════════════════════════════════════════════════════════════════════════════
function SkinEditorSection() {
  const [activeMode, setActiveMode] = useState(1)
  const [zones, setZones] = useState([0, 1, 2])
  const [sliders, setSliders] = useState({ texture: 68, detail: 45, depth: 72 })
  const MODES = ["Natural", "Smooth", "Detailed"]
  const ZONES = ["Face", "Skin", "Eyes", "Mouth", "Neck", "Hair"]
  const CONTROLS = [
    { key: "texture" as const, label: "Texture Strength", color: "#FFFF00", track: "#2a2a00" },
    { key: "detail"  as const, label: "Micro Detail",     color: "#60a5fa", track: "#0a1520" },
    { key: "depth"   as const, label: "Pore Depth",       color: "#c084fc", track: "#1a0a30" },
  ]

  return (
    <section className="bg-[#04040a] py-20">
      <div className="px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-stretch" style={{ minHeight: 640 }}>

          {/* Left: controls panel */}
          <motion.div
            initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.9 }}
            className="lg:flex-[4] flex flex-col justify-center"
          >
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-5">04 / Skin Editor</p>
            <h2 className="font-black text-white leading-[0.85] mb-6" style={{ fontSize: "clamp(2.5rem,4.5vw,4.5rem)" }}>
              PIXEL-PERFECT<br /><span className="text-amber-400">CONTROL.</span>
            </h2>
            <p className="text-white/50 text-base leading-relaxed mb-8">
              Real-time AI enhancement with granular controls. Adjust every parameter and see results instantly in the live preview.
            </p>

            {/* Mode selector */}
            <div className="mb-6">
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Enhancement Mode</div>
              <div className="flex gap-2">
                {MODES.map((m, i) => (
                  <button key={i} onClick={() => setActiveMode(i)}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                      activeMode === i ? "bg-[#FFFF00] text-black" : "bg-white/6 text-white/50 hover:bg-white/10"
                    )}>{m}</button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-5 mb-6">
              {CONTROLS.map(c => (
                <div key={c.key}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white/55 text-xs font-semibold">{c.label}</span>
                    <span className="text-xs font-black" style={{ color: c.color }}>{sliders[c.key]}%</span>
                  </div>
                  <div className="relative h-2 rounded-full" style={{ background: c.track }}>
                    <div className="absolute left-0 top-0 h-full rounded-full transition-all"
                      style={{ width: `${sliders[c.key]}%`, background: c.color }} />
                    <input type="range" min={0} max={100} value={sliders[c.key]}
                      onChange={e => setSliders(s => ({ ...s, [c.key]: +e.target.value }))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* Zone chips */}
            <div className="mb-8">
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Target Zones</div>
              <div className="flex flex-wrap gap-2">
                {ZONES.map((z, i) => (
                  <button key={i} onClick={() => setZones(v => v.includes(i) ? v.filter(x => x !== i) : [...v, i])}
                    className={cn("px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
                      zones.includes(i) ? "border-[#FFFF00]/60 text-[#FFFF00] bg-[#FFFF00]/10" : "border-white/12 text-white/35 hover:border-white/25"
                    )}>{z}</button>
                ))}
              </div>
            </div>

            <Link href="/app/skineditor">
              <button className="bg-[#FFFF00] text-black font-bold h-14 px-8 rounded-xl text-sm inline-flex items-center gap-2 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,0,0.35)] transition-all">
                Open Skin Editor <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>

          {/* Right: large portrait image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.9 }}
            className="relative rounded-2xl overflow-hidden border border-white/8 bg-neutral-900 lg:flex-[6]"
            style={{ minHeight: 580 }}
          >
            <Image src={IMG.bm1a} alt="Skin editor live preview" fill className="object-cover object-center" sizes="700px" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
            {/* Live indicator */}
            <div className="absolute top-5 right-5 z-10">
              <span className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-lg text-xs font-bold text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />Live Preview
              </span>
            </div>
            {/* Stats overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/60 to-transparent flex gap-4">
              {[["99.1%","Quality"], ["<90s","Process"], ["8K","Output"]].map(([v,l]) => (
                <div key={l} className="text-center flex-1">
                  <div className="text-[#FFFF00] font-black text-xl">{v}</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. IMAGE GENERATION — editorial full-width portrait gallery
// ══════════════════════════════════════════════════════════════════════════════
const PROMPTS = [
  "A photorealistic portrait, golden hour, 8K detail",
  "Cinematic headshot, studio lighting, ultra-sharp",
  "Editorial fashion portrait, natural light, film grain",
  "Black and white portrait, dramatic shadows",
]

function ImageGenSection() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setP(x => (x + 1) % PROMPTS.length), 3200)
    return () => clearInterval(t)
  }, [])

  const TILES = [
    { src: IMG.g1a,  label: "Natural Portrait",  wide: false },
    { src: IMG.g2b,  label: "Fashion Shot",       wide: false },
    { src: IMG.bm1a, label: "Studio Portrait",    wide: true  },
    { src: IMG.asian,label: "Editorial",          wide: false },
    { src: IMG.g1b,  label: "Outdoor",            wide: false },
  ]

  return (
    <section className="bg-black py-20">
      <div className="px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10"
        >
          <div>
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-3">05 / Image Generation</p>
            <h2 className="font-black text-white leading-[0.85]" style={{ fontSize: "clamp(3rem,6vw,6.5rem)" }}>
              IMAGINE.<br /><span className="text-purple-400">CREATE.</span>
            </h2>
          </div>
          <div className="lg:max-w-xs lg:pb-2 space-y-4">
            <div className="p-4 rounded-xl bg-white/4 border border-white/8">
              <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">Sample Prompt</div>
              <AnimatePresence mode="wait">
                <motion.p key={p}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="text-white/70 text-sm italic leading-relaxed"
                >&ldquo;{PROMPTS[p]}&rdquo;</motion.p>
              </AnimatePresence>
            </div>
            <Link href="/app/image">
              <button className="w-full bg-[#FFFF00] text-black font-bold h-12 rounded-xl text-sm inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                Generate Now <Sparkles className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Portrait tiles — 5 equal flex tiles, all aspect-[3/4] */}
        <div className="flex gap-3">
          {TILES.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.08 }}
              className="relative flex-1 rounded-xl overflow-hidden border border-white/8 bg-neutral-900 group"
              style={{ aspectRatio: "3/4" }}
            >
              <Image src={t.src} alt={t.label} fill className="object-cover object-center transition-transform duration-500 group-hover:scale-105" sizes="20vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-xs font-bold text-white">{t.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. HOW IT WORKS — large numbered, minimal
// ══════════════════════════════════════════════════════════════════════════════
const STEPS = [
  { n: "01", icon: Upload, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", title: "Upload Your Photo", desc: "JPG, PNG, or RAW. Any resolution. Our AI handles the rest automatically." },
  { n: "02", icon: Zap,    color: "text-[#FFFF00]",  bg: "bg-[#FFFF00]/10 border-[#FFFF00]/20", title: "AI Enhances in Seconds", desc: "Choose mode and parameters. The model reconstructs every detail from scratch." },
  { n: "03", icon: Download, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", title: "Download in 8K", desc: "Export lossless 8K. Ready for print, production, or publishing immediately." },
]

function HowItWorks() {
  return (
    <section className="bg-[#060606] py-20">
      <div className="px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-4">06 / How It Works</p>
          <h2 className="font-black text-white leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5vw,5rem)" }}>
            Simple Process.<br /><span className="text-[#FFFF00]">Stunning Results.</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.12 }}
              className="p-8 rounded-2xl bg-[#0a0a0a] border border-white/8"
            >
              <div className={cn("w-14 h-14 rounded-xl border flex items-center justify-center mb-6", s.bg)}>
                <s.icon className={cn("w-6 h-6", s.color)} />
              </div>
              <div className={cn("text-sm font-black mb-3 tracking-[0.2em]", s.color)}>{s.n}</div>
              <h3 className="text-white font-bold text-xl mb-3">{s.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. WHO IS IT FOR — audience cards
// ══════════════════════════════════════════════════════════════════════════════
const AUDIENCES = [
  { icon: Camera, color: "text-blue-400", bg: "bg-blue-500/8 border-blue-500/15", title: "Photographers", stat: "8K output", points: ["Batch upscale entire shoots", "Non-destructive editing", "RAW + JPEG support"] },
  { icon: Users,  color: "text-[#FFFF00]", bg: "bg-[#FFFF00]/8 border-[#FFFF00]/15", title: "Content Creators", stat: "50+ models", points: ["Thumbnail optimization", "AI portrait retouching", "Video frame upscaling"] },
  { icon: Building2, color: "text-violet-400", bg: "bg-violet-500/8 border-violet-500/15", title: "Studios & Agencies", stat: "Enterprise", points: ["Team workspaces", "Priority processing", "API access"] },
  { icon: Globe, color: "text-green-400", bg: "bg-green-500/8 border-green-500/15", title: "Brands", stat: "Commercial", points: ["Product photo upscaling", "Batch processing", "Commercial license"] },
]

function WhoIsItFor() {
  return (
    <section className="bg-[#030303] py-20">
      <div className="px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-4">07 / Built For You</p>
          <h2 className="font-black text-white leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5vw,5rem)" }}>
            Who Uses<br /><span className="text-[#FFFF00]">Sharpii.ai</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {AUDIENCES.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.09 }}
              className={cn("p-7 rounded-2xl border flex flex-col", a.bg)}
            >
              <div className="w-12 h-12 rounded-xl border flex items-center justify-center mb-5" style={{ borderColor: "inherit" }}>
                <a.icon className={cn("w-5 h-5", a.color)} />
              </div>
              <div className={cn("text-xs font-black uppercase tracking-widest mb-2", a.color)}>{a.stat}</div>
              <h3 className="text-white font-bold text-xl mb-3">{a.title}</h3>
              <ul className="space-y-2 mt-auto">
                {a.points.map((p, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-white/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />{p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 10. STATS — giant numbers
// ══════════════════════════════════════════════════════════════════════════════
const STATS = [
  { n: "8K",    l: "Max Output",    s: "7680 × 4320px" },
  { n: "50+",   l: "AI Models",     s: "Across all tools" },
  { n: "99.1%", l: "Quality Score", s: "User satisfaction" },
  { n: "20×",   l: "Faster",        s: "vs manual editing" },
]

function StatsSection() {
  return (
    <section className="py-20 bg-black border-y border-white/6">
      <div className="px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/6 rounded-2xl overflow-hidden">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-black px-8 py-10 text-center"
            >
              <div className="font-black text-[#FFFF00] leading-none mb-3" style={{ fontSize: "clamp(2.8rem,5vw,5rem)" }}>{s.n}</div>
              <div className="text-white font-bold text-base mb-1">{s.l}</div>
              <div className="text-white/30 text-xs uppercase tracking-widest">{s.s}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 11. TESTIMONIALS
// ══════════════════════════════════════════════════════════════════════════════
const TESTIMONIALS = [
  { quote: "Sharpii.ai changed how I deliver portrait sessions. My clients think I upgraded my camera.", name: "Sarah Kim", role: "Portrait Photographer" },
  { quote: "I used to spend 2 hours retouching per video. With Sharpii I process an entire batch in 10 minutes.", name: "Marcus Johnson", role: "Content Creator, 2.1M followers" },
  { quote: "The skin editor is the most sophisticated AI retouching tool I've ever used.", name: "Priya Mehta", role: "Creative Director, Studio 44" },
]

function Testimonials() {
  return (
    <section className="bg-[#060606] py-20">
      <div className="px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-4">08 / Reviews</p>
          <h2 className="font-black text-white leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5vw,5rem)" }}>
            Trusted By<br /><span className="text-[#FFFF00]">Thousands.</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-[#0c0c0c] border border-white/8"
            >
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-[#FFFF00] text-[#FFFF00]" />)}
              </div>
              <p className="text-white/70 text-base leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div className="text-white font-bold text-sm">{t.name}</div>
                <div className="text-white/35 text-xs mt-0.5">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 12. PRICING
// ══════════════════════════════════════════════════════════════════════════════
function PricingWrapper() {
  return (
    <section id="pricing" className="bg-[#030303] py-20">
      <div className="px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-4">09 / Pricing</p>
          <h2 className="font-black text-white leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5vw,5rem)" }}>
            Start Free.<br /><span className="text-[#FFFF00]">Scale Fearlessly.</span>
          </h2>
          <p className="text-white/40 text-lg mt-4">Credits work across every tool. No feature gates. Cancel anytime.</p>
        </motion.div>
        <MyPricingPlans2 />
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function Home2Page() {
  return (
    <div className="min-h-screen bg-black text-white">
      <NavigationHero4 />
      <Hero />
      <Ticker />
      <FeatureStrip />
      <VideoSection />
      <UpscalerSection />
      <SkinEditorSection />
      <ImageGenSection />
      <HowItWorks />
      <WhoIsItFor />
      <StatsSection />
      <Testimonials />
      <PricingWrapper />
      <FAQSection />
      <Footer />
    </div>
  )
}
