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
  ArrowRight, ChevronLeft, ChevronRight, Star, Sparkles, Zap,
  Brush, Eraser, Square, Type, Layers, Mic, Music, Video,
  Camera, Wand2, ImageIcon, Upload, Download, Play, Pause,
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

// ─── STYLE OVERRIDES FOR ADAPTIVE NAV ─────────────────────────────────────────
function NavStyleOverride() {
  return (
    <style>{`
      html[data-nav-theme="light"] nav.glass-premium {
        background: rgba(8,8,8,0.97) !important;
        border-color: rgba(255,255,255,0.12) !important;
        box-shadow: 0 4px 32px rgba(0,0,0,0.5) !important;
        transition: background 0.35s ease, border-color 0.35s ease !important;
      }
      nav.glass-premium {
        transition: background 0.35s ease, border-color 0.35s ease !important;
      }
    `}</style>
  )
}

// ─── ADAPTIVE NAV CONTROLLER ──────────────────────────────────────────────────
function NavThemeController() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const lightSections = document.querySelectorAll("[data-nav-light]")
    const visible = new Set<Element>()

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) visible.add(e.target)
        else visible.delete(e.target)
      })
      document.documentElement.setAttribute(
        "data-nav-theme",
        visible.size > 0 ? "light" : "dark"
      )
    }, {
      threshold: 0,
      rootMargin: "-72px 0px -85% 0px",
    })

    lightSections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [])
  return null
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
      <div className="absolute inset-0">
        <Image src={before} alt={beforeAlt} fill sizes="100vw" className="object-cover object-center" priority />
      </div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={after} alt={afterAlt} fill sizes="100vw" className="object-cover object-center" priority />
      </div>
      {/* Glowing divider */}
      <div className="absolute top-0 bottom-0 pointer-events-none z-20"
        style={{ left: `${pos}%`, transform: "translateX(-50%)", width: 2, background: "white",
          boxShadow: "0 0 16px 4px rgba(255,255,255,0.6), 0 0 60px rgba(255,255,255,0.2)" }} />
      {/* Handle */}
      <div className="absolute z-30 pointer-events-none flex items-center justify-center"
        style={{ left: `${pos}%`, top: "50%", transform: "translate(-50%,-50%)", width: 68, height: 68,
          borderRadius: "50%", background: "white",
          boxShadow: "0 0 0 4px rgba(255,255,255,0.25), 0 8px 40px rgba(0,0,0,0.8)" }}>
        <ChevronLeft className="w-4 h-4 text-black absolute" style={{ left: 9 }} />
        <ChevronRight className="w-4 h-4 text-black absolute" style={{ right: 9 }} />
      </div>
      {/* Labels */}
      <div className="absolute top-5 left-5 z-30 pointer-events-none">
        <span className="bg-black/55 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/65 text-[10px] font-bold uppercase tracking-[0.2em]">{beforeAlt}</span>
      </div>
      <div className="absolute top-5 right-5 z-30 pointer-events-none">
        <span className="bg-[#FFFF00] px-3 py-1.5 rounded-full text-black text-[10px] font-black uppercase tracking-[0.2em]">{afterAlt}</span>
      </div>
    </div>
  )
}

