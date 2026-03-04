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
import { useTaskManager } from "@/components/providers/TaskManagerProvider"
import { useCredits } from "@/lib/hooks/use-credits"
import { ExpandViewModal } from "@/components/ui/expand-view-modal"
import { CreditIcon } from "@/components/ui/CreditIcon"
import { ComparisonView } from "@/components/ui/ComparisonView"
import { startSmartProgress, type TaskEntry } from "@/lib/task-progress"
import { SMART_UPSCALER_TASK_DURATION_SECS } from "@/models/smart-upscaler/config"
import {
  PRO_UPSCALER_TASK_DURATION_SECS,
  getProUpscalerCredits,
  type SkinPreset,
} from "@/models/pro-upscaler/config"

// --- Demo images ---
const DEMO_INPUT_URL = 'https://i.postimg.cc/vTtwPDVt/90s-Futuristic-Portrait-3.png'
const DEMO_OUTPUT_URL = 'https://i.postimg.cc/NjJBqyPS/Comfy-UI-00022-psmsy-1770811094.png'

// --- Credits by resolution (Smart Upscaler) ---
const SMART_UPSCALER_CREDITS = { '4k': 80, '8k': 120 } as const

type UpscalerModel = 'pro-upscaler' | 'smart-upscaler'

// ─── Small toggle switch ─────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0",
        checked ? "bg-[#FFFF00]" : "bg-white/10"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200",
          checked ? "bg-black translate-x-5" : "bg-white/60 translate-x-0"
        )}
      />
    </button>
  )
}

