"use client"
import React, { useState, useRef, useEffect, Suspense } from "react"
import {
  IconUpload,
  IconLoader2,
  IconTrash,
  IconSparkles,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-client-simple"
import { ElegantLoading } from "@/components/ui/elegant-loading"
import MyLoadingProcessIndicator from "@/components/ui/MyLoadingProcessIndicator"
import { ExpandViewModal } from "@/components/ui/expand-view-modal"
import { CreditIcon } from "@/components/ui/CreditIcon"
import { ComparisonView } from "@/components/ui/ComparisonView"
import { startSmartProgress, type TaskStatus, type TaskEntry } from "@/lib/task-progress"
import { SMART_UPSCALER_TASK_DURATION_SECS } from "@/models/smart-upscaler/config"

// --- Demo images ---
const DEMO_INPUT_URL = 'https://i.postimg.cc/vTtwPDVt/90s-Futuristic-Portrait-3.png'
const DEMO_OUTPUT_URL = 'https://i.postimg.cc/NjJBqyPS/Comfy-UI-00022-psmsy-1770811094.png'

// --- Credits by resolution ---
const UPSCALER_CREDITS = { '4k': 80, '8k': 120 } as const

function UpscalerContent() {
  const { user, isLoading, isDemo } = useAuth()

  // Image state
  const [uploadedImage, setUploadedImage] = useState<string | null>(DEMO_INPUT_URL)
  const [upscaledImage, setUpscaledImage] = useState<string | null>(DEMO_OUTPUT_URL)
  const [imageMetadata, setImageMetadata] = useState({ width: 1024, height: 1024 })

  // Settings
  const [resolution, setResolution] = useState<'4k' | '8k'>('4k')

  // Credit balance
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/credits/balance')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.balance !== undefined) setCreditBalance(d.balance) })
      .catch(() => {})
  }, [])

  // Credit cost (flat pricing)
  const creditCost = UPSCALER_CREDITS[resolution]

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpandViewOpen, setIsExpandViewOpen] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'loading' | 'success' | 'error' }>>([])

  // Multi-task tracking
  const [activeTasks, setActiveTasks] = useState<Map<string, TaskEntry>>(new Map())
  const [dismissedTaskIds, setDismissedTaskIds] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)
  const latestImageRef = useRef(uploadedImage)
  latestImageRef.current = uploadedImage
  const latestTaskIdRef = useRef<string | null>(null)
  const taskIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  const visibleTasks = React.useMemo(() => {
    const items = Array.from(activeTasks.values()).filter(task => !dismissedTaskIds.has(task.id))
    return items.sort((a, b) => b.createdAt - a.createdAt)
  }, [activeTasks, dismissedTaskIds])

  const openPlansPopup = () => window.dispatchEvent(new CustomEvent('sharpii:open-plans'))

  const handleUpload = (files: FileList | null) => {
    if (!files || !files[0]) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImageMetadata({ width: img.width, height: img.height })
        setUploadedImage(e.target?.result as string)
        setUpscaledImage(null)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploadedImage(null)
    setUpscaledImage(null)
    setImageMetadata({ width: 1024, height: 1024 })
  }

  const handleUpscale = async () => {
    if (!uploadedImage) return

    if (creditBalance === null || creditBalance <= 0) {
      openPlansPopup()
      return
    }
    if (creditBalance < creditCost) {
      const toastId = `${Date.now()}-topup`
      setToasts(prev => [...prev, { id: toastId, message: 'Not enough credits. Top up your account from the dashboard.', type: 'error' }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 5000)
      return
    }

    setIsSubmitting(true)
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const createdAt = Date.now()
    const inputImage = uploadedImage
    latestTaskIdRef.current = taskId

    setDismissedTaskIds(prev => { const next = new Set(prev); next.delete(taskId); return next })
    setActiveTasks(prev => {
      const newMap = new Map(prev)
      newMap.set(taskId, { id: taskId, progress: 0, status: 'loading', message: 'Upscaling...', createdAt, inputImage })
      return newMap
    })

    setTimeout(() => setIsSubmitting(false), 1000)

    try {
      const progressInterval = startSmartProgress(taskId, SMART_UPSCALER_TASK_DURATION_SECS, setActiveTasks)
      taskIntervalsRef.current.set(taskId, progressInterval)

      // POST returns immediately with { taskId: dbTaskId, status: 'processing' }
      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: inputImage,
          modelId: 'smart-upscaler',
          settings: {
            resolution,
            imageWidth: imageMetadata.width,
            imageHeight: imageMetadata.height,
            pageName: 'app/upscaler',
          }
        })
      })

      const data = await response.json()

      if (response.status === 402) {
        openPlansPopup()
        const interval = taskIntervalsRef.current.get(taskId)
        if (interval) { clearInterval(interval); taskIntervalsRef.current.delete(taskId) }
        setActiveTasks(prev => { const m = new Map(prev); m.delete(taskId); return m })
        return
      }

      if (!response.ok) throw new Error(data?.error || 'Upscaling failed')

      const dbTaskId: string = data.taskId

      // NOTE: intentionally do NOT clear taskIntervalsRef (smart progress animation).
      // Let it keep animating toward 96% while we poll for the real result.

      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/enhance-image/poll?taskId=${dbTaskId}`)
          const pollData = await pollRes.json()

          if (pollData.status === 'success') {
            clearInterval(pollInterval)
            pollIntervalsRef.current.delete(taskId)
            const progressInterval = taskIntervalsRef.current.get(taskId)
            if (progressInterval) { clearInterval(progressInterval); taskIntervalsRef.current.delete(taskId) }

            const outputUrl = Array.isArray(pollData.outputs) && pollData.outputs[0]?.url
              ? pollData.outputs[0].url
              : null

            if (latestTaskIdRef.current === taskId && latestImageRef.current === inputImage) {
              setUpscaledImage(outputUrl)
            }

            setActiveTasks(prev => {
              const newMap = new Map(prev)
              const task = newMap.get(taskId)
              if (task) newMap.set(taskId, { ...task, progress: 100, status: 'success', message: 'Done!' })
              return newMap
            })

            setTimeout(() => {
              setActiveTasks(prev => { const m = new Map(prev); m.delete(taskId); return m })
              setDismissedTaskIds(prev => { const s = new Set(prev); s.delete(taskId); return s })
            }, 4000)

          } else if (pollData.status === 'failed') {
            clearInterval(pollInterval)
            pollIntervalsRef.current.delete(taskId)
            const progressInterval = taskIntervalsRef.current.get(taskId)
            if (progressInterval) { clearInterval(progressInterval); taskIntervalsRef.current.delete(taskId) }

            setActiveTasks(prev => {
              const newMap = new Map(prev)
              const task = newMap.get(taskId)
              if (task) newMap.set(taskId, { ...task, progress: 100, status: 'error', message: pollData.error || 'Upscaling failed' })
              return newMap
            })

            setTimeout(() => {
              setActiveTasks(prev => { const m = new Map(prev); m.delete(taskId); return m })
              setDismissedTaskIds(prev => { const s = new Set(prev); s.delete(taskId); return s })
            }, 4000)
          }
          // status === 'running': keep polling, progress animation keeps going
        } catch (pollError) {
          console.warn('Poll error (will retry):', pollError)
        }
      }, 10000)

      pollIntervalsRef.current.set(taskId, pollInterval)

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection error'

      const progressInterval = taskIntervalsRef.current.get(taskId)
      if (progressInterval) { clearInterval(progressInterval); taskIntervalsRef.current.delete(taskId) }
      const pollInterval = pollIntervalsRef.current.get(taskId)
      if (pollInterval) { clearInterval(pollInterval); pollIntervalsRef.current.delete(taskId) }

      setActiveTasks(prev => {
        const newMap = new Map(prev)
        const task = newMap.get(taskId)
        if (task) newMap.set(taskId, { ...task, progress: 100, status: 'error', message: errorMsg })
        return newMap
      })

      setTimeout(() => {
        setActiveTasks(prev => { const m = new Map(prev); m.delete(taskId); return m })
        setDismissedTaskIds(prev => { const next = new Set(prev); next.delete(taskId); return next })
      }, 4000)
    }
  }

  const handleDownload = async () => {
    if (!upscaledImage) return
    try {
      const response = await fetch(upscaledImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `upscaled-${resolution}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      const a = document.createElement('a')
      a.href = upscaledImage
      a.download = `upscaled-${resolution}-${Date.now()}.png`
      a.click()
    }
  }

  if (isLoading) return <ElegantLoading message="Initializing Upscaler..." />

  if (!user && !isDemo) {
    if (typeof window !== 'undefined') window.location.href = '/app/signin'
    return <ElegantLoading message="Redirecting to login..." />
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-white font-sans">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {/* Main Layout */}
      <div className="flex-1 pt-16 w-full grid grid-cols-1 lg:grid-cols-[420px_1fr] items-start">

        {/* LEFT SIDEBAR */}
        <div className="flex flex-col border-r border-white/5 bg-[#0c0c0e] z-20 relative min-h-[calc(100vh-6rem)] lg:pb-32 order-2 lg:order-1">

          {/* INPUT IMAGE */}
          <div className="border-b border-white/5">
            {/* Header row — exactly matches editor: label left, delete icon right */}
            <div className="grid grid-cols-[40%_60%] gap-4 px-5 pt-5 pb-[0.3rem]">
              <div className="flex items-center justify-between h-6">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Input Image</span>
                {uploadedImage && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteImage() }}
                    className="p-2 -mr-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-all"
                    title="Delete Image"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="h-6" />
            </div>

            {/* Image row — 40% column with square thumbnail, matching editor exactly */}
            <div className="grid grid-cols-[40%_60%] gap-4 px-5 pt-1 pb-3">
              <div className="flex flex-col gap-4">
                <div
                  className="w-full aspect-square rounded-lg bg-black border border-white/10 overflow-hidden relative cursor-pointer group hover:border-[#FFFF00]/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadedImage ? (
                    <>
                      <img src={uploadedImage} className="w-full h-full object-cover" alt="Input" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <IconUpload className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <IconUpload className="w-6 h-6 text-gray-500" />
                      <span className="text-[10px] text-gray-600 font-medium">Select Image</span>
                    </div>
                  )}
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* UPSCALE FACTOR */}
          <div className="border-b border-white/5 px-5 py-5">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-3">Upscale Factor</span>

            {/* Cupertino segmented pill — matches editor page style */}
            <div className="flex bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)]">
              {(['4k', '8k'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={cn(
                    "flex-1 py-2 text-[11px] font-black rounded-md transition-all uppercase tracking-wider",
                    resolution === res
                      ? "bg-[#FFFF00] text-black shadow-md scale-[1.02]"
                      : "text-white hover:text-white"
                  )}
                >
                  {res === '4k' ? '4K Crisp' : '8K Ultra'}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setResolution('4k')}
                className={cn(
                  "rounded-lg border p-3 transition-all text-left",
                  resolution === '4k' ? "border-[#FFFF00] border-2" : "border-white/5"
                )}
              >
                <div className="text-sm font-semibold text-white">4096 × 4096</div>
                <div className="text-[10px] text-gray-500 mt-1 leading-snug">Balanced quality and speed</div>
              </button>
              <button
                onClick={() => setResolution('8k')}
                className={cn(
                  "rounded-lg border p-3 transition-all text-left",
                  resolution === '8k' ? "border-[#FFFF00] border-2" : "border-white/5"
                )}
              >
                <div className="text-sm font-semibold text-white">8192 × 8192</div>
                <div className="text-[10px] text-gray-500 mt-1 leading-snug">Maximum detail and sharpness</div>
              </button>
            </div>
          </div>

          {/* INFO */}
          <div className="px-5 py-4 border-b border-white/5">
            <div className="rounded-xl border border-white/5 bg-white/2 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <IconSparkles className="w-4 h-4 text-[#FFFF00]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Smart Upscaler</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Improves skin quality and overall clarity, then performs Smart Upscale to produce a sharper, high-detail output.
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                {['Crisp Detail', 'AI Enhanced', 'Lossless Output'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* FOOTER CTA */}
          <div className="lg:fixed lg:bottom-0 lg:left-0 lg:w-[420px] relative w-full bg-[#0c0c0e] border-t border-white/5 z-40">
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Estimated Cost</span>
                <div className="flex items-center gap-2">
                  <CreditIcon className="w-6 h-6 rounded-md" iconClassName="w-3 h-3" />
                  <span className="font-mono font-medium text-white/90">{creditCost}</span>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={handleUpscale}
                disabled={!uploadedImage || isSubmitting}
                className="w-full bg-[#FFFF00] hover:bg-[#e6e600] text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] text-base uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <IconSparkles className="w-5 h-5" />
                    <span>Upscale to {resolution.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT MAIN CANVAS */}
        <div className="relative flex flex-col px-4 pt-2 pb-4 lg:sticky lg:top-[4.5rem] lg:h-[calc(85vh-4.5rem)] overflow-y-auto custom-scrollbar order-1 lg:order-2">
          <div className="w-full relative flex items-center justify-center bg-[#050505] custom-checkerboard rounded-2xl border border-white/5 overflow-hidden h-[400px] lg:flex-1 lg:min-h-[400px] flex-shrink-0">
            {!uploadedImage ? (
              <div
                className="text-center cursor-pointer p-12 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconUpload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300">No Image Selected</h3>
                <p className="text-sm text-gray-500 mt-2">Upload an image to start upscaling</p>
              </div>
            ) : upscaledImage ? (
              <ComparisonView
                original={uploadedImage}
                enhanced={upscaledImage}
                enhancedLabel="Upscaled"
                onDownload={handleDownload}
                onExpand={() => setIsExpandViewOpen(true)}
              />
            ) : (
              <div className="relative w-full h-full">
                <img src={uploadedImage} className="w-full h-full object-contain opacity-50 blur-sm" alt="Preview" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/80 backdrop-blur px-6 py-3 rounded-full border border-white/10 text-gray-300 text-sm">
                    Click Upscale to process
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STATUS BAR */}
          <div className="mt-4 flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-wider">
            <div>
              {uploadedImage && <span>Source: {imageMetadata.width}×{imageMetadata.height} • PNG</span>}
            </div>
            <div>Sharpii Engine v2.0</div>
          </div>
        </div>

      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={cn(
                "px-5 py-3 rounded-xl text-sm font-medium shadow-xl border backdrop-blur",
                toast.type === 'error' ? "bg-red-900/90 border-red-500/30 text-red-100" : "bg-white/10 border-white/10 text-white"
              )}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {/* Task Status Indicator */}
      <MyLoadingProcessIndicator
        isVisible={visibleTasks.length > 0}
        tasks={visibleTasks}
        onCloseTask={(taskId) => {
          setDismissedTaskIds(prev => { const next = new Set(prev); next.add(taskId); return next })
        }}
      />

      {/* Expand View Modal */}
      {upscaledImage && uploadedImage && (
        <ExpandViewModal
          isOpen={isExpandViewOpen}
          onClose={() => setIsExpandViewOpen(false)}
          originalImage={uploadedImage}
          enhancedImage={upscaledImage}
          onDownload={handleDownload}
        />
      )}

    </div>
  )
}

export default function UpscalerPage() {
  return (
    <Suspense fallback={<ElegantLoading message="Initializing Upscaler..." />}>
      <UpscalerContent />
    </Suspense>
  )
}
