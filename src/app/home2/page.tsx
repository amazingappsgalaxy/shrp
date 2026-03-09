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
  ArrowRight, ScanLine, Sparkles, Video, Maximize2, Play,
  Wand2, Layers, Upload, Zap, Download, Camera, Users,
  Building2, Globe, CheckCircle2, TrendingUp, Star,
  ChevronLeft, ChevronRight
} from "lucide-react"

// ─── CDN ASSETS ────────────────────────────────────────────────────────────────
// All tebi.io portrait images confirmed loading; comparebefore/after removed (broken)
const IMG = {
  g1b:  "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg",
  g1a:  "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png",
  g2b:  "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+2+Before.jpg",
  bm1b: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+Before.jpg",
  bm1a: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+After.png",
  asian:"https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+after.png",
}

// Videos from Higgsfield CDN — publicly served, no auth
const VID = {
  hero:         "https://higgsfield.ai/home/features-banner.mp4",
  heroT:        "https://higgsfield.ai/home/features-banner.webp",
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
  triple:       "https://higgsfield.ai/home/triple-composition.mp4",
  tripleT:      "https://higgsfield.ai/home/triple-composition.webp",
  nanoBanana:   "https://static.higgsfield.ai/flow/nano-banana-2-banner.mp4",
  nanoBananaT:  "https://static.higgsfield.ai/flow/nano-banana-2-banner.webp",
  kling3:       "https://static.higgsfield.ai/promotion/kling-3-hero.mp4",
  kling3T:      "https://static.higgsfield.ai/promotion/kling-3-hero.webp",
}

// ─── SHARED PRIMITIVES ─────────────────────────────────────────────────────────

/** Eyebrow chip above section headers */
function Chip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-[11px] font-bold text-white/50 uppercase tracking-[0.18em]">
      {icon}{children}
    </span>
  )
}

/** Standard section header — consistent typography across all sections */
function SectionHead({
  chip, title, accent, sub, align = "left",
}: {
  chip?: string; title: string; accent?: string; sub?: string; align?: "left" | "center"
}) {
  return (
    <div className={cn("mb-16", align === "center" && "text-center flex flex-col items-center")}>
      {chip && <div className="mb-5"><Chip>{chip}</Chip></div>}
      <h2 className="font-black text-[clamp(2.6rem,5vw,4.5rem)] leading-[0.88] tracking-tight text-white mb-5">
        {title}
        {accent && <><br /><span className="text-[#FFFF00]">{accent}</span></>}
      </h2>
      {sub && (
        <p className={cn("text-white/45 text-lg leading-relaxed", align === "center" ? "max-w-2xl" : "max-w-xl")}>
          {sub}
        </p>
      )}
    </div>
  )
}

/** Autoplay muted loop video */
function AutoVid({ src, poster, className = "" }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => { ref.current?.play().catch(() => {}) }, [])
  return (
    <video ref={ref} src={src} poster={poster} muted loop playsInline autoPlay
      className={cn("w-full h-full object-cover", className)} />
  )
}

// ─── COMPARISON SLIDER ─────────────────────────────────────────────────────────
// Uses clipPath — prevents image scaling bug from overflow+width approach

