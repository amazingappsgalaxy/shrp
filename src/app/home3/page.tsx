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
import { ArrowRight, ChevronLeft, ChevronRight, Star, Sparkles, Zap } from "lucide-react"

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
  motion:       "https://static.higgsfield.ai/explore/motion-transfer.mp4",
  motionT:      "https://static.higgsfield.ai/explore/motion-transfer.webp",
  editVideo:    "https://static.higgsfield.ai/explore/edit-video.mp4",
  editVideoT:   "https://static.higgsfield.ai/explore/edit-video.webp",
  upscale:      "https://static.higgsfield.ai/explore/upscale.mp4",
  upscaleT:     "https://static.higgsfield.ai/explore/upscale.webp",
  aiInfluencer: "https://static.higgsfield.ai/explore/ai-influencer.mp4",
  aiInfluencerT:"https://static.higgsfield.ai/explore/ai-influencer.webp",
  soulCin:      "https://static.higgsfield.ai/explore/soul-cinematic.mp4",
  soulCinT:     "https://static.higgsfield.ai/explore/soul-cinematic.webp",
  nanoModel:    "https://static.higgsfield.ai/explore/nano-model.mp4",
  nanoModelT:   "https://static.higgsfield.ai/explore/nano-model.webp",
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function AutoVid({ src, poster, className = "" }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => { ref.current?.play().catch(() => {}) }, [])
  return (
    <video ref={ref} src={src} poster={poster} muted loop playsInline
      className={cn("w-full h-full object-cover", className)} />
  )
}

function useSlider(init = 50, min = 15, max = 85, speed = 0.04) {
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
  before, after, beforeAlt = "Before", afterAlt = "After", speed = 0.04
}: {
  before: string; after: string; beforeAlt?: string; afterAlt?: string; speed?: number
}) {
  const { pos, cur, setPos, setPaused } = useSlider(50, 15, 85, speed)
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((cx: number) => {
    if (!ref.current) return
    const { left, width } = ref.current.getBoundingClientRect()
    const p = Math.min(85, Math.max(15, ((cx - left) / width) * 100))
    cur.current = p; setPos(p)
  }, [cur, setPos])

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden select-none"
      style={{ cursor: "ew-resize" }}
      onPointerDown={e => { setPaused(true); e.currentTarget.setPointerCapture(e.pointerId); onMove(e.clientX) }}
      onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) onMove(e.clientX) }}
      onPointerUp={e => { e.currentTarget.releasePointerCapture(e.pointerId); setPaused(false) }}
      onPointerLeave={() => setPaused(false)}
    >
      {/* BEFORE — full size always */}
      <div className="absolute inset-0">
        <Image src={before} alt={beforeAlt} fill sizes="100vw" className="object-cover object-center" priority />
      </div>
      {/* AFTER — clipPath, no scaling */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={after} alt={afterAlt} fill sizes="100vw" className="object-cover object-center" priority />
      </div>
      {/* Glowing divider line */}
      <div className="absolute top-0 bottom-0 pointer-events-none z-20"
        style={{ left: `${pos}%`, transform: "translateX(-50%)", width: 2, background: "white", boxShadow: "0 0 16px 4px rgba(255,255,255,0.6), 0 0 60px rgba(255,255,255,0.2)" }} />
      {/* Handle */}
      <div className="absolute z-30 pointer-events-none flex items-center justify-center"
        style={{ left: `${pos}%`, top: "50%", transform: "translate(-50%,-50%)", width: 68, height: 68, borderRadius: "50%", background: "white", boxShadow: "0 0 0 4px rgba(255,255,255,0.25), 0 8px 40px rgba(0,0,0,0.8)" }}>
        <ChevronLeft className="w-4 h-4 text-black absolute" style={{ left: 9 }} />
        <ChevronRight className="w-4 h-4 text-black absolute" style={{ right: 9 }} />
      </div>
      {/* Labels */}
      <div className="absolute top-6 left-6 z-30 pointer-events-none">
        <span className="bg-black/55 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/65 text-[10px] font-bold uppercase tracking-[0.2em]">
          {beforeAlt}
        </span>
      </div>
      <div className="absolute top-6 right-6 z-30 pointer-events-none">
        <span className="bg-[#FFFF00] px-3 py-1.5 rounded-full text-black text-[10px] font-black uppercase tracking-[0.2em]">
          {afterAlt}
        </span>
      </div>
    </div>
  )
}

