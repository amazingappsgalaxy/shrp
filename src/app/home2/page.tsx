"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"
import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"
import { FAQSection } from "@/components/sections/FAQSection"
import { cn } from "@/lib/utils"
import {
  ArrowRight, ScanLine, ChevronDown, Sparkles,
  Video, Image as ImageIcon, Settings2, Cpu,
  Maximize2, Play, Wand2, Layers, Star, ArrowUpRight,
  Volume2, VolumeX, Pause, RefreshCw
} from "lucide-react"

// ─── CDN ASSETS ──────────────────────────────────────────────────────────────
const IMG = {
  before:    "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/comparison/comparebefore.jpeg",
  after:     "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/comparison/compareafter.jpeg",
  g1b:       "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg",
  g1a:       "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png",
  g2b:       "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+2+Before.jpg",
  bm1b:      "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+Before.jpg",
  bm1a:      "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+After.png",
  asian:     "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+after.png",
}

// Videos grabbed from Higgsfield CDN (publicly served, no auth required)
const VID = {
  hero:        "https://higgsfield.ai/home/features-banner.mp4",
  heroThumb:   "https://higgsfield.ai/home/features-banner.webp",
  createVideo: "https://static.higgsfield.ai/explore/create-video.mp4",
  createThumb: "https://static.higgsfield.ai/explore/create-video.webp",
  createImg:   "https://static.higgsfield.ai/explore/create-image.mp4",
  createImgT:  "https://static.higgsfield.ai/explore/create-image.webp",
  upscale:     "https://static.higgsfield.ai/explore/upscale.mp4",
  upscaleT:    "https://static.higgsfield.ai/explore/upscale.webp",
  lipsync:     "https://static.higgsfield.ai/explore/lipsync-studio.mp4",
  lipsyncT:    "https://static.higgsfield.ai/explore/lipsync-studio.webp",
  editVideo:   "https://static.higgsfield.ai/explore/edit-video.mp4",
  editVideoT:  "https://static.higgsfield.ai/explore/edit-video.webp",
  motion:      "https://static.higgsfield.ai/kling-motion-control-square.mp4",
  motionT:     "https://static.higgsfield.ai/kling-motion-control-square.webp",
  soulCin:     "https://static.higgsfield.ai/image/soul-cinematic-banner.mp4",
  soulCinT:    "https://static.higgsfield.ai/image/soul-cinematic-banner.webp",
  soul2:       "https://static.higgsfield.ai/soul2/soul2.mp4",
  soul2T:      "https://static.higgsfield.ai/soul2/soul2.webp",
  aiInfluencer:"https://static.higgsfield.ai/ai-influencer/ai-influencer-main.mp4",
  aiInfluencerT:"https://static.higgsfield.ai/ai-influencer/ai-influencer-main.webp",
  triple:      "https://higgsfield.ai/home/triple-composition.mp4",
  tripleT:     "https://higgsfield.ai/home/triple-composition.webp",
  nanoBanana:  "https://static.higgsfield.ai/flow/nano-banana-2-banner.mp4",
  nanoBananaT: "https://static.higgsfield.ai/flow/nano-banana-2-banner.webp",
  kling3:      "https://static.higgsfield.ai/promotion/kling-3-hero.mp4",
}

// ─── COMPARISON SLIDER — fixed: uses clipPath, not width ──────────────────
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
    <div ref={ref} className={cn("absolute inset-0 cursor-ew-resize select-none overflow-hidden", className)}
      onPointerDown={e => { setDrag(true); setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
      onPointerMove={e => drag && onMove(e.clientX)}
      onPointerUp={() => { setDrag(false); setPaused(false) }}>
      {/* Before — full background */}
      <div className="absolute inset-0 bg-neutral-800">
        <Image src={before} alt={beforeAlt} fill className="object-cover object-top" sizes="900px" />
      </div>
      {/* After — full size, clipped right with clipPath (NO SCALING) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <div className="absolute inset-0 bg-neutral-700">
          <Image src={after} alt={afterAlt} fill className="object-cover object-top" sizes="900px" />
        </div>
      </div>
      {/* Divider line */}
      <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        <div className="absolute inset-y-0 w-[2px] bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        <div className="absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-white/70 bg-black/50 backdrop-blur-xl flex items-center justify-center shadow-2xl">
          <ScanLine className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  )
}