function UpscalerContent() {
  const { user, isLoading, isDemo } = useAuth()
  const { addWatchedTask, resolveTask, failTask } = useTaskManager()

  // Image state
  const [uploadedImage, setUploadedImage] = useState<string | null>(DEMO_INPUT_URL)
  const [upscaledImage, setUpscaledImage] = useState<string | null>(DEMO_OUTPUT_URL)
  const [imageMetadata, setImageMetadata] = useState({ width: 1024, height: 1024 })

  // ── Model selection ──────────────────────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState<UpscalerModel>('pro-upscaler')

  // ── Smart Upscaler settings ──────────────────────────────────────────────
  const [smartResolution, setSmartResolution] = useState<'4k' | '8k'>('4k')

  // ── Pro Upscaler settings ────────────────────────────────────────────────
  const [portrait, setPortrait] = useState(true)
  const [skinPreset, setSkinPreset] = useState<SkinPreset>('Subtle')
  const [customPrompt, setCustomPrompt] = useState('')
  const [maxmode, setMaxmode] = useState(false)
  const [maxResolution, setMaxResolution] = useState<'4k' | '8k'>('4k')

  // Credit balance — from shared SWR cache, auto-refreshed after task completion
  const { total: creditBalance, isLoading: creditsLoading } = useCredits()

  // Compute credit cost based on selected model + settings
  const creditCost = selectedModel === 'pro-upscaler'
    ? getProUpscalerCredits(maxmode, maxResolution)
    : SMART_UPSCALER_CREDITS[smartResolution]

  // Upload-on-drop state
  const [isUploading, setIsUploading] = useState(false)
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null)

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


  // Clear all intervals on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      taskIntervalsRef.current.forEach(clearInterval)
      pollIntervalsRef.current.forEach(clearInterval)
    }
  }, [])

  const openPlansPopup = () => window.dispatchEvent(new CustomEvent('sharpii:open-plans'))

  const handleUpload = (files: FileList | null) => {
    if (!files || !files[0]) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUri = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        setImageMetadata({ width: img.width, height: img.height })
        setUploadedImage(dataUri)
        setUpscaledImage(null)
        setRemoteImageUrl(null)
      }
      img.src = dataUri

      // Fire upload to Bunny CDN immediately in the background
      setIsUploading(true)
      fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUri }),
      })
        .then(r => r.json())
        .then(data => { if (data.imageUrl) setRemoteImageUrl(data.imageUrl) })
        .catch(err => console.error('Background upload failed:', err))
        .finally(() => setIsUploading(false))
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploadedImage(null)
    setUpscaledImage(null)
    setRemoteImageUrl(null)
    setImageMetadata({ width: 1024, height: 1024 })
  }

  const handleUpscale = async () => {
    if (!uploadedImage) return

    if (!creditsLoading && creditBalance <= 0) {
      openPlansPopup()
      return
    }
    if (!creditsLoading && creditBalance < creditCost) {
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
      const durationSecs = selectedModel === 'pro-upscaler'
        ? PRO_UPSCALER_TASK_DURATION_SECS
        : SMART_UPSCALER_TASK_DURATION_SECS
      const progressInterval = startSmartProgress(taskId, durationSecs, setActiveTasks)
      taskIntervalsRef.current.set(taskId, progressInterval)

      // remoteImageUrl is set as soon as the user drops the image, so in normal
      // usage it will already be available here — skip re-uploading the data URI.
      let imageUrlForApi = remoteImageUrl || inputImage
      if (imageUrlForApi.startsWith('data:')) {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUri: imageUrlForApi })
        })
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}))
          throw new Error(uploadErr.error || 'Image upload failed')
        }
        const uploadData = await uploadRes.json()
        imageUrlForApi = uploadData.imageUrl
      }

      // Build settings based on selected model
      const settings = selectedModel === 'pro-upscaler'
        ? {
            portrait,
            maxmode,
            skinPreset: skinPreset === 'Subtle' ? '1' : skinPreset === 'Real' ? '2' : '3',
            customPrompt,
            resolution: maxResolution,
            imageWidth: imageMetadata.width,
            imageHeight: imageMetadata.height,
            pageName: 'app/upscaler',
          }
        : {
            resolution: smartResolution,
            imageWidth: imageMetadata.width,
            imageHeight: imageMetadata.height,
            pageName: 'app/upscaler',
          }

      // POST returns immediately with { taskId: dbTaskId, status: 'processing' }
      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrlForApi,
          modelId: selectedModel,
          settings,
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
      addWatchedTask(dbTaskId, 'Upscaling')

      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/enhance-image/poll?taskId=${dbTaskId}`)
          const pollData = await pollRes.json()

          if (pollData.status === 'success') {
            clearInterval(pollInterval)
            pollIntervalsRef.current.delete(taskId)
            const pInterval = taskIntervalsRef.current.get(taskId)
            if (pInterval) { clearInterval(pInterval); taskIntervalsRef.current.delete(taskId) }

            const outputUrl = Array.isArray(pollData.outputs) && pollData.outputs[0]?.url
              ? pollData.outputs[0].url
              : null

            if (latestTaskIdRef.current === taskId && latestImageRef.current === inputImage) {
              setUpscaledImage(outputUrl)
            }

            // Notify global task manager
            resolveTask(dbTaskId)

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
            const pInterval = taskIntervalsRef.current.get(taskId)
            if (pInterval) { clearInterval(pInterval); taskIntervalsRef.current.delete(taskId) }

            // Notify global task manager
            failTask(dbTaskId)

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
    const suffix = selectedModel === 'pro-upscaler'
      ? `pro-${maxmode ? maxResolution : 'std'}`
      : `smart-${smartResolution}`
    try {
      const response = await fetch(upscaledImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `upscaled-${suffix}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      const a = document.createElement('a')
      a.href = upscaledImage
      a.download = `upscaled-${suffix}-${Date.now()}.png`
      a.click()
    }
  }

  if (isLoading) return <ElegantLoading message="Initializing Upscaler..." />

  if (!user && !isDemo) {
    if (typeof window !== 'undefined') window.location.href = '/app/signin'
    return <ElegantLoading message="Redirecting to login..." />
  }

  const skinPresets: SkinPreset[] = ['Subtle', 'Real', 'Cinema']

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

          {/* INPUT IMAGE + MODEL SELECTOR */}
          <div className="border-b border-white/5">
            {/* Header row */}
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
              <div className="h-6 flex items-center">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Upscaler Model</span>
              </div>
            </div>

            {/* Image + model selector row */}
            <div className="grid grid-cols-[40%_60%] gap-4 px-5 pt-1 pb-3">
              {/* Thumbnail */}
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
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 z-10 pointer-events-none">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span className="text-[10px] text-white/60 font-medium tracking-wide">Uploading</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Model selector */}
              <div className="flex flex-col justify-start pt-0.5 gap-2">
                <div className="flex bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)] flex-col gap-1">
                  {(['pro-upscaler', 'smart-upscaler'] as UpscalerModel[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setSelectedModel(m); if (upscaledImage !== DEMO_OUTPUT_URL) setUpscaledImage(null) }}
                      className={cn(
                        "w-full py-2.5 px-2 text-xs font-[900] rounded-md transition-all uppercase tracking-wider text-center",
                        selectedModel === m
                          ? "bg-[#FFFF00] text-black shadow-md"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      {m === 'pro-upscaler' ? 'Professional Upscaler' : 'Smart Upscaler'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed px-1">
                  {selectedModel === 'pro-upscaler'
                    ? 'Unblur anything. Enhances clarity in heavily blurred images, making them sharper and more defined. Advanced upscaling to improve detail and recover lost visual information.'
                    : 'Performs Smart Upscale to produce a sharper, high-detail output. Maintains existing details.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* PORTRAIT MODE (Pro Upscaler only) */}
          {selectedModel === 'pro-upscaler' && (
            <div className="border-b border-white/5 px-5 py-5">
              {/* Section heading + toggle */}
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">Portrait Mode</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Optimized for portraits with realistic skin.</p>
                </div>
                <Toggle checked={portrait} onChange={setPortrait} />
              </div>

              {portrait && (
                <div className="mt-4 rounded-xl overflow-hidden border border-white/5">
                  {/* Skin Enhancement sub-section — label left, segmented control right */}
                  <div className="flex items-center justify-between gap-3 p-3 bg-white/[0.02] border-b border-white/5">
                    <p className="text-xs font-semibold text-white shrink-0">Skin Enhancement</p>
                    <div className="flex bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)]">
                      {skinPresets.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setSkinPreset(preset)}
                          className={cn(
                            "py-1.5 px-3 text-[11px] font-black rounded-md transition-all uppercase tracking-wider",
                            skinPreset === preset
                              ? "bg-white/[0.09] text-[#FFFF00] shadow-sm"
                              : "text-gray-500 hover:text-white"
                          )}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fine-tune Prompt sub-section */}
                  <div className="p-3 bg-white/[0.02]">
                    <p className="text-xs font-semibold text-white mb-2">Fine-tune Prompt</p>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={e => setCustomPrompt(e.target.value)}
                      placeholder="maintain glossy lip, add subtle freckles..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MAX MODE (Pro Upscaler only) */}
          {selectedModel === 'pro-upscaler' && (
            <div className="border-b border-white/5 px-5 py-5">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">Max Mode</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Higher resolution output with more detail.</p>
                </div>
                <Toggle checked={maxmode} onChange={setMaxmode} />
              </div>

              {maxmode && (
                <div className="mt-4">
                  <div className="flex bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)]">
                    {(['4k', '8k'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setMaxResolution(res)}
                        className={cn(
                          "flex-1 py-2 text-[11px] font-black rounded-md transition-all uppercase tracking-wider",
                          maxResolution === res
                            ? "bg-white/[0.09] text-[#FFFF00] shadow-sm"
                            : "text-gray-500 hover:text-white"
                        )}
                      >
                        {res === '4k' ? '4K Crisp' : '8K Ultra'}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMaxResolution('4k')}
                      className={cn(
                        "rounded-lg border p-3 transition-all text-left",
                        maxResolution === '4k' ? "border-white/20 bg-white/5" : "border-white/5"
                      )}
                    >
                      <div className={cn("text-sm font-semibold", maxResolution === '4k' ? "text-[#FFFF00]" : "text-white")}>4096 × 4096</div>
                      <div className="text-[10px] text-gray-500 mt-1 leading-snug">Balanced quality and speed</div>
                    </button>
                    <button
                      onClick={() => setMaxResolution('8k')}
                      className={cn(
                        "rounded-lg border p-3 transition-all text-left",
                        maxResolution === '8k' ? "border-white/20 bg-white/5" : "border-white/5"
                      )}
                    >
                      <div className={cn("text-sm font-semibold", maxResolution === '8k' ? "text-[#FFFF00]" : "text-white")}>8192 × 8192</div>
                      <div className="text-[10px] text-gray-500 mt-1 leading-snug">Maximum detail and sharpness</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPSCALE FACTOR (Smart Upscaler only) */}
          {selectedModel === 'smart-upscaler' && (
            <div className="border-b border-white/5 px-5 py-5">
              <span className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-3">Upscale Factor</span>

              {/* Cupertino segmented pill */}
              <div className="flex bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)]">
                {(['4k', '8k'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => setSmartResolution(res)}
                    className={cn(
                      "flex-1 py-2 text-[11px] font-black rounded-md transition-all uppercase tracking-wider",
                      smartResolution === res
                        ? "bg-white/[0.09] text-[#FFFF00] shadow-sm"
                        : "text-gray-500 hover:text-white"
                    )}
                  >
                    {res === '4k' ? '4K Crisp' : '8K Ultra'}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSmartResolution('4k')}
                  className={cn(
                    "rounded-lg border p-3 transition-all text-left",
                    smartResolution === '4k' ? "border-white/20 bg-white/5" : "border-white/5"
                  )}
                >
                  <div className={cn("text-sm font-semibold", smartResolution === '4k' ? "text-[#FFFF00]" : "text-white")}>4096 × 4096</div>
                  <div className="text-[10px] text-gray-500 mt-1 leading-snug">Balanced quality and speed</div>
                </button>
                <button
                  onClick={() => setSmartResolution('8k')}
                  className={cn(
                    "rounded-lg border p-3 transition-all text-left",
                    smartResolution === '8k' ? "border-white/20 bg-white/5" : "border-white/5"
                  )}
                >
                  <div className={cn("text-sm font-semibold", smartResolution === '8k' ? "text-[#FFFF00]" : "text-white")}>8192 × 8192</div>
                  <div className="text-[10px] text-gray-500 mt-1 leading-snug">Maximum detail and sharpness</div>
                </button>
              </div>
            </div>
          )}


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
                disabled={!uploadedImage || isSubmitting || isUploading}
                className="w-full bg-[#FFFF00] hover:bg-[#e6e600] text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] text-base uppercase tracking-wider"
              >
                {isUploading ? (
                  <>
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <IconSparkles className="w-5 h-5" />
                    <span>
                      {selectedModel === 'pro-upscaler'
                        ? portrait
                          ? `Upscale Portrait${maxmode ? ` to ${maxResolution.toUpperCase()}` : ''}`
                          : `Upscale${maxmode ? ` to ${maxResolution.toUpperCase()}` : ''}`
                        : `Upscale to ${smartResolution.toUpperCase()}`
                      }
                    </span>
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