// ─── 1. HERO ──────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative w-full bg-black overflow-hidden" style={{ height: "100svh", minHeight: 640 }}>
      {/* Full-screen comparison slider */}
      <div className="absolute inset-0">
        <ComparisonSlider before={IMG.g1b} after={IMG.g1a} beforeAlt="Before" afterAlt="After AI" speed={0.038} />
      </div>

      {/* Top-left badge */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute top-24 left-8 lg:left-14 z-40 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-lg border border-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">AI-Powered Visual Enhancement</span>
        </div>
      </motion.div>

      {/* Bottom content — gradient + text */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)", padding: "0 32px 52px" }}>
        <div className="pointer-events-auto max-w-[1440px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <h1 className="font-black text-white leading-[0.80] tracking-tight" style={{ fontSize: "clamp(4.5rem,11vw,12rem)", textShadow: "0 4px 40px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)" }}>
                MAKE IT<br /><span className="text-[#FFFF00]">SHARP.</span>
              </h1>
              <p className="text-white/50 text-lg mt-5 max-w-md font-medium leading-relaxed">
                AI portrait enhancement, skin editing &amp; image generation. Up to 8K resolution.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pb-1 shrink-0">
              <Link href="/signup"
                className="inline-flex items-center gap-2.5 bg-[#FFFF00] px-8 py-4 rounded-xl text-black font-black text-[15px] hover:bg-white transition-colors duration-200">
                Start for Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/app"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md px-8 py-4 rounded-xl text-white font-bold text-[15px] border border-white/20 hover:bg-white/18 transition-colors duration-200">
                See All Tools
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── 2. TICKER ────────────────────────────────────────────────────────────────
function Ticker() {
  const items = ["Smart Upscaler", "8K Output", "50+ AI Models", "Skin Editor", "Video Generation", "Instant Results", "Image Editing", "Professional Grade", "Batch Processing", "RAW Support"]
  const all = [...items, ...items]
  return (
    <div className="bg-[#FFFF00] overflow-hidden py-[14px] border-y border-[#e6e600]">
      <motion.div className="flex w-max gap-10 items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
        {all.map((t, i) => (
          <span key={i} className="text-black font-black text-[13px] uppercase tracking-[0.14em] whitespace-nowrap flex items-center gap-4">
            {t}
            <span className="w-1 h-1 rounded-full bg-black/25 flex-shrink-0" />
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ─── 3. UPSCALER SECTION ──────────────────────────────────────────────────────
function UpscalerSection() {
  return (
    <section className="bg-[#07070b]">
      {/* Header */}
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 pt-24 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">01 / Smart Upscaler</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3.2rem,7vw,8rem)" }}>
              NOT SCALED.<br /><span className="text-[#FFFF00]">REBUILT.</span>
            </h2>
          </div>
          <p className="text-white/35 text-[15px] max-w-[320px] lg:text-right lg:pb-2 leading-relaxed">
            AI synthesizes new detail from scratch — skin texture, hair strands, micro-contrast. Zero upscaling artifacts.
          </p>
        </div>
      </div>

      {/* FULL-WIDTH comparison — 73vh, no side padding, no border radius */}
      <div className="relative w-full" style={{ height: "73vh", minHeight: 500 }}>
        <ComparisonSlider before={IMG.bm1b} after={IMG.bm1a} beforeAlt="Original 2MP" afterAlt="AI 8K" speed={0.02} />
      </div>

      {/* Stats + CTA */}
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="grid grid-cols-3 gap-0 divide-x divide-white/8">
            {[
              { n: "4K", d: "Standard", s: "4096 × 4096px" },
              { n: "8K", d: "Pro Output", s: "7680 × 4320px" },
              { n: "~90s", d: "Processing", s: "Per image" },
            ].map(({ n, d, s }) => (
              <div key={d} className="px-8 first:pl-0 last:pr-0">
                <div className="text-[#FFFF00] font-black" style={{ fontSize: "clamp(2.4rem,4vw,4.5rem)", lineHeight: 1 }}>{n}</div>
                <div className="text-white font-bold text-sm mt-2">{d}</div>
                <div className="text-white/30 text-xs mt-0.5">{s}</div>
              </div>
            ))}
          </div>
          <Link href="/app/upscaler"
            className="inline-flex items-center gap-2.5 bg-[#FFFF00] px-8 py-4 rounded-xl text-black font-black text-[15px] hover:bg-white transition-colors duration-200 shrink-0">
            Try Upscaler <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── 4. VIDEO SECTION ─────────────────────────────────────────────────────────
function VideoSection() {
  return (
    <section className="bg-black pt-24 pb-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">02 / Video Suite</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3.2rem,8vw,9.5rem)" }}>
              GENERATE<br /><span className="text-violet-400">VIDEOS.</span>
            </h2>
          </div>
          <div className="max-w-[300px] lg:pb-3">
            <p className="text-white/35 text-[15px] mb-6 leading-relaxed">11 AI video tools. Create, sync lips, transfer motion, edit — one subscription.</p>
            <Link href="/app/video"
              className="inline-flex items-center gap-2 border border-white/18 px-6 py-3 rounded-xl text-white/70 font-bold text-sm hover:bg-white/8 transition-colors duration-200">
              Explore Video Tools <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* MASSIVE 21:9 hero video */}
        <div className="relative rounded-2xl overflow-hidden mb-5" style={{ aspectRatio: "21/9" }}>
          <AutoVid src={VID.soul2} poster={VID.soul2T} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-8">
            <span className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/55 text-[10px] font-bold uppercase tracking-widest">Soul Cinematic Mode</span>
          </div>
          <div className="absolute top-6 right-6">
            <span className="bg-violet-500/20 backdrop-blur-sm border border-violet-400/30 px-3 py-1.5 rounded-full text-violet-300 text-[10px] font-bold uppercase tracking-widest">AI Generated</span>
          </div>
        </div>

        {/* 4-column 16:9 feature cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { src: VID.createVideo, poster: VID.createVideoT, name: "AI Video Generation", tag: "CREATE", accent: "#a78bfa" },
            { src: VID.lipsync, poster: VID.lipsyncT, name: "Lip Sync Studio", tag: "SYNC", accent: "#f472b6" },
            { src: VID.motion, poster: VID.motionT, name: "Motion Transfer", tag: "MOTION", accent: "#22d3ee" },
            { src: VID.editVideo, poster: VID.editVideoT, name: "AI Video Editor", tag: "EDIT", accent: "#818cf8" },
          ].map(v => (
            <div key={v.name} className="rounded-xl overflow-hidden group relative"
              style={{ borderTop: `2px solid ${v.accent}88` }}>
              <div style={{ aspectRatio: "16/9" }} className="overflow-hidden">
                <AutoVid src={v.src} poster={v.poster} className="group-hover:scale-105 transition-transform duration-700" />
              </div>
              {/* Always-visible label overlay */}
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 py-3"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)" }}>
                <p className="text-white text-[13px] font-bold">{v.name}</p>
                <span className="text-[10px] font-black tracking-widest" style={{ color: v.accent }}>{v.tag}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Scrolling strip */}
        <div className="overflow-hidden rounded-xl">
          <motion.div className="flex gap-3 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 44, repeat: Infinity, ease: "linear" }}>
            {[
              { src: VID.aiInfluencer, poster: VID.aiInfluencerT, name: "AI Influencer" },
              { src: VID.soulCin, poster: VID.soulCinT, name: "Cinematic Mode" },
              { src: VID.upscale, poster: VID.upscaleT, name: "Video Upscaling" },
              { src: VID.nanoModel, poster: VID.nanoModelT, name: "Nano Model" },
              { src: VID.aiInfluencer, poster: VID.aiInfluencerT, name: "AI Influencer" },
              { src: VID.soulCin, poster: VID.soulCinT, name: "Cinematic Mode" },
              { src: VID.upscale, poster: VID.upscaleT, name: "Video Upscaling" },
              { src: VID.nanoModel, poster: VID.nanoModelT, name: "Nano Model" },
            ].map((v, i) => (
              <div key={i} className="flex-shrink-0 relative rounded-xl overflow-hidden" style={{ width: 290, height: 165 }}>
                <AutoVid src={v.src} poster={v.poster} />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/80 to-transparent">
                  <span className="text-white/65 text-xs font-bold">{v.name}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── 5. SKIN EDITOR — FULL-HEIGHT SPLIT SCREEN ───────────────────────────────
function SkinEditorSection() {
  return (
    <section className="bg-[#0c0016] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: "88vh" }}>
        {/* LEFT: Portrait — CSS background-image for guaranteed rendering */}
        <div className="relative order-2 lg:order-1 overflow-hidden"
          style={{
            minHeight: 640,
            backgroundImage: `url(${IMG.asian})`,
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
          }}>
          {/* Right-side fade into the dark bg — desktop */}
          <div className="absolute inset-0 hidden lg:block"
            style={{ background: "linear-gradient(to right, transparent 65%, #0c0016 100%)" }} />
          {/* Bottom fade — mobile */}
          <div className="absolute inset-0 lg:hidden"
            style={{ background: "linear-gradient(to bottom, transparent 60%, #0c0016 100%)" }} />
        </div>

        {/* RIGHT: Controls */}
        <div className="flex flex-col justify-center px-8 lg:pl-4 lg:pr-14 py-16 order-1 lg:order-2 relative z-10">
          <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">03 / Skin Editor</p>
          <h2 className="font-black text-white leading-[0.82] mb-6" style={{ fontSize: "clamp(2.8rem,5vw,5.8rem)" }}>
            PIXEL-PERFECT<br /><span className="text-amber-400">CONTROL.</span>
          </h2>
          <p className="text-white/40 text-[15px] mb-10 max-w-[360px] leading-relaxed">
            Granular AI retouching. Adjust skin texture, smoothing, fine detail and color — every slider responds in real time.
          </p>

          {/* Sliders UI */}
          <div className="space-y-5 mb-10 max-w-[380px]">
            {[
              { label: "Texture Strength", value: 78 },
              { label: "Skin Smoothing", value: 42 },
              { label: "Fine Detail Recovery", value: 91 },
              { label: "Color Precision", value: 67 },
            ].map(c => (
              <div key={c.label}>
                <div className="flex justify-between mb-2">
                  <span className="text-white/60 text-[13px] font-medium">{c.label}</span>
                  <span className="text-white/30 text-[13px] font-mono">{c.value}</span>
                </div>
                <div className="h-[3px] bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${c.value}%`, background: "linear-gradient(to right, #f59e0b88, #f59e0b)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Mode pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {["Natural", "Glam", "Editorial", "Cinematic", "Raw"].map((m, i) => (
              <span key={m}
                className={cn("px-4 py-2 rounded-full text-[13px] font-bold transition-colors cursor-pointer",
                  i === 1 ? "bg-amber-400 text-black" : "bg-white/[0.07] text-white/45 hover:bg-white/[0.12]")}>
                {m}
              </span>
            ))}
          </div>

          <Link href="/app/skineditor"
            className="inline-flex items-center gap-2.5 bg-[#FFFF00] px-8 py-4 rounded-xl text-black font-black text-[15px] self-start hover:bg-white transition-colors duration-200 mb-14">
            Open Skin Editor <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-0 divide-x divide-white/8 pt-10 border-t border-white/8 max-w-[380px]">
            {[["99.1%", "Quality Score"], ["~90s", "Avg. Speed"], ["8K", "Max Output"]].map(([n, l]) => (
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

// ─── 6. IMAGE GEN — STAGGERED MASONRY GALLERY ─────────────────────────────────
function ImageGenSection() {
  // Staggered heights — bottom-aligned for dramatic effect
  const GALLERY = [
    { src: IMG.g1a,  alt: "Natural Portrait",  style: "Editorial",    h: 580 },
    { src: IMG.g2b,  alt: "Fashion Shot",       style: "Commercial",   h: 440 },
    { src: IMG.bm1a, alt: "Studio Portrait",    style: "Professional", h: 610 },
    { src: IMG.asian,alt: "Beauty Shot",        style: "Artistic",     h: 470 },
    { src: IMG.g1b,  alt: "Natural Light",      style: "Lifestyle",    h: 540 },
  ]

  return (
    <section className="bg-[#0a0a0a] pt-24 pb-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">04 / Image Generation</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3.2rem,7vw,8rem)" }}>
              IMAGINE.<br /><span className="text-purple-400">CREATE.</span>
            </h2>
          </div>
          <div className="max-w-[300px] lg:pb-3">
            <p className="text-white/35 text-[15px] mb-6 leading-relaxed">
              Generate studio-quality portraits from text. 50+ styles — editorial, fashion, cinematic and more.
            </p>
            <Link href="/app/image"
              className="inline-flex items-center gap-2 bg-[#FFFF00] px-6 py-3 rounded-xl text-black font-black text-sm hover:bg-white transition-colors duration-200">
              Generate Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* STAGGERED GALLERY — items bottom-aligned — desktop only */}
        <div className="hidden lg:flex items-end gap-2">
          {GALLERY.map((item, i) => (
            <motion.div key={item.alt}
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.65, delay: i * 0.1 }}
              className="flex-1 relative overflow-hidden rounded-xl group cursor-pointer"
              style={{ height: item.h }}>
              <Image src={item.src} alt={item.alt} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-105" />
              {/* Always-on subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70" />
              {/* Hover info */}
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-1 group-hover:translate-y-0 opacity-70 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white text-sm font-bold">{item.alt}</p>
                <p className="text-white/45 text-xs mt-0.5 uppercase tracking-wide">{item.style}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: 2-col grid */}
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

// ─── 7. STATS — FULL YELLOW BREAK ─────────────────────────────────────────────
function StatsSection() {
  return (
    <section className="bg-[#FFFF00]">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28">
        <p className="text-black/35 text-[11px] font-black uppercase tracking-[0.35em] mb-14">BY THE NUMBERS</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-14 lg:gap-0 lg:divide-x lg:divide-black/10">
          {[
            { n: "8K", d: "Max Output",    s: "7680 × 4320px" },
            { n: "50+", d: "AI Models",    s: "Across all tools" },
            { n: "99.1%", d: "Quality",    s: "User satisfaction" },
            { n: "20×", d: "Faster",       s: "vs. manual editing" },
          ].map(({ n, d, s }) => (
            <div key={d} className="lg:px-12 first:lg:pl-0 last:lg:pr-0">
              <div className="font-black text-black leading-none" style={{ fontSize: "clamp(4.5rem,8.5vw,9.5rem)" }}>{n}</div>
              <div className="text-black font-bold text-xl mt-3">{d}</div>
              <div className="text-black/45 text-sm mt-1">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 8. HOW IT WORKS — LIGHT BACKGROUND (CONTRAST BREAK) ──────────────────────
function HowItWorksSection() {
  const steps = [
    { n: "01", title: "Upload Your Photo", desc: "Drop any portrait, RAW file, or batch folder. JPEG, PNG, RAW, TIFF — all accepted." },
    { n: "02", title: "AI Enhances in Seconds", desc: "Our models synthesize new detail, correct skin tone, sharpen edges — fully automated, nothing manual." },
    { n: "03", title: "Download in 8K", desc: "Get your image at up to 8K resolution, ready for print, web, or commercial use." },
  ]
  return (
    <section className="bg-[#f4f4f4]">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28">
        <div className="flex flex-col lg:flex-row lg:items-start gap-16">
          <div className="lg:sticky lg:top-24 shrink-0">
            <p className="text-black/30 text-[11px] font-black uppercase tracking-[0.35em] mb-5">05 / How It Works</p>
            <h2 className="font-black text-black leading-[0.82]" style={{ fontSize: "clamp(3rem,5vw,5.5rem)" }}>
              Simple<br />Process.
            </h2>
          </div>
          <div className="flex-1 max-w-xl">
            {steps.map((step, i) => (
              <motion.div key={step.n}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex gap-8 mb-12 last:mb-0">
                {/* Number */}
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
              <Link href="/signup"
                className="inline-flex items-center gap-2 bg-black px-7 py-3.5 rounded-xl text-white font-black text-sm hover:bg-black/80 transition-colors duration-200">
                Start for Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/app"
                className="inline-flex items-center gap-2 border border-black/15 px-7 py-3.5 rounded-xl text-black/70 font-bold text-sm hover:bg-black/5 transition-colors duration-200">
                View All Tools
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 9. TESTIMONIALS ──────────────────────────────────────────────────────────
function TestimonialsSection() {
  const REVIEWS = [
    { stars: 5, text: "Sharpii.ai changed how I deliver portrait sessions. My clients think I upgraded my camera. The 8K output is extraordinary.", name: "Sarah Kim", role: "Portrait Photographer", loc: "New York" },
    { stars: 5, text: "I used to spend 2 hours retouching per video. With Sharpii I process an entire batch in 10 minutes. Absolute game-changer.", name: "Marcus Johnson", role: "Content Creator", loc: "2.4m followers" },
    { stars: 5, text: "The skin editor is the most sophisticated AI retouching tool I've ever used. It actually understands skin tone and texture.", name: "Priya Mehta", role: "Creative Director", loc: "Studio 44" },
  ]
  return (
    <section className="bg-[#070707] pt-24 pb-16">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">06 / Reviews</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3rem,5.5vw,6.5rem)" }}>
              Trusted By<br /><span className="text-[#FFFF00]">Thousands.</span>
            </h2>
          </div>
          <Link href="/signup"
            className="inline-flex items-center gap-2 bg-[#FFFF00] px-8 py-4 rounded-xl text-black font-black text-[15px] hover:bg-white transition-colors duration-200 self-start lg:self-auto mb-2">
            Join Them <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {REVIEWS.map((r, i) => (
            <motion.div key={r.name}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/[0.035] border border-white/[0.055] rounded-2xl p-8 flex flex-col relative overflow-hidden">
              {/* Decorative large quote mark */}
              <div className="absolute top-4 right-6 text-[#FFFF00]/8 font-black leading-none select-none pointer-events-none"
                style={{ fontSize: "6rem", lineHeight: 1 }}>&ldquo;</div>
              <div className="flex gap-1 mb-5 relative z-10">
                {Array.from({ length: r.stars }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-[#FFFF00] fill-[#FFFF00]" />
                ))}
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

// ─── 10. PRICING ──────────────────────────────────────────────────────────────
function PricingSection() {
  return (
    <section className="bg-black pt-24 pb-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="text-center mb-16">
          <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">07 / Pricing</p>
          <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3rem,5.5vw,6.5rem)" }}>
            Start Free.<br /><span className="text-[#FFFF00]">Scale Fearlessly.</span>
          </h2>
          <p className="text-white/35 text-[15px] mt-5 max-w-md mx-auto">
            Credits work across every tool. No feature gates. Cancel anytime.
          </p>
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
      <NavigationHero4 />
      <Hero />
      <Ticker />
      <UpscalerSection />
      <VideoSection />
      <SkinEditorSection />
      <ImageGenSection />
      <StatsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  )
}
