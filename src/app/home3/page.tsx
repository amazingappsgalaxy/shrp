"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"
import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"
import { FAQSection } from "@/components/sections/FAQSection"
import { cn } from "@/lib/utils"
import {
  ArrowRight, ChevronLeft, ChevronRight, Star, Sparkles, Zap,
  Brush, Eraser, Square, Type, Layers, Mic, Music, Video,
  Camera, Wand2, ImageIcon, Download, Play,
  Users, Building2, Globe,
} from "lucide-react"

// ─── ASSETS ───────────────────────────────────────────────────────────────────
const IMG = {
  g1b:   "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg",
  g1a:   "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png",
  g2b:   "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+2+Before.jpg",
  bm1b:  "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+Before.jpg",
  bm1a:  "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+After.png",
  asian: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+after.png",
}

const VID = {
  soul2:        "https://static.higgsfield.ai/soul2/soul2.mp4",
  soul2T:       "https://static.higgsfield.ai/soul2/soul2.webp",
  createVideo:  "https://static.higgsfield.ai/explore/create-video.mp4",
  createVideoT: "https://static.higgsfield.ai/explore/create-video.webp",
  lipsync:      "https://static.higgsfield.ai/explore/lipsync-studio.mp4",
  lipsyncT:     "https://static.higgsfield.ai/explore/lipsync-studio.webp",
  motion:       "https://static.higgsfield.ai/kling-motion-control-square.mp4",
  motionT:      "https://static.higgsfield.ai/kling-motion-control-square.webp",
  editVideo:    "https://static.higgsfield.ai/explore/edit-video.mp4",
  editVideoT:   "https://static.higgsfield.ai/explore/edit-video.webp",
  upscale:      "https://static.higgsfield.ai/explore/upscale.mp4",
  upscaleT:     "https://static.higgsfield.ai/explore/upscale.webp",
  aiInfluencer: "https://static.higgsfield.ai/ai-influencer/ai-influencer-main.mp4",
  aiInfluencerT:"https://static.higgsfield.ai/ai-influencer/ai-influencer-main.webp",
  soulCin:      "https://static.higgsfield.ai/image/soul-cinematic-banner.mp4",
  soulCinT:     "https://static.higgsfield.ai/image/soul-cinematic-banner.webp",
  nanoBanana:   "https://static.higgsfield.ai/flow/nano-banana-2-banner.mp4",
  nanoBananaT:  "https://static.higgsfield.ai/flow/nano-banana-2-banner.webp",
  kling3:       "https://static.higgsfield.ai/promotion/kling-3-hero.mp4",
  kling3T:      "https://static.higgsfield.ai/promotion/kling-3-hero.webp",
  nanoModel:    "https://static.higgsfield.ai/explore/nano-model.mp4",
  nanoModelT:   "https://static.higgsfield.ai/explore/nano-model.webp",
}

// ─── STYLE OVERRIDES ──────────────────────────────────────────────────────────
function NavStyleOverride() {
  return (
    <style>{`
      nav.glass-premium {
        background: rgba(0,0,0,0.75) !important;
        border-color: rgba(255,255,255,0.1) !important;
        backdrop-filter: blur(24px) !important;
        transition: background 0.35s ease, border-color 0.35s ease !important;
      }
      html[data-nav-theme="light"] nav.glass-premium {
        background: rgba(0,0,0,0.90) !important;
        border-color: rgba(255,255,255,0.12) !important;
      }
      @keyframes autoScrollX {
        from { transform: translateX(0); }
        to   { transform: translateX(-50%); }
      }
      .auto-scroll-x {
        animation: autoScrollX 52s linear infinite;
      }
      .auto-scroll-x:hover { animation-play-state: paused; }
      .skin-xhair { opacity: 0; transition: opacity 0.2s; }
      .skin-container:hover .skin-xhair { opacity: 1; }
    `}</style>
  )
}

function NavThemeController() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const lightSections = document.querySelectorAll("[data-nav-light]")
    const visible = new Set<Element>()
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target) })
      document.documentElement.setAttribute("data-nav-theme", visible.size > 0 ? "light" : "dark")
    }, { threshold: 0, rootMargin: "-72px 0px -85% 0px" })
    lightSections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [])
  return null
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function AutoVid({ src, poster, className = "" }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => { ref.current?.play().catch(() => {}) }, [])
  return <video ref={ref} src={src} poster={poster} muted loop playsInline autoPlay className={cn("w-full h-full object-cover", className)} />
}