// ─── 1. HERO ──────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative w-full bg-black overflow-hidden" style={{ height: "100svh", minHeight: 640 }}>
      {/* Full-screen comparison */}
      <div className="absolute inset-0">
        <ComparisonSlider before={IMG.g1b} after={IMG.g1a} beforeAlt="Before" afterAlt="After AI" speed={0.038} />
      </div>
      {/* Top gradient for nav readability */}
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none z-30"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, transparent 100%)" }} />
      {/* Badge */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute top-24 left-8 lg:left-14 z-40 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-lg border border-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse" />
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">AI-Powered Visual Enhancement</span>
        </div>
      </motion.div>
      {/* Bottom text */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)", padding: "0 32px 52px" }}>
        <div className="pointer-events-auto max-w-[1440px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <h1 className="font-black text-white leading-[0.80] tracking-tight"
                style={{ fontSize: "clamp(4.5rem,11vw,12rem)", textShadow: "0 4px 40px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)" }}>
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
  const items = ["Smart Upscaler", "8K Output", "50+ AI Models", "Skin Editor", "Video Generation",
    "Instant Results", "Image Editing", "Lip Sync", "Motion Transfer", "RAW Support", "Batch Processing"]
  const all = [...items, ...items]
  return (
    <div className="bg-[#FFFF00] overflow-hidden py-[14px] border-y border-[#e6e600]">
      <motion.div className="flex w-max gap-10 items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
        {all.map((t, i) => (
          <span key={i} className="text-black font-black text-[13px] uppercase tracking-[0.14em] whitespace-nowrap flex items-center gap-4">
            {t}<span className="w-1 h-1 rounded-full bg-black/25 flex-shrink-0" />
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ─── 3. UPSCALER — SPLIT LAYOUT ───────────────────────────────────────────────
function UpscalerSection() {
  return (
    <section className="bg-[#07070b] overflow-hidden">
      <div className="flex flex-col lg:flex-row" style={{ minHeight: "94vh" }}>
        {/* LEFT: Stats panel — 38% */}
        <div className="lg:w-[38%] flex flex-col justify-between px-8 lg:px-14 py-16 lg:py-24 border-r border-white/5">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-10">01 / Smart Upscaler</p>
            {/* GIANT 8K headline */}
            <div className="font-black text-[#FFFF00] leading-none mb-2"
              style={{ fontSize: "clamp(7rem,18vw,14rem)", letterSpacing: "-0.05em", lineHeight: 0.82 }}>
              8K
            </div>
            <div className="text-white/20 font-black text-2xl mb-8 uppercase tracking-wide">Resolution</div>
            <h2 className="font-black text-white leading-[0.88] mb-6" style={{ fontSize: "clamp(2rem,3.5vw,3.2rem)" }}>
              NOT SCALED.<br />REBUILT.
            </h2>
            <p className="text-white/35 text-[15px] max-w-[320px] leading-relaxed mb-12">
              AI synthesizes new detail from scratch — skin texture, hair strands, micro-contrast. Zero upscaling artifacts at any resolution.
            </p>
          </div>

          {/* Spec grid */}
          <div className="space-y-0 divide-y divide-white/6 mb-10">
            {[
              { label: "4K Output", value: "4096 × 4096 px", note: "80 credits" },
              { label: "8K Output", value: "7680 × 4320 px", note: "120 credits" },
              { label: "Processing", value: "~90 seconds", note: "per image" },
              { label: "Formats", value: "JPEG · PNG · WEBP", note: "RAW supported" },
            ].map(spec => (
              <div key={spec.label} className="flex items-center justify-between py-4">
                <span className="text-white/40 text-[13px] font-medium">{spec.label}</span>
                <div className="text-right">
                  <span className="text-white text-[13px] font-bold">{spec.value}</span>
                  <span className="text-white/25 text-[11px] ml-2">{spec.note}</span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/app/upscaler"
            className="inline-flex items-center gap-2.5 bg-[#FFFF00] px-8 py-4 rounded-xl text-black font-black text-[15px] hover:bg-white transition-colors duration-200 self-start">
            Try Upscaler Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* RIGHT: Comparison — portrait aspect, edge-to-edge */}
        <div className="lg:flex-1 relative" style={{ minHeight: 580 }}>
          <ComparisonSlider
            before={IMG.bm1b} after={IMG.bm1a}
            beforeAlt="Original 2MP" afterAlt="AI 8K"
            speed={0.018}
          />
          {/* Resolution overlay badges */}
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

// ─── 4. SKIN DETAIL MAGNIFIER ──────────────────────────────────────────────────
function SkinDetailMagnifier() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 38 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const { left, top, width, height } = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - left) / width) * 100,
      y: ((e.clientY - top) / height) * 100,
    })
  }, [])

  return (
    <section className="bg-[#04040a] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-24">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">AI Detail Engine</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,6vw,7rem)" }}>
              EVERY PORE.<br /><span className="text-[#FFFF00]">EVERY STRAND.</span>
            </h2>
          </div>
          <p className="text-white/35 text-[15px] max-w-[300px] lg:text-right leading-relaxed lg:pb-2">
            At 8K, sharpii synthesizes realistic skin texture, micro-detail, and fine hair that simply doesn&apos;t exist in the source image.
          </p>
        </div>

        {/* Main magnifier demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: 560 }}>
          {/* Left: portrait with interactive magnifier lens */}
          <div
            ref={containerRef}
            className="relative rounded-2xl overflow-hidden cursor-crosshair"
            style={{ minHeight: 480, backgroundImage: `url(${IMG.bm1a})`, backgroundSize: "cover", backgroundPosition: "center 10%" }}
            onMouseMove={handleMouseMove}
          >
            {/* Magnifier ring */}
            <div className="absolute z-20 pointer-events-none border-2 border-[#FFFF00]/60"
              style={{
                width: 200, height: 200, borderRadius: "50%",
                left: `calc(${mousePos.x}% - 100px)`,
                top: `calc(${mousePos.y}% - 100px)`,
                backgroundImage: `url(${IMG.bm1a})`,
                backgroundSize: "600%",
                backgroundPosition: `${mousePos.x * 0.98}% ${mousePos.y * 0.98}%`,
                boxShadow: "0 0 0 2px rgba(255,255,255,0.15), 0 8px 40px rgba(0,0,0,0.6)",
                transition: "left 0.04s ease-out, top 0.04s ease-out",
              }}
            />
            {/* Crosshair lines */}
            <div className="absolute z-10 pointer-events-none"
              style={{
                left: `calc(${mousePos.x}% - 1px)`, top: 0, bottom: 0, width: 1,
                background: "rgba(255,255,0,0.15)",
                transition: "left 0.04s ease-out",
              }} />
            <div className="absolute z-10 pointer-events-none"
              style={{
                top: `calc(${mousePos.y}% - 1px)`, left: 0, right: 0, height: 1,
                background: "rgba(255,255,0,0.15)",
                transition: "top 0.04s ease-out",
              }} />
            {/* Label */}
            <div className="absolute bottom-5 left-5 z-30">
              <span className="bg-black/60 backdrop-blur-sm text-white/50 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                Move cursor to explore detail
              </span>
            </div>
          </div>

          {/* Right: detail stats + comparison */}
          <div className="flex flex-col justify-between gap-6">
            {/* Three resolution comparison chips */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { res: "1080p", mp: "2.1 MP", status: "source", dim: "1920×1080" },
                { res: "4K", mp: "8.3 MP", status: "enhanced", dim: "4096×4096" },
                { res: "8K", mp: "33.2 MP", status: "ultra", dim: "7680×4320" },
              ].map((r, i) => (
                <div key={r.res}
                  className={cn("rounded-xl p-4 border", i === 2
                    ? "bg-[#FFFF00]/8 border-[#FFFF00]/25"
                    : "bg-white/[0.03] border-white/6")}>
                  <div className={cn("font-black text-2xl mb-1", i === 2 ? "text-[#FFFF00]" : "text-white/70")}>{r.res}</div>
                  <div className="text-white/40 text-[11px] font-bold">{r.mp}</div>
                  <div className="text-white/20 text-[10px] mt-0.5">{r.dim}</div>
                  {i === 2 && <div className="mt-2 text-[#FFFF00]/70 text-[10px] font-black uppercase tracking-wider">16× detail</div>}
                </div>
              ))}
            </div>

            {/* Detail comparison cards: before crop vs after crop */}
            <div className="flex-1 grid grid-cols-2 gap-3" style={{ minHeight: 260 }}>
              {/* Before crop */}
              <div className="relative rounded-xl overflow-hidden" style={{ minHeight: 240 }}>
                <div className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${IMG.bm1b})`,
                    backgroundSize: "450%",
                    backgroundPosition: "52% 10%",
                  }} />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent pt-10 px-3 pb-3">
                  <span className="bg-white/15 backdrop-blur-sm text-white/80 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/15">Original 1080p</span>
                </div>
              </div>
              {/* After crop */}
              <div className="relative rounded-xl overflow-hidden ring-2 ring-[#FFFF00]/50" style={{ minHeight: 240 }}>
                <div className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${IMG.bm1a})`,
                    backgroundSize: "450%",
                    backgroundPosition: "52% 10%",
                  }} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent pt-10 px-3 pb-3">
                  <span className="bg-[#FFFF00] text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">AI 8K</span>
                </div>
              </div>
            </div>

            {/* Detail stat chips */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "✦", label: "Skin Texture", detail: "Reconstructed pore-level detail" },
                { icon: "⊹", label: "Hair Strands", detail: "Individual strand synthesis" },
                { icon: "◈", label: "Micro-contrast", detail: "Edge sharpness preserved" },
                { icon: "⬡", label: "Zero Artifacts", detail: "No AI hallucination" },
              ].map(d => (
                <div key={d.label} className="bg-white/[0.03] border border-white/6 rounded-xl p-4">
                  <span className="text-[#FFFF00]/70 text-lg">{d.icon}</span>
                  <div className="text-white font-bold text-[13px] mt-2">{d.label}</div>
                  <div className="text-white/30 text-[11px] mt-0.5">{d.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 5. VIDEO SECTION — CINEMATIC HERO ────────────────────────────────────────
function VideoSection() {
  return (
    <section className="bg-black pt-24 pb-0">
      {/* Header */}
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-end gap-8">
            <div>
              <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-3">02 / Video Suite</p>
              <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,6vw,7.5rem)" }}>
                IMAGINE.<br /><span className="text-violet-400">GENERATE.</span>
              </h2>
            </div>
          </div>
          <div className="max-w-[280px]">
            <p className="text-white/35 text-[14px] mb-5 leading-relaxed">
              11 AI video tools in one platform. Create, sync, transfer, edit — all included.
            </p>
            <Link href="/app/video"
              className="inline-flex items-center gap-2 border border-white/18 px-5 py-2.5 rounded-xl text-white/70 font-bold text-sm hover:bg-white/8 transition-colors duration-200">
              Explore Video <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Full-bleed 21:9 cinematic hero video */}
      <div className="relative overflow-hidden mb-3" style={{ aspectRatio: "21/9", maxHeight: "56vh" }}>
        <AutoVid src={VID.soul2} poster={VID.soul2T} />
        {/* Cinematic letterbox bars */}
        <div className="absolute top-0 left-0 right-0 h-[8%] bg-black z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-black z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />
        {/* Corner labels */}
        <div className="absolute top-1/2 left-8 -translate-y-1/2 z-20 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-lg border border-violet-400/25 px-4 py-2.5 rounded-xl">
            <div className="text-violet-300/60 text-[9px] font-bold uppercase tracking-widest mb-0.5">AI Generated</div>
            <div className="text-white font-black text-sm">Soul Cinematic</div>
          </div>
        </div>
        <div className="absolute bottom-[12%] right-8 z-20 pointer-events-none">
          <span className="bg-violet-500/15 border border-violet-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-violet-300 text-[10px] font-bold uppercase tracking-wider">
            Kling 2.1 Model
          </span>
        </div>
      </div>

      {/* 4-column feature cards */}
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {[
            { src: VID.createVideo, poster: VID.createVideoT, name: "AI Video Gen", tag: "CREATE", accent: "#a78bfa", desc: "Text to cinematic video" },
            { src: VID.lipsync, poster: VID.lipsyncT, name: "Lip Sync Studio", tag: "SYNC", accent: "#f472b6", desc: "Audio-driven lip animation" },
            { src: VID.motion, poster: VID.motionT, name: "Motion Transfer", tag: "MOTION", accent: "#22d3ee", desc: "Clone any movement" },
            { src: VID.editVideo, poster: VID.editVideoT, name: "AI Video Editor", tag: "EDIT", accent: "#818cf8", desc: "Prompt-based editing" },
          ].map(v => (
            <div key={v.name} className="rounded-xl overflow-hidden group relative"
              style={{ borderTop: `2px solid ${v.accent}88` }}>
              <div style={{ aspectRatio: "16/9" }} className="overflow-hidden">
                <AutoVid src={v.src} poster={v.poster} className="group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }}>
                <p className="text-white text-[13px] font-bold">{v.name}</p>
                <p className="text-white/35 text-[11px]">{v.desc}</p>
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-[9px] font-black tracking-widest px-2 py-1 rounded-md"
                  style={{ color: v.accent, background: `${v.accent}18`, border: `1px solid ${v.accent}40` }}>{v.tag}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Scrolling strip */}
        <div className="overflow-hidden rounded-xl pb-24">
          <motion.div className="flex gap-3 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}>
            {[
              { src: VID.aiInfluencer, poster: VID.aiInfluencerT, name: "AI Influencer" },
              { src: VID.soulCin, poster: VID.soulCinT, name: "Cinematic Mode" },
              { src: VID.upscale, poster: VID.upscaleT, name: "Video Upscaling" },
              { src: VID.nanoModel, poster: VID.nanoModelT, name: "Nano Model" },
              { src: VID.createVideo, poster: VID.createVideoT, name: "Video Generation" },
              { src: VID.motion, poster: VID.motionT, name: "Motion Transfer" },
              { src: VID.aiInfluencer, poster: VID.aiInfluencerT, name: "AI Influencer" },
              { src: VID.soulCin, poster: VID.soulCinT, name: "Cinematic Mode" },
              { src: VID.upscale, poster: VID.upscaleT, name: "Video Upscaling" },
              { src: VID.nanoModel, poster: VID.nanoModelT, name: "Nano Model" },
              { src: VID.createVideo, poster: VID.createVideoT, name: "Video Generation" },
              { src: VID.motion, poster: VID.motionT, name: "Motion Transfer" },
            ].map((v, i) => (
              <div key={i} className="flex-shrink-0 relative rounded-xl overflow-hidden" style={{ width: 320, height: 180 }}>
                <AutoVid src={v.src} poster={v.poster} />
                <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
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

// ─── 6. VIDEO CATEGORIES ──────────────────────────────────────────────────────
function VideoCategories() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const CATS = [
    { name: "Cinematic Portrait", desc: "Soul-level motion and depth", src: VID.soul2, poster: VID.soul2T, accent: "#a78bfa", tag: "Most Popular" },
    { name: "Text to Video", desc: "Prompt → full scene in seconds", src: VID.createVideo, poster: VID.createVideoT, accent: "#f472b6", tag: "Create" },
    { name: "Lip Sync", desc: "Any audio animates any face", src: VID.lipsync, poster: VID.lipsyncT, accent: "#34d399", tag: "Audio" },
    { name: "Motion Transfer", desc: "Copy movement to new subjects", src: VID.motion, poster: VID.motionT, accent: "#22d3ee", tag: "Transfer" },
    { name: "Video Editing", desc: "Prompt-based scene changes", src: VID.editVideo, poster: VID.editVideoT, accent: "#fb923c", tag: "Edit" },
    { name: "Video Upscaling", desc: "Up to 4K from any source", src: VID.upscale, poster: VID.upscaleT, accent: "#FFFF00", tag: "Enhance" },
    { name: "AI Influencer", desc: "Consistent AI persona videos", src: VID.aiInfluencer, poster: VID.aiInfluencerT, accent: "#e879f9", tag: "Brand" },
    { name: "Nano Model", desc: "Ultra-fast generation mode", src: VID.nanoModel, poster: VID.nanoModelT, accent: "#94a3b8", tag: "Speed" },
  ]

  const scroll = (dir: 1 | -1) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * 360, behavior: "smooth" })
  }

  return (
    <section className="bg-[#060610] py-24 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Video Library</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.4rem,4.5vw,5rem)" }}>
              8 Ways to<br /><span className="text-violet-400">Create Video.</span>
            </h2>
          </div>
          {/* Arrow controls */}
          <div className="flex gap-2 shrink-0 mb-2">
            <button onClick={() => scroll(-1)}
              className="w-10 h-10 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>
            <button onClick={() => scroll(1)}
              className="w-10 h-10 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll — no scrollbar */}
        <div ref={scrollRef}
          className="flex gap-4 overflow-x-auto"
          style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          {CATS.map((cat, i) => (
            <div key={cat.name}
              className="flex-shrink-0 rounded-2xl overflow-hidden relative group cursor-pointer"
              style={{ width: 290, scrollSnapAlign: "start", border: `1px solid ${cat.accent}25` }}>
              {/* Video */}
              <div style={{ aspectRatio: "9/16" }} className="relative overflow-hidden">
                <AutoVid src={cat.src} poster={cat.poster} className="group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0"
                  style={{ background: `linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)` }} />
                {/* Tag */}
                <div className="absolute top-4 right-4">
                  <span className="text-[9px] font-black tracking-wider px-2.5 py-1 rounded-full"
                    style={{ color: cat.accent, background: `${cat.accent}18`, border: `1px solid ${cat.accent}35` }}>
                    {cat.tag}
                  </span>
                </div>
                {/* Info */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="text-white font-black text-base mb-1">{cat.name}</div>
                  <div className="text-white/45 text-[12px] leading-snug">{cat.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 7. VIDEO CLONING ──────────────────────────────────────────────────────────
function VideoCloning() {
  return (
    <section className="bg-[#0a0014] pt-20 pb-16">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Left: Concept explanation */}
          <div className="lg:w-[36%] shrink-0 lg:pt-4">
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Reference Video</p>
            <h2 className="font-black text-white leading-[0.88] mb-6" style={{ fontSize: "clamp(2.4rem,4vw,4.5rem)" }}>
              CLONE ANY<br /><span className="text-violet-400">PERFORMANCE.</span>
            </h2>
            <p className="text-white/35 text-[15px] leading-relaxed mb-10 max-w-[360px]">
              Upload a reference photo of any person. Our AI generates a fully animated video — matching the lighting, emotion, and motion style you specify.
            </p>
            <div className="space-y-4 mb-10">
              {[
                { step: "1", text: "Upload a portrait photo as reference" },
                { step: "2", text: "Describe the motion & style" },
                { step: "3", text: "AI generates a cinematic video" },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0">
                    <span className="text-violet-300 text-[12px] font-black">{s.step}</span>
                  </div>
                  <span className="text-white/55 text-[14px]">{s.text}</span>
                </div>
              ))}
            </div>
            <Link href="/app/video"
              className="inline-flex items-center gap-2.5 bg-violet-500 px-7 py-3.5 rounded-xl text-white font-black text-[14px] hover:bg-violet-400 transition-colors duration-200">
              Try Video Cloning <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right: Reference photo → generated video */}
          <div className="flex-1 flex items-end gap-4" style={{ minHeight: 460 }}>
            {/* Reference portrait */}
            <div className="flex-1 relative rounded-2xl overflow-hidden" style={{ height: 420 }}>
              <div className="absolute inset-0"
                style={{ backgroundImage: `url(${IMG.g1b})`, backgroundSize: "cover", backgroundPosition: "center 10%" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <span className="bg-black/60 backdrop-blur-sm text-white/55 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                  Reference Photo
                </span>
              </div>
              <div className="absolute top-5 left-5">
                <div className="w-7 h-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                  <Camera className="w-3 h-3 text-white/60" />
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-0.5 h-10 bg-gradient-to-b from-transparent to-violet-400/50" />
              <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-400/40 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-violet-400/50 text-[10px] font-bold uppercase tracking-wider text-center">AI<br/>Gen</div>
              <div className="w-0.5 h-10 bg-gradient-to-t from-transparent to-violet-400/50" />
            </div>

            {/* Generated video */}
            <div className="flex-1 relative rounded-2xl overflow-hidden ring-2 ring-violet-400/30" style={{ height: 460 }}>
              <AutoVid src={VID.createVideo} poster={VID.createVideoT} className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <span className="bg-violet-500/80 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                  Generated Video
                </span>
              </div>
              <div className="absolute top-5 right-5">
                <div className="w-7 h-7 rounded-full bg-violet-500/30 border border-violet-400/40 flex items-center justify-center">
                  <Play className="w-3 h-3 text-violet-300 fill-violet-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 8. AUDIO & LIP SYNC ──────────────────────────────────────────────────────
function AudioLipSync() {
  // Animated waveform bars
  const BARS = Array.from({ length: 40 }, (_, i) => i)

  return (
    <section className="bg-[#f9f9f9] py-24" data-nav-light="true">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left: video demo */}
          <div className="lg:w-[45%] shrink-0">
            <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "9/16", maxHeight: 520 }}>
              <AutoVid src={VID.lipsync} poster={VID.lipsyncT} className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              {/* Audio waveform overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-5 py-5 bg-gradient-to-t from-black to-transparent">
                <div className="flex items-end gap-[3px] mb-3 h-12">
                  {BARS.map(i => {
                    const h = [0.3,0.6,0.9,0.5,0.8,0.4,1,0.7,0.5,0.9,0.3,0.7,0.8,0.5,0.6,0.4,0.9,0.7,0.5,0.8,0.3,0.6,1,0.4,0.7,0.5,0.9,0.6,0.3,0.8,0.5,0.7,0.4,0.9,0.6,0.8,0.3,0.7,0.5,0.9][i % 40]
                    return (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{ background: `rgba(244,114,182,${0.5 + h * 0.5})`, minWidth: 2 }}
                        animate={{ scaleY: [h * 0.5, h, h * 0.6] }}
                        transition={{
                          duration: 0.4 + (i % 7) * 0.07,
                          repeat: Infinity,
                          delay: i * 0.025,
                          ease: "easeInOut",
                        }}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f472b6] animate-pulse" />
                  <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Audio Syncing...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: content */}
          <div className="flex-1">
            <p className="text-black/30 text-[11px] font-black uppercase tracking-[0.35em] mb-5">Audio & Lip Sync</p>
            <h2 className="font-black text-black leading-[0.88] mb-6" style={{ fontSize: "clamp(2.6rem,5vw,5.5rem)" }}>
              YOUR WORDS.<br /><span className="text-[#e91e8c]">ANY FACE.</span>
            </h2>
            <p className="text-black/45 text-[15px] leading-relaxed mb-10 max-w-[380px]">
              Upload any audio — voiceover, speech, song. Our AI synchronizes lip movement frame-by-frame, with natural facial expressions and micro-movements.
            </p>

            {/* Feature chips */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              {[
                { icon: Mic, label: "Voiceover Sync", desc: "Any spoken audio" },
                { icon: Music, label: "Song Lip Sync", desc: "Music video ready" },
                { icon: Video, label: "Real-time Preview", desc: "See it instantly" },
                { icon: Download, label: "Export in HD", desc: "Up to 4K video" },
              ].map(f => (
                <div key={f.label} className="bg-black/[0.04] border border-black/8 rounded-xl p-4">
                  <f.icon className="w-5 h-5 text-[#e91e8c] mb-3" />
                  <div className="text-black font-bold text-[13px]">{f.label}</div>
                  <div className="text-black/40 text-[11px] mt-0.5">{f.desc}</div>
                </div>
              ))}
            </div>

            <Link href="/app/video"
              className="inline-flex items-center gap-2.5 bg-black px-7 py-4 rounded-xl text-white font-black text-[14px] hover:bg-black/80 transition-colors duration-200">
              Try Lip Sync <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 9. SKIN EDITOR ────────────────────────────────────────────────────────────
function SkinEditorSection() {
  return (
    <section className="bg-[#0c0016] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: "88vh" }}>
        {/* Portrait */}
        <div className="relative order-2 lg:order-1 overflow-hidden"
          style={{
            minHeight: 640,
            backgroundImage: `url(${IMG.asian})`,
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
          }}>
          <div className="absolute inset-0 hidden lg:block"
            style={{ background: "linear-gradient(to right, transparent 65%, #0c0016 100%)" }} />
          <div className="absolute inset-0 lg:hidden"
            style={{ background: "linear-gradient(to bottom, transparent 60%, #0c0016 100%)" }} />
        </div>

        {/* Controls */}
        <div className="flex flex-col justify-center px-8 lg:pl-4 lg:pr-14 py-16 order-1 lg:order-2 relative z-10">
          <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">03 / Skin Editor</p>
          <h2 className="font-black text-white leading-[0.82] mb-6" style={{ fontSize: "clamp(2.8rem,5vw,5.8rem)" }}>
            PIXEL-PERFECT<br /><span className="text-amber-400">CONTROL.</span>
          </h2>
          <p className="text-white/40 text-[15px] mb-10 max-w-[360px] leading-relaxed">
            Granular AI retouching. Adjust skin texture, smoothing, fine detail and color — every slider responds in real time.
          </p>

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

// ─── 10. IMAGE EDIT MOCKUP ─────────────────────────────────────────────────────
function ImageEditSection() {
  const LAYER_COLORS = [
    { name: "Smooth Skin", color: "#ef4444" },
    { name: "Remove Blemish", color: "#3b82f6" },
    { name: "Enhance Eyes", color: "#10b981" },
  ]
  const TOOLS = [
    { icon: Brush, name: "Brush" },
    { icon: Eraser, name: "Eraser" },
    { icon: Square, name: "Rect" },
    { icon: Type, name: "Text" },
  ]

  return (
    <section className="bg-[#0e0e11] py-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">04 / Image Edit</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(2.8rem,5.5vw,6.5rem)" }}>
              PAINT YOUR<br /><span className="text-emerald-400">PROMPT.</span>
            </h2>
          </div>
          <div className="max-w-[300px] lg:pb-3">
            <p className="text-white/35 text-[15px] leading-relaxed mb-5">
              Brush a mask over any area. Type what you want changed. AI edits only that zone — nothing else moves.
            </p>
            <Link href="/app/edit"
              className="inline-flex items-center gap-2 bg-emerald-500 px-6 py-3 rounded-xl text-white font-black text-sm hover:bg-emerald-400 transition-colors duration-200">
              Try Image Edit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Studio mockup */}
        <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#0a0a0c]" style={{ minHeight: 560 }}>
          {/* Top bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8 bg-[#111116]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <span className="text-white/25 text-[12px] font-medium ml-2">Image Edit Studio — sharpii.ai</span>
            <div className="ml-auto flex gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 font-bold">Edit Mode</span>
            </div>
          </div>

          {/* Main layout */}
          <div className="flex h-full" style={{ minHeight: 500 }}>
            {/* Left tool panel */}
            <div className="w-14 border-r border-white/6 flex flex-col items-center py-4 gap-3 bg-[#0c0c0f]">
              {TOOLS.map((t, i) => (
                <div key={t.name}
                  className={cn("w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors",
                    i === 0 ? "bg-emerald-500/20 border border-emerald-400/40" : "hover:bg-white/[0.06] border border-transparent")}>
                  <t.icon className={cn("w-4 h-4", i === 0 ? "text-emerald-400" : "text-white/30")} />
                </div>
              ))}
              <div className="w-8 h-px bg-white/8 my-1" />
              <Layers className="w-4 h-4 text-white/20 cursor-pointer hover:text-white/40 transition-colors" />
            </div>

            {/* Canvas area */}
            <div className="flex-1 relative flex items-center justify-center bg-[#090909] p-4">
              {/* Canvas with portrait */}
              <div className="relative rounded-xl overflow-hidden"
                style={{ width: 330, height: 440 }}>
                {/* Portrait */}
                <div className="absolute inset-0"
                  style={{ backgroundImage: `url(${IMG.g1a})`, backgroundSize: "cover", backgroundPosition: "center 10%" }} />

                {/* Painted mask areas — CSS brush stroke simulation */}
                {/* Forehead brush stroke */}
                <div className="absolute pointer-events-none"
                  style={{
                    top: "12%", left: "28%", width: "44%", height: "7%",
                    borderRadius: "60% 50% 55% 45% / 50% 60% 40% 50%",
                    background: "rgba(239,68,68,0.45)",
                    filter: "blur(4px)",
                    transform: "rotate(-3deg)",
                  }} />
                {/* Cheek brush stroke */}
                <div className="absolute pointer-events-none"
                  style={{
                    top: "38%", left: "18%", width: "32%", height: "9%",
                    borderRadius: "50% 60% 55% 45% / 60% 50% 50% 50%",
                    background: "rgba(239,68,68,0.38)",
                    filter: "blur(5px)",
                    transform: "rotate(5deg)",
                  }} />
                {/* Right cheek */}
                <div className="absolute pointer-events-none"
                  style={{
                    top: "39%", right: "18%", width: "28%", height: "8%",
                    borderRadius: "45% 55% 50% 60% / 55% 45% 55% 45%",
                    background: "rgba(239,68,68,0.32)",
                    filter: "blur(5px)",
                    transform: "rotate(-3deg)",
                  }} />
                {/* Blemish zone (blue) */}
                <div className="absolute pointer-events-none"
                  style={{
                    top: "28%", left: "37%", width: "18%", height: "8%",
                    borderRadius: "50%",
                    background: "rgba(59,130,246,0.42)",
                    filter: "blur(4px)",
                  }} />

                {/* Cursor dot */}
                <div className="absolute pointer-events-none z-20"
                  style={{ top: "32%", left: "42%", transform: "translate(-50%,-50%)" }}>
                  <div className="w-6 h-6 rounded-full border-2 border-white/60 bg-white/10 backdrop-blur-sm" />
                </div>

                {/* Active layer chip floating */}
                <div className="absolute top-3 left-3 flex gap-2 flex-wrap z-20">
                  {LAYER_COLORS.map(l => (
                    <div key={l.name}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md"
                      style={{ background: `${l.color}22`, border: `1px solid ${l.color}50` }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                      <span className="text-[10px] font-bold" style={{ color: l.color }}>{l.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="w-52 border-l border-white/6 flex flex-col bg-[#0c0c0f] py-4 px-3">
              <div className="text-white/25 text-[10px] font-black uppercase tracking-wider mb-4">Layers</div>
              <div className="space-y-2">
                {LAYER_COLORS.map((l, i) => (
                  <div key={l.name}
                    className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer",
                      i === 0 ? "bg-white/[0.07] border border-white/10" : "hover:bg-white/[0.04]")}>
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                    <span className="text-white/55 text-[12px] font-medium flex-1">{l.name}</span>
                    <span className="text-white/20 text-[10px]">↔</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-white/[0.04] rounded-lg mt-1">
                  <div className="w-3 h-3 rounded-sm border border-white/20 border-dashed" />
                  <span className="text-white/25 text-[12px]">Add layer</span>
                </div>
              </div>

              <div className="mt-auto">
                <div className="text-white/25 text-[10px] font-black uppercase tracking-wider mb-3">Brush Size</div>
                <div className="h-[2px] bg-white/8 rounded-full mb-1">
                  <div className="h-full w-[35%] bg-emerald-400 rounded-full" />
                </div>
                <div className="flex justify-between">
                  <span className="text-white/20 text-[10px]">1px</span>
                  <span className="text-emerald-400/70 text-[10px] font-bold">24px</span>
                  <span className="text-white/20 text-[10px]">100px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom prompt bar */}
          <div className="border-t border-white/8 px-5 py-3 flex items-center gap-4 bg-[#0c0c0f]">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
              <span className="text-white/30 text-[11px] font-bold uppercase tracking-wide">Active Layer</span>
            </div>
            <div className="flex-1 bg-[#17171d] border border-white/8 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400/60 shrink-0" />
              <span className="text-white/25 text-[13px] flex-1">Smooth skin, remove blemishes, natural look...</span>
            </div>
            <button className="bg-emerald-500 text-white text-[12px] font-black px-5 py-2.5 rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2 shrink-0">
              <Wand2 className="w-3.5 h-3.5" /> Apply
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 11. IMAGE GEN — STAGGERED MASONRY ─────────────────────────────────────────
function ImageGenSection() {
  const GALLERY = [
    { src: IMG.g1a,  alt: "Natural Portrait",  style: "Editorial",    h: 580 },
    { src: IMG.g2b,  alt: "Fashion Shot",       style: "Commercial",   h: 440 },
    { src: IMG.bm1a, alt: "Studio Portrait",    style: "Professional", h: 610 },
    { src: IMG.asian, alt: "Beauty Shot",       style: "Artistic",     h: 470 },
    { src: IMG.g1b,  alt: "Natural Light",      style: "Lifestyle",    h: 540 },
  ]

  return (
    <section className="bg-[#0a0a0a] pt-24 pb-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">05 / Image Generation</p>
            <h2 className="font-black text-white leading-[0.82]" style={{ fontSize: "clamp(3.2rem,7vw,8rem)" }}>
              TEXT TO<br /><span className="text-purple-400">PORTRAIT.</span>
            </h2>
          </div>
          <div className="max-w-[300px] lg:pb-3">
            <p className="text-white/35 text-[15px] mb-6 leading-relaxed">
              Studio-quality portraits from text. 50+ styles — editorial, fashion, cinematic and more.
            </p>
            <Link href="/app/image"
              className="inline-flex items-center gap-2 bg-[#FFFF00] px-6 py-3 rounded-xl text-black font-black text-sm hover:bg-white transition-colors duration-200">
              Generate Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Staggered gallery */}
        <div className="hidden lg:flex items-end gap-2">
          {GALLERY.map((item, i) => (
            <motion.div key={item.alt}
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.65, delay: i * 0.1 }}
              className="flex-1 relative overflow-hidden rounded-xl group cursor-pointer"
              style={{ height: item.h }}>
              <Image src={item.src} alt={item.alt} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70" />
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-1 group-hover:translate-y-0 opacity-70 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white text-sm font-bold">{item.alt}</p>
                <p className="text-white/45 text-xs mt-0.5 uppercase tracking-wide">{item.style}</p>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Mobile grid */}
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

// ─── 12. TOOLS CAROUSEL ────────────────────────────────────────────────────────
function ToolsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const TOOLS = [
    { icon: Zap, name: "Smart Upscaler", desc: "4K & 8K enhancement", tag: "Most Used", color: "#FFFF00", href: "/app/upscaler" },
    { icon: Sparkles, name: "Skin Editor", desc: "AI-powered retouching", tag: "Pro", color: "#f59e0b", href: "/app/skineditor" },
    { icon: ImageIcon, name: "Image Generation", desc: "Text to portrait", tag: "50+ Models", color: "#a78bfa", href: "/app/image" },
    { icon: Wand2, name: "Image Edit", desc: "Brush mask & prompt", tag: "Precise", color: "#10b981", href: "/app/edit" },
    { icon: Video, name: "Video Generation", desc: "Text to video", tag: "New", color: "#60a5fa", href: "/app/video" },
    { icon: Mic, name: "Lip Sync Studio", desc: "Audio-driven animation", tag: "Audio", color: "#f472b6", href: "/app/video" },
    { icon: ArrowRight, name: "Motion Transfer", desc: "Clone any movement", tag: "Transfer", color: "#22d3ee", href: "/app/video" },
    { icon: Camera, name: "Video Upscale", desc: "4K video enhancement", tag: "Quality", color: "#fb923c", href: "/app/video" },
  ]

  const scroll = (dir: 1 | -1) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" })
  }

  return (
    <section className="bg-white py-24" data-nav-light="true">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-black/30 text-[11px] font-black uppercase tracking-[0.35em] mb-5">All Tools</p>
            <h2 className="font-black text-black leading-[0.88]" style={{ fontSize: "clamp(2.8rem,5vw,5.5rem)" }}>
              Everything<br />You Need.
            </h2>
          </div>
          <div className="flex gap-2 shrink-0 mb-2">
            <button onClick={() => scroll(-1)}
              className="w-10 h-10 rounded-full bg-black/[0.06] border border-black/10 flex items-center justify-center hover:bg-black/12 transition-colors">
              <ChevronLeft className="w-4 h-4 text-black/50" />
            </button>
            <button onClick={() => scroll(1)}
              className="w-10 h-10 rounded-full bg-black/[0.06] border border-black/10 flex items-center justify-center hover:bg-black/12 transition-colors">
              <ChevronRight className="w-4 h-4 text-black/50" />
            </button>
          </div>
        </div>

        <div ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}>
          {TOOLS.map(tool => (
            <Link key={tool.name} href={tool.href}
              className="flex-shrink-0 rounded-2xl bg-[#f5f5f5] border border-black/6 p-6 group hover:border-black/15 hover:bg-[#f0f0f0] transition-all duration-200 cursor-pointer"
              style={{ width: 240, scrollSnapAlign: "start" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${tool.color}18`, border: `1px solid ${tool.color}30` }}>
                <tool.icon className="w-5 h-5" style={{ color: tool.color }} />
              </div>
              <div className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-3"
                style={{ background: `${tool.color}15`, color: tool.color }}>
                {tool.tag}
              </div>
              <div className="text-black font-black text-[15px] mb-1.5 group-hover:translate-x-0.5 transition-transform">{tool.name}</div>
              <div className="text-black/40 text-[13px] leading-snug">{tool.desc}</div>
              <div className="mt-5 flex items-center gap-1.5 text-black/30 group-hover:text-black/60 transition-colors text-[12px] font-bold">
                Try it <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 13. STATS ─────────────────────────────────────────────────────────────────
function StatsSection() {
  return (
    <section className="bg-[#FFFF00]" data-nav-light="true">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28">
        <p className="text-black/35 text-[11px] font-black uppercase tracking-[0.35em] mb-14">BY THE NUMBERS</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-14 lg:gap-0 lg:divide-x lg:divide-black/20">
          {[
            { n: "8K", d: "Max Output", s: "7680 × 4320px" },
            { n: "50+", d: "AI Models", s: "Across all tools" },
            { n: "99.1%", d: "Quality", s: "User satisfaction" },
            { n: "20×", d: "Faster", s: "vs. manual editing" },
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

// ─── 14. HOW IT WORKS ──────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { n: "01", title: "Upload Your Photo", desc: "Drop any portrait, RAW file, or batch folder. JPEG, PNG, RAW, TIFF — all accepted." },
    { n: "02", title: "AI Enhances in Seconds", desc: "Our models synthesize new detail, correct skin tone, sharpen edges — fully automated." },
    { n: "03", title: "Download in 8K", desc: "Get your image at up to 8K resolution, ready for print, web, or commercial use." },
  ]
  return (
    <section className="bg-[#f4f4f4]" data-nav-light="true">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28">
        <div className="flex flex-col lg:flex-row lg:items-start gap-16">
          <div className="lg:sticky lg:top-24 shrink-0">
            <p className="text-black/30 text-[11px] font-black uppercase tracking-[0.35em] mb-5">06 / How It Works</p>
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

// ─── 15. TESTIMONIALS ──────────────────────────────────────────────────────────
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
            <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">07 / Reviews</p>
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
              <div className="absolute top-4 right-6 text-[#FFFF00]/8 font-black select-none pointer-events-none"
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

// ─── 16. PRICING ──────────────────────────────────────────────────────────────
function PricingSection() {
  return (
    <section className="bg-black pt-24 pb-24" id="pricing-section">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        <div className="text-center mb-16">
          <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.35em] mb-5">08 / Pricing</p>
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
      <NavStyleOverride />
      <NavThemeController />
      <NavigationHero4 />
      <Hero />
      <Ticker />
      <UpscalerSection />
      <SkinDetailMagnifier />
      <VideoSection />
      <VideoCategories />
      <VideoCloning />
      <AudioLipSync />
      <SkinEditorSection />
      <ImageEditSection />
      <ImageGenSection />
      <ToolsCarousel />
      <StatsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  )
}
