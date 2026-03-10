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
  Wand2, Play, Plus, Volume2, VolumeX,
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
      input[type=range].pslider { -webkit-appearance:none; appearance:none; width:100%; height:36px; background:transparent; cursor:pointer; padding:0; margin:0; }
      input[type=range].pslider::-webkit-slider-runnable-track { height:2px; border-radius:99px; background:rgba(255,255,255,0.08); }
      input[type=range].pslider::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:#fff; margin-top:-9px; cursor:pointer; box-shadow:0 0 0 2.5px #0c0016, 0 0 0 4.5px rgba(251,191,36,0.75), 0 2px 12px rgba(0,0,0,0.8); transition:box-shadow 0.15s, transform 0.1s; }
      input[type=range].pslider:hover::-webkit-slider-thumb, input[type=range].pslider:active::-webkit-slider-thumb { box-shadow:0 0 0 2.5px #0c0016, 0 0 0 5.5px #fbbf24, 0 0 20px rgba(251,191,36,0.5), 0 2px 12px rgba(0,0,0,0.8); transform:scale(1.15); }
      input[type=range].pslider::-moz-range-track { height:2px; border-radius:99px; background:rgba(255,255,255,0.08); }
      input[type=range].pslider::-moz-range-progress { height:2px; border-radius:99px; background:linear-gradient(90deg,#f59e0b,#fbbf24); }
      input[type=range].pslider::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:#fff; border:2.5px solid #0c0016; cursor:pointer; box-shadow:0 0 0 3px rgba(251,191,36,0.75), 0 2px 12px rgba(0,0,0,0.8); }
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
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.play().catch(() => {})
  }, [])
  if (failed && poster) {
    return <div className={cn("w-full h-full bg-cover bg-center", className)} style={{ backgroundImage: `url(${poster})` }} />
  }
  return (
    <video
      ref={ref} src={src} poster={poster} muted loop playsInline autoPlay
      className={cn("w-full h-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  )
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
  const dragging = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(5, Math.min((cx - r.left) / r.width * 100, 95))
    setPos(cur.current)
  }, [cur, setPos])

  return (
    <section className="relative w-full bg-black overflow-hidden" style={{ height: "100svh", minHeight: 700 }}>
      <div ref={ref} className="absolute inset-0 select-none"
        style={{ cursor: drag ? "grabbing" : "ew-resize", touchAction: "none" }}
        onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true; setDrag(true); setPaused(true); onMove(e.clientX) }}
        onPointerMove={e => { if (dragging.current) onMove(e.clientX) }}
        onPointerUp={e => { e.currentTarget.releasePointerCapture(e.pointerId); dragging.current = false; setDrag(false); setPaused(false) }}
        onPointerLeave={() => { if (dragging.current) { dragging.current = false; setDrag(false); setPaused(false) } }}
      >
        <div className="absolute inset-0 bg-neutral-900">
          <Image src={IMG.g1b} alt="Original" fill draggable={false} className="object-cover object-center pointer-events-none" priority sizes="100vw" />
        </div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <div className="absolute inset-0 bg-neutral-800">
            <Image src={IMG.g1a} alt="AI Enhanced" fill draggable={false} className="object-cover object-center pointer-events-none" priority sizes="100vw" />
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
            <h1 className="font-black text-white leading-[0.82] tracking-tight" style={{ fontSize: "clamp(2.4rem,5.5vw,7rem)" }}>
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
                  Get Started <ArrowRight className="w-4 h-4" />
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
    <section className="bg-black pt-20 pb-0 overflow-hidden"
      style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "100% 80px" }}>
      <div className="px-8 lg:px-14 mb-10 max-w-[1440px] mx-auto">
        <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-4">The Platform</p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <h2 className="font-black text-white leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5.5vw,6rem)" }}>
            ONE PLATFORM.<br /><span className="text-[#FFFF00]">EVERY TOOL.</span>
          </h2>
          <p className="text-white/50 text-[14px] max-w-xs leading-relaxed lg:pb-1">
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
              <div key={i} className="flex-shrink-0 relative rounded-xl overflow-hidden bg-[#0f0f18]"
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
              <div key={i} className="flex-shrink-0 relative rounded-xl overflow-hidden bg-[#0f0f18]"
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