// Autoplay video component
function AutoVid({ src, poster, className = "", loop = true }: { src: string; poster?: string; className?: string; loop?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) { ref.current.play().catch(() => {}) }
  }, [])
  return (
    <video ref={ref} src={src} poster={poster} muted loop={loop} playsInline autoPlay
      className={cn("w-full h-full object-cover", className)} />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HERO
// ─────────────────────────────────────────────────────────────────────────────
function Hero() {
  const { pos, cur, setPos, setPaused } = useSlider(50, 15, 85, 0.07)
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(0, Math.min((cx - r.left) / r.width * 100, 100))
    setPos(cur.current)
  }, [cur, setPos])

  return (
    <section className="relative w-full overflow-hidden bg-black" style={{ height: "100svh", minHeight: 700 }}>
      {/* Full-bleed comparison canvas */}
      <div ref={ref} className="absolute inset-0 select-none"
        style={{ cursor: dragging ? "grabbing" : "ew-resize" }}
        onPointerDown={e => { setDragging(true); setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
        onPointerMove={e => dragging && onMove(e.clientX)}
        onPointerUp={() => { setDragging(false); setPaused(false) }}
        onPointerLeave={() => { setDragging(false); setPaused(false) }}>
        {/* BEFORE — original photo */}
        <div className="absolute inset-0 bg-neutral-900">
          <Image src={IMG.before} alt="Original photo" fill className="object-cover object-top" priority sizes="100vw" />
        </div>
        {/* AFTER — same photo, AI enhanced, clipped correctly */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <div className="absolute inset-0 bg-neutral-800">
            <Image src={IMG.after} alt="AI enhanced photo" fill className="object-cover object-top" priority sizes="100vw" />
          </div>
        </div>
        {/* Divider */}
        <div className="absolute top-0 bottom-0 z-30 pointer-events-none" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
          <div className="absolute inset-y-0 w-[2px] bg-white/70 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
          <div className="absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-[1.5px] border-white/80 bg-black/60 backdrop-blur-xl flex items-center justify-center shadow-2xl">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
        </div>
        {/* Labels */}
        <div className="absolute top-24 left-5 z-30 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFF00]/20 backdrop-blur-md border border-[#FFFF00]/30 text-[11px] font-black tracking-widest text-[#FFFF00] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00]" /> AI Enhanced
          </span>
        </div>
        <div className="absolute top-24 right-5 z-30 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[11px] font-black tracking-widest text-white/40 uppercase">Original</span>
        </div>
      </div>

      {/* Cinematic darkening gradient */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black via-black/90 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* Editorial text at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pb-10 px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-5 text-[11px] font-bold text-white/70 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />AI-Powered Visual Enhancement
            </div>
            <h1 className="font-heading font-black leading-[0.85] tracking-tight">
              <span className="block text-white whitespace-nowrap" style={{ fontSize: "clamp(3rem, 7vw, 7rem)" }}>MAKE IT</span>
              <span className="block text-[#FFFF00] whitespace-nowrap" style={{ fontSize: "clamp(3rem, 7vw, 7rem)" }}>SHARP.</span>
            </h1>
          </div>
          <div className="lg:max-w-[380px] lg:pb-2 flex flex-col gap-5">
            <p className="text-white/55 text-base leading-relaxed">
              Transform blurry, low-res photos into breathtaking 8K visuals. Drag the slider above — see the difference instantly.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/app/dashboard">
                <button className="bg-[#FFFF00] text-black font-bold px-8 py-4 rounded-xl text-sm inline-flex items-center gap-2 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,0,0.45)] transition-all duration-300">
                  Start for Free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="#features">
                <button className="border border-white/20 text-white font-medium px-7 py-4 rounded-xl text-sm bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
                  See All Tools
                </button>
              </Link>
            </div>
            <div className="flex items-center gap-5 pt-1">
              {["8K Output", "50+ Models", "<90s Processing"].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-[#FFFF00]/60" />
                  <span className="text-[11px] text-white/40 font-medium">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        <motion.div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/20"
          animate={{ y: [0, 5, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
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
  const items = ["8K Upscaling", "AI Skin Editor", "Image Generation", "Video Generation", "Motion Transfer", "Lip Sync", "AI Portraits", "Video Cloning", "Image Editing", "AI Influencer"]
  const all = [...items, ...items, ...items]
  return (
    <div className="py-3.5 bg-[#FFFF00] overflow-hidden relative z-10">
      <motion.div className="flex gap-10 whitespace-nowrap w-max"
        animate={{ x: ["0%", "-33.33%"] }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }}>
        {all.map((item, i) => (
          <span key={i} className="text-black font-black text-xs uppercase tracking-[0.2em] inline-flex items-center gap-8">
            {item}<span className="text-black/20">◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BENTO GRID — 6 cards, each totally unique layout
// ─────────────────────────────────────────────────────────────────────────────
function BentoFeatures() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="features" className="py-24 bg-[#060606] relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}
          className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5 text-[11px] font-bold text-white/50 uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5 text-[#FFFF00]" /> Full Creative Suite
          </div>
          <h2 className="font-heading text-4xl md:text-6xl font-black text-white leading-[0.9] mb-4">
            Everything Your<br /><span className="text-[#FFFF00]">Vision Needs.</span>
          </h2>
          <p className="text-white/40 text-lg max-w-lg mx-auto">One platform. Unlimited creative possibilities.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 max-w-[1400px] mx-auto">

          {/* UPSCALER — big card with correct before/after comparison (same woman) */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="lg:col-span-4 lg:row-span-2 relative rounded-3xl overflow-hidden border border-white/8 bg-[#0f0f0f]" style={{ minHeight: 560 }}>
            <ComparisonSlider before={IMG.g1b} after={IMG.g1a} beforeAlt="Original portrait" afterAlt="8K AI upscaled" speed={0.07} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 z-30 pointer-events-none">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#FFFF00]/20 border border-[#FFFF00]/30">
                  <Maximize2 className="w-3.5 h-3.5 text-[#FFFF00]" />
                </div>
                <span className="text-[11px] font-black text-[#FFFF00] uppercase tracking-widest">Smart Upscaler</span>
              </div>
              <h3 className="text-white font-bold text-2xl mb-1.5">Up to 8K Resolution</h3>
              <p className="text-white/45 text-sm mb-4 max-w-sm">Not just scaled — truly rebuilt. Drag the slider above to see the AI reconstruction.</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-[11px] font-bold text-white/60">4K · 80 cr</span>
                <span className="px-3 py-1 rounded-lg bg-[#FFFF00]/15 border border-[#FFFF00]/25 text-[11px] font-bold text-[#FFFF00]">8K · 120 cr</span>
              </div>
            </div>
          </motion.div>

          {/* SKIN EDITOR — side-by-side portrait split */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-white/8 bg-[#0f0f0f]" style={{ minHeight: 270 }}>
            <div className="absolute inset-0 flex">
              <div className="flex-1 relative overflow-hidden">
                <Image src={IMG.bm1a} alt="Skin enhanced" fill className="object-cover object-top" sizes="200px" />
                <div className="absolute top-2.5 left-2.5 text-[8px] font-black bg-[#FFFF00]/20 border border-[#FFFF00]/30 px-1.5 py-0.5 rounded text-[#FFFF00] uppercase tracking-wider">After AI</div>
              </div>
              <div className="w-[1px] bg-white/25 z-10" />
              <div className="flex-1 relative overflow-hidden">
                <Image src={IMG.bm1b} alt="Original skin" fill className="object-cover object-top" sizes="200px" />
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

          {/* IMAGE GENERATION — 2×2 portrait grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-white/8 bg-[#0f0f0f]" style={{ minHeight: 270 }}>
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
              {[IMG.g1b, IMG.bm1b, IMG.g1a, IMG.asian].map((src, i) => (
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

          {/* VIDEO SUITE — real autoplay video */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-4 relative rounded-3xl overflow-hidden border border-white/8 bg-[#05030f]" style={{ minHeight: 270 }}>
            <div className="absolute inset-0">
              <AutoVid src={VID.createVideo} poster={VID.createThumb} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
            </div>
            <div className="relative z-10 p-6 h-full flex flex-col justify-between" style={{ minHeight: 270 }}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-purple-400/25 border border-purple-400/30">
                    <Video className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest">Video Generation</span>
                </div>
                <h3 className="text-white font-bold text-2xl mb-2 max-w-xs leading-tight">Generate. Clone.<br />Animate. Sync.</h3>
                <p className="text-white/45 text-sm max-w-xs leading-relaxed">Text-to-video, motion transfer, lip sync and video cloning — powered by 60+ models.</p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {[
                  { logo: "/images/openai_sora.webp", name: "Sora" },
                  { logo: "/images/google_logo.webp", name: "Veo" },
                  { logo: "/images/kling_logo.webp", name: "Kling" },
                  { logo: "/images/bytedance_logo.webp", name: "Doubao" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10">
                    <div className="w-5 h-5 rounded flex items-center justify-center overflow-hidden bg-white/10 flex-shrink-0">
                      <Image src={m.logo} alt={m.name} width={14} height={14} className="object-contain" />
                    </div>
                    <span className="text-[10px] text-white/55 font-bold">{m.name}</span>
                  </div>
                ))}
                <span className="text-[10px] text-white/20 ml-1">+56 more</span>
              </div>
            </div>
          </motion.div>

          {/* IMAGE EDIT — comparison slider */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-white/8 bg-[#0f0f0f]" style={{ minHeight: 270 }}>
            <ComparisonSlider before={IMG.bm1b} after={IMG.bm1a} beforeAlt="Before edit" afterAlt="After AI edit" speed={0.06} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 right-0 p-4 z-30 pointer-events-none">
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
// 4. VIDEO GENERATION — dedicated section with video wall
// ─────────────────────────────────────────────────────────────────────────────
function VideoGenSection() {
  const features = [
    { title: "Text to Video", desc: "Describe a scene in words. Get a cinematic clip in seconds.", src: VID.createVideo, thumb: VID.createThumb, tag: "Text → Video", col: "text-purple-400", bg: "bg-purple-400/20 border-purple-400/30" },
    { title: "Motion Transfer", desc: "Clone a movement from any source video onto a new subject.", src: VID.motion, thumb: VID.motionT, tag: "Motion Clone", col: "text-cyan-400", bg: "bg-cyan-400/20 border-cyan-400/30" },
    { title: "Lip Sync Studio", desc: "Match any audio to any face — perfect sync, every time.", src: VID.lipsync, thumb: VID.lipsyncT, tag: "Lip Sync", col: "text-pink-400", bg: "bg-pink-400/20 border-pink-400/30" },
    { title: "AI Influencer", desc: "Generate a fully AI-driven video persona from scratch.", src: VID.aiInfluencer, thumb: VID.aiInfluencerT, tag: "AI Persona", col: "text-amber-400", bg: "bg-amber-400/20 border-amber-400/30" },
  ]

  return (
    <section className="py-24 bg-[#040404] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-purple-900/[0.07] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-blue-900/[0.05] rounded-full blur-[120px]" />
      </div>
      <div className="container mx-auto px-4 lg:px-8">
        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 max-w-[1300px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-400 text-[11px] font-black uppercase tracking-widest mb-5">
                <Video className="w-3.5 h-3.5" /> Video Suite
              </div>
              <h2 className="font-heading text-5xl md:text-7xl font-black text-white leading-[0.88]">
                Your Vision.<br /><span className="text-[#FFFF00]">In Motion.</span>
              </h2>
            </div>
            <div className="lg:max-w-xs space-y-4">
              <p className="text-white/50 leading-relaxed">60+ video AI models in one platform. Generate, clone, animate and sync — no technical knowledge required.</p>
              <Link href="/app/video">
                <button className="inline-flex items-center gap-2 border border-white/20 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-white/5 transition-all">
                  Explore Video Tools <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Big hero video + feature cards */}
        <div className="max-w-[1300px] mx-auto grid lg:grid-cols-12 gap-4">
          {/* Large featured video */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-white/8 bg-black group" style={{ aspectRatio: "16/9" }}>
            <AutoVid src={VID.triple} poster={VID.tripleT} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[11px] font-black text-white uppercase tracking-widest">Live AI Generation</span>
              </div>
            </div>
          </motion.div>

          {/* 4 feature mini cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#0a0a0a] group" style={{ aspectRatio: "1" }}>
                <div className="absolute inset-0">
                  <AutoVid src={f.src} poster={f.thumb} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-end p-3.5">
                  <div className={cn("inline-flex self-start items-center gap-1 px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider mb-1.5", f.bg, f.col)}>
                    {f.tag}
                  </div>
                  <div className={cn("text-xs font-bold leading-tight", f.col)}>{f.title}</div>
                  <div className="text-[10px] text-white/40 leading-relaxed mt-0.5 line-clamp-2">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scrolling video strip */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-6 max-w-[1300px] mx-auto overflow-hidden rounded-2xl border border-white/[0.06] relative">
          <motion.div className="flex gap-3 w-max" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }}>
            {[VID.kling3, VID.soul2, VID.nanoBanana, VID.soulCin, VID.editVideo, VID.kling3, VID.soul2, VID.nanoBanana, VID.soulCin, VID.editVideo].map((src, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900" style={{ width: 200, height: 120 }}>
                <AutoVid src={src} className="w-full h-full object-cover" />
              </div>
            ))}
          </motion.div>
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#040404] to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#040404] to-transparent pointer-events-none z-10" />
        </motion.div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. UPSCALER DEEP DIVE
// ─────────────────────────────────────────────────────────────────────────────
function UpscalerSection() {
  const { pos, cur, setPos, setPaused } = useSlider(50, 5, 95, 0.06)
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
    { v: "<90s", l: "Processing Time" },
    { v: "99.1%", l: "Quality Score" },
  ]

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 right-0 w-[800px] h-[700px] bg-[#FFFF00]/[0.03] rounded-full blur-[140px]" />
      </div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-[1300px] mx-auto">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div ref={ref} className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-ew-resize select-none bg-neutral-900" style={{ aspectRatio: "4/5" }}
              onPointerDown={e => { setDrag(true); setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
              onPointerMove={e => drag && onMove(e.clientX)}
              onPointerUp={() => { setDrag(false); setPaused(false) }}>
              {/* BEFORE */}
              <div className="absolute inset-0 bg-neutral-900">
                <Image src={IMG.g1b} alt="Low-res original" fill className="object-cover object-top" sizes="700px" />
              </div>
              {/* AFTER — clipPath fix */}
              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                <div className="absolute inset-0 bg-neutral-800">
                  <Image src={IMG.g1a} alt="AI upscaled 8K" fill className="object-cover object-top" sizes="700px" />
                </div>
              </div>
              {/* Divider */}
              <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
                <div className="absolute inset-y-0 w-[2px] bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                <div className="absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-2 border-white/70 bg-black/50 backdrop-blur-xl flex items-center justify-center shadow-xl">
                  <ScanLine className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-[#FFFF00]/20 backdrop-blur-md border border-[#FFFF00]/30 text-[10px] font-black text-[#FFFF00] uppercase tracking-widest pointer-events-none z-20">{res} AI</div>
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest pointer-events-none z-20">Original</div>
            </div>
            {/* Upscale video demo below the comparison */}
            <div className="mt-3 relative rounded-2xl overflow-hidden border border-white/8 bg-black" style={{ height: 100 }}>
              <AutoVid src={VID.upscale} poster={VID.upscaleT} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="text-[10px] font-black text-[#FFFF00] uppercase tracking-widest">See it in action</div>
                <div className="text-[9px] text-white/30 mt-0.5">Real-time upscaling preview</div>
              </div>
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
                Our AI doesn&apos;t just enlarge — it <em className="text-white not-italic font-semibold">reconstructs</em>. Every texture synthesized from millions of references to produce output indistinguishable from native 8K capture.
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
              <button className="w-full py-4 rounded-xl bg-[#FFFF00] text-black font-bold text-base inline-flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(255,255,0,0.3)] transition-all duration-300">
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
// 6. SKIN EDITOR — Professional Grade Control (unique design, not generic)
// ─────────────────────────────────────────────────────────────────────────────
function SkinEditorSection() {
  const [texture, setTexture] = useState(68)
  const [detail, setDetail] = useState(42)
  const [depth, setDepth] = useState(74)
  const [mode, setMode] = useState<"natural" | "smooth" | "detailed">("natural")
  const [zones, setZones] = useState({ Face: true, Skin: true, Nose: false, Mouth: true, Eyes: false, Hair: false })
  const [processing, setProcessing] = useState(false)
  const [previewSide, setPreviewSide] = useState<"before" | "after">("after")
  const coverage = Math.round(Object.values(zones).filter(Boolean).length / 6 * 100)

  const sliders = [
    { key: "texture", label: "Texture Strength", sub: "Surface micro-detail level", v: texture, set: setTexture, c: "#FFFF00", track: "#3a3a00" },
    { key: "detail",  label: "Micro Detail",     sub: "Pore & skin texture depth",  v: detail,  set: setDetail,  c: "#60a5fa", track: "#0c1a2e" },
    { key: "depth",   label: "Trans. Depth",      sub: "Transformation intensity",   v: depth,   set: setDepth,   c: "#c084fc", track: "#1e0a3a" },
  ]

  return (
    <section className="relative py-24 overflow-hidden" style={{ background: "#050508" }}>
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] rounded-full blur-[200px]" style={{ background: "radial-gradient(ellipse, rgba(96,165,250,0.05) 0%, rgba(192,132,252,0.04) 50%, transparent 70%)" }} />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[11px] font-bold uppercase tracking-widest" style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa" }}>
            <Cpu className="w-3.5 h-3.5" /> Skin Editor Pro
          </div>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-[0.9]">
            Professional Grade <span className="text-[#FFFF00]">Control.</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Surgical precision meets AI. Every parameter visualised in real-time. Designed for professionals who refuse to compromise.
          </p>
        </motion.div>

        {/* Main layout: preview left, controls right */}
        <div className="max-w-[1300px] mx-auto grid lg:grid-cols-12 gap-4">

          {/* ── PREVIEW PANEL ── */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl" style={{ minHeight: 580 }}>
            {/* Background with gradient */}
            <div className="absolute inset-0 bg-[#0a0a10]" />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(255,160,0,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(96,165,250,0.1) 0%, transparent 50%)" }} />

            {/* Preview image — toggleable before/after */}
            <div className="absolute inset-0">
              <AnimatePresence mode="wait">
                <motion.div key={previewSide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0">
                  <Image src={previewSide === "after" ? IMG.bm1a : IMG.bm1b} alt="Skin preview" fill className="object-cover object-top" sizes="900px" />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,5,8,0.92) 0%, rgba(5,5,8,0.1) 50%, rgba(5,5,8,0.4) 100%)" }} />

            {/* Top HUD */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4">
              <div className="flex items-center justify-between">
                {/* Status bar */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-xl border text-[11px] font-black uppercase tracking-widest" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live Preview
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg backdrop-blur-xl text-[11px] font-mono" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                    4K · {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </div>
                </div>
                {/* Before/After toggle */}
                <div className="flex rounded-xl overflow-hidden border border-white/10" style={{ background: "rgba(0,0,0,0.5)" }}>
                  {(["before", "after"] as const).map(s => (
                    <button key={s} onClick={() => setPreviewSide(s)}
                      className={cn("px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all", previewSide === s ? "bg-[#FFFF00] text-black" : "text-white/40 hover:text-white/70")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom metrics HUD */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
              <div className="grid grid-cols-3 gap-2">
                {sliders.map((s) => (
                  <div key={s.key} className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label.split(" ")[0]}</span>
                      <span className="text-lg font-black font-heading" style={{ color: s.c }}>{s.v}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: s.track }}>
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: s.c }} animate={{ width: `${s.v}%` }} transition={{ duration: 0.3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── CONTROLS PANEL ── */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 flex flex-col gap-3">

            {/* Parameter sliders card */}
            <div className="flex-1 rounded-3xl p-5 flex flex-col gap-4" style={{ background: "#0e0e14", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-[#FFFF00]" />
                  <span className="font-bold text-white text-sm">Enhancement Parameters</span>
                </div>
                <button onClick={() => { setTexture(68); setDetail(42); setDepth(74) }}
                  className="text-[10px] uppercase tracking-wider font-bold transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.2)"}>
                  Reset
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-5">
                {sliders.map((s) => (
                  <div key={s.key}>
                    <div className="flex justify-between mb-2">
                      <div>
                        <div className="text-xs font-bold text-white/70">{s.label}</div>
                        <div className="text-[10px] text-white/25 mt-0.5">{s.sub}</div>
                      </div>
                      <span className="text-sm font-black font-heading mt-0.5" style={{ color: s.c }}>{s.v}%</span>
                    </div>
                    <div className="relative h-1.5 rounded-full" style={{ background: s.track }}>
                      <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ backgroundColor: s.c }} animate={{ width: `${s.v}%` }} transition={{ duration: 0.3 }} />
                      <input type="range" min={0} max={100} value={s.v} onChange={e => s.set(+e.target.value)}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mode selector */}
              <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[10px] font-bold uppercase tracking-widest block mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Processing Mode</span>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "natural",  label: "Natural",  sub: "Realistic pores" },
                    { id: "smooth",   label: "Smooth",   sub: "Clean skin tone" },
                    { id: "detailed", label: "Detailed", sub: "Max micro-detail" },
                  ] as const).map(m => (
                    <button key={m.id} onClick={() => setMode(m.id)}
                      className="p-2.5 rounded-xl border text-center transition-all"
                      style={mode === m.id
                        ? { background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.4)" }
                        : { background: "transparent", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className={cn("text-[11px] font-bold", mode === m.id ? "text-blue-300" : "text-white/40")}>{m.label}</div>
                      <div className="text-[9px] text-white/20 mt-0.5">{m.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target zones */}
              <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Target Zones</span>
                  <span className="text-[10px] font-mono" style={{ color: "#FFFF00" }}>{coverage}% Active</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(zones) as Array<keyof typeof zones>).map(z => (
                    <button key={z} onClick={() => setZones(p => ({ ...p, [z]: !p[z] }))}
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all"
                      style={zones[z]
                        ? { background: "rgba(96,165,250,0.18)", border: "1px solid rgba(96,165,250,0.35)", color: "#93c5fd" }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.28)" }}>
                      {z}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => { setProcessing(true); setTimeout(() => setProcessing(false), 3000) }}
              disabled={processing}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#FFFF00", color: "black" }}>
              {processing
                ? <><Cpu className="w-4 h-4 animate-spin" />Processing Enhancement...</>
                : <>Apply Enhancement <ArrowRight className="w-4 h-4" /></>}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. IMAGE GENERATION — editorial gallery, no controls at all
// ─────────────────────────────────────────────────────────────────────────────
function ImageGenSection() {
  const [active, setActive] = useState(0)
  const prompts = [
    "Cinematic portrait, golden hour, ultra-sharp 8K",
    "Fashion editorial, dramatic shadows, high contrast",
    "Studio portrait, skin detail, photorealistic",
    "Natural light, outdoor portrait, 4K realism",
  ]
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % prompts.length), 3200)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="py-24 bg-[#040404] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[700px] h-[500px] bg-amber-500/[0.025] rounded-full blur-[130px] pointer-events-none" />
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14 max-w-[1300px] mx-auto">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[11px] font-black uppercase tracking-widest mb-5">
              <ImageIcon className="w-3.5 h-3.5" /> Image Generation
            </div>
            <h2 className="font-heading text-5xl md:text-7xl font-black text-white leading-[0.88]">
              Words into<br /><span className="text-[#FFFF00]">Worlds.</span>
            </h2>
          </div>
          <div className="lg:max-w-xs space-y-4">
            <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />
                <span className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Sample prompt</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p key={active} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }}
                  className="text-white/55 text-sm font-mono leading-relaxed">&ldquo;{prompts[active]}&rdquo;</motion.p>
              </AnimatePresence>
            </div>
            <Link href="/app/image">
              <button className="w-full inline-flex items-center justify-center gap-2 bg-[#FFFF00] text-black font-bold px-6 py-3.5 rounded-xl text-sm hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] transition-all">
                Generate Now <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Mosaic gallery — 5 images in asymmetric grid */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-[1300px] mx-auto grid grid-cols-12 grid-rows-2 gap-3" style={{ height: 520 }}>
          {/* Col 1-3 tall */}
          <div className="col-span-3 row-span-2 relative rounded-3xl overflow-hidden group" style={{ background: "linear-gradient(160deg, #1a0f00, #050005)" }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(255,140,0,0.22) 0%, transparent 60%)" }} />
            <Image src={IMG.g1a} alt="AI portrait" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-700" sizes="320px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="text-[9px] text-white/30 font-mono mb-1.5 truncate">&ldquo;{prompts[active]}&rdquo;</div>
                </motion.div>
              </AnimatePresence>
              <span className="px-2 py-0.5 rounded-md bg-[#FFFF00]/20 border border-[#FFFF00]/30 text-[9px] font-black text-[#FFFF00] uppercase tracking-wider">AI Enhanced</span>
            </div>
          </div>
          {/* Col 4-7 top */}
          <div className="col-span-4 row-span-1 relative rounded-3xl overflow-hidden group" style={{ background: "linear-gradient(135deg, #001030, #000818)" }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(60,100,255,0.28) 0%, transparent 65%)" }} />
            <Image src={IMG.g1b} alt="Portrait" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-700" sizes="400px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3"><span className="px-2 py-0.5 rounded-full bg-blue-400/20 border border-blue-400/25 text-[8px] font-black text-blue-300 uppercase tracking-wider">Portrait</span></div>
          </div>
          {/* Col 8-12 top */}
          <div className="col-span-5 row-span-1 relative rounded-3xl overflow-hidden group" style={{ background: "linear-gradient(135deg, #0d0008, #050005)" }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(180,80,255,0.22) 0%, transparent 65%)" }} />
            <Image src={IMG.bm1a} alt="AI enhanced portrait" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-700" sizes="500px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3"><span className="px-2 py-0.5 rounded-full bg-purple-400/20 border border-purple-400/25 text-[8px] font-black text-purple-300 uppercase tracking-wider">Realism</span></div>
          </div>
          {/* Col 4-8 bottom */}
          <div className="col-span-5 row-span-1 relative rounded-3xl overflow-hidden group" style={{ background: "linear-gradient(135deg, #061208, #030a04)" }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(40,180,80,0.22) 0%, transparent 65%)" }} />
            <Image src={IMG.g2b} alt="Natural portrait" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-700" sizes="500px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3"><span className="px-2 py-0.5 rounded-full bg-green-400/20 border border-green-400/25 text-[8px] font-black text-green-300 uppercase tracking-wider">Natural</span></div>
          </div>
          {/* Col 9-12 bottom */}
          <div className="col-span-4 row-span-1 relative rounded-3xl overflow-hidden group" style={{ background: "linear-gradient(135deg, #0d0800, #080500)" }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,180,0,0.18) 0%, transparent 65%)" }} />
            <Image src={IMG.asian} alt="AI portrait" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-700" sizes="400px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3"><span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/25 text-[8px] font-black text-amber-300 uppercase tracking-wider">Cinematic</span></div>
          </div>
        </motion.div>

        {/* Powered by row */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
          className="max-w-[1300px] mx-auto mt-5 flex items-center gap-4">
          <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold whitespace-nowrap">Powered by</span>
          {["/images/google_logo.webp", "/images/bytedance_logo.webp", "/images/openai_sora.webp", "/images/kling_logo.webp"].map((logo, i) => (
            <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Image src={logo} alt="Model" width={18} height={18} className="object-contain" />
            </div>
          ))}
          <span className="text-[10px] text-white/20 font-medium">+ 46 more models</span>
          <ArrowUpRight className="w-3 h-3 text-white/15" />
        </motion.div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. STATS STRIP
// ─────────────────────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { v: "8K", l: "Max Output" },
    { v: "50+", l: "AI Models" },
    { v: "99.1%", l: "Quality Score" },
    { v: "20×", l: "Faster" },
  ]
  return (
    <div className="py-16 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #050505 0%, #0a0a00 50%, #050505 100%)" }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,0,0.06)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FFFF00]/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FFFF00]/20 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 max-w-5xl mx-auto">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="text-center">
              <div className="font-heading font-black text-6xl md:text-7xl text-[#FFFF00] mb-2 leading-none" style={{ filter: "drop-shadow(0 0 40px rgba(255,255,0,0.3))" }}>{s.v}</div>
              <div className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. PRICING
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
          <p className="text-white/40 text-lg max-w-md mx-auto">Credits work across every tool. No feature gates. No surprises.</p>
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
      <VideoGenSection />
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