function useSlider(init = 50, min = 12, max = 88, speed = 0.08) {
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
  before, after, beforeAlt, afterAlt, speed = 0.08, className = "",
}: {
  before: string; after: string; beforeAlt: string; afterAlt: string
  speed?: number; className?: string
}) {
  const { pos, cur, setPos, setPaused } = useSlider(50, 12, 88, speed)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(0, Math.min((cx - r.left) / r.width * 100, 100))
    setPos(cur.current)
  }, [cur, setPos])

  return (
    <div ref={ref}
      className={cn("absolute inset-0 select-none overflow-hidden", className)}
      style={{ cursor: drag ? "grabbing" : "ew-resize" }}
      onPointerDown={e => { setDrag(true); setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
      onPointerMove={e => drag && onMove(e.clientX)}
      onPointerUp={() => { setDrag(false); setPaused(false) }}
      onPointerLeave={() => { if (drag) { setDrag(false); setPaused(false) } }}
    >
      {/* BEFORE */}
      <div className="absolute inset-0">
        <Image src={before} alt={beforeAlt} fill className="object-cover object-top" sizes="(max-width:768px) 100vw, 50vw" />
      </div>
      {/* AFTER — clipPath prevents scaling */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={after} alt={afterAlt} fill className="object-cover object-top" sizes="(max-width:768px) 100vw, 50vw" />
      </div>
      {/* Divider */}
      <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        <div className="absolute inset-y-0 w-[2px] bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
        <div className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-white/80 bg-black/60 backdrop-blur-xl flex items-center justify-center shadow-xl">
          <ScanLine className="w-4 h-4 text-white" />
        </div>
      </div>
      {/* Corner labels — always readable with opaque chip background */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-md text-[10px] font-bold text-white/60 uppercase tracking-widest">Original</span>
      </div>
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 bg-[#FFFF00]/90 px-2.5 py-1 rounded-md text-[10px] font-black text-black uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />AI Enhanced
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. HERO
// ═══════════════════════════════════════════════════════════════════════════════
function Hero() {
  const { pos, cur, setPos, setPaused } = useSlider(50, 15, 85, 0.06)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    cur.current = Math.max(0, Math.min((cx - r.left) / r.width * 100, 100))
    setPos(cur.current)
  }, [cur, setPos])

  return (
    <section className="relative w-full bg-black overflow-hidden" style={{ height: "100svh", minHeight: 680 }}>
      {/* Full-bleed comparison canvas — using g1b/g1a (confirmed loading) */}
      <div ref={ref} className="absolute inset-0"
        style={{ cursor: drag ? "grabbing" : "ew-resize" }}
        onPointerDown={e => { setDrag(true); setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
        onPointerMove={e => drag && onMove(e.clientX)}
        onPointerUp={() => { setDrag(false); setPaused(false) }}
        onPointerLeave={() => { if (drag) { setDrag(false); setPaused(false) } }}
      >
        <div className="absolute inset-0 bg-neutral-900">
          <Image src={IMG.g1b} alt="Original photo" fill className="object-cover object-top" priority sizes="100vw" />
        </div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <div className="absolute inset-0 bg-neutral-800">
            <Image src={IMG.g1a} alt="AI enhanced" fill className="object-cover object-top" priority sizes="100vw" />
          </div>
        </div>
        {/* Divider */}
        <div className="absolute top-0 bottom-0 z-30 pointer-events-none" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
          <div className="absolute inset-y-0 w-[2px] bg-white/75 shadow-[0_0_16px_rgba(255,255,255,0.55)]" />
          <div className="absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-white/80 bg-black/55 backdrop-blur-xl flex items-center justify-center shadow-2xl">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
        </div>
        {/* Corner labels */}
        <div className="absolute top-24 left-6 z-30 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white/55 uppercase tracking-widest">Original</span>
        </div>
        <div className="absolute top-24 right-6 z-30 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-[#FFFF00]/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-black text-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-black/60 animate-pulse" />AI Enhanced
          </span>
        </div>
      </div>

      {/* Gradient overlay — strong enough for text readability */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.35)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-black via-black/85 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
      </div>

      {/* Editorial text */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pb-12 px-6 md:px-12 lg:px-20 max-w-[1440px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10"
        >
          {/* Left: headline */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6 text-[11px] font-bold text-white/65 uppercase tracking-[0.18em]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />
              AI-Powered Visual Enhancement
            </div>
            <h1 className="font-black leading-[0.82] tracking-tight">
              <span className="block text-white" style={{ fontSize: "clamp(3.4rem,7.5vw,7.5rem)" }}>MAKE IT</span>
              <span className="block text-[#FFFF00]" style={{ fontSize: "clamp(3.4rem,7.5vw,7.5rem)" }}>SHARP.</span>
            </h1>
          </div>

          {/* Right: copy + CTAs */}
          <div className="lg:max-w-[420px] flex flex-col gap-6">
            <p className="text-white/55 text-lg leading-relaxed">
              Transform any photo into breathtaking 8K detail. Our AI doesn't just upscale — it fully reconstructs skin texture, sharpness, and depth.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/app/dashboard">
                <button className="bg-[#FFFF00] text-black font-bold h-14 px-8 rounded-xl text-sm inline-flex items-center gap-2 hover:scale-105 hover:shadow-[0_0_45px_rgba(255,255,0,0.4)] transition-all duration-300">
                  Start for Free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="#features">
                <button className="border border-white/20 text-white font-semibold h-14 px-7 rounded-xl text-sm bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
                  See All Tools
                </button>
              </Link>
            </div>
            <div className="flex items-center gap-6">
              {["8K Output", "50+ Models", "<90s Processing"].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#FFFF00]/60" />
                  <span className="text-xs text-white/40 font-medium">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 text-white/25 pointer-events-none"
        animate={{ y: [0, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-widest font-bold">Drag slider</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
            <div className="w-1 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </motion.div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. TICKER — seamless marquee, 2 copies → animate to -50%
// ═══════════════════════════════════════════════════════════════════════════════
function Ticker() {
  const items = [
    "8K Upscaling", "AI Skin Editor", "Image Generation", "Video Generation",
    "Motion Transfer", "Lip Sync", "AI Portraits", "Video Editing",
    "Image Restoration", "AI Influencer"
  ]
  const doubled = [...items, ...items]
  return (
    <div className="py-4 bg-[#FFFF00] overflow-hidden relative z-10 border-y border-black/10">
      <motion.div
        className="flex gap-0 whitespace-nowrap w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="text-black font-black text-sm uppercase tracking-[0.18em] inline-flex items-center px-8 gap-8">
            {item}<span className="text-black/25 text-xs">◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. BENTO FEATURES — 2-row grid, correct aspect ratios per card
// ═══════════════════════════════════════════════════════════════════════════════
function BentoFeatures() {
  return (
    <section id="features" className="py-24 bg-[#060606]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <SectionHead
            chip="Full Creative Suite"
            title="Everything Your"
            accent="Vision Needs."
            sub="Professional-grade AI tools. One platform. Zero friction."
          />
        </motion.div>

        {/* ROW 1: tall portrait cards */}
        <div className="flex gap-3 mb-3" style={{ height: 520 }}>
          {/* Upscaler — col 45%, tall comparison slider */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }}
            className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#0f0f0f] flex-[5]"
          >
            <ComparisonSlider before={IMG.g1b} after={IMG.g1a} beforeAlt="Original portrait" afterAlt="AI upscaled" speed={0.06} />
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 z-30 pointer-events-none">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#FFFF00]/20 border border-[#FFFF00]/30">
                  <Maximize2 className="w-3.5 h-3.5 text-[#FFFF00]" />
                </div>
                <span className="text-xs font-black text-[#FFFF00] uppercase tracking-widest">Smart Upscaler</span>
              </div>
              <h3 className="text-white font-bold text-2xl mb-1.5">Up to 8K Resolution</h3>
              <p className="text-white/50 text-sm mb-4 max-w-xs">AI reconstruction — not just scaling. Every pore, strand, and texture rebuilt from scratch.</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-xs font-bold text-white/60">4K · 80 cr</span>
                <span className="px-3 py-1 rounded-lg bg-[#FFFF00]/15 border border-[#FFFF00]/25 text-xs font-bold text-[#FFFF00]">8K · 120 cr</span>
              </div>
            </div>
          </motion.div>

          {/* Skin Editor — col 22%, single portrait */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#0f0f0f] flex-[2]"
          >
            <div className="absolute inset-0">
              <Image src={IMG.bm1a} alt="Skin enhanced portrait" fill className="object-cover object-top" sizes="280px" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            {/* Top badge */}
            <div className="absolute top-4 left-4 z-20">
              <span className="bg-black/70 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/70 uppercase tracking-widest inline-block">After</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFFF00]" />
                <span className="text-xs font-black text-[#FFFF00] uppercase tracking-widest">Skin Editor</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-1">AI Skin Enhancement</h3>
              <p className="text-white/45 text-xs leading-relaxed">Texture, tone, and depth — perfected with precision controls.</p>
            </div>
          </motion.div>

          {/* Image Gen — col 33%, 2 portrait cells side by side */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
            className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#0f0f0f] flex-[3] flex flex-col"
          >
            {/* Two portrait tiles */}
            <div className="flex flex-1 gap-1 p-1">
              <div className="relative flex-1 rounded-xl overflow-hidden bg-neutral-800">
                <Image src={IMG.g2b} alt="AI generated portrait" fill className="object-cover object-top" sizes="200px" />
              </div>
              <div className="relative flex-1 rounded-xl overflow-hidden bg-neutral-800">
                <Image src={IMG.asian} alt="AI generated portrait" fill className="object-cover object-top" sizes="200px" />
              </div>
            </div>
            {/* Info bar */}
            <div className="p-5 bg-[#0f0f0f] border-t border-white/6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#FFFF00]" />
                <span className="text-xs font-black text-[#FFFF00] uppercase tracking-widest">Image Generation</span>
              </div>
              <h3 className="text-white font-bold text-lg">Create from Text</h3>
              <p className="text-white/45 text-xs mt-1">50+ AI models. Any style, any subject.</p>
            </div>
          </motion.div>
        </div>

        {/* ROW 2: landscape cards — video, edit */}
        <div className="flex gap-3" style={{ height: 320 }}>
          {/* Video Suite — 16:9 video */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#05030f] flex-[6]"
          >
            <AutoVid src={VID.createVideo} poster={VID.createVideoT} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-y-0 left-0 p-7 flex flex-col justify-center z-10 max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
                  <Play className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-xs font-black text-violet-400 uppercase tracking-widest">Video Generation</span>
              </div>
              <h3 className="text-white font-bold text-2xl mb-2">Bring Ideas to Life</h3>
              <p className="text-white/50 text-sm leading-relaxed">Text-to-video, lip sync, motion transfer, and 8 more tools — all in one platform.</p>
              <div className="flex gap-2 mt-4">
                {["Text-to-Video", "Lip Sync", "Motion Transfer", "+8 more"].map((t, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-white/8 border border-white/10 text-[10px] font-bold text-white/55">{t}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Image Edit — comparison slider landscape */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.25 }}
            className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#0f0f0f] flex-[4]"
          >
            <ComparisonSlider before={IMG.bm1b} after={IMG.bm1a} beforeAlt="Before editing" afterAlt="After AI editing" speed={0.07} />
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black via-black/75 to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 right-0 p-5 z-30 pointer-events-none">
              <div className="flex items-center gap-2 mb-1.5">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Image Editing</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-1">Edit with Prompts</h3>
              <p className="text-white/45 text-xs">Describe changes in plain text — AI handles the rest.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. BEFORE / AFTER GALLERY STRIP — horizontal scroll, portrait cards
// ═══════════════════════════════════════════════════════════════════════════════
const BA_CARDS = [
  { b: IMG.g1b,  a: IMG.g1a,  label: "Skin Enhancement",   tag: "Skin Editor" },
  { b: IMG.bm1b, a: IMG.bm1a, label: "Portrait Restore",   tag: "Upscaler" },
  { b: IMG.g1b,  a: IMG.g1a,  label: "8K Texture Detail",  tag: "Smart Upscaler" },
  { b: IMG.bm1b, a: IMG.bm1a, label: "Micro-Detail Boost", tag: "Skin Editor" },
  { b: IMG.g1b,  a: IMG.g1a,  label: "Photo Restoration",  tag: "Upscaler" },
  { b: IMG.bm1b, a: IMG.bm1a, label: "Color & Tone Fix",   tag: "Skin Editor" },
]

function BeforeAfterStrip() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <section className="py-24 bg-[#030303]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="flex items-end justify-between mb-10"
        >
          <SectionHead chip="Before & After" title="The Sharpii" accent="Difference." sub="Drag any slider to see the transformation." />
          <div className="hidden lg:flex items-center gap-2 pb-16">
            <button onClick={() => scrollRef.current?.scrollBy({ left: -420, behavior: "smooth" })}
              className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/8 transition-colors">
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>
            <button onClick={() => scrollRef.current?.scrollBy({ left: 420, behavior: "smooth" })}
              className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/8 transition-colors">
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </motion.div>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
          {BA_CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06 }}
              className="relative rounded-xl overflow-hidden border border-white/8 flex-shrink-0"
              style={{ width: 240, height: 320, scrollSnapAlign: "start" }}
            >
              <ComparisonSlider before={card.b} after={card.a} beforeAlt="Before" afterAlt="After" speed={0.05 + i * 0.01} />
              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-20" />
              <div className="absolute bottom-0 left-0 right-0 p-4 z-30 pointer-events-none">
                <span className="block text-[10px] font-bold text-[#FFFF00] uppercase tracking-widest mb-1">{card.tag}</span>
                <span className="block text-sm font-bold text-white">{card.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. VIDEO GENERATION — large 16:9 hero + 4-card grid + scrolling strip
// ═══════════════════════════════════════════════════════════════════════════════
const VIDEO_FEATURES = [
  { src: VID.createVideo,  poster: VID.createVideoT,  title: "AI Video Generation",  desc: "Create stunning videos from text prompts in seconds." },
  { src: VID.lipsync,      poster: VID.lipsyncT,      title: "Lip Sync Studio",       desc: "Sync any audio track to any face, perfectly." },
  { src: VID.motion,       poster: VID.motionT,       title: "Motion Transfer",       desc: "Apply real-world motion patterns to your footage." },
  { src: VID.editVideo,    poster: VID.editVideoT,    title: "AI Video Editor",       desc: "Edit clips with natural language — no timeline needed." },
]

const STRIP_VIDS = [
  { src: VID.soul2,        poster: VID.soul2T,        label: "Style Transfer" },
  { src: VID.aiInfluencer, poster: VID.aiInfluencerT, label: "AI Influencer" },
  { src: VID.soulCin,      poster: VID.soulCinT,      label: "Cinematic Grade" },
  { src: VID.triple,       poster: VID.tripleT,       label: "Multi-Subject AI" },
  { src: VID.nanoBanana,   poster: VID.nanoBananaT,   label: "Flow Animation" },
  { src: VID.kling3,       poster: VID.kling3T,       label: "Kling 3.0 Model" },
  { src: VID.upscale,      poster: VID.upscaleT,      label: "Video Upscaling" },
  { src: VID.soul2,        poster: VID.soul2T,        label: "Style Transfer" },
  { src: VID.aiInfluencer, poster: VID.aiInfluencerT, label: "AI Influencer" },
  { src: VID.soulCin,      poster: VID.soulCinT,      label: "Cinematic Grade" },
]

function VideoGenSection() {
  return (
    <section className="py-24 bg-[#060606]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12"
        >
          <SectionHead chip="Video Suite" title="Your Vision." accent="In Motion." sub="11 video AI tools — all under one subscription. Create, edit, lip sync, clone, and animate." />
          <Link href="/app/dashboard" className="flex-shrink-0 pb-16">
            <button className="bg-[#FFFF00] text-black font-bold h-14 px-8 rounded-xl text-sm inline-flex items-center gap-2 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,0,0.35)] transition-all">
              Explore Video Tools <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>

        {/* Hero video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative rounded-2xl overflow-hidden mb-4 border border-white/8"
          style={{ aspectRatio: "16/7" }}
        >
          {/* Use soul2 — static.higgsfield.ai is more reliable than higgsfield.ai root */}
          <AutoVid src={VID.soul2} poster={VID.soul2T} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
          <div className="absolute inset-y-0 left-0 flex flex-col justify-center pl-10 md:pl-16 max-w-md z-10">
            <Chip icon={<Play className="w-3 h-3" />}>Video AI Suite</Chip>
            <h3 className="font-black text-3xl md:text-5xl text-white mt-4 mb-3 leading-tight">
              11 Video<br />AI Tools
            </h3>
            <p className="text-white/60 text-base md:text-lg">From creation to final cut — powered by the world's best video models.</p>
          </div>
          {/* Live indicator */}
          <div className="absolute top-5 right-5 z-10">
            <span className="inline-flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-lg text-xs font-bold text-white/70 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live Demo
            </span>
          </div>
        </motion.div>

        {/* 4-card feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {VIDEO_FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
              className="relative rounded-xl overflow-hidden border border-white/8 bg-[#0f0f0f] group"
            >
              {/* 16:9 video container */}
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                <AutoVid src={f.src} poster={f.poster} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              {/* Text below video */}
              <div className="p-4">
                <h4 className="text-white font-bold text-base mb-1">{f.title}</h4>
                <p className="text-white/45 text-xs leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scrolling video strip */}
        <div className="overflow-hidden rounded-xl border border-white/6">
          <motion.div
            className="flex gap-2 w-max py-2 px-2"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {[...STRIP_VIDS, ...STRIP_VIDS].map((v, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden flex-shrink-0 border border-white/8" style={{ width: 280, height: 158 }}>
                <AutoVid src={v.src} poster={v.poster} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="text-xs font-bold text-white">{v.label}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. HOW IT WORKS — 3 clean steps
// ═══════════════════════════════════════════════════════════════════════════════
const STEPS = [
  {
    n: "01", icon: Upload, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
    title: "Upload Your Photo",
    desc: "Drop in any image — JPG, PNG, RAW. Any resolution. Our AI handles the rest.",
  },
  {
    n: "02", icon: Zap, color: "text-[#FFFF00]", bg: "bg-[#FFFF00]/10 border-[#FFFF00]/20",
    title: "AI Enhances in Seconds",
    desc: "Choose your enhancement mode. Our model reconstructs textures, sharpness, and detail from scratch.",
  },
  {
    n: "03", icon: Download, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20",
    title: "Download in 8K",
    desc: "Export in full 8K resolution. Lossless quality. Ready for print, post-production, or publishing.",
  },
]

function HowItWorks() {
  return (
    <section className="py-24 bg-[#030303]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
        >
          <SectionHead chip="How It Works" title="Simple Process." accent="Stunning Results." sub="From upload to 8K output — in under 90 seconds." align="center" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-16 left-[17%] right-[17%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.12 }}
              className="relative p-8 rounded-2xl bg-[#0c0c0c] border border-white/8 text-center flex flex-col items-center"
            >
              <div className={cn("w-16 h-16 rounded-xl border flex items-center justify-center mb-6", s.bg)}>
                <s.icon className={cn("w-7 h-7", s.color)} />
              </div>
              <div className={cn("text-xs font-black mb-3 tracking-[0.2em]", s.color)}>{s.n}</div>
              <h3 className="text-white font-bold text-xl mb-3">{s.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. UPSCALER DEEP DIVE
// ═══════════════════════════════════════════════════════════════════════════════
function UpscalerSection() {
  const SPECS = [
    { label: "4K Output", sub: "3840 × 2160px", credits: "80 cr" },
    { label: "8K Output", sub: "7680 × 4320px", credits: "120 cr" },
  ]
  return (
    <section className="py-24 bg-[#060606]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: comparison slider in portrait container */}
          <motion.div
            initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="relative rounded-2xl overflow-hidden border border-white/8"
            style={{ aspectRatio: "4/5" }}
          >
            <ComparisonSlider before={IMG.bm1b} after={IMG.bm1a} beforeAlt="Low-res original" afterAlt="8K AI upscaled" speed={0.06} />
          </motion.div>

          {/* Right: info */}
          <motion.div
            initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8 }}
          >
            <Chip icon={<Maximize2 className="w-3 h-3" />}>Smart Upscaler</Chip>
            <h2 className="font-black text-[clamp(2.4rem,4.5vw,4rem)] leading-[0.88] text-white mt-5 mb-5">
              Not Scaled.<br /><span className="text-[#FFFF00]">Reconstructed.</span>
            </h2>
            <p className="text-white/50 text-lg mb-8 leading-relaxed">
              Our AI doesn't just enlarge — it synthesizes new detail. Trained on millions of reference textures, every pixel is rebuilt with photo-realistic precision.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {SPECS.map((s, i) => (
                <div key={i} className="p-5 rounded-xl bg-[#0f0f0f] border border-white/8">
                  <div className="text-xl font-black text-white mb-1">{s.label}</div>
                  <div className="text-white/45 text-xs mb-3">{s.sub}</div>
                  <div className="text-[#FFFF00] text-xs font-bold">{s.credits}</div>
                </div>
              ))}
            </div>

            {/* Resolution comparison chips */}
            <div className="flex items-center gap-3 mb-8">
              {[
                { res: "1080p", color: "text-white/40", bg: "bg-white/5 border-white/8" },
                { res: "→", color: "text-white/25", bg: "" },
                { res: "4K", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                { res: "→", color: "text-white/25", bg: "" },
                { res: "8K", color: "text-[#FFFF00]", bg: "bg-[#FFFF00]/10 border-[#FFFF00]/20" },
              ].map((r, i) => r.bg ? (
                <span key={i} className={cn("px-4 py-2 rounded-lg border text-sm font-bold", r.bg, r.color)}>{r.res}</span>
              ) : (
                <span key={i} className={cn("text-sm font-bold", r.color)}>{r.res}</span>
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

// ═══════════════════════════════════════════════════════════════════════════════
// 8. USE CASES — 4 audience cards
// ═══════════════════════════════════════════════════════════════════════════════
const USECASES = [
  {
    icon: Camera, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
    title: "Photographers",
    desc: "Deliver gallery-quality prints in 8K. Rescue old or blurry shots. Enhance skin for portrait sessions automatically.",
    points: ["Batch upscale entire shoots", "Non-destructive AI editing", "RAW & JPEG support"],
    stat: "Up to 8K output",
  },
  {
    icon: Users, color: "text-[#FFFF00]", bg: "bg-[#FFFF00]/10 border-[#FFFF00]/20",
    title: "Content Creators",
    desc: "Produce studio-quality thumbnails, posters, and social assets in seconds. No Photoshop skills required.",
    points: ["Thumbnail optimization", "AI portrait retouching", "Video frame enhancement"],
    stat: "50+ AI models",
  },
  {
    icon: Building2, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
    title: "Studios & Agencies",
    desc: "Scale AI post-production across your entire team. Enterprise credits, priority processing, and API access.",
    points: ["Team workspaces", "Priority queue access", "Custom API integration"],
    stat: "Enterprise ready",
  },
  {
    icon: Globe, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20",
    title: "Brands & Commerce",
    desc: "Transform product photos into campaign-ready visuals. Consistent, high-resolution imagery for every channel.",
    points: ["Product photo upscaling", "Batch processing", "Commercial license"],
    stat: "Commercial use",
  },
]

function UseCases() {
  return (
    <section className="py-24 bg-[#030303]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
        >
          <SectionHead chip="Built For You" title="Who Uses" accent="Sharpii.ai" sub="From solo creators to enterprise studios — our platform scales to every workflow." align="center" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {USECASES.map((u, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-7 rounded-2xl bg-[#0c0c0c] border border-white/8 flex flex-col group hover:border-white/16 transition-colors"
            >
              <div className={cn("w-14 h-14 rounded-xl border flex items-center justify-center mb-6", u.bg)}>
                <u.icon className={cn("w-6 h-6", u.color)} />
              </div>
              <div className={cn("text-xs font-black mb-3 uppercase tracking-widest", u.color)}>{u.stat}</div>
              <h3 className="text-white font-bold text-xl mb-3">{u.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed mb-6">{u.desc}</p>
              <ul className="space-y-2 mt-auto">
                {u.points.map((p, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-white/55">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />{p}
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

// ═══════════════════════════════════════════════════════════════════════════════
// 9. SKIN EDITOR PRO CONTROL — refined, no duplicate rendering
// ═══════════════════════════════════════════════════════════════════════════════
function SkinEditorSection() {
  const [activeMode, setActiveMode] = useState(1)
  const [zones, setZones] = useState<number[]>([0, 1])
  const [sliders, setSliders] = useState({ texture: 68, detail: 45, depth: 72 })

  const MODES = ["Natural", "Smooth", "Detailed"]
  const ZONES = ["Face", "Skin", "Eyes", "Mouth", "Neck", "Hair"]

  const CONTROLS = [
    { key: "texture" as const, label: "Texture Strength", color: "#FFFF00", track: "#3a3a00" },
    { key: "detail"  as const, label: "Micro Detail",     color: "#60a5fa", track: "#0c1a2e" },
    { key: "depth"   as const, label: "Pore Depth",        color: "#c084fc", track: "#1e0a3a" },
  ]

  return (
    <section className="py-24 bg-[#060606]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
        >
          <SectionHead chip="Skin Editor" title="Professional Grade" accent="Control." sub="Precision skin enhancement with real-time preview. Adjust every parameter before committing." />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.9 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4"
        >
          {/* Left: live preview — portrait container */}
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]" style={{ minHeight: 580 }}>
            <Image src={IMG.bm1a} alt="Skin editor live preview" fill className="object-cover object-top" sizes="700px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* Top labels */}
            <div className="absolute top-5 left-5 flex items-center gap-2 z-10">
              <span className="bg-black/70 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-lg text-xs font-bold text-white/70 uppercase tracking-widest inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />Live Preview
              </span>
            </div>
            <div className="absolute top-5 right-5 z-10">
              <span className="bg-[#FFFF00]/90 px-3 py-1.5 rounded-lg text-xs font-black text-black uppercase tracking-widest">AI Active</span>
            </div>
          </div>

          {/* Right: controls */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#0d0d10] p-6 flex-1">
              <h4 className="text-white font-bold text-lg mb-1">Enhancement Parameters</h4>
              <p className="text-white/35 text-xs mb-6">Fine-tune every aspect of the AI enhancement in real time.</p>

              {/* Enhancement Mode */}
              <div className="mb-6">
                <label className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3 block">Enhancement Mode</label>
                <div className="flex gap-2">
                  {MODES.map((m, i) => (
                    <button key={i}
                      onClick={() => setActiveMode(i)}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all",
                        activeMode === i
                          ? "bg-[#FFFF00] text-black"
                          : "bg-white/6 text-white/50 hover:bg-white/10"
                      )}
                    >{m}</button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-5 mb-6">
                {CONTROLS.map((c) => (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white/60 text-xs font-semibold">{c.label}</label>
                      <span className="text-xs font-black" style={{ color: c.color }}>{sliders[c.key]}%</span>
                    </div>
                    <div className="relative h-1.5 rounded-full" style={{ background: c.track }}>
                      <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${sliders[c.key]}%`, background: c.color }} />
                      <input
                        type="range" min={0} max={100} value={sliders[c.key]}
                        onChange={e => setSliders(s => ({ ...s, [c.key]: +e.target.value }))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Target Zones */}
              <div className="mb-6">
                <label className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3 block">Target Zones</label>
                <div className="flex flex-wrap gap-2">
                  {ZONES.map((z, i) => (
                    <button key={i}
                      onClick={() => setZones(v => v.includes(i) ? v.filter(x => x !== i) : [...v, i])}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
                        zones.includes(i)
                          ? "bg-white/10 border-[#FFFF00]/60 text-[#FFFF00]"
                          : "bg-transparent border-white/12 text-white/40 hover:border-white/25"
                      )}
                    >{z}</button>
                  ))}
                </div>
              </div>

              <Link href="/app/skineditor">
                <button className="w-full bg-[#FFFF00] text-black font-bold h-12 rounded-xl text-sm inline-flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(255,255,0,0.35)] transition-all">
                  Apply Enhancement <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { v: "99.1%", l: "Quality Score" },
                { v: "<90s",  l: "Processing" },
                { v: "8K",    l: "Max Output" },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#0d0d10] border border-white/8 text-center">
                  <div className="text-[#FFFF00] font-black text-xl">{s.v}</div>
                  <div className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. MODEL SHOWCASE
// ═══════════════════════════════════════════════════════════════════════════════
const MODELS = [
  { name: "Flux Pro",        cat: "Generate",  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/15" },
  { name: "Midjourney V7",   cat: "Generate",  color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/15" },
  { name: "DALL·E 3",        cat: "Generate",  color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/15" },
  { name: "Stable Diffusion",cat: "Generate",  color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/15" },
  { name: "Kling 3.0",       cat: "Video",     color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/15" },
  { name: "Runway Gen-4",    cat: "Video",     color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/15" },
  { name: "Sora",            cat: "Video",     color: "text-green-400",  bg: "bg-green-500/10 border-green-500/15" },
  { name: "Higgsfield",      cat: "Video",     color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/15" },
  { name: "Real-ESRGAN",     cat: "Upscale",   color: "text-[#FFFF00]",  bg: "bg-[#FFFF00]/10 border-[#FFFF00]/15" },
  { name: "4xUltraSharp",    cat: "Upscale",   color: "text-[#FFFF00]",  bg: "bg-[#FFFF00]/10 border-[#FFFF00]/15" },
  { name: "GPT-Image-1",     cat: "Edit",      color: "text-teal-400",   bg: "bg-teal-500/10 border-teal-500/15" },
  { name: "Gemini Imagen",   cat: "Generate",  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/15" },
]

const CAT_COLORS: Record<string, string> = {
  "Generate": "text-blue-400",
  "Video":    "text-violet-400",
  "Upscale":  "text-[#FFFF00]",
  "Edit":     "text-teal-400",
}

function ModelShowcase() {
  return (
    <section className="py-24 bg-[#060606]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
        >
          <SectionHead chip="AI Models" title="50+ Models." accent="One Platform." sub="The world's best AI models — unified into one seamless experience. Switch models instantly." align="center" />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {MODELS.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }}
              className={cn("p-4 rounded-xl border text-center group hover:scale-105 transition-all duration-300", m.bg)}
            >
              <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", CAT_COLORS[m.cat])}>{m.cat}</div>
              <div className="text-white font-bold text-sm">{m.name}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-white/35 text-sm mb-5">And 38+ more models across all categories</p>
          <Link href="/app/image">
            <button className="border border-white/15 text-white font-semibold h-12 px-8 rounded-xl text-sm bg-white/4 hover:bg-white/8 transition-all inline-flex items-center gap-2">
              Browse All Models <ArrowRight className="w-4 h-4 text-white/50" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. IMAGE GENERATION GALLERY — portrait containers, 5-col mosaic
// ═══════════════════════════════════════════════════════════════════════════════
const PROMPTS = [
  "A photorealistic portrait of a woman, golden hour lighting, 8K",
  "Dramatic cinematic headshot, studio lighting, ultra-detailed",
  "Editorial fashion portrait, clean background, natural light",
  "Black and white portrait, deep shadows, high contrast film",
  "Close-up face study, skin texture detail, professional lighting",
]

function ImageGenSection() {
  const [activePrompt, setActivePrompt] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActivePrompt(p => (p + 1) % PROMPTS.length), 3500)
    return () => clearInterval(t)
  }, [])

  // 5 equal portrait tiles — flex row, each aspect-[3/4], no empty gaps
  const GALLERY = [
    { src: IMG.g1a,  label: "Natural Portrait" },
    { src: IMG.g2b,  label: "Fashion Shot" },
    { src: IMG.bm1a, label: "Studio Portrait" },
    { src: IMG.asian,label: "Editorial" },
    { src: IMG.g1b,  label: "Outdoor" },
  ]

  return (
    <section className="py-24 bg-[#030303]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12"
        >
          <SectionHead chip="Image Generation" title="Imagine Worlds." accent="Create Realities." sub="Generate studio-quality portraits with 50+ AI models." />

          <div className="lg:max-w-sm pb-16 space-y-4">
            <div className="p-4 rounded-xl bg-[#0f0f0f] border border-white/8">
              <div className="text-white/35 text-[10px] font-bold uppercase tracking-widest mb-2">Sample Prompt</div>
              <AnimatePresence mode="wait">
                <motion.p key={activePrompt}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="text-white/75 text-sm leading-relaxed italic"
                >
                  &ldquo;{PROMPTS[activePrompt]}&rdquo;
                </motion.p>
              </AnimatePresence>
            </div>
            <Link href="/app/image">
              <button className="w-full bg-[#FFFF00] text-black font-bold h-12 rounded-xl text-sm inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                Generate Now <Sparkles className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Portrait gallery — 5 equal tiles, each maintains aspect-[3/4] naturally */}
        <div className="flex gap-3">
          {GALLERY.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.07 }}
              className="relative flex-1 rounded-xl overflow-hidden border border-white/8 bg-neutral-900 group"
              style={{ aspectRatio: "3/4" }}
            >
              <Image src={g.src} alt={g.label} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px) 50vw, 20vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-xs font-bold text-white">{g.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 12. CREATOR SHOWCASE — "Made with Sharpii"
// ═══════════════════════════════════════════════════════════════════════════════
const SHOWCASE_ITEMS = [
  { src: IMG.g1a,  size: "tall",   label: "Portrait Enhancement",  user: "@sarah.k" },
  { src: IMG.bm1a, size: "wide",   label: "Skin Retouching",        user: "@marcus_photo" },
  { src: IMG.asian,size: "normal", label: "AI Generation",          user: "@aiartist" },
  { src: IMG.g2b,  size: "tall",   label: "Photo Restoration",      user: "@vintageshots" },
  { src: IMG.g1b,  size: "normal", label: "Editorial Shot",         user: "@creativestudio" },
  { src: IMG.bm1b, size: "wide",   label: "8K Upscaling",           user: "@printmaster" },
]

function CreatorShowcase() {
  return (
    <section className="py-24 bg-[#060606]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="flex items-end justify-between mb-12"
        >
          <SectionHead chip="Community" title="Made with" accent="Sharpii.ai" sub="Real outputs from real creators — no filters, no retouching beyond our AI." />
          <Link href="/app/dashboard" className="pb-16 hidden lg:block">
            <button className="border border-white/15 text-white font-semibold h-12 px-7 rounded-xl text-sm bg-white/4 hover:bg-white/8 transition-all inline-flex items-center gap-2">
              Start Creating <ArrowRight className="w-4 h-4 text-white/50" />
            </button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {SHOWCASE_ITEMS.map((item, i) => {
            const h = item.size === "tall" ? 400 : item.size === "wide" ? 200 : 300
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
                className={cn("relative rounded-xl overflow-hidden border border-white/8 bg-neutral-900 group",
                  item.size === "tall" ? "row-span-2" : ""
                )}
                style={{ height: h }}
              >
                <Image src={item.src} alt={item.label} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="250px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-xs font-bold text-white">{item.label}</div>
                  <div className="text-[10px] text-white/45 mt-0.5">{item.user}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 13. STATS STRIP — bold numbers, readable
// ═══════════════════════════════════════════════════════════════════════════════
const STATS = [
  { n: "8K",   l: "Max Output",    sub: "7680 × 4320px" },
  { n: "50+",  l: "AI Models",     sub: "Across all tools" },
  { n: "99.1%",l: "Quality Score", sub: "User satisfaction" },
  { n: "20×",  l: "Faster",        sub: "vs manual editing" },
]

function StatsStrip() {
  return (
    <section className="py-20 bg-[#030303] border-y border-white/6">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/6 rounded-2xl overflow-hidden">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-[#030303] p-10 text-center"
            >
              <div className="font-black text-[clamp(3rem,5vw,4.5rem)] text-[#FFFF00] leading-none mb-3">{s.n}</div>
              <div className="text-white font-bold text-base mb-1">{s.l}</div>
              <div className="text-white/35 text-xs uppercase tracking-widest">{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 14. TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════════════════
const TESTIMONIALS = [
  {
    quote: "Sharpii.ai completely changed how I deliver portrait sessions. My clients can't believe the detail — they think I upgraded my camera.",
    name: "Sarah Kim", role: "Portrait Photographer", rating: 5,
  },
  {
    quote: "I used to spend 2 hours per video retouching in Premiere. Now I process an entire batch in Sharpii in 10 minutes. Game-changer.",
    name: "Marcus Johnson", role: "Content Creator, 2.1M followers", rating: 5,
  },
  {
    quote: "The skin editor is the most sophisticated AI retouching tool I've ever used. The control over micro-detail is just unreal.",
    name: "Priya Mehta", role: "Creative Director, Studio 44", rating: 5,
  },
]

function Testimonials() {
  return (
    <section className="py-24 bg-[#060606]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
        >
          <SectionHead chip="Testimonials" title="Trusted By" accent="Thousands." sub="From individual creators to enterprise studios worldwide." align="center" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-[#0c0c0c] border border-white/8 flex flex-col"
            >
              <div className="flex gap-0.5 mb-6">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#FFFF00] text-[#FFFF00]" />
                ))}
              </div>
              <p className="text-white/70 text-base leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div className="text-white font-bold text-sm">{t.name}</div>
                <div className="text-white/40 text-xs mt-0.5">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 15. PRICING WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════
function PricingWrapper() {
  return (
    <section id="pricing" className="py-24 bg-[#030303]">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
        >
          <SectionHead chip="Pricing Plans" title="Start Free." accent="Scale Fearlessly." sub="Credits work across every tool. No feature gates. No surprises. Cancel anytime." align="center" />
        </motion.div>
        <MyPricingPlans2 />
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Home2Page() {
  return (
    <div className="min-h-screen bg-black text-white">
      <NavigationHero4 />
      <Hero />
      <Ticker />
      <BentoFeatures />
      <BeforeAfterStrip />
      <VideoGenSection />
      <HowItWorks />
      <UpscalerSection />
      <UseCases />
      <SkinEditorSection />
      <ModelShowcase />
      <ImageGenSection />
      <CreatorShowcase />
      <StatsStrip />
      <Testimonials />
      <PricingWrapper />
      <FAQSection />
      <Footer />
    </div>
  )
}