// ─── 4. UPSCALER — image selector + fixed slider ─────────────────────────────
function UpscalerSection() {
  const [pos, setPos] = useState(50)
  const cur = useRef(50)
  const [drag, setDrag] = useState(false)
  const dragging = useRef(false)
  const ref = useRef<HTMLDivElement>(null)
  const [selectedPair, setSelectedPair] = useState(0)

  const IMAGE_PAIRS = [
    { before: IMG.bm1b, after: IMG.bm1a, label: "Man"    },
    { before: IMG.g1b,  after: IMG.g1a,  label: "Female" },
    { before: IMG.g2b,  after: IMG.asian, label: "Beauty" },
  ]

  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(5, Math.min((cx - r.left) / r.width * 100, 95))
    setPos(cur.current)
  }, [cur, setPos])

  return (
    <section className="bg-black overflow-hidden"
      style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
      <div className="flex flex-col lg:flex-row" style={{ minHeight: "95vh" }}>
        {/* LEFT: Stats + image selector */}
        <div className="lg:w-[38%] flex flex-col px-8 lg:px-14 py-16 lg:py-24 border-r border-white/5">
          <div className="flex-1">
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-10">01 / Smart Upscaler</p>
            <div className="font-black text-[#FFFF00] leading-none mb-2"
              style={{ fontSize: "clamp(7rem,18vw,14rem)", letterSpacing: "-0.05em", lineHeight: 0.82 }}>8K</div>
            <div className="text-white/20 font-black text-2xl mb-8 uppercase tracking-wide">Resolution</div>
            <h2 className="font-black text-white leading-[0.88] mb-6" style={{ fontSize: "clamp(2rem,3.5vw,3.2rem)" }}>
              NOT SCALED.<br /><span className="font-heading">REBUILT.</span>
            </h2>
            <p className="text-white/50 text-[15px] max-w-[320px] leading-relaxed mb-10">
              AI synthesizes new detail from scratch — skin texture, hair strands, micro-contrast. Zero artifacts at any resolution.
            </p>
          </div>

          <div className="space-y-0 divide-y divide-white/6 mb-8">
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

          {/* Image selector — thumbnails */}
          <div className="mb-8">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Sample Images</p>
            <div className="flex gap-2">
              {IMAGE_PAIRS.map((pair, i) => (
                <button key={i}
                  onClick={() => { setSelectedPair(i); cur.current = 50; setPos(50) }}
                  className="relative rounded-xl overflow-hidden shrink-0 transition-all hover:scale-105"
                  style={{ width: 80, height: 100, outline: selectedPair === i ? "2.5px solid #FFFF00" : "1px solid rgba(255,255,255,0.10)", outlineOffset: selectedPair === i ? 2 : 0, opacity: selectedPair === i ? 1 : 0.55 }}>
                  <div className="absolute inset-0"
                    style={{ backgroundImage: `url(${pair.after})`, backgroundSize: "cover", backgroundPosition: "center 10%" }} />
                </button>
              ))}
            </div>
          </div>

          <Link href="/app/upscaler"
            className="inline-flex items-center gap-2.5 bg-[#FFFF00] px-8 py-4 rounded-xl text-black font-black text-[15px] hover:bg-white transition-colors duration-200 self-start">
            Try Upscaler <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* RIGHT: Comparison slider */}
        <div ref={ref} className="lg:flex-1 relative select-none"
          style={{ minHeight: 580, cursor: drag ? "grabbing" : "ew-resize", touchAction: "none" }}
          onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true; setDrag(true); onMove(e.clientX) }}
          onPointerMove={e => { if (dragging.current) onMove(e.clientX) }}
          onPointerUp={e => { e.currentTarget.releasePointerCapture(e.pointerId); dragging.current = false; setDrag(false) }}
          onPointerLeave={() => { if (dragging.current) { dragging.current = false; setDrag(false) } }}>
          <div className="absolute inset-0">
            <Image src={IMAGE_PAIRS[selectedPair]?.before ?? IMG.bm1b} alt="Original" fill draggable={false} className="object-cover object-center pointer-events-none" sizes="60vw" />
          </div>
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <Image src={IMAGE_PAIRS[selectedPair]?.after ?? IMG.bm1a} alt="AI 8K" fill draggable={false} className="object-cover object-center pointer-events-none" sizes="60vw" />
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
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-0.5">Original</div>
              <div className="text-white font-black text-sm">As shot</div>
            </div>
            <div className="bg-[#FFFF00]/10 backdrop-blur-md border border-[#FFFF00]/30 px-4 py-2.5 rounded-xl">
              <div className="text-[#FFFF00]/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">AI Output</div>
              <div className="text-[#FFFF00] font-black text-sm">8K Enhanced</div>
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
    }
    container.addEventListener("mousemove", handleMove, { passive: true })
    return () => container.removeEventListener("mousemove", handleMove)
  }, [])

  return (
    <section className="bg-black overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-24">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Detail Engine</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,6vw,7rem)" }}>
              EVERY PORE.<br /><span className="text-[#FFFF00]">EVERY STRAND.</span>
            </h2>
          </div>
          <p className="text-white/50 text-[14px] max-w-xs leading-relaxed lg:pb-2">
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
              IMAGINE.<br /><span className="font-heading text-violet-400">GENERATE.</span>
            </h2>
          </div>
          <div className="max-w-[280px]">
            <p className="text-white/50 text-[14px] mb-5 leading-relaxed">11 AI video tools. Create, sync, transfer, edit — one subscription.</p>
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
          <div className="lg:col-span-2 relative rounded-xl overflow-hidden" style={{ height: 420, borderTop: `2px solid #a78bfa50` }}>
            <AutoVid src={VID.soul2} poster={VID.soul2T} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <div className="text-violet-300/50 text-[9px] font-bold uppercase tracking-widest mb-1">AI Generated</div>
              <div className="text-white font-black text-lg">Soul Cinematic</div>
              <div className="text-white/40 text-[12px]">Text prompt to full cinematic video</div>
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden" style={{ height: 420, borderTop: `2px solid #f472b650` }}>
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
            <div key={v.name} className="relative rounded-xl overflow-hidden" style={{ height: 300, borderTop: `2px solid ${v.accent}50` }}>
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
    <section className="bg-black overflow-hidden relative" style={{ paddingTop: "9rem", paddingBottom: "8rem" }}>
      {/* Ambient glow — 3 large blurred color blobs for depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Violet blob — upper left */}
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "55%", height: "70%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
        {/* Cyan blob — lower right */}
        <div style={{ position: "absolute", bottom: "0%", right: "-5%", width: "50%", height: "65%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(34,211,238,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        {/* Yellow center — subtle warm accent in middle */}
        <div style={{ position: "absolute", top: "30%", left: "35%", width: "30%", height: "40%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,0,0.07) 0%, transparent 65%)", filter: "blur(30px)" }} />
      </div>

      <div className="px-8 lg:px-14 mb-16 max-w-[1440px] mx-auto relative z-10">
        <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">11 Video Formats</p>
        <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,5.5vw,6rem)" }}>
          EVERY KIND<br /><span className="text-violet-400">OF VIDEO.</span>
        </h2>
      </div>

      {/* Full-width auto-scroll, doubled size */}
      <div className="overflow-hidden relative z-10">
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
    <section className="bg-black pt-24 pb-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Motion Transfer</p>
            <h2 className="font-black text-white leading-[0.88] mb-6" style={{ fontSize: "clamp(2.4rem,4.5vw,5rem)" }}>
              ANY MOTION.<br /><span className="font-heading text-cyan-400">ANY PERSON.</span>
            </h2>
            <p className="text-white/50 text-[15px] leading-relaxed mb-10 max-w-[380px]">
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
            <div className="relative rounded-xl overflow-hidden ring-1 ring-cyan-400/20" style={{ aspectRatio: "1/1" }}>
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
            <div className="absolute -bottom-6 -right-4 lg:-right-8 w-36 rounded-lg overflow-hidden ring-2 ring-cyan-400/30 shadow-2xl" style={{ height: 200 }}>
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

// ─── COPY VIRAL REELS ─────────────────────────────────────────────────────────
// ─── REEL TILE — mutable video card ──────────────────────────────────────────
function ReelTile({ src, poster }: { src: string; poster?: string }) {
  const [muted, setMuted] = useState(true)
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => { ref.current?.play().catch(() => {}) }, [])
  useEffect(() => { if (ref.current) ref.current.muted = muted }, [muted])
  return (
    <div className="relative rounded-xl overflow-hidden group cursor-pointer" style={{ aspectRatio: "9/16" }}>
      <video ref={ref} src={src} poster={poster} muted loop playsInline autoPlay className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      {/* Mute/unmute on hover */}
      <button
        onClick={e => { e.stopPropagation(); setMuted(m => !m) }}
        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {muted
          ? <VolumeX className="w-3.5 h-3.5 text-white" />
          : <Volume2 className="w-3.5 h-3.5 text-white" />}
      </button>
    </div>
  )
}