function useSlider(init = 50, min = 20, max = 80, speed = 0.045) {
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

// ─── 1. HERO ──────────────────────────────────────────────────────────────────
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
      <div ref={ref} className="absolute inset-0"
        style={{ cursor: drag ? "grabbing" : "ew-resize", touchAction: "none" }}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); setPaused(true); onMove(e.clientX) }}
        onPointerMove={e => drag && onMove(e.clientX)}
        onPointerUp={e => { e.currentTarget.releasePointerCapture(e.pointerId); setDrag(false); setPaused(false) }}
        onPointerLeave={() => { if (drag) { setDrag(false); setPaused(false) } }}
      >
        <div className="absolute inset-0 bg-neutral-900">
          <Image src={IMG.g1b} alt="Original" fill className="object-cover object-center" priority sizes="100vw" />
        </div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <div className="absolute inset-0 bg-neutral-800">
            <Image src={IMG.g1a} alt="AI Enhanced" fill className="object-cover object-center" priority sizes="100vw" />
          </div>
        </div>
        <div className="absolute top-0 bottom-0 z-30 pointer-events-none"
          style={{ left: `${pos}%`, transform: "translateX(-50%)", width: 3, background: "rgba(255,255,255,0.95)", boxShadow: "0 0 24px rgba(255,255,255,0.8)" }} />
        <div className="absolute z-30 pointer-events-none flex items-center justify-center"
          style={{ left: `${pos}%`, top: "50%", transform: "translate(-50%,-50%)", width: 56, height: 56, borderRadius: "50%", background: "white", boxShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
          <ChevronLeft className="w-4 h-4 text-black absolute left-2.5" />
          <ChevronRight className="w-4 h-4 text-black absolute right-2.5" />
        </div>
      </div>
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-40 px-6 md:px-14 lg:px-20 pb-12 max-w-[1440px] mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />
              <span className="text-[11px] font-bold text-white/65 uppercase tracking-[0.18em]">AI-Powered Visual Enhancement</span>
            </div>
            <h1 className="font-black text-white leading-[0.82] tracking-tight" style={{ fontSize: "clamp(3.8rem,9vw,9.5rem)" }}>
              MAKE IT<br /><span className="text-[#FFFF00]">SHARP.</span>
            </h1>
          </div>
          <div className="lg:max-w-[400px] flex flex-col gap-5">
            <p className="text-white/55 text-lg leading-relaxed">
              Transform any photo into breathtaking 8K detail. Drag the slider — see the difference instantly.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/signup">
                <button className="bg-[#FFFF00] text-black font-bold h-14 px-8 rounded-xl text-sm inline-flex items-center gap-2 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,0,0.35)] transition-all duration-300">
                  Start for Free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/app">
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

// ─── 2. TICKER ────────────────────────────────────────────────────────────────
function Ticker() {
  const items = ["Smart Upscaler", "8K Output", "50+ AI Models", "Skin Editor", "Video Generation",
    "Lip Sync", "Motion Transfer", "Image Editing", "AI Portraits", "Video Upscaling", "AI Influencer", "Relight AI"]
  const all = [...items, ...items]
  return (
    <div className="bg-[#FFFF00] overflow-hidden py-[14px] border-y border-[#e6e600]">
      <motion.div className="flex w-max gap-10 items-center"
        animate={{ x: ["0%", "-50%"] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }}>
        {all.map((t, i) => (
          <span key={i} className="text-black font-black text-[13px] uppercase tracking-[0.14em] whitespace-nowrap flex items-center gap-4">
            {t}<span className="text-black/30">◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ─── 3. FEATURES REEL — doubled tile sizes ────────────────────────────────────
function FeaturesReel() {
  const FEATURES = [
    { name: "Smart Upscaler", tag: "8K",     src: VID.upscale,      poster: VID.upscaleT,      portrait: false },
    { name: "Skin Editor",    tag: "AI",     src: VID.nanoBanana,   poster: VID.nanoBananaT,   portrait: true  },
    { name: "Lip Sync",       tag: "Audio",  src: VID.lipsync,      poster: VID.lipsyncT,      portrait: true  },
    { name: "AI Video Gen",   tag: "Create", src: VID.kling3,       poster: VID.kling3T,       portrait: false },
    { name: "Motion Transfer",tag: "Kling",  src: VID.motion,       poster: VID.motionT,       portrait: false },
    { name: "AI Influencer",  tag: "Brand",  src: VID.aiInfluencer, poster: VID.aiInfluencerT, portrait: true  },
    { name: "Image Edit",     tag: "Mask",   src: VID.editVideo,    poster: VID.editVideoT,    portrait: false },
    { name: "Video Upscale",  tag: "4K",     src: VID.nanoModel,    poster: VID.nanoModelT,    portrait: true  },
    { name: "Soul Cinematic", tag: "Film",   src: VID.soul2,        poster: VID.soul2T,        portrait: false },
    { name: "AI Video Edit",  tag: "Prompt", src: VID.editVideo,    poster: VID.editVideoT,    portrait: false },
  ]
  const all = [...FEATURES, ...FEATURES]

  return (
    <section className="bg-[#030307] pt-20 pb-0 overflow-hidden"
      style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "100% 80px" }}>
      <div className="px-8 lg:px-14 mb-10 max-w-[1440px] mx-auto">
        <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-4">The Platform</p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <h2 className="font-black text-white leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5.5vw,6rem)" }}>
            ONE PLATFORM.<br /><span className="text-[#FFFF00]">EVERY TOOL.</span>
          </h2>
          <p className="text-white/35 text-[14px] max-w-xs leading-relaxed lg:pb-1">
            Photo enhancement, AI portraits, video generation, lip sync, motion transfer — all under one subscription.
          </p>
        </div>
      </div>

      {/* Two-row scroll strip — full width, no padding */}
      <div className="pb-24">
        {/* Row 1 — forward */}
        <div className="overflow-hidden mb-4">
          <div className="flex gap-4 w-max auto-scroll-x">
            {all.map((f, i) => (
              <div key={i} className="flex-shrink-0 relative rounded-2xl overflow-hidden bg-[#0f0f18]"
                style={{ width: f.portrait ? 280 : 460, height: 360 }}>
                <AutoVid src={f.src} poster={f.poster} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <div className="text-white font-black text-[15px]">{f.name}</div>
                  <div className="text-[#FFFF00] text-[10px] font-black uppercase tracking-widest mt-1">{f.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Row 2 — reverse at offset */}
        <div className="overflow-hidden" style={{ marginLeft: "-180px" }}>
          <div className="flex gap-4 w-max" style={{ animation: "autoScrollX 64s linear infinite reverse" }}>
            {[...all].reverse().map((f, i) => (
              <div key={i} className="flex-shrink-0 relative rounded-2xl overflow-hidden bg-[#0f0f18]"
                style={{ width: f.portrait ? 240 : 400, height: 300 }}>
                <AutoVid src={f.src} poster={f.poster} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <div className="text-white font-black text-[13px]">{f.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 4. UPSCALER — fixed slider with setPointerCapture ───────────────────────
function UpscalerSection() {
  const { pos, cur, setPos, setPaused } = useSlider(50, 15, 85, 0.018)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(5, Math.min((cx - r.left) / r.width * 100, 95))
    setPos(cur.current)
  }, [cur, setPos])

  return (
    <section className="bg-[#07070b] overflow-hidden"
      style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
      <div className="flex flex-col lg:flex-row" style={{ minHeight: "95vh" }}>
        {/* LEFT: Stats */}
        <div className="lg:w-[38%] flex flex-col justify-between px-8 lg:px-14 py-16 lg:py-24 border-r border-white/5">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-10">01 / Smart Upscaler</p>
            <div className="font-black text-[#FFFF00] leading-none mb-2"
              style={{ fontSize: "clamp(7rem,18vw,14rem)", letterSpacing: "-0.05em", lineHeight: 0.82 }}>8K</div>
            <div className="text-white/20 font-black text-2xl mb-8 uppercase tracking-wide">Resolution</div>
            <h2 className="font-black text-white leading-[0.88] mb-6" style={{ fontSize: "clamp(2rem,3.5vw,3.2rem)" }}>
              NOT SCALED.<br />REBUILT.
            </h2>
            <p className="text-white/35 text-[15px] max-w-[320px] leading-relaxed mb-12">
              AI synthesizes new detail from scratch — skin texture, hair strands, micro-contrast. Zero artifacts at any resolution.
            </p>
          </div>
          <div className="space-y-0 divide-y divide-white/6 mb-10">
            {[
              { l: "4K Output", v: "4096 × 4096 px", n: "80 credits" },
              { l: "8K Output", v: "7680 × 4320 px", n: "120 credits" },
              { l: "Processing", v: "~90 seconds",    n: "per image" },
              { l: "Formats",   v: "JPEG · PNG · WEBP", n: "RAW input" },
            ].map(s => (
              <div key={s.l} className="flex items-center justify-between py-4">
                <span className="text-white/40 text-[13px] font-medium">{s.l}</span>
                <div className="text-right">
                  <span className="text-white text-[13px] font-bold">{s.v}</span>
                  <span className="text-white/25 text-[11px] ml-2">{s.n}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/app/upscaler"
            className="inline-flex items-center gap-2.5 bg-[#FFFF00] px-8 py-4 rounded-xl text-black font-black text-[15px] hover:bg-white transition-colors duration-200 self-start">
            Try Upscaler Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* RIGHT: Comparison — fixed with setPointerCapture */}
        <div ref={ref} className="lg:flex-1 relative"
          style={{ minHeight: 580, cursor: drag ? "grabbing" : "ew-resize", touchAction: "none" }}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); setPaused(true); onMove(e.clientX) }}
          onPointerMove={e => drag && onMove(e.clientX)}
          onPointerUp={e => { e.currentTarget.releasePointerCapture(e.pointerId); setDrag(false); setPaused(false) }}
          onPointerLeave={() => { if (drag) { setDrag(false); setPaused(false) } }}>
          <div className="absolute inset-0">
            <Image src={IMG.bm1b} alt="Original" fill className="object-cover object-center" sizes="60vw" />
          </div>
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <Image src={IMG.bm1a} alt="AI 8K" fill className="object-cover object-center" sizes="60vw" />
          </div>
          <div className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{ left: `${pos}%`, transform: "translateX(-50%)", width: 3, background: "rgba(255,255,255,0.95)", boxShadow: "0 0 20px rgba(255,255,255,0.7)" }} />
          <div className="absolute z-30 pointer-events-none flex items-center justify-center"
            style={{ left: `${pos}%`, top: "50%", transform: "translate(-50%,-50%)", width: 56, height: 56, borderRadius: "50%", background: "white", boxShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
            <ChevronLeft className="w-4 h-4 text-black absolute left-2.5" />
            <ChevronRight className="w-4 h-4 text-black absolute right-2.5" />
          </div>
          <div className="absolute bottom-8 left-8 z-40 pointer-events-none flex gap-3">
            <div className="bg-black/70 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl">
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-0.5">Input</div>
              <div className="text-white font-black text-sm">2 MP</div>
            </div>
            <div className="bg-[#FFFF00]/10 backdrop-blur-md border border-[#FFFF00]/30 px-4 py-2.5 rounded-xl">
              <div className="text-[#FFFF00]/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">AI Output</div>
              <div className="text-[#FFFF00] font-black text-sm">33 MP · 8K</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 5. SKIN DETAIL MAGNIFIER — crosshairs hidden until hover ─────────────────
function SkinDetailMagnifier() {
  const containerRef = useRef<HTMLDivElement>(null)
  const magnifierRef = useRef<HTMLDivElement>(null)
  const crossHRef = useRef<HTMLDivElement>(null)
  const crossVRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleMove = (e: MouseEvent) => {
      const { left, top, width, height } = container.getBoundingClientRect()
      const x = ((e.clientX - left) / width) * 100
      const y = ((e.clientY - top) / height) * 100
      if (magnifierRef.current) {
        magnifierRef.current.style.left = `calc(${x}% - 110px)`
        magnifierRef.current.style.top = `calc(${y}% - 110px)`
        magnifierRef.current.style.backgroundPosition = `${x * 0.98}% ${y * 0.98}%`
      }
      if (crossHRef.current) crossHRef.current.style.left = `${x}%`
      if (crossVRef.current) crossVRef.current.style.top = `${y}%`
    }
    container.addEventListener("mousemove", handleMove, { passive: true })
    return () => container.removeEventListener("mousemove", handleMove)
  }, [])

  return (
    <section className="bg-[#04040a] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-24">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Detail Engine</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,6vw,7rem)" }}>
              EVERY PORE.<br /><span className="text-[#FFFF00]">EVERY STRAND.</span>
            </h2>
          </div>
          <p className="text-white/35 text-[14px] max-w-xs leading-relaxed lg:pb-2">
            At 8K, sharpii synthesizes realistic skin texture, micro-detail, and fine hair — synthesized from data, not just stretched pixels.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: 520 }}>
          {/* Portrait with magnifier */}
          <div ref={containerRef} className="skin-container relative rounded-2xl overflow-hidden cursor-crosshair"
            style={{ minHeight: 480, backgroundImage: `url(${IMG.bm1a})`, backgroundSize: "cover", backgroundPosition: "center 10%" }}>
            <div ref={magnifierRef}
              className="absolute z-20 pointer-events-none rounded-full border-2 border-[#FFFF00]/60"
              style={{
                width: 220, height: 220,
                backgroundImage: `url(${IMG.bm1a})`,
                backgroundSize: "650%",
                backgroundPosition: "50% 38%",
                boxShadow: "0 0 0 3px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.8)",
                left: "calc(50% - 110px)", top: "calc(38% - 110px)",
              }} />
            {/* Crosshairs — hidden until hover via CSS class */}
            <div ref={crossHRef} className="skin-xhair absolute top-0 bottom-0 pointer-events-none z-10"
              style={{ width: 1, background: "rgba(255,255,0,0.25)", left: "50%" }} />
            <div ref={crossVRef} className="skin-xhair absolute left-0 right-0 pointer-events-none z-10"
              style={{ height: 1, background: "rgba(255,255,0,0.25)", top: "38%" }} />
            <div className="absolute bottom-5 left-5 z-30">
              <span className="bg-black/60 backdrop-blur-sm text-white/50 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                Move cursor to explore
              </span>
            </div>
          </div>

          {/* Right: detail specs */}
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { res: "1080p", mp: "2.1 MP",  dim: "1920×1080", hi: false },
                { res: "4K",    mp: "8.3 MP",  dim: "4096×4096", hi: false },
                { res: "8K",    mp: "33.2 MP", dim: "7680×4320", hi: true  },
              ].map(r => (
                <div key={r.res} className={cn("rounded-xl p-4 border", r.hi ? "bg-[#FFFF00]/8 border-[#FFFF00]/25" : "bg-white/[0.03] border-white/6")}>
                  <div className={cn("font-black text-2xl mb-1", r.hi ? "text-[#FFFF00]" : "text-white/70")}>{r.res}</div>
                  <div className="text-white/40 text-[11px] font-bold">{r.mp}</div>
                  <div className="text-white/20 text-[10px] mt-0.5">{r.dim}</div>
                  {r.hi && <div className="mt-2 text-[#FFFF00]/70 text-[10px] font-black uppercase tracking-wider">16× detail</div>}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 flex-1" style={{ minHeight: 240 }}>
              <div className="relative rounded-xl overflow-hidden" style={{ minHeight: 240 }}>
                <div className="absolute inset-0" style={{ backgroundImage: `url(${IMG.bm1b})`, backgroundSize: "450%", backgroundPosition: "52% 10%" }} />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent pt-10 px-3 pb-3">
                  <span className="bg-white/15 backdrop-blur-sm text-white/80 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/15">Original 1080p</span>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden ring-2 ring-[#FFFF00]/50" style={{ minHeight: 240 }}>
                <div className="absolute inset-0" style={{ backgroundImage: `url(${IMG.bm1a})`, backgroundSize: "450%", backgroundPosition: "52% 10%" }} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent pt-10 px-3 pb-3">
                  <span className="bg-[#FFFF00] text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">AI 8K</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "✦", l: "Skin Texture",  d: "Pore-level reconstruction" },
                { icon: "⊹", l: "Hair Strands",  d: "Individual strand synthesis" },
                { icon: "◈", l: "Micro-contrast", d: "Edge sharpness preserved" },
                { icon: "⬡", l: "Zero Artifacts", d: "No AI hallucination" },
              ].map(d => (
                <div key={d.l} className="bg-white/[0.03] border border-white/6 rounded-xl p-4">
                  <span className="text-[#FFFF00]/70 text-lg">{d.icon}</span>
                  <div className="text-white font-bold text-[13px] mt-2">{d.l}</div>
                  <div className="text-white/30 text-[11px] mt-0.5">{d.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 6. VIDEO SECTION — clean consistent grid ─────────────────────────────────
function VideoSection() {
  const CARDS = [
    { src: VID.soul2,        poster: VID.soul2T,        name: "Soul Cinematic",   accent: "#a78bfa", wide: true  },
    { src: VID.lipsync,      poster: VID.lipsyncT,      name: "Lip Sync Studio",  accent: "#f472b6", wide: false },
    { src: VID.aiInfluencer, poster: VID.aiInfluencerT, name: "AI Influencer",    accent: "#e879f9", wide: false },
    { src: VID.createVideo,  poster: VID.createVideoT,  name: "Video Generation", accent: "#818cf8", wide: true  },
    { src: VID.motion,       poster: VID.motionT,       name: "Motion Transfer",  accent: "#22d3ee", wide: false },
    { src: VID.editVideo,    poster: VID.editVideoT,    name: "Video Editor",     accent: "#fb923c", wide: false },
  ]
  return (
    <section className="bg-black pt-24 pb-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-3">02 / Video Suite</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,6vw,7.5rem)" }}>
              IMAGINE.<br /><span className="text-violet-400">GENERATE.</span>
            </h2>
          </div>
          <div className="max-w-[280px]">
            <p className="text-white/35 text-[14px] mb-5 leading-relaxed">11 AI video tools. Create, sync, transfer, edit — one subscription.</p>
            <Link href="/app/video" className="inline-flex items-center gap-2 border border-white/15 px-5 py-2.5 rounded-xl text-white/70 font-bold text-sm hover:bg-white/8 transition-colors">
              Explore Video <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Uniform 3-column grid */}
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Row 1: wide + 2 portrait */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden" style={{ height: 420, borderTop: `2px solid #a78bfa50` }}>
            <AutoVid src={VID.soul2} poster={VID.soul2T} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <div className="text-violet-300/50 text-[9px] font-bold uppercase tracking-widest mb-1">AI Generated</div>
              <div className="text-white font-black text-lg">Soul Cinematic</div>
              <div className="text-white/40 text-[12px]">Text prompt to full cinematic video</div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden" style={{ height: 420, borderTop: `2px solid #f472b650` }}>
            <AutoVid src={VID.lipsync} poster={VID.lipsyncT} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5">
              <div className="text-pink-400/60 text-[9px] font-bold uppercase tracking-widest mb-1">Audio Sync</div>
              <div className="text-white font-black">Lip Sync Studio</div>
              <div className="text-white/40 text-[12px]">Any audio to any face</div>
            </div>
          </div>
          {/* Row 2: 3 uniform cards */}
          {[
            { src: VID.aiInfluencer, poster: VID.aiInfluencerT, name: "AI Influencer",    sub: "Consistent AI persona",   accent: "#e879f9" },
            { src: VID.motion,       poster: VID.motionT,       name: "Motion Transfer",  sub: "Clone any movement",       accent: "#22d3ee" },
            { src: VID.editVideo,    poster: VID.editVideoT,    name: "Video Editor",     sub: "Prompt-based scene edits", accent: "#fb923c" },
          ].map(v => (
            <div key={v.name} className="relative rounded-2xl overflow-hidden" style={{ height: 300, borderTop: `2px solid ${v.accent}50` }}>
              <AutoVid src={v.src} poster={v.poster} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5">
                <div className="text-white font-black text-[15px]">{v.name}</div>
                <div className="text-white/40 text-[12px] mt-0.5">{v.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 7. VIDEO CATEGORIES — doubled size, full-width strip ─────────────────────
function VideoCategories() {
  const CATS = [
    { name: "Soul Cinematic",  desc: "Deep cinematic portrait motion",    src: VID.soul2,       poster: VID.soul2T,       accent: "#a78bfa" },
    { name: "AI Video Gen",    desc: "Text prompt to full video scene",   src: VID.createVideo, poster: VID.createVideoT, accent: "#f472b6" },
    { name: "Lip Sync",        desc: "Any audio animates any face",       src: VID.lipsync,     poster: VID.lipsyncT,     accent: "#34d399" },
    { name: "Motion Transfer", desc: "Copy movement to new subjects",     src: VID.motion,      poster: VID.motionT,      accent: "#22d3ee" },
    { name: "AI Video Edit",   desc: "Prompt-based scene changes",        src: VID.editVideo,   poster: VID.editVideoT,   accent: "#fb923c" },
    { name: "Video Upscale",   desc: "4K from any source footage",        src: VID.upscale,     poster: VID.upscaleT,     accent: "#FFFF00" },
    { name: "AI Influencer",   desc: "Consistent AI persona videos",      src: VID.aiInfluencer,poster: VID.aiInfluencerT,accent: "#e879f9" },
    { name: "Nano Fast Gen",   desc: "Ultra-fast generation mode",        src: VID.nanoModel,   poster: VID.nanoModelT,   accent: "#94a3b8" },
  ]
  const all = [...CATS, ...CATS]

  return (
    <section className="bg-[#060610] pt-24 pb-24 overflow-hidden">
      <div className="px-8 lg:px-14 mb-14 max-w-[1440px] mx-auto">
        <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">11 Video Formats</p>
        <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,5.5vw,6rem)" }}>
          EVERY KIND<br /><span className="text-violet-400">OF VIDEO.</span>
        </h2>
      </div>

      {/* Full-width auto-scroll, doubled size */}
      <div className="overflow-hidden">
        <div className="flex gap-5 w-max auto-scroll-x" style={{ animationDuration: "56s" }}>
          {all.map((cat, i) => (
            <div key={i} className="flex-shrink-0 rounded-2xl overflow-hidden relative group cursor-pointer"
              style={{ width: 340, height: 480, border: `1px solid ${cat.accent}25` }}>
              <AutoVid src={cat.src} poster={cat.poster} className="group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
              <div className="absolute bottom-6 left-5 right-5">
                <div className="text-white font-black text-[17px] mb-1.5">{cat.name}</div>
                <div className="text-white/50 text-[13px] leading-snug mb-4">{cat.desc}</div>
                <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: cat.accent }}>
                  {cat.accent === "#FFFF00" ? "★ FEATURED" : "→ EXPLORE"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 8. MOTION TRANSFER ───────────────────────────────────────────────────────
function MotionTransfer() {
  return (
    <section className="bg-[#080814] pt-24 pb-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Motion Transfer</p>
            <h2 className="font-black text-white leading-[0.88] mb-6" style={{ fontSize: "clamp(2.4rem,4.5vw,5rem)" }}>
              ANY MOTION.<br /><span className="text-cyan-400">ANY PERSON.</span>
            </h2>
            <p className="text-white/35 text-[15px] leading-relaxed mb-10 max-w-[380px]">
              Take any movement — a dance, a gesture, a walk — from any reference video. Apply it exactly to a different person. No motion capture, no markers.
            </p>
            <div className="space-y-4 mb-10">
              {[
                { n: "1", t: "Pick a source video with movement" },
                { n: "2", t: "Choose the target person" },
                { n: "3", t: "AI transfers motion frame-by-frame" },
              ].map(s => (
                <div key={s.n} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center shrink-0">
                    <span className="text-cyan-300 text-[11px] font-black">{s.n}</span>
                  </div>
                  <span className="text-white/55 text-[14px]">{s.t}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-5 flex-wrap mb-10">
              {["Kling 2.1", "No Markers", "Any Genre", "60fps"].map(tag => (
                <span key={tag} className="text-cyan-400 text-[11px] font-black uppercase tracking-widest">{tag}</span>
              ))}
            </div>
            <Link href="/app/video" className="inline-flex items-center gap-2 bg-cyan-500 px-6 py-3 rounded-xl text-black font-black text-sm hover:bg-cyan-400 transition-colors">
              Try Motion Transfer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden ring-1 ring-cyan-400/20" style={{ aspectRatio: "1/1" }}>
              <AutoVid src={VID.motion} poster={VID.motionT} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <div className="text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-1">Motion Transfer</div>
                  <div className="text-white font-black text-sm">Kling 2.1 Model</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-4 lg:-right-8 w-36 rounded-xl overflow-hidden ring-2 ring-cyan-400/30 shadow-2xl" style={{ height: 200 }}>
              <AutoVid src={VID.aiInfluencer} poster={VID.aiInfluencerT} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <div className="text-cyan-300 text-[9px] font-black uppercase tracking-widest">Transferred</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 9. AUDIO & LIP SYNC ──────────────────────────────────────────────────────
function AudioLipSync() {
  const BARS = Array.from({ length: 36 }, (_, i) => i)
  const barHeights = [0.3,0.6,0.9,0.5,0.8,0.4,1,0.7,0.5,0.9,0.3,0.7,0.8,0.5,0.6,0.4,0.9,0.7,0.5,0.8,0.3,0.6,1,0.4,0.7,0.5,0.9,0.6,0.3,0.8,0.5,0.7,0.4,0.9,0.6,0.8]

  return (
    <section className="bg-[#050510] py-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative" style={{ maxWidth: 380 }}>
            <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "3/4" }}>
              <AutoVid src={VID.lipsync} poster={VID.lipsyncT} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-5 py-5">
                <div className="flex items-end gap-[3px] mb-3 h-14">
                  {BARS.map(i => {
                    const h = barHeights[i % 36] ?? 0.5
                    return (
                      <motion.div key={i} className="flex-1 rounded-sm"
                        style={{ background: `rgba(233,30,140,${0.4 + h * 0.6})`, minWidth: 2 }}
                        animate={{ scaleY: [h * 0.4, h, h * 0.5] }}
                        transition={{ duration: 0.4 + (i % 7) * 0.07, repeat: Infinity, delay: i * 0.025, ease: "easeInOut" }} />
                    )
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e91e8c] animate-pulse" />
                  <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Audio Syncing Live...</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-white/25 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Audio &amp; Lip Sync</p>
            <h2 className="font-black text-white leading-[0.88] mb-6" style={{ fontSize: "clamp(2.6rem,5vw,5.5rem)" }}>
              YOUR WORDS.<br /><span className="text-[#e91e8c]">ANY FACE.</span>
            </h2>
            <p className="text-white/45 text-[15px] leading-relaxed mb-10 max-w-[380px]">
              Upload any audio — speech, voiceover, or song. AI synchronizes lip movement frame-by-frame with natural micro-expressions.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-10">
              {[
                { icon: Mic,      label: "Voice Sync",    desc: "Any spoken audio" },
                { icon: Music,    label: "Song Lip Sync", desc: "Music video ready" },
                { icon: Video,    label: "Live Preview",  desc: "See it instantly" },
                { icon: Download, label: "Export HD",     desc: "Up to 4K video" },
              ].map(f => (
                <div key={f.label} className="bg-white/[0.06] border border-white/10 rounded-xl p-4">
                  <f.icon className="w-5 h-5 text-[#e91e8c] mb-3" />
                  <div className="text-white font-bold text-[13px]">{f.label}</div>
                  <div className="text-white/40 text-[11px] mt-0.5">{f.desc}</div>
                </div>
              ))}
            </div>
            <Link href="/app/video"
              className="inline-flex items-center gap-2.5 bg-[#e91e8c] px-7 py-4 rounded-xl text-white font-black text-[14px] hover:bg-[#d01478] transition-colors">
              Try Lip Sync <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 10. SKIN EDITOR ──────────────────────────────────────────────────────────
function SkinEditorSection() {
  const [textureSize,  setTextureSize]  = useState(4)
  const [detailLevel,  setDetailLevel]  = useState(1.0)
  const [strength,     setStrength]     = useState(0.20)
  const [activeMode,   setActiveMode]   = useState("Real")
  const MODES = ["Poly", "Skin", "Freckle", "Real"]

  const texturePercent  = ((textureSize - 2) / 8) * 100
  const detailPercent   = ((detailLevel - 0.8) / 0.4) * 100
  const strengthPercent = ((strength - 0.1) / 0.28) * 100

  return (
    <section className="bg-[#0c0016] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: "88vh" }}>
        <div className="relative order-2 lg:order-1 overflow-hidden"
          style={{ minHeight: 640, backgroundImage: `url(${IMG.asian})`, backgroundSize: "cover", backgroundPosition: "center 20%" }}>
          <div className="absolute inset-0 hidden lg:block" style={{ background: "linear-gradient(to right, transparent 65%, #0c0016 100%)" }} />
          <div className="absolute inset-0 lg:hidden" style={{ background: "linear-gradient(to bottom, transparent 60%, #0c0016 100%)" }} />
        </div>
        <div className="flex flex-col justify-center px-8 lg:pl-4 lg:pr-14 py-16 order-1 lg:order-2 relative z-10">
          <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">03 / Skin Editor</p>
          <h2 className="font-black text-white leading-[0.82] mb-6" style={{ fontSize: "clamp(2.8rem,5vw,5.8rem)" }}>
            RETOUCHING.<br /><span className="text-amber-400">REIMAGINED.</span>
          </h2>
          <p className="text-white/40 text-[15px] mb-8 max-w-[360px] leading-relaxed">
            Granular AI skin retouching. Every slider responds in real time — texture, detail recovery, and transformation strength.
          </p>
          <div className="flex gap-2 mb-8">
            {MODES.map(m => (
              <button key={m} onClick={() => setActiveMode(m)}
                className={cn("px-4 py-2 rounded-full text-[13px] font-bold transition-colors",
                  m === activeMode ? "bg-amber-400 text-black" : "bg-white/[0.07] text-white/45 hover:bg-white/[0.12]")}>
                {m}
              </button>
            ))}
          </div>
          <div className="space-y-6 mb-10 max-w-[380px]">
            {[
              { label: "Skin Texture Size",       val: textureSize,   fmt: String(textureSize),     pct: texturePercent,  set: setTextureSize,  min: 2,   max: 10,  step: 1    },
              { label: "Detail Level",             val: detailLevel,   fmt: detailLevel.toFixed(1),   pct: detailPercent,   set: setDetailLevel,  min: 0.8, max: 1.2, step: 0.05 },
              { label: "Transformation Strength",  val: strength,      fmt: strength.toFixed(2),      pct: strengthPercent, set: setStrength,     min: 0.1, max: 0.38,step: 0.01 },
            ].map(s => (
              <div key={s.label} className="relative">
                <div className="flex justify-between mb-2">
                  <span className="text-white/60 text-[13px] font-medium">{s.label}</span>
                  <span className="text-amber-400 text-[13px] font-mono">{s.fmt}</span>
                </div>
                <div className="relative h-[3px] bg-white/10 rounded-full">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${s.pct}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400 border-2 border-[#0c0016] shadow-lg"
                    style={{ left: `calc(${s.pct}% - 8px)` }} />
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                  onChange={e => s.set(Number(e.target.value) as never)}
                  className="absolute inset-x-0 opacity-0 h-8 cursor-pointer" style={{ top: "16px" }} />
              </div>
            ))}
          </div>
          <Link href="/app/skineditor"
            className="inline-flex items-center gap-2.5 bg-[#FFFF00] px-8 py-4 rounded-xl text-black font-black text-[15px] self-start hover:bg-white transition-colors mb-12">
            Open Skin Editor <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="grid grid-cols-3 divide-x divide-white/8 pt-8 border-t border-white/8 max-w-[380px]">
            {[["99.1%","Quality"],["~90s","Speed"],["8K","Max"]].map(([n,l]) => (
              <div key={l} className="px-5 first:pl-0 last:pr-0">
                <div className="text-white font-black text-2xl">{n}</div>
                <div className="text-white/30 text-[11px] mt-1 uppercase tracking-wide">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 11. AI RELIGHTING ────────────────────────────────────────────────────────
function AIRelighting() {
  const PRESETS = [
    { name: "Studio",    color: "#ffffff", brightness: "Bright",   src: IMG.g1a  },
    { name: "Golden Hr", color: "#ff8800", brightness: "Warm",     src: IMG.asian },
    { name: "Moonlight", color: "#7eb8ff", brightness: "Cool",     src: IMG.g2b  },
    { name: "Spotlight", color: "#ffffff", brightness: "Dramatic", src: IMG.bm1a },
    { name: "Window",    color: "#c8e0ff", brightness: "Soft",     src: IMG.g1b  },
    { name: "Neon",      color: "#00ffcc", brightness: "Vibrant",  src: IMG.bm1b },
  ]
  return (
    <section className="bg-[#080808] py-24"
      style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize: "60px 60px" }}>
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">AI Relighting</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,5.5vw,6.5rem)" }}>
              LIGHT.<br /><span className="text-orange-400">REDEFINED.</span>
            </h2>
          </div>
          <div className="max-w-[300px] lg:pb-2">
            <p className="text-white/35 text-[14px] leading-relaxed mb-5">
              Change the lighting direction, color, and mood of any portrait. Studio, golden hour, moonlight — applied with photorealistic accuracy.
            </p>
            <Link href="/app/edit" className="inline-flex items-center gap-2 text-orange-400 font-black text-[13px] uppercase tracking-widest hover:text-white transition-colors">
              Try Relight <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESETS.map((p, i) => (
            <motion.div key={p.name}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
              className="relative rounded-xl overflow-hidden group cursor-pointer"
              style={{ aspectRatio: "3/4" }}>
              <div className="absolute inset-0" style={{ backgroundImage: `url(${p.src})`, backgroundSize: "cover", backgroundPosition: "center 15%" }} />
              <div className="absolute inset-0 mix-blend-color" style={{ background: p.color, opacity: i === 0 ? 0 : 0.12 }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ background: p.color }} />
                  <span className="text-white font-black text-[13px]">{p.name}</span>
                </div>
                <span className="text-white/40 text-[10px] uppercase tracking-widest">{p.brightness} light</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 12. IMAGE EDIT STUDIO — full redesign matching real EditModal ────────────
function ImageEditStudio() {
  const [activeMode, setActiveMode] = useState<"edit"|"relight"|"prompt">("edit")

  const LAYERS = [
    { hex: "#FF4B4B", name: "Smooth skin texture",     active: true  },
    { hex: "#4B8BFF", name: "Brighten & enhance eyes", active: false },
    { hex: "#4BFF8B", name: "Add hair highlights",     active: false },
  ]
  const LIGHTING = ["Studio","Golden Hr","Moonlight","Campfire","Spotlight","Window","Neon"]

  return (
    <section className="bg-[#06060c] py-24 overflow-hidden relative"
      style={{
        backgroundImage: [
          "linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "36px 36px",
      }}>
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 55% 60%, rgba(16,185,129,0.06), transparent)" }} />

      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 relative z-10">
        {/* Section header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">04 / Image Edit</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,5.5vw,6.5rem)" }}>
              BRUSH. MASK.<br /><span className="text-emerald-400">TRANSFORM.</span>
            </h2>
          </div>
          <div className="max-w-[300px] lg:pb-3">
            <p className="text-white/35 text-[15px] leading-relaxed mb-5">
              Paint a mask over any zone. Write what you want changed. AI edits only inside the mask — everything else stays untouched.
            </p>
            <Link href="/app/edit" className="inline-flex items-center gap-2 bg-emerald-500 px-6 py-3 rounded-xl text-white font-black text-sm hover:bg-emerald-400 transition-colors">
              Open Edit Studio <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Studio UI mockup */}
        <div className="rounded-2xl border border-emerald-400/12 overflow-hidden shadow-2xl"
          style={{ background: "#0c0c12" }}>
          {/* Chrome bar */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/6 bg-[#0e0e16]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-white/20 text-[12px] ml-2 font-medium">Sharpii.ai — Image Edit Studio</span>
            {/* Mode tabs */}
            <div className="ml-auto flex gap-1">
              {(["edit","relight","prompt"] as const).map(m => (
                <button key={m} onClick={() => setActiveMode(m)}
                  className={cn("px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors",
                    activeMode === m
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
                      : "text-white/25 hover:text-white/50")}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 3-pane layout */}
          <div className="flex" style={{ minHeight: 580 }}>
            {/* Left: tool panel */}
            <div className="w-[60px] border-r border-white/6 flex flex-col items-center py-5 gap-2 bg-[#0c0c12] shrink-0">
              {[
                { icon: Brush,  active: true  },
                { icon: Eraser, active: false },
                { icon: Square, active: false },
                { icon: Type,   active: false },
              ].map((t, i) => (
                <div key={i} className={cn("w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer border transition-colors",
                  t.active ? "bg-emerald-500/20 border-emerald-400/35" : "border-transparent hover:bg-white/[0.05]")}>
                  <t.icon className={cn("w-4 h-4", t.active ? "text-emerald-400" : "text-white/25")} />
                </div>
              ))}
              <div className="w-8 h-px bg-white/8 my-2" />
              <div className="w-10 h-10 rounded-xl hover:bg-white/[0.05] flex items-center justify-center cursor-pointer">
                <Layers className="w-4 h-4 text-white/20" />
              </div>
            </div>

            {/* Canvas — portrait + floating layer cards side-by-side */}
            <div className="flex-1 bg-[#090910] flex items-center justify-center p-8">
              {/* Checkerboard hint for transparency */}
              <div className="relative" style={{ width: 720 }}>

                {activeMode === "edit" && (
                  <div className="flex items-start gap-8">
                    {/* Portrait canvas */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl flex-shrink-0" style={{ width: 380, height: 520 }}>
                      <div className="absolute inset-0"
                        style={{ backgroundImage: `url(${IMG.g1a})`, backgroundSize: "cover", backgroundPosition: "center 5%" }} />
                      {/* Mask overlays */}
                      <div className="absolute pointer-events-none"
                        style={{ top: "13%", left: "18%", width: "64%", height: "13%", borderRadius: "50%", background: "rgba(255,75,75,0.48)", filter: "blur(8px)", transform: "rotate(-1.5deg)" }} />
                      <div className="absolute pointer-events-none"
                        style={{ top: "28%", left: "20%", width: "60%", height: "8%", borderRadius: "50%", background: "rgba(75,139,255,0.48)", filter: "blur(5px)" }} />
                      <div className="absolute pointer-events-none"
                        style={{ top: "2%", left: "8%", width: "84%", height: "14%", borderRadius: "50%", background: "rgba(75,255,139,0.32)", filter: "blur(11px)" }} />
                      {/* Brush cursor */}
                      <div className="absolute z-30 pointer-events-none" style={{ top: "19%", left: "38%", transform: "translate(-50%,-50%)" }}>
                        <div className="w-8 h-8 rounded-full border-2 border-white/70 bg-[#FF4B4B]/25" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/80" />
                      </div>
                    </div>

                    {/* Floating layer cards with SVG connector lines */}
                    <div className="flex flex-col gap-4 pt-8 flex-shrink-0">
                      {LAYERS.map((l, i) => {
                        const topPcts = ["13%", "28%", "3%"]
                        return (
                          <div key={l.name} className="relative">
                            {/* Connector line */}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 flex items-center pointer-events-none"
                              style={{ width: 40 }}>
                              <div className="h-px flex-1" style={{ background: `${l.hex}50`, borderTop: `1px dashed ${l.hex}40` }} />
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.hex, opacity: 0.7 }} />
                            </div>
                            <div className={cn("bg-[#14141e]/95 backdrop-blur-md border rounded-xl px-4 py-3 cursor-pointer transition-colors",
                              l.active ? "border-white/15" : "border-white/6 hover:border-white/12")}
                              style={{ minWidth: 200, borderColor: l.active ? `${l.hex}50` : undefined }}>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: l.hex }} />
                                <span className="text-white/75 font-bold text-[12px]">{l.name}</span>
                              </div>
                              <div className="text-white/25 text-[10px]">Layer {i + 1}{l.active ? " · Active" : ""}</div>
                            </div>
                          </div>
                        )
                      })}
                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-white/25 transition-colors cursor-pointer mt-1">
                        <div className="w-2.5 h-2.5 rounded-sm border border-white/20 border-dashed flex-shrink-0" />
                        <span className="text-white/25 text-[12px]">Add layer</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeMode === "relight" && (
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl mx-auto" style={{ width: 380, height: 520 }}>
                    <div className="absolute inset-0"
                      style={{ backgroundImage: `url(${IMG.g1a})`, backgroundSize: "cover", backgroundPosition: "center 5%" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,136,0,0.32), transparent 55%)" }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                    <div className="absolute top-5 left-4 right-4">
                      <div className="flex gap-1 flex-wrap bg-black/65 backdrop-blur-sm rounded-xl p-2 border border-white/10">
                        {LIGHTING.map(s => (
                          <button key={s} className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors",
                            s === "Golden Hr" ? "bg-orange-500/20 text-orange-400 border border-orange-400/30" : "text-white/35 hover:text-white/60")}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="text-orange-300 text-[10px] font-black uppercase tracking-widest mb-1">Golden Hour Active</div>
                      <div className="text-white font-bold">Warm directional light applied</div>
                    </div>
                  </div>
                )}

                {activeMode === "prompt" && (
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl mx-auto" style={{ width: 380, height: 520 }}>
                    <div className="absolute inset-0"
                      style={{ backgroundImage: `url(${IMG.g1a})`, backgroundSize: "cover", backgroundPosition: "center 5%" }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute top-5 left-4 right-4">
                      <div className="bg-[#14141e]/90 backdrop-blur-md border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px] font-bold">Full Image Prompt Edit</span>
                        </div>
                        <div className="text-white/65 text-[13px] leading-relaxed">&ldquo;Add dramatic studio lighting with deep shadows on the left side&rdquo;</div>
                      </div>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-emerald-300 text-[10px] font-black uppercase tracking-widest">Generating...</div>
                        <div className="text-white/50 text-[12px]">Applying prompt to full image</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: layers panel */}
            <div className="w-[200px] border-l border-white/6 flex flex-col bg-[#0c0c12] py-4 px-3 shrink-0">
              <div className="text-white/20 text-[10px] font-black uppercase tracking-wider mb-4">Layers</div>
              <div className="space-y-2 flex-1">
                {LAYERS.map((l, i) => (
                  <div key={l.name} className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                    l.active ? "bg-white/[0.07] border border-white/10" : "hover:bg-white/[0.04]")}>
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.hex }} />
                    <span className="text-white/55 text-[11px] font-medium truncate">{l.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-white/[0.04] rounded-lg">
                  <div className="w-3 h-3 rounded-sm border border-white/20 border-dashed flex-shrink-0" />
                  <span className="text-white/25 text-[11px]">Add layer</span>
                </div>
              </div>
              <div className="border-t border-white/6 pt-4 mt-4">
                <div className="text-white/20 text-[10px] font-black uppercase tracking-wider mb-2">Model</div>
                <div className="bg-white/[0.04] border border-white/8 rounded-lg px-3 py-2 text-white/45 text-[11px]">nano-banana-2</div>
              </div>
            </div>
          </div>

          {/* Bottom prompt bar */}
          <div className="border-t border-white/6 px-5 py-3.5 flex items-center gap-4 bg-[#0e0e16]">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-3 h-3 rounded-sm bg-[#FF4B4B]" />
              <span className="text-white/30 text-[11px] font-bold uppercase tracking-wide">Active Layer</span>
            </div>
            <div className="flex-1 bg-[#12121a] border border-white/8 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400/60 shrink-0" />
              <span className="text-white/25 text-[12px]">Smooth skin, remove blemishes, natural look...</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-white/25 text-[12px]">⚡ 5 credits</span>
              <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-[12px] font-black px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
                <Wand2 className="w-3.5 h-3.5" /> Generate
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 13. IMAGE GENERATION ─────────────────────────────────────────────────────
function ImageGenSection() {
  const GALLERY = [
    { src: IMG.g1a,   alt: "Editorial Portrait",  style: "Editorial",    h: 580 },
    { src: IMG.g2b,   alt: "Fashion Shot",         style: "Commercial",   h: 440 },
    { src: IMG.bm1a,  alt: "Studio Portrait",      style: "Professional", h: 610 },
    { src: IMG.asian, alt: "Beauty Shot",           style: "Artistic",     h: 470 },
    { src: IMG.g1b,   alt: "Natural Light",         style: "Lifestyle",    h: 540 },
  ]
  return (
    <section className="bg-[#0a0a0a] pt-24 pb-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">05 / Image Generation</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3.2rem,7vw,8rem)" }}>
              DESCRIBE IT.<br /><span className="text-purple-400">WE RENDER IT.</span>
            </h2>
          </div>
          <div className="max-w-[300px] lg:pb-3">
            <p className="text-white/35 text-[15px] mb-6 leading-relaxed">Studio-quality portraits from a text prompt. 50+ styles — editorial, fashion, cinematic.</p>
            <Link href="/app/image" className="inline-flex items-center gap-2 bg-[#FFFF00] px-6 py-3 rounded-xl text-black font-black text-sm hover:bg-white transition-colors">
              Generate Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="hidden lg:flex items-end gap-2">
          {GALLERY.map((item, i) => (
            <motion.div key={item.alt}
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.65, delay: i * 0.1 }}
              className="flex-1 relative overflow-hidden rounded-xl group cursor-pointer" style={{ height: item.h }}>
              <Image src={item.src} alt={item.alt} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70" />
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-1 group-hover:translate-y-0 opacity-70 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white text-sm font-bold">{item.alt}</p>
                <p className="text-white/45 text-xs mt-0.5 uppercase tracking-wide">{item.style}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="lg:hidden grid grid-cols-2 gap-3">
          {GALLERY.map(item => (
            <div key={item.alt} className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "2/3" }}>
              <Image src={item.src} alt={item.alt} fill className="object-cover object-center" />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-xs font-bold">{item.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 14. AI MODELS SHOWCASE — replaces ToolsCarousel ─────────────────────────
function ModelsSection() {
  const MODELS = [
    { name: "nano-banana-2",      cat: "Image Edit",       desc: "Precision brush masking",     tag: "Most Used", color: "#10b981", vid: VID.editVideo,    vidT: VID.editVideoT,    href: "/app/edit"      },
    { name: "nano-banana-2 Pro",  cat: "Image Edit",       desc: "High-res output + detail",    tag: "Pro",       color: "#34d399", vid: VID.nanoBanana,   vidT: VID.nanoBananaT,   href: "/app/edit"      },
    { name: "Soul Cinematic",     cat: "Video Gen",        desc: "Text to cinematic video",     tag: "New",       color: "#a78bfa", vid: VID.soul2,        vidT: VID.soul2T,        href: "/app/video"     },
    { name: "Kling 2.1",          cat: "Motion Transfer",  desc: "Frame-accurate pose cloning", tag: "Kling",     color: "#22d3ee", vid: VID.motion,       vidT: VID.motionT,       href: "/app/video"     },
    { name: "Smart Upscaler 8K",  cat: "Image Enhancement","desc": "AI-synthesized 8K detail",  tag: "8K",        color: "#FFFF00", vid: VID.upscale,      vidT: VID.upscaleT,      href: "/app/upscaler"  },
    { name: "Skin Editor AI",     cat: "Skin Retouching",  desc: "Granular texture control",    tag: "AI",        color: "#f59e0b", vid: VID.nanoBanana,   vidT: VID.nanoBananaT,   href: "/app/skineditor"},
    { name: "Lip Sync Studio",    cat: "Video Sync",       desc: "Audio-to-face animation",     tag: "Audio",     color: "#f472b6", vid: VID.lipsync,      vidT: VID.lipsyncT,      href: "/app/video"     },
    { name: "AI Influencer",      cat: "Brand Content",    desc: "Consistent AI personas",      tag: "Brand",     color: "#e879f9", vid: VID.aiInfluencer, vidT: VID.aiInfluencerT, href: "/app/video"     },
    { name: "Nano Fast Gen",      cat: "Image Gen",        desc: "Ultra-fast generation",       tag: "Fast",      color: "#94a3b8", vid: VID.nanoModel,    vidT: VID.nanoModelT,    href: "/app/image"     },
  ]
  const all = [...MODELS, ...MODELS]

  return (
    <section className="bg-[#050508] py-24 overflow-hidden"
      style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <div className="px-8 lg:px-14 mb-14 max-w-[1440px] mx-auto">
        <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">AI Models</p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <h2 className="font-black text-white leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5.5vw,6rem)" }}>
            EVERY MODEL<br /><span className="text-[#FFFF00]">WE OFFER.</span>
          </h2>
          <p className="text-white/35 text-[14px] max-w-[280px] leading-relaxed lg:pb-1">
            50+ specialized AI models. Each built for a specific task — pick what you need.
          </p>
        </div>
      </div>

      {/* Auto-scroll model strip — full width */}
      <div className="overflow-hidden mb-4">
        <div className="flex gap-4 w-max auto-scroll-x" style={{ animationDuration: "60s" }}>
          {all.map((m, i) => (
            <Link key={i} href={m.href}
              className="flex-shrink-0 rounded-2xl overflow-hidden group bg-[#0d0d14] border hover:border-white/12 transition-all"
              style={{ width: 280, border: `1px solid rgba(255,255,255,0.06)` }}>
              {/* Video */}
              <div className="relative overflow-hidden" style={{ height: 200 }}>
                <AutoVid src={m.vid} poster={m.vidT} className="group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm"
                    style={{ color: m.color }}>{m.tag}</span>
                </div>
                <div className="absolute bottom-3 left-3 text-white/40 text-[9px] font-bold uppercase tracking-widest">{m.cat}</div>
              </div>
              {/* Info */}
              <div className="p-5">
                <div className="w-2 h-2 rounded-full mb-3" style={{ background: m.color }} />
                <div className="text-white font-black text-[14px] mb-1 group-hover:translate-x-0.5 transition-transform">{m.name}</div>
                <div className="text-white/40 text-[12px] mb-4">{m.desc}</div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest" style={{ color: m.color }}>
                  Try it <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 15. CREATOR USE CASES ────────────────────────────────────────────────────
function CreatorUseCases() {
  const CASES = [
    {
      icon: Camera, label: "Photographers", color: "#FFFF00",
      headline: "Deliver 8K quality without 8K equipment.",
      uses: ["Upscale client portraits to 8K for print", "Bulk-process wedding shoots in minutes", "Perfect skin retouching for every subject", "Add studio lighting in post"],
      cta: "/app/upscaler",
    },
    {
      icon: Users, label: "Content Creators", color: "#a78bfa",
      headline: "Create more content, faster.",
      uses: ["Generate AI portraits for social feeds", "Sync audio to any face for shorts", "Create AI influencer personas", "Transfer motion from any reference"],
      cta: "/app/image",
    },
    {
      icon: Building2, label: "Studios & Agencies", color: "#22d3ee",
      headline: "Scale professional work at AI speed.",
      uses: ["Batch-process entire campaign shoots", "Consistent AI talent across all visuals", "Video generation for social content", "Enterprise API access"],
      cta: "/signup",
    },
  ]
  return (
    <section className="bg-[#060606] py-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="mb-14">
          <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Built For</p>
          <h2 className="font-black text-white leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5vw,5.5rem)" }}>
            YOUR WORKFLOW.<br /><span className="text-[#FFFF00]">YOUR TOOLS.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {CASES.map((c, i) => (
            <motion.div key={c.label}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/[0.03] border border-white/8 rounded-2xl p-8 flex flex-col group hover:border-white/14 transition-colors">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: `${c.color}15`, border: `1px solid ${c.color}25` }}>
                <c.icon className="w-5 h-5" style={{ color: c.color }} />
              </div>
              <div className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-2">{c.label}</div>
              <h3 className="text-white font-black text-xl leading-snug mb-6">{c.headline}</h3>
              <ul className="space-y-3 flex-1 mb-8">
                {c.uses.map(u => (
                  <li key={u} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: c.color }} />
                    <span className="text-white/50 text-[14px] leading-snug">{u}</span>
                  </li>
                ))}
              </ul>
              <Link href={c.cta} className="inline-flex items-center gap-2 font-black text-[13px] uppercase tracking-widest hover:gap-3 transition-all"
                style={{ color: c.color }}>
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 16. STATS ────────────────────────────────────────────────────────────────
function StatsSection() {
  return (
    <section className="bg-[#FFFF00]" data-nav-light="true">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28">
        <p className="text-black/35 text-[11px] font-black uppercase tracking-[0.35em] mb-14">BY THE NUMBERS</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-14 gap-x-8 lg:gap-0">
          {[
            { n: "8K",    d: "Max Output", s: "7680 × 4320px"      },
            { n: "50+",   d: "AI Models",  s: "Across all tools"    },
            { n: "99.1%", d: "Quality",    s: "User satisfaction"   },
            { n: "20×",   d: "Faster",     s: "vs. manual editing"  },
          ].map(({ n, d, s }, i) => (
            <div key={d} className="lg:px-10 xl:px-14 first:lg:pl-0 last:lg:pr-0 relative">
              {i > 0 && <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-black/15" />}
              <div className="font-black text-black leading-none" style={{ fontSize: "clamp(4.5rem,8vw,9rem)" }}>{n}</div>
              <div className="text-black font-bold text-xl mt-3">{d}</div>
              <div className="text-black/45 text-sm mt-1">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 17. TESTIMONIALS ─────────────────────────────────────────────────────────
function TestimonialsSection() {
  const REVIEWS = [
    { stars: 5, text: "Sharpii.ai changed how I deliver portrait sessions. My clients think I upgraded my camera. The 8K output is extraordinary.", name: "Sarah Kim",      role: "Portrait Photographer", loc: "New York"        },
    { stars: 5, text: "I used to spend 2 hours retouching per video. With Sharpii I process an entire batch in 10 minutes. Absolute game-changer.", name: "Marcus Johnson", role: "Content Creator",        loc: "2.4m followers"  },
    { stars: 5, text: "The skin editor is the most sophisticated AI retouching tool I've ever used. It actually understands skin tone and texture.",  name: "Priya Mehta",   role: "Creative Director",      loc: "Studio 44"       },
  ]
  return (
    <section className="bg-[#070707] pt-24 pb-16">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Reviews</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3rem,5.5vw,6.5rem)" }}>
              Trusted By<br /><span className="text-[#FFFF00]">Thousands.</span>
            </h2>
          </div>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-[#FFFF00] px-8 py-4 rounded-xl text-black font-black text-[15px] hover:bg-white transition-colors self-start lg:self-auto mb-2">
            Join Them <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {REVIEWS.map((r, i) => (
            <motion.div key={r.name}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/[0.035] border border-white/[0.055] rounded-2xl p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 right-6 text-[#FFFF00]/8 font-black select-none pointer-events-none" style={{ fontSize: "6rem", lineHeight: 1 }}>&ldquo;</div>
              <div className="flex gap-1 mb-5 relative z-10">
                {Array.from({ length: r.stars }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-[#FFFF00] fill-[#FFFF00]" />)}
              </div>
              <p className="text-white/75 text-[15px] leading-relaxed flex-1 mb-7 relative z-10">&ldquo;{r.text}&rdquo;</p>
              <div className="border-t border-white/8 pt-5 relative z-10">
                <p className="text-white font-bold text-sm">{r.name}</p>
                <p className="text-white/35 text-xs mt-0.5">{r.role} · {r.loc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 18. HOW IT WORKS — white bg ──────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { n: "01", title: "Upload Your Photo",       desc: "Drop any portrait, RAW file, or batch folder. JPEG, PNG, RAW, TIFF — all accepted." },
    { n: "02", title: "AI Processes in Seconds", desc: "Our models synthesize new detail, correct skin tone, sharpen edges — fully automated." },
    { n: "03", title: "Download in 8K",          desc: "Get your image at up to 8K resolution, print-ready, web-ready, commercial-ready." },
  ]
  return (
    <section className="bg-white py-28" data-nav-light="true">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row lg:items-start gap-16">
          <div className="lg:sticky lg:top-24 shrink-0">
            <p className="text-black/30 text-[11px] font-black uppercase tracking-[0.35em] mb-5">How It Works</p>
            <h2 className="font-black text-black leading-[0.82]" style={{ fontSize: "clamp(3rem,5vw,5.5rem)" }}>Simple<br />Process.</h2>
          </div>
          <div className="flex-1 max-w-xl">
            {steps.map((step, i) => (
              <motion.div key={step.n}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex gap-8 mb-12 last:mb-0">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-black flex items-center justify-center">
                  <span className="text-white font-black text-[13px]">{step.n}</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-black font-black text-2xl mb-2">{step.title}</h3>
                  <p className="text-black/50 text-[15px] leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
            <div className="mt-12 pt-12 border-t border-black/10 flex gap-4">
              <Link href="/signup" className="inline-flex items-center gap-2 bg-black px-7 py-3.5 rounded-xl text-white font-black text-sm hover:bg-black/80 transition-colors">
                Start for Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/app" className="inline-flex items-center gap-2 border border-black/15 px-7 py-3.5 rounded-xl text-black/70 font-bold text-sm hover:bg-black/5 transition-colors">
                View All Tools
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 19. PRICING ──────────────────────────────────────────────────────────────
function PricingSection() {
  return (
    <section className="bg-black pt-24 pb-24" id="pricing-section">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="text-center mb-16">
          <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Pricing</p>
          <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3rem,5.5vw,6.5rem)" }}>
            Start Free.<br /><span className="text-[#FFFF00]">Scale Fearlessly.</span>
          </h2>
          <p className="text-white/35 text-[15px] mt-5 max-w-md mx-auto">Credits work across every tool. No feature gates. Cancel anytime.</p>
        </div>
        <MyPricingPlans2 />
      </div>
    </section>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Home3Page() {
  return (
    <div className="min-h-screen bg-black text-white">
      <NavStyleOverride />
      <NavThemeController />
      <NavigationHero4 />
      <Hero />
      <Ticker />
      <FeaturesReel />
      <UpscalerSection />
      <SkinDetailMagnifier />
      <VideoSection />
      <VideoCategories />
      <MotionTransfer />
      <AudioLipSync />
      <SkinEditorSection />
      <AIRelighting />
      <ImageEditStudio />
      <ImageGenSection />
      <ModelsSection />
      <CreatorUseCases />
      <StatsSection />
      <TestimonialsSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  )
}
