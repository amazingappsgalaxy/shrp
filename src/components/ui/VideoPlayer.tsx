"use client"

import React, { useRef, useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  IconVolume, IconVolumeOff, IconPlayerPlay, IconPlayerPause,
  IconMaximize, IconMinimize, IconDownload, IconX,
  IconRepeat, IconRepeatOff,
} from "@tabler/icons-react"
import { createPortal } from "react-dom"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(secs: number): string {
  if (!isFinite(secs)) return "0:00"
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

// ─── VideoCard: grid tile with hover-to-play ─────────────────────────────────

interface VideoCardProps {
  url: string
  aspect?: string
  className?: string
  onExpand?: () => void
  placeholder?: React.ReactNode
  loading?: boolean
}

export function VideoCard({
  url, aspect = "16:9", className, onExpand, placeholder, loading,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    if (videoRef.current && isLoaded) videoRef.current.play().catch(() => {})
  }, [isLoaded])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0 }
    setProgress(0)
  }, [])

  const handleLoaded = useCallback(() => {
    setIsLoaded(true)
    if (isHovered && videoRef.current) videoRef.current.play().catch(() => {})
  }, [isHovered])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    const { currentTime, duration } = videoRef.current
    if (duration > 0) setProgress((currentTime / duration) * 100)
  }, [])

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return
    const next = !isMuted
    videoRef.current.muted = next
    setIsMuted(next)
  }, [isMuted])

  const aspectPadding: Record<string, string> = {
    "16:9": "56.25%", "9:16": "177.78%", "1:1": "100%", "4:3": "75%", "3:4": "133.33%",
  }

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-xl bg-[#0a0a0a] border border-white/[0.07] cursor-pointer",
        "hover:border-white/20 transition-all duration-200",
        className
      )}
      style={{ paddingBottom: aspectPadding[aspect] ?? "56.25%" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onExpand}
    >
      <div className="absolute inset-0">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-[#0d0d0d]">
            {placeholder ?? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white/10 border-t-[#FFFF00]/60 rounded-full animate-spin" />
                <span className="text-[11px] text-white/30 font-medium">Generating…</span>
              </div>
            )}
          </div>
        ) : url ? (
          <>
            <video
              ref={videoRef}
              src={url}
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
              onLoadedData={handleLoaded}
              onTimeUpdate={handleTimeUpdate}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Play overlay when idle */}
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
              isHovered ? "opacity-0" : "opacity-100 pointer-events-none"
            )}>
              <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center">
                <IconPlayerPlay className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* Bottom bar: progress + controls */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 flex flex-col gap-0 transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}>
              {/* Progress bar */}
              <div className="w-full h-0.5 bg-white/10">
                <div
                  className="h-full bg-[#FFFF00] transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Controls row */}
              <div className="flex items-center justify-between px-2 py-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleMute}
                    className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    {isMuted
                      ? <IconVolumeOff className="w-3.5 h-3.5" />
                      : <IconVolume className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
                {onExpand && (
                  <button
                    onClick={e => { e.stopPropagation(); onExpand() }}
                    className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <IconMaximize className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

// ─── VideoModal: full-screen modal with custom controls ───────────────────────

interface VideoModalProps {
  url: string
  isOpen: boolean
  onClose: () => void
  onDownload?: () => void
}

export function VideoModal({ url, isOpen, onClose, onDownload }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const volumeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showVolume, setShowVolume] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLooping, setIsLooping] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Auto-play when opens; kick off the auto-hide timer so controls disappear after 3s
  useEffect(() => {
    if (isOpen && videoRef.current) {
      setIsVideoReady(false)
      // Always reset to unmuted on open — state persists between sessions
      setIsMuted(false)
      videoRef.current.muted = false
      // Try unmuted play; fall back to muted if browser blocks it
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true
          setIsMuted(true)
          videoRef.current.play().catch(() => {})
        }
      })
      setIsPlaying(true)
      setControlsVisible(true)
      // Start auto-hide countdown immediately on open
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000)
    }
    if (!isOpen && videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
      setIsVideoReady(false)
      setProgress(0)
      setCurrentTime(0)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [isOpen])

  // Fullscreen change listener
  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", fn)
    return () => document.removeEventListener("fullscreenchange", fn)
  }, [])

  // Auto-hide controls after inactivity
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false)
    }, 3000)
  }, [isPlaying])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
    resetHideTimer()
  }, [isPlaying, resetHideTimer])

  // Escape / Space key — declared after togglePlay to avoid stale closure
  useEffect(() => {
    if (!isOpen) return
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === " ") { e.preventDefault(); togglePlay() }
    }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [isOpen, onClose, togglePlay])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    const next = !isMuted
    videoRef.current.muted = next
    setIsMuted(next)
    if (next) setVolume(0)
    else { videoRef.current.volume = volume || 1; setVolume(volume || 1) }
  }, [isMuted, volume])

  const toggleLoop = useCallback(() => {
    if (!videoRef.current) return
    const next = !isLooping
    videoRef.current.loop = next
    setIsLooping(next)
  }, [isLooping])

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {})
    } else {
      await document.exitFullscreen().catch(() => {})
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || isDragging) return
    const { currentTime: ct, duration: d } = videoRef.current
    setCurrentTime(ct)
    setDuration(d || 0)
    if (d > 0) setProgress((ct / d) * 100)
  }, [isDragging])

  const handleLoaded = useCallback(() => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration || 0)
    setIsVideoReady(true)
  }, [])

  const seekFromEvent = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!videoRef.current || !progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    videoRef.current.currentTime = pct * videoRef.current.duration
    setProgress(pct * 100)
    setCurrentTime(pct * videoRef.current.duration)
  }, [])

  const handleProgressDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    seekFromEvent(e.nativeEvent)
  }, [seekFromEvent])

  const handleProgressMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    seekFromEvent(e.nativeEvent)
  }, [isDragging, seekFromEvent])

  const handleProgressUp = useCallback(() => setIsDragging(false), [])

  const handleVolumeChange = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!videoRef.current || !volumeRef.current) return
    const rect = volumeRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    videoRef.current.volume = pct
    videoRef.current.muted = pct === 0
    setVolume(pct)
    setIsMuted(pct === 0)
  }, [])

  const handleDownload = useCallback(async () => {
    if (!url) return
    if (onDownload) { onDownload(); return }
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl; a.download = `sharpii-video-${Date.now()}.mp4`
      document.body.appendChild(a); a.click()
      URL.revokeObjectURL(blobUrl); document.body.removeChild(a)
    } catch {
      const a = document.createElement("a")
      a.href = url; a.download = `sharpii-video-${Date.now()}.mp4`; a.click()
    }
  }, [url, onDownload])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10002] flex flex-col bg-black"
      onMouseMove={resetHideTimer}
    >
      {/* Top bar — collapses with controls */}
      <div className={cn(
        "flex items-center justify-between px-5 py-3 flex-shrink-0 transition-opacity duration-300",
        "bg-gradient-to-b from-black/80 to-transparent",
        controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#FFFF00]" />
          <span className="text-white/60 text-xs font-mono uppercase tracking-widest">Sharpii Video</span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all"
        >
          <IconX className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Video — fills the space between top bar and controls bar */}
      <div
        className="flex-1 flex items-center justify-center px-6 min-h-0 relative cursor-pointer"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={url}
          muted={isMuted}
          loop={isLooping}
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoaded}
          onEnded={() => { if (!isLooping) setIsPlaying(false) }}
          className="max-w-full max-h-full object-contain rounded-xl select-none"
        />

        {/* Loading overlay — shown while video is buffering */}
        {!isVideoReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          </div>
        )}

        {/* Center play overlay when paused (and video is ready) */}
        {isVideoReady && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
              <IconPlayerPlay className="w-9 h-9 text-white fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className={cn(
        "px-5 py-4 flex flex-col gap-3 flex-shrink-0 transition-opacity duration-300",
        "bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8",
        controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>

        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative w-full h-1 bg-white/15 rounded-full cursor-pointer group/pb"
          style={{ paddingBlock: 8, marginBlock: -8 }}
          onPointerDown={handleProgressDown}
          onPointerMove={handleProgressMove}
          onPointerUp={handleProgressUp}
        >
          <div className="absolute inset-y-0 left-0 right-0 flex items-center h-1 top-1/2 -translate-y-1/2 rounded-full overflow-hidden bg-white/15">
            {/* Buffered background (visual nicety) */}
            <div
              className="absolute inset-y-0 left-0 bg-white/20"
              style={{ width: "100%" }}
            />
            {/* Fill */}
            <div
              className="absolute inset-y-0 left-0 bg-[#FFFF00] rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#FFFF00] border-2 border-black shadow-[0_0_8px_rgba(255,255,0,0.5)] opacity-0 group-hover/pb:opacity-100 pointer-events-none transition-opacity"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>

        {/* Bottom controls row */}
        <div className="flex items-center justify-between gap-3">

          {/* Left: play + volume + time */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-white transition-all"
            >
              {isPlaying
                ? <IconPlayerPause className="w-4.5 h-4.5 fill-white" />
                : <IconPlayerPlay className="w-4.5 h-4.5 fill-white ml-0.5" />
              }
            </button>

            {/* Volume */}
            <div
              className="relative flex items-center gap-2"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button
                onClick={toggleMute}
                className="w-9 h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-white transition-all"
              >
                {isMuted || volume === 0
                  ? <IconVolumeOff className="w-4 h-4" />
                  : <IconVolume className="w-4 h-4" />
                }
              </button>

              {/* Volume slider */}
              {showVolume && (
                <div
                  ref={volumeRef}
                  className="absolute left-10 bottom-0 w-28 h-9 flex items-center px-2 bg-[#111] border border-white/10 rounded-xl cursor-pointer shadow-2xl"
                  onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); handleVolumeChange(e) }}
                  onPointerMove={e => { if (e.buttons > 0) handleVolumeChange(e) }}
                >
                  <div className="relative w-full h-1 bg-white/15 rounded-full">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#FFFF00] rounded-full"
                      style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FFFF00] border border-black pointer-events-none"
                      style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Time */}
            <span className="text-[11px] font-mono text-white/50 tabular-nums select-none ml-1">
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>
          </div>

          {/* Right: loop + fullscreen + download */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLoop}
              title={isLooping ? "Loop on" : "Loop off"}
              className={cn(
                "w-9 h-9 rounded-xl border flex items-center justify-center transition-all",
                isLooping
                  ? "bg-[#FFFF00]/10 border-[#FFFF00]/30 text-[#FFFF00]"
                  : "bg-white/[0.08] border-white/10 text-white/50 hover:text-white hover:bg-white/[0.15]"
              )}
            >
              {isLooping
                ? <IconRepeat className="w-4 h-4" />
                : <IconRepeatOff className="w-4 h-4" />
              }
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white text-[11px] font-medium transition-all"
            >
              <IconDownload className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-white transition-all"
            >
              {isFullscreen
                ? <IconMinimize className="w-4 h-4" />
                : <IconMaximize className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