function CopyViralReels() {
  const REELS_ROW1 = [
    { src: VID.lipsync,      poster: VID.lipsyncT      },
    { src: VID.motion,       poster: VID.motionT       },
    { src: VID.soul2,        poster: VID.soul2T        },
    { src: VID.aiInfluencer, poster: VID.aiInfluencerT },
    { src: VID.nanoBanana,   poster: VID.nanoBananaT   },
  ]
  const REELS_ROW2 = [
    { src: VID.createVideo,  poster: VID.createVideoT  },
    { src: VID.editVideo,    poster: VID.editVideoT    },
    { src: VID.nanoModel,    poster: VID.nanoModelT    },
    { src: VID.kling3,       poster: VID.kling3T       },
    { src: VID.soulCin,      poster: VID.soulCinT      },
  ]

  return (
    <section className="bg-black py-24 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 mb-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Viral Reels Engine</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,5.5vw,6.5rem)" }}>
              COPY ANY REEL.<br /><span className="text-[#FFFF00]">MAKE IT YOURS.</span>
            </h2>
          </div>
          <p className="text-white/50 text-[15px] max-w-[340px] leading-relaxed lg:pb-2">
            See a trending reel? Replicate the motion, the style, the lip-sync — with your face, your body, your brand.
          </p>
        </div>
      </div>

      {/* Two rows of portrait video tiles */}
      <div className="px-8 lg:px-14 max-w-[1440px] mx-auto flex flex-col gap-3">
        {[REELS_ROW1, REELS_ROW2].map((row, ri) => (
          <div key={ri} className="grid grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3">
            {row.map((r, i) => (
              <ReelTile key={i} src={r.src} poster={r.poster} />
            ))}
          </div>
        ))}
      </div>

      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 mt-10 flex items-center gap-5 flex-wrap">
        <Link href="/app/video" className="inline-flex items-center gap-2 bg-[#FFFF00] px-6 py-3.5 rounded-xl text-black font-black text-sm hover:bg-white transition-colors">
          Start Copying Reels <ArrowRight className="w-4 h-4" />
        </Link>
        <span className="text-white/20 text-[13px]">Motion transfer · Lip sync · Style copy · All in one</span>
      </div>
    </section>
  )
}

// ─── 9. AUDIO & LIP SYNC ──────────────────────────────────────────────────────
function AudioLipSync() {
  const BH = [0.3,0.7,1,0.5,0.85,0.4,0.95,0.6,0.5,0.9,0.35,0.75,0.8,0.45,0.65,0.4,0.9,0.7,0.5,0.8,0.3]
  return (
    <section className="bg-white py-24 overflow-hidden" data-nav-light="true">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">

        {/* Header row */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-10">
          <div>
            <p className="text-black/25 text-[11px] font-black uppercase tracking-[0.35em] mb-4">Audio &amp; Lip Sync</p>
            <h2 className="font-black text-black leading-[0.88]" style={{ fontSize: "clamp(3rem,6vw,7rem)" }}>
              YOUR WORDS.<br /><span className="text-[#e91e8c]">ANY FACE.</span>
            </h2>
          </div>
          <div className="max-w-[300px] lg:pt-8">
            <p className="text-black/40 text-[15px] leading-relaxed mb-6">
              Upload any audio — voice, song, or script. AI syncs lip movement frame-by-frame with natural micro-expressions.
            </p>
            <Link href="/app/video" className="inline-flex items-center gap-2 bg-black px-6 py-3.5 rounded-xl text-white font-black text-sm hover:bg-black/75 transition-colors">
              Try Lip Sync <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 5-video layout: 1 tall featured left + 2×2 right grid */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Featured — tall portrait video with waveform */}
          <div className="relative rounded-xl overflow-hidden lg:w-[38%] shrink-0" style={{ minHeight: 520 }}>
            <AutoVid src={VID.lipsync} poster={VID.lipsyncT} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-6 py-6">
              <div className="flex items-end gap-[3px] mb-3 h-12">
                {BH.map((h, i) => (
                  <motion.div key={i} className="flex-1 rounded-sm"
                    style={{ background: `rgba(233,30,140,${0.45 + h * 0.55})`, minWidth: 3, originY: "bottom" }}
                    animate={{ scaleY: [h * 0.35, h, h * 0.45] }}
                    transition={{ duration: 0.38 + (i % 6) * 0.07, repeat: Infinity, delay: i * 0.028, ease: "easeInOut" }} />
                ))}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e91e8c] animate-pulse" />
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Audio Syncing Live</span>
              </div>
              <div className="text-white font-black text-xl">Lip Sync Studio</div>
              <div className="text-white/40 text-[12px] mt-0.5">Any audio. Any face.</div>
            </div>
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#e91e8c]" />
          </div>

          {/* Right: 2×2 grid of 4 videos */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {([
              { src: VID.aiInfluencer, poster: VID.aiInfluencerT, accent: "#e879f9", tag: "AI Influencer",   desc: "Consistent AI persona"   },
              { src: VID.soul2,        poster: VID.soul2T,        accent: "#a78bfa", tag: "Soul Cinematic",  desc: "Text to cinematic video" },
              { src: VID.nanoBanana,   poster: VID.nanoBananaT,   accent: "#f59e0b", tag: "Nano Banana 2",   desc: "Ultra-detail generation" },
              { src: VID.motion,       poster: VID.motionT,       accent: "#22d3ee", tag: "Motion Transfer", desc: "Clone any movement"      },
            ] as const).map((v, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden group" style={{ minHeight: 250 }}>
                <AutoVid src={v.src} poster={v.poster} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `${v.accent}80` }} />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm" style={{ color: v.accent }}>{v.tag}</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-white font-black text-[14px] leading-tight">{v.tag}</div>
                  <div className="text-white/40 text-[11px] mt-0.5">{v.desc}</div>
                </div>
              </div>
            ))}
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
          <h2 className="font-black text-white leading-[0.82] mb-6" style={{ fontSize: "clamp(2.4rem,4.5vw,5.2rem)" }}>
            DERMA-GRADE<br /><span className="text-amber-400">SKIN CONTROL.</span>
          </h2>
          <p className="text-white/40 text-[15px] mb-8 max-w-[360px] leading-relaxed">
            Clinical-level AI skin retouching. Control texture synthesis, detail recovery, and transformation strength — each slider tuned to dermatological precision.
          </p>
          <div className="flex gap-2 mb-8 flex-wrap">
            {MODES.map(m => (
              <button key={m} onClick={() => setActiveMode(m)}
                className={cn("px-4 py-2 rounded-full text-[13px] font-bold transition-colors",
                  m === activeMode ? "bg-amber-400 text-black" : "bg-white/[0.07] text-white/45 hover:bg-white/[0.12]")}>
                {m}
              </button>
            ))}
          </div>
          <div className="space-y-8 mb-10 max-w-[380px]">
            {[
              { label: "Skin Texture Size",      val: textureSize,  fmt: String(textureSize),            pct: texturePercent,  set: setTextureSize,  min: 2,   max: 10,  step: 1    },
              { label: "Detail Recovery",         val: detailLevel,  fmt: detailLevel.toFixed(1),          pct: detailPercent,   set: setDetailLevel,  min: 0.8, max: 1.2, step: 0.05 },
              { label: "Strength",                val: strength,     fmt: `${Math.round(strength*100)}%`,  pct: strengthPercent, set: setStrength,     min: 0.1, max: 0.38,step: 0.01 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-white/40 text-[11px] font-bold uppercase tracking-[0.18em]">{s.label}</span>
                  <span className="text-amber-400 font-mono font-black text-2xl tabular-nums leading-none">{s.fmt}</span>
                </div>
                <div className="relative flex items-center" style={{ height: 36 }}>
                  {/* Track (unfilled) */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full" style={{ height: 2, background: "rgba(255,255,255,0.08)" }} />
                  {/* Fill */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-all duration-75"
                    style={{ width: `${s.pct}%`, height: 2, background: "linear-gradient(90deg,#92400e,#f59e0b,#fbbf24)" }} />
                  {/* Wipe-bar handle */}
                  <div className="absolute top-1/2 pointer-events-none transition-all duration-75"
                    style={{ left: `${s.pct}%`, transform: "translate(-50%,-50%)", width: 3, height: 32, background: "rgba(255,255,255,0.95)", boxShadow: "0 0 10px rgba(251,191,36,0.6), 0 0 0 1px rgba(0,0,0,0.3)" }} />
                  {/* Native input */}
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                    onChange={e => s.set(Number(e.target.value) as never)}
                    className="pslider absolute inset-0 opacity-0" />
                </div>
              </div>
            ))}
          </div>
          <Link href="/app/skineditor"
            className="inline-flex items-center gap-2.5 bg-[#FFFF00] px-8 py-4 rounded-xl text-black font-black text-[15px] self-start hover:bg-white transition-colors mb-12">
            Open Skin Editor <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="grid grid-cols-3 divide-x divide-white/8 pt-8 border-t border-white/8 max-w-[380px]">
            {[["90%","Quality"],["~90s","Speed"],["8K","Max"]].map(([n,l]) => (
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
  const FEATURED = { name: "Golden Hour",  color: "#ff8800", brightness: "Warm golden",  src: IMG.asian,  mood: "Warm outdoor glow · Sunset direction" }
  const SIDE     = [
    { name: "Studio",   color: "#e8e8ff", brightness: "Clean",    src: IMG.g1a,  mood: "Overhead front · Diffused"  },
    { name: "Neon",     color: "#00ffcc", brightness: "Vibrant",  src: IMG.bm1a, mood: "Low-angle · Hard edge"       },
  ]
  return (
    <section className="bg-black py-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">AI Relighting</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,5.5vw,6.5rem)" }}>
              ANY SCENE.<br /><span className="text-orange-400">ANY LIGHT.</span>
            </h2>
          </div>
          <div className="max-w-[320px] lg:pb-2 flex flex-col gap-4">
            <p className="text-white/50 text-[14px] leading-relaxed">
              Swap lighting direction, temperature, and intensity — non-destructively. Studio, golden hour, neon, moonlight. One image, infinite moods.
            </p>
            <Link href="/app/edit" className="self-start inline-flex items-center gap-2 border border-orange-400/40 text-orange-400 font-black text-[13px] px-5 py-2.5 rounded-xl hover:bg-orange-400/10 transition-colors">
              Try Relight <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Asymmetric 3-image layout: large feature left, two stacked right */}
        <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: 560 }}>
          {/* Large feature — left 2/3 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="lg:flex-[2] relative rounded-2xl overflow-hidden group cursor-pointer"
            style={{ minHeight: 420 }}>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${FEATURED.src})`, backgroundSize: "cover", backgroundPosition: "center 10%" }} />
            {/* Warm tint */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,136,0,0.22) 0%, transparent 65%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
            {/* Top badge */}
            <div className="absolute top-5 left-5 flex items-center gap-2.5 bg-black/50 backdrop-blur-md border border-orange-400/30 px-3 py-2 rounded-xl">
              <div className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ background: FEATURED.color }} />
              <span className="text-white font-black text-[12px]">{FEATURED.name}</span>
            </div>
            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="text-orange-300/60 text-[10px] font-black uppercase tracking-widest mb-2">{FEATURED.brightness} · Featured</div>
              <div className="text-white font-black text-xl mb-1">{FEATURED.mood}</div>
              <div className="inline-flex items-center gap-1.5 mt-3 bg-orange-400/15 border border-orange-400/25 px-3 py-1.5 rounded-lg">
                <Sparkles className="w-3 h-3 text-orange-300" />
                <span className="text-orange-300 text-[11px] font-bold">AI-relit in 4 seconds</span>
              </div>
            </div>
          </motion.div>

          {/* Two stacked right */}
          <div className="lg:flex-1 flex flex-row lg:flex-col gap-4">
            {SIDE.map((p, i) => (
              <motion.div key={p.name}
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                className="flex-1 relative rounded-2xl overflow-hidden group cursor-pointer"
                style={{ minHeight: 200 }}>
                <div className="absolute inset-0" style={{ backgroundImage: `url(${p.src})`, backgroundSize: "cover", backgroundPosition: "center 15%" }} />
                <div className="absolute inset-0 mix-blend-color" style={{ background: p.color, opacity: 0.10 }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)" }} />
                {/* Top badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-lg">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-white font-bold text-[10px]">{p.name}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-0.5">{p.brightness} light</div>
                  <div className="text-white/75 text-[12px] font-bold">{p.mood}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Light presets strip */}
        <div className="mt-6 flex gap-2 flex-wrap">
          {["Studio", "Golden Hr", "Moonlight", "Campfire", "Spotlight", "Window Light", "Neon", "Horror", "Sunset"].map(preset => (
            <span key={preset} className="bg-white/[0.05] border border-white/8 text-white/40 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white/60 cursor-pointer transition-colors">
              {preset}
            </span>
          ))}
          <span className="text-white/20 text-[10px] flex items-center px-2">+40 more</span>
        </div>
      </div>
    </section>
  )
}

// ─── 12. IMAGE EDIT STUDIO ────────────────────────────────────────────────────
const EDIT_DEMO_PROMPTS = [
  { text: "Smooth skin, remove blemishes", layer: { hex: "#FF4B4B", name: "RED",  maskArea: "face" } },
  { text: "Change hair color to warm golden blonde", layer: { hex: "#4B8BFF", name: "BLUE", maskArea: "hair" } },
  { text: "Add soft studio background blur", layer: { hex: "#4BFF8B", name: "GREEN", maskArea: "bg"  } },
  { text: "Make eyes more vibrant and sharp",        layer: { hex: "#FFD700", name: "GOLD", maskArea: "eyes" } },
]

function ImageEditStudio() {
  const [stage, setStage]           = useState(0) // 0=idle 1=brushing 2=typed 3=generating 4=result
  const [typedText, setTypedText]   = useState("")
  const [brushP, setBrushP]         = useState(0) // 0–1
  const [demoIdx, setDemoIdx]       = useState(0)
  const demo = EDIT_DEMO_PROMPTS[demoIdx]!

  useEffect(() => {
    let raf = 0, timer: ReturnType<typeof setTimeout>

    if (stage === 0) {
      setTypedText(""); setBrushP(0)
      timer = setTimeout(() => setStage(1), 1600)
    } else if (stage === 1) {
      const start = Date.now(); const dur = 2600
      const tick = () => {
        const p = Math.min((Date.now() - start) / dur, 1)
        setBrushP(p)
        if (p < 1) raf = requestAnimationFrame(tick)
        else { timer = setTimeout(() => setStage(2), 200) }
      }
      raf = requestAnimationFrame(tick)
    } else if (stage === 2) {
      const full = demo.text; let i = 0
      const type = () => {
        if (i < full.length) { setTypedText(full.slice(0, ++i)); timer = setTimeout(type, 32) }
        else { timer = setTimeout(() => setStage(3), 700) }
      }
      timer = setTimeout(type, 300)
    } else if (stage === 3) {
      timer = setTimeout(() => setStage(4), 1800)
    } else if (stage === 4) {
      timer = setTimeout(() => { setDemoIdx(d => (d + 1) % EDIT_DEMO_PROMPTS.length); setStage(0) }, 2800)
    }
    return () => { clearTimeout(timer); cancelAnimationFrame(raf) }
  }, [stage, demoIdx])

  // Brush cursor path across the image (looping horizontally in the mask area)
  const bx = 10 + brushP * 75
  const by = demo.layer.maskArea === "hair" ? 5 + Math.sin(brushP * Math.PI * 3) * 5
           : demo.layer.maskArea === "eyes" ? 28 + Math.sin(brushP * Math.PI * 4) * 3
           : demo.layer.maskArea === "bg"   ? 15 + brushP * 20
           : 18 + Math.sin(brushP * Math.PI * 2.5) * 8

  const maskStyle = (() => {
    const a = stage === 0 ? 0 : stage === 4 ? 0.15 : Math.min(brushP * 0.6, 0.55)
    if (demo.layer.maskArea === "hair")
      return { top: "0%",  left: "10%",  width: "80%", height: "28%", background: `${demo.layer.hex}${Math.round(a*255).toString(16).padStart(2,"0")}`, borderRadius: "50% 50% 40% 40%", filter: "blur(14px)" }
    if (demo.layer.maskArea === "eyes")
      return { top: "26%", left: "15%",  width: "70%", height: "14%", background: `${demo.layer.hex}${Math.round(a*255).toString(16).padStart(2,"0")}`, borderRadius: "60%",           filter: "blur(8px)"  }
    if (demo.layer.maskArea === "bg")
      return { top: "0%",  left: "0%",   width: "100%",height: "100%",background: `${demo.layer.hex}${Math.round(a*165).toString(16).padStart(2,"0")}`, filter: "blur(24px)" }
    return { top: "12%", left: "8%",   width: "84%", height: "26%", background: `${demo.layer.hex}${Math.round(a*255).toString(16).padStart(2,"0")}`, borderRadius: "60% 50% 55% 60% / 50% 55% 50% 55%", filter: "blur(12px)" }
  })()

  const isGenerating = stage === 3
  const isResult     = stage === 4

  return (
    <section className="bg-black pt-20 pb-24 overflow-hidden">
      {/* Header */}
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 mb-12">
        <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">04 / Image Edit</p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,5.5vw,6rem)" }}>
            MASK. PROMPT.<br /><span className="text-[#FFFF00]">TRANSFORM.</span>
          </h2>
          <div className="lg:max-w-[380px] lg:pb-1 flex flex-col gap-4">
            <p className="text-white/50 text-[15px] leading-relaxed">
              Paint any region with a brush. Type what to change. AI edits only inside your mask — with surgical precision, zero bleed.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/app/edit" className="inline-flex items-center gap-2 bg-[#FFFF00] px-6 py-3 rounded-xl text-black font-black text-sm hover:bg-white transition-colors">
                Open Magic Editor <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-white/25 text-[12px]">5 credits per edit · No subscription lock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animated mockup */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-14">
        <div className="rounded-2xl border border-white/8 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7)]" style={{ background: "#09090f" }}>

          {/* macOS title bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#060609] border-b border-white/6">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 flex items-center justify-center gap-3">
              {/* Mode tabs */}
              <div className="flex bg-white/[0.06] rounded-lg p-0.5 gap-0.5">
                {["Edit", "Relight", "Prompt"].map((m, i) => (
                  <span key={m} className={cn("px-4 py-1.5 rounded-md text-[11px] font-bold transition-all",
                    i === 0 ? "bg-[#FFFF00] text-black" : "text-white/30")}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">Magic Editor</span>
            </div>
          </div>

          {/* Main workspace */}
          <div className="flex flex-col lg:flex-row" style={{ minHeight: 560 }}>

            {/* ── LEFT PANEL ── */}
            <div className="w-full lg:w-[360px] bg-[#07070d] border-b lg:border-b-0 lg:border-r border-white/6 flex flex-col shrink-0">

              {/* Image upload strip */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-2 ring-[#FFFF00]/40">
                  <Image src={IMG.g1a} alt="Source" width={48} height={48} className="object-cover w-full h-full" style={{ objectPosition: "center 5%" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[12px] font-bold truncate">portrait_edit.jpg</div>
                  <div className="text-white/30 text-[10px] mt-0.5">3024 × 4032 · 8.2 MB</div>
                </div>
                <button className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/8 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-white/30" />
                </button>
              </div>

              {/* Tool buttons row */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/25 text-[10px] font-black uppercase tracking-widest">Tools</p>
                  <span className="text-[#FFFF00]/60 text-[10px] font-bold">Brush · 28px</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { Icon: Brush,  label: "Brush",  active: true  },
                    { Icon: Eraser, label: "Eraser", active: false },
                    { Icon: Square, label: "Rect",   active: false },
                    { Icon: Type,   label: "Text",   active: false },
                  ].map(t => (
                    <div key={t.label} className={cn(
                      "w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all",
                      t.active ? "bg-[#FFFF00] text-black border-transparent shadow-[0_0_16px_rgba(255,255,0,0.3)]"
                               : "bg-white/[0.04] text-white/25 border-white/6 hover:bg-white/8")}>
                      <t.Icon className="w-4 h-4" />
                    </div>
                  ))}
                  {/* Undo/redo */}
                  <div className="ml-auto flex gap-1">
                    {[Layers, Sparkles].map((Icon, i) => (
                      <div key={i} className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/6 flex items-center justify-center cursor-pointer hover:bg-white/8 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-white/25" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Brush size slider */}
              <div className="px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-white/25 text-[10px] font-black uppercase tracking-widest w-16">Size</span>
                  <div className="flex-1 relative h-6 flex items-center">
                    <div className="absolute inset-x-0 h-px bg-white/10 rounded-full" />
                    <div className="absolute left-0 h-px bg-[#FFFF00]/60 rounded-full" style={{ width: "38%" }} />
                    <div className="absolute bg-white rounded-full w-3 h-3 shadow-md" style={{ left: "calc(38% - 6px)" }} />
                  </div>
                  <span className="text-white/50 text-[11px] font-bold w-8 text-right">28</span>
                </div>
              </div>

              {/* Mask layers */}
              <div className="p-4 border-b border-white/5 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/25 text-[10px] font-black uppercase tracking-widest">Mask Layers</p>
                  <button className="w-6 h-6 rounded-md bg-white/[0.05] border border-white/8 flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white/30" />
                  </button>
                </div>
                {/* Active layer */}
                <motion.div
                  key={demoIdx}
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-[#111118] border rounded-xl p-3 mb-2"
                  style={{ borderColor: `${demo.layer.hex}50` }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/10" style={{ background: demo.layer.hex }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: demo.layer.hex }}>{demo.layer.name}</span>
                    <span className="text-white/20 text-[9px] ml-auto">Layer {demoIdx + 1}</span>
                    <div className="w-4 h-4 rounded-md flex items-center justify-center bg-white/[0.04]">
                      <Layers className="w-2.5 h-2.5 text-white/20" />
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-lg px-2.5 py-2 text-white/35 text-[11px] leading-snug min-h-[36px]">
                    {stage >= 2 ? `"${typedText}${stage === 2 ? "│" : ""}"` : <span className="text-white/15 italic">Paint a region to begin…</span>}
                  </div>
                </motion.div>
                {/* Ghost layer below */}
                {demoIdx > 0 && (
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 opacity-40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: EDIT_DEMO_PROMPTS[(demoIdx - 1) % EDIT_DEMO_PROMPTS.length]!.layer.hex }} />
                      <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{EDIT_DEMO_PROMPTS[(demoIdx - 1) % EDIT_DEMO_PROMPTS.length]!.layer.name}</span>
                      <span className="text-white/15 text-[9px] ml-auto">✓ Done</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/25 text-[10px] font-black uppercase tracking-widest">Model</span>
                  </div>
                  <span className="text-white/30 text-[10px]">nano-banana-2</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-3">
                  <span className="text-white/20">Estimated cost</span>
                  <span className="flex items-center gap-1 text-[#FFFF00]/60">
                    <Zap className="w-3 h-3" />5 credits
                  </span>
                </div>
                <motion.button
                  animate={isGenerating
                    ? { boxShadow: ["0 0 0px rgba(255,255,0,0)", "0 0 28px rgba(255,255,0,0.6)", "0 0 0px rgba(255,255,0,0)"] }
                    : isResult
                    ? { background: "#22c55e", color: "#000" }
                    : {}}
                  transition={{ repeat: isGenerating ? Infinity : 0, duration: 0.8 }}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-black text-[13px] flex items-center justify-center gap-2 transition-colors",
                    isResult ? "bg-green-500 text-black" : "bg-[#FFFF00] text-black",
                  )}>
                  {isGenerating
                    ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}><Sparkles className="w-4 h-4" /></motion.div>GENERATING…</>
                    : isResult
                    ? <><Sparkles className="w-4 h-4" />DONE — DOWNLOAD</>
                    : <><Wand2 className="w-4 h-4" />GENERATE</>}
                </motion.button>
              </div>
            </div>

            {/* ── CANVAS AREA ── */}
            <div className="flex-1 relative bg-[#040408] flex items-center justify-center overflow-hidden"
              style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize: "24px 24px", minHeight: 400 }}>

              {/* Canvas container */}
              <div className="relative" style={{ width: "min(320px, 80vw)", height: "min(440px, 68vw)", maxHeight: 460 }}>
                {/* Image */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                  <Image src={IMG.g1a} alt="Canvas portrait" fill className="object-cover" style={{ objectPosition: "center 5%" }} />

                  {/* Animated mask layer */}
                  <div className="absolute pointer-events-none" style={{ ...maskStyle }} />

                  {/* Result overlay — fades in at stage 4 */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isResult ? 1 : 0 }}
                    transition={{ duration: 0.7 }}
                  >
                    <Image src={IMG.bm1a} alt="Result" fill className="object-cover" style={{ objectPosition: "center 5%" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/60 backdrop-blur-md border border-green-500/40 px-4 py-2 rounded-xl flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-300 text-[12px] font-black uppercase tracking-wider">AI Edit Complete</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Brush cursor — animates during stage 1 */}
                  {stage === 1 && (
                    <div className="absolute pointer-events-none z-30 transition-none"
                      style={{ left: `${bx}%`, top: `${by}%`, transform: "translate(-50%,-50%)" }}>
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full border-2 border-white/80"
                          style={{ boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 0 16px ${demo.layer.hex}99` }} />
                        <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: demo.layer.hex }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating layer card — appears after brushing */}
                <motion.div
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: stage >= 2 ? 1 : 0, x: stage >= 2 ? 0 : 16 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bg-[#0e0e18]/95 backdrop-blur-xl border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] z-20 hidden lg:block"
                  style={{ top: "10%", right: -190, width: 180, padding: "12px 14px", borderColor: `${demo.layer.hex}55` }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: demo.layer.hex, boxShadow: `0 0 6px ${demo.layer.hex}` }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: demo.layer.hex }}>{demo.layer.name}</span>
                  </div>
                  <div className="bg-black/50 border border-white/5 rounded-xl px-2.5 py-2">
                    <div className="text-white/50 text-[10px] leading-snug">
                      &ldquo;{typedText}{stage === 2 ? "│" : ""}&rdquo;
                    </div>
                  </div>
                  {stage >= 3 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ repeat: Infinity, duration: 1 }}
                        className="w-1.5 h-1.5 rounded-full bg-[#FFFF00]" />
                      <span className="text-[#FFFF00]/60 text-[9px] font-bold uppercase tracking-wider">
                        {isResult ? "Applied ✓" : "Processing…"}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Stage label */}
                <div className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-6">
                  {[
                    { s: [0],    label: "Paint mask" },
                    { s: [1,2],  label: "Type prompt" },
                    { s: [3],    label: "Generating" },
                    { s: [4],    label: "Done" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full transition-all",
                        step.s.includes(stage) ? "bg-[#FFFF00]" : "bg-white/15")} />
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors",
                        step.s.includes(stage) ? "text-white/60" : "text-white/15")}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambient glow behind canvas */}
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  animate={{ opacity: isGenerating ? [0.15, 0.35, 0.15] : 0.08 }}
                  transition={{ repeat: isGenerating ? Infinity : 0, duration: 1 }}
                  className="absolute"
                  style={{ top: "20%", left: "25%", width: "50%", height: "60%", background: `radial-gradient(ellipse, ${demo.layer.hex}55 0%, transparent 70%)`, filter: "blur(30px)" }}
                />
              </div>
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
    <section className="bg-black pt-24 pb-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">05 / Image Generation</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3.2rem,7vw,8rem)" }}>
              DESCRIBE IT.<br /><span className="text-purple-400">WE RENDER IT.</span>
            </h2>
          </div>
          <div className="max-w-[300px] lg:pb-3">
            <p className="text-white/50 text-[15px] mb-6 leading-relaxed">Studio-quality portraits from a text prompt. 50+ styles — editorial, fashion, cinematic.</p>
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
    <section className="bg-black py-24 overflow-hidden relative">
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", top: "10%", left: "-8%", width: "45%", height: "60%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,0,0.10) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: "40%", height: "55%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(139,92,246,0.10) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", top: "40%", left: "40%", width: "25%", height: "35%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 65%)", filter: "blur(40px)" }} />
      </div>
      <div className="px-8 lg:px-14 mb-14 max-w-[1440px] mx-auto relative z-10">
        <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">AI Models</p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <h2 className="font-black text-white leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5.5vw,6rem)" }}>
            EVERY MODEL<br /><span className="text-[#FFFF00]">WE OFFER.</span>
          </h2>
          <p className="text-white/50 text-[14px] max-w-[280px] leading-relaxed lg:pb-1">
            50+ specialized AI models. Each built for a specific task — pick what you need.
          </p>
        </div>
      </div>

      {/* Auto-scroll model strip — full width */}
      <div className="overflow-hidden mb-4 relative z-10">
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


// ─── 16. STATS ────────────────────────────────────────────────────────────────
function StatsSection() {
  return (
    <section className="bg-[#FFFF00]" data-nav-light="true">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28">
        <p className="text-black/35 text-[11px] font-black uppercase tracking-[0.35em] mb-14">BY THE NUMBERS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 lg:gap-0">
          {[
            { n: "8K",    d: "Max Output", s: "7680 × 4320px"      },
            { n: "50+",   d: "AI Models",  s: "Across all tools"    },
            { n: "90%", d: "Quality",    s: "User satisfaction"   },
            { n: "20×",   d: "Faster",     s: "vs. manual editing"  },
          ].map(({ n, d, s }, i) => (
            <div key={d} className="lg:px-10 xl:px-14 first:lg:pl-0 last:lg:pr-0 relative">
              {i > 0 && <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-black/15" />}
              <div className="font-black text-black leading-none" style={{ fontSize: "clamp(3.5rem,8vw,9rem)" }}>{n}</div>
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
    <section className="bg-black pt-24 pb-16">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Reviews</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3rem,5.5vw,6.5rem)" }}>
              TRUSTED BY<br /><span className="text-[#FFFF00]">THOUSANDS.</span>
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
            <h2 className="font-black text-black leading-[0.82]" style={{ fontSize: "clamp(3rem,5vw,5.5rem)" }}>SIMPLE<br />PROCESS.</h2>
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
                Get Started <ArrowRight className="w-4 h-4" />
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
            START NOW.<br /><span className="text-[#FFFF00]">SCALE FEARLESSLY.</span>
          </h2>
          <p className="text-white/50 text-[15px] mt-5 max-w-md mx-auto">Credits work across every tool. No feature gates. Cancel anytime.</p>
        </div>
        <MyPricingPlans2 />
      </div>
    </section>
  )
}

// ─── A. AI SKIN FIX ───────────────────────────────────────────────────────────
function SkinCompareSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50)
  const cur = useRef(50)
  const [drag, setDrag] = useState(false)
  const dragging = useRef(false)
  const ref = useRef<HTMLDivElement>(null)
  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(5, Math.min((cx - r.left) / r.width * 100, 95))
    setPos(cur.current)
  }, [])
  return (
    <div ref={ref} className="relative rounded-xl overflow-hidden select-none"
      style={{ aspectRatio: "3/4", cursor: drag ? "grabbing" : "ew-resize", touchAction: "none" }}
      onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true; setDrag(true); onMove(e.clientX) }}
      onPointerMove={e => { if (dragging.current) onMove(e.clientX) }}
      onPointerUp={e => { e.currentTarget.releasePointerCapture(e.pointerId); dragging.current = false; setDrag(false) }}
      onPointerLeave={() => { if (dragging.current) { dragging.current = false; setDrag(false) } }}>
      {/* Before layer */}
      <div className="absolute inset-0">
        <Image src={before} alt="Before" fill draggable={false} className="object-cover object-center pointer-events-none" sizes="50vw" />
      </div>
      {/* After layer */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={after} alt="After" fill draggable={false} className="object-cover object-center pointer-events-none" sizes="50vw" />
      </div>
      {/* Divider line */}
      <div className="absolute top-0 bottom-0 pointer-events-none z-20"
        style={{ left: `${pos}%`, transform: "translateX(-50%)", width: 2, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 12px rgba(255,255,255,0.6)" }} />
      {/* Handle */}
      <div className="absolute z-30 pointer-events-none flex items-center justify-center"
        style={{ left: `${pos}%`, top: "50%", transform: "translate(-50%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>
        <ChevronLeft className="w-3 h-3 text-black absolute left-2" />
        <ChevronRight className="w-3 h-3 text-black absolute right-2" />
      </div>
      {/* Before / After corner labels */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <span className="bg-black/60 text-white/55 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">AI</span>
      </div>
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <span className="bg-black/60 text-white/30 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Original</span>
      </div>
    </div>
  )
}

function AISkinFixSection() {
  return (
    <section className="bg-black py-24 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 mb-14">
        <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">AI Skin Restoration</p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3rem,6vw,7.5rem)" }}>
            REAL SKIN.<br /><span className="text-amber-400">NO FILTERS.</span>
          </h2>
          <p className="text-white/50 text-[15px] max-w-[340px] leading-relaxed lg:pb-2">
            Most AI over-smooths into plastic. Sharpii.ai restores micro-texture, pores, and natural grain — preserving what other tools destroy.
          </p>
        </div>
      </div>

      {/* Two draggable comparison sliders */}
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        <SkinCompareSlider before={IMG.g1b} after={IMG.g1a} />
        <SkinCompareSlider before={IMG.bm1b} after={IMG.bm1a} />
      </div>

      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 flex items-center gap-5 flex-wrap">
        <Link href="/app/skineditor" className="inline-flex items-center gap-2 bg-amber-400 px-6 py-3.5 rounded-xl text-black font-black text-sm hover:bg-amber-300 transition-colors">
          Fix Skin Now <ArrowRight className="w-4 h-4" />
        </Link>
        <span className="text-white/20 text-[13px]">Drag either slider to compare · No plastic · No compromise.</span>
      </div>
    </section>
  )
}

// ─── B. AI AVATARS ────────────────────────────────────────────────────────────
function AIAvatarsSection() {
  const ENVIRONMENTS = [
    { label: "Podcast Host",    color: "#a78bfa", img: IMG.g1a,   bg: "linear-gradient(135deg,#1a0a2e,#0a0a14)",  desc: "Studio setup · Speaking to camera" },
    { label: "YouTube Creator", color: "#22d3ee", img: IMG.bm1a,  bg: "linear-gradient(135deg,#0a1a2e,#050e18)",  desc: "On-cam reaction · Branded BG"      },
    { label: "Brand Promo",     color: "#FFFF00", img: IMG.asian,  bg: "linear-gradient(135deg,#1a1a00,#0a0a00)",  desc: "Product pitch · Teleprompter style" },
    { label: "Social Reel",     color: "#f472b6", img: IMG.g2b,   bg: "linear-gradient(135deg,#2e0a1a,#14050a)",  desc: "Vertical format · Trending vibes"  },
  ]
  const SAVINGS = [
    { stat: "90%",   desc: "Cost reduction vs. studio shoots"     },
    { stat: "10min", desc: "From photo to publishable reel"       },
    { stat: "50+",   desc: "Different environments and styles"    },
    { stat: "∞",     desc: "New content without new shoots"       },
  ]
  return (
    <section className="bg-black py-24 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">AI Avatar Creator</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,5.5vw,6.5rem)" }}>
              YOUR FACE.<br /><span className="text-purple-400">INFINITE CONTENT.</span>
            </h2>
          </div>
          <div className="lg:max-w-[380px] lg:pb-2 flex flex-col gap-5">
            <p className="text-white/50 text-[15px] leading-relaxed">
              Upload one photo. AI makes you speak, present, and perform in 50+ environments — without a camera, studio, or crew. Cut content costs by 90%.
            </p>
            <Link href="/app/image" className="self-start inline-flex items-center gap-2 bg-purple-500 px-6 py-3.5 rounded-xl text-white font-black text-sm hover:bg-purple-400 transition-colors">
              Create Your AI Avatar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Flow diagram: Photo → AI → Output videos */}
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 mb-16">
          {/* Input: Your photo */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-3">Your Photo</div>
            <div className="relative w-28 h-36 rounded-2xl overflow-hidden ring-2 ring-purple-500/50 shadow-[0_0_30px_rgba(168,139,250,0.3)]">
              <Image src={IMG.g1a} alt="Input photo" fill className="object-cover" style={{ objectPosition: "center 5%" }} />
              <div className="absolute inset-0 flex items-end p-2">
                <span className="bg-purple-500/80 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">1 photo</span>
              </div>
            </div>
          </div>

          {/* Arrow + AI Processing */}
          <div className="flex flex-col items-center gap-2 px-2 lg:px-4 flex-shrink-0">
            <div className="w-px h-4 bg-white/10 lg:hidden" />
            <div className="hidden lg:block w-12 h-px bg-white/10" />
            <div className="bg-[#0e0818] border border-purple-500/30 rounded-2xl px-5 py-4 flex flex-col items-center gap-2 shadow-[0_0_40px_rgba(168,139,250,0.15)]">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}>
                <Sparkles className="w-6 h-6 text-purple-400" />
              </motion.div>
              <span className="text-purple-300 text-[10px] font-black uppercase tracking-wider text-center">AI Avatar<br />Engine</span>
              <div className="w-full h-px bg-purple-500/20" />
              <span className="text-white/30 text-[9px] text-center">Lip sync · Voice · Style</span>
            </div>
            <div className="hidden lg:block w-12 h-px bg-white/10" />
            <div className="w-px h-4 bg-white/10 lg:hidden" />
          </div>

          {/* Output: Multiple video styles */}
          <div className="flex-1">
            <div className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-3 text-center lg:text-left">Output Reels</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {ENVIRONMENTS.map((env, i) => (
                <motion.div key={env.label}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                  className="relative rounded-2xl overflow-hidden group cursor-pointer"
                  style={{ aspectRatio: "9/14", background: env.bg }}>
                  {/* Face centered */}
                  <div className="absolute bottom-0 left-0 right-0 top-4 flex items-end justify-center overflow-hidden">
                    <div className="w-[85%] relative" style={{ aspectRatio: "3/4" }}>
                      <Image src={env.img} alt={env.label} fill className="object-cover rounded-xl" style={{ objectPosition: "center 5%" }} />
                    </div>
                  </div>
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  {/* Style label top */}
                  <div className="absolute top-3 left-3 right-3">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm" style={{ color: env.color }}>
                      {env.label}
                    </span>
                  </div>
                  {/* Description bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="text-white/50 text-[9px] leading-tight">{env.desc}</div>
                  </div>
                  {/* Animated "speaking" bar at bottom */}
                  <div className="absolute bottom-2 right-3 flex items-end gap-[2px]">
                    {[0.4, 0.7, 1, 0.6, 0.8].map((h, j) => (
                      <motion.div key={j} className="w-[3px] rounded-sm"
                        style={{ background: env.color, opacity: 0.6 }}
                        animate={{ scaleY: [h * 0.3, h, h * 0.5] }}
                        transition={{ repeat: Infinity, duration: 0.3 + j * 0.07, delay: j * 0.04, ease: "easeInOut" }} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Savings stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {SAVINGS.map((s, i) => (
            <motion.div key={s.stat}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
              className="bg-purple-500/[0.07] border border-purple-500/20 rounded-2xl p-5">
              <div className="font-black text-purple-300 mb-1" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>{s.stat}</div>
              <div className="text-white/40 text-[12px] leading-snug">{s.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Features list + CTA */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-8 border-t border-white/6">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {["Lip sync to any voice", "50+ styles & environments", "Consistent AI persona", "Commercial rights included", "Batch generate reels", "No studio needed"].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/40 text-[13px]">
                <div className="w-1 h-1 rounded-full bg-purple-400" />
                {f}
              </div>
            ))}
          </div>
          <Link href="/app/image" className="shrink-0 inline-flex items-center gap-2 bg-purple-500 px-8 py-4 rounded-xl text-white font-black text-sm hover:bg-purple-400 transition-colors">
            Start for Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── C. IMAGE GALLERY ─────────────────────────────────────────────────────────
function ImageGallerySection() {
  const IMGS = [IMG.g1a, IMG.bm1a, IMG.asian, IMG.g2b, IMG.g1b, IMG.bm1b, IMG.g1a, IMG.bm1a, IMG.g2b, IMG.asian, IMG.g1b, IMG.bm1b]
  return (
    <section className="bg-black pt-24 pb-16 overflow-hidden">
      {/* Header */}
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 mb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-4">Output Gallery</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3rem,6vw,7.5rem)" }}>
              MADE WITH<br /><span className="font-heading text-[#FFFF00]">SHARPII.</span>
            </h2>
          </div>
          <div className="lg:max-w-[280px] lg:pb-2">
            <p className="text-white/50 text-[15px] leading-relaxed mb-5">
              Every portrait was created or enhanced with Sharpii.ai. Pure AI output — no filters, no presets.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 bg-[#FFFF00] px-6 py-3 rounded-xl text-black font-black text-sm hover:bg-white transition-colors">
              Create Yours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop: uniform 6-col grid, all 3:4 */}
      <div className="hidden lg:grid px-8 lg:px-14 max-w-[1440px] mx-auto grid-cols-5 gap-2">
        {IMGS.map((src, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl group cursor-pointer" style={{ aspectRatio: "3/4" }}>
            <Image src={src} alt="AI portrait" fill className="object-cover object-center transition-transform duration-700 group-hover:scale-105" sizes="17vw" />
          </div>
        ))}
      </div>

      {/* Mobile: 3-col grid */}
      <div className="lg:hidden grid grid-cols-3 gap-1.5 px-4">
        {IMGS.slice(0, 9).map((src, i) => (
          <div key={i} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
            <Image src={src} alt="AI portrait" fill className="object-cover object-center" />
          </div>
        ))}
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
      <CopyViralReels />
      <AudioLipSync />
      <SkinEditorSection />
      <AISkinFixSection />
      <AIRelighting />
      <AIAvatarsSection />
      <ImageEditStudio />
      <ImageGenSection />
      <ImageGallerySection />
      <ModelsSection />
      <StatsSection />
      <TestimonialsSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  )
}
