"use client"
import React, { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  IconUpload,
  IconLoader2,
  IconSparkles,
  IconWand,
  IconTrash,
  IconPolygon,
  IconMoodSmile,
  IconPalette,
  IconBrush,
  IconShield,
  IconAdjustmentsHorizontal,
  IconCheck,
  IconX
} from "@tabler/icons-react"
// Removed STYLE_MAPPING and STYLE_LORAS as they are no longer supported

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-client-simple"
import { ElegantLoading } from "@/components/ui/elegant-loading"
import MyLoadingProcessIndicator from "@/components/ui/MyLoadingProcessIndicator"
import { ModelPricingEngine } from "@/lib/model-pricing-config"
import { MechanicalSlider } from "@/components/ui/mechanical-slider"
import { Switch } from "@/components/ui/switch"
import { DropdownOption } from "@/components/ui/custom-dropdown"
import { ExpandViewModal } from "@/components/ui/expand-view-modal"
import { CreditIcon } from "@/components/ui/CreditIcon"
import { ComparisonView } from "@/components/ui/ComparisonView"
import { startSmartProgress, type TaskStatus, type TaskEntry } from "@/lib/task-progress"

// --- TYPES ---
interface AreaProtectionSettings {
  face: {
    skin: boolean
    mouth: boolean
    lowerLip: boolean
    upperLip: boolean
    nose: boolean
  }
  eyes: {
    eyeGeneral: boolean
    rightEye: boolean
    leftBrow: boolean
    rightBrow: boolean
    leftEye: boolean
  }
  other: {
    hair: boolean
    cloth: boolean
    background: boolean
    neck: boolean
  }
}

const DEFAULT_AREA_PROTECTION: AreaProtectionSettings = {
  face: {
    skin: false,
    mouth: false,
    lowerLip: false,
    upperLip: false,
    nose: false
  },
  eyes: {
    eyeGeneral: false,
    rightEye: false,
    leftBrow: false,
    rightBrow: false,
    leftEye: false
  },
  other: {
    hair: false,
    cloth: false,
    background: false,
    neck: false
  }
}

// Available models configuration
const AVAILABLE_MODELS = [
  {
    id: 'skin-editor',
    name: 'Skin Editor',
    provider: 'runninghub',
    category: 'Specialized',
    description: 'Professional skin retouching',
    icon: IconSparkles,
  }
]

// Model-specific control configurations
const MODEL_CONTROLS = {
  'skin-editor': {
    megapixels: { type: 'number', default: 4, min: 2, max: 10, step: 1, label: 'Skin Texture Size', leftLabel: 'Dispersed', rightLabel: 'Dense' },
    maxshift: { type: 'number', default: 1, min: 0.8, max: 1.2, step: 0.1, label: 'Detail Level', leftLabel: 'Low', rightLabel: 'High' },
    denoise: { type: 'number', default: 0.20, min: 0.1, max: 0.38, step: 0.01, label: 'Transformation Strength', leftLabel: 'Subtle', rightLabel: 'Strong' }
  }
}

const STYLES = [
  { id: 'style1', name: 'Poly', value: 'FLUX_Polyhedron_all_Kohya_ss-000001.safetensors', icon: IconPolygon },
  { id: 'style2', name: 'Skin', value: 'skin.safetensors', icon: IconMoodSmile },
  { id: 'style3', name: 'Freckle', value: 'freckles-flux.safetensors', icon: IconPalette },
  { id: 'style4', name: 'Real', value: 'Realim_Lora_BSY_IL_V1_RA42.safetensors', icon: IconBrush }
]

// Enhancement mode options by model
const MODES_BY_MODEL: Record<string, DropdownOption[]> = {
  'skin-editor': [
    { value: 'Subtle', label: 'Subtle', description: 'Natural texture preservation' },
    { value: 'Clear', label: 'Clear', description: 'Balanced smoothing' },
    { value: 'Pimples', label: 'Blemish Removal', description: 'Focus on acne removal' },
    { value: 'Freckles', label: 'Freckle Enhancer', description: 'Enhance natural freckles' },
    { value: 'Custom', label: 'Custom', description: 'Custom prompt' }
  ],
  'default': [
    { value: 'standard', label: 'Standard', description: 'Balanced enhancement' },
    { value: 'detailed', label: 'Detailed', description: 'Maximum detail recovery' },
    { value: 'heavy', label: 'Heavy', description: 'Aggressive processing' }
  ]
}

// Default settings per mode for Skin Editor
const SKIN_EDITOR_DEFAULTS = {
  Subtle: { denoise: 0.20, maxshift: 1, megapixels: 4 },
  Clear: { denoise: 0.35, maxshift: 1.2, megapixels: 4 },
  Pimples: { denoise: 0.37, maxshift: 1.2, megapixels: 2 },
  Freckles: { denoise: 0.37, maxshift: 1.2, megapixels: 2 },
  Custom: { denoise: 0.24, maxshift: 1, megapixels: 4 }
}

const DEMO_INPUT_URL = 'https://i.postimg.cc/vTtwPDVt/90s-Futuristic-Portrait-3.png'
const DEMO_OUTPUT_URL = 'https://i.postimg.cc/NjJBqyPS/Comfy-UI-00022-psmsy-1770811094.png'

function EditorContent() {
  const { user, isLoading, isDemo } = useAuth()
  const searchParams = useSearchParams()

  type EnhancedOutput = { type: 'image' | 'video'; url: string }
  const normalizeOutputs = (value: unknown): EnhancedOutput[] => {
    const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)
    const asItem = (url: string): EnhancedOutput => ({
      type: isVideo(url) ? 'video' : 'image',
      url
    })

    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'string') return asItem(item)
          if (item && typeof item === 'object') {
            const url = (item as { url?: string }).url
            const type = (item as { type?: 'image' | 'video' }).type
            if (url && type) return { url, type }
            if (url) return asItem(url)
          }
          return null
        })
        .filter((item): item is EnhancedOutput => !!item)
    }

    if (typeof value === 'string') {
      return [asItem(value)]
    }

    return []
  }

  // State: Defaulting to USER PROVIDED DEMO IMAGES
  const [uploadedImage, setUploadedImage] = useState<string | null>(DEMO_INPUT_URL)
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [enhancedOutputs, setEnhancedOutputs] = useState<EnhancedOutput[]>([
    { type: 'image', url: DEMO_OUTPUT_URL }
  ])
  const [selectedOutputIndex, setSelectedOutputIndex] = useState(0)
  // Backward compatibility accessor
  const selectedOutput = enhancedOutputs[selectedOutputIndex] || null
  const enhancedImage = selectedOutput?.type === 'image' ? selectedOutput.url : null

  const [imageMetadata, setImageMetadata] = useState({ width: 1024, height: 1024 })

  // Settings
  // Force Skin Editor as default and only model
  const [selectedModel, setSelectedModel] = useState('skin-editor')
  const [selectedStyle, setSelectedStyle] = useState(STYLES[1]?.id || 'style2') // Default to Skin style

  // Dynamic default mode based on model
  const [enhancementMode, setEnhancementMode] = useState<string>('Subtle')
  const [customPrompt, setCustomPrompt] = useState("")
  const [modelSettings, setModelSettings] = useState<Record<string, any>>({})
  const [areaSettings, setAreaSettings] = useState<AreaProtectionSettings>(DEFAULT_AREA_PROTECTION)

  // Smart Upscale Settings
  const [upscaleResolution, setUpscaleResolution] = useState<'4k' | '8k'>('4k')

  // Credit balance
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/credits/balance')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.balance !== undefined) setCreditBalance(d.balance) })
      .catch(() => {})
  }, [])

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpandViewOpen, setIsExpandViewOpen] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'loading' | 'success' | 'error' }>>([])

  // Multi-task tracking
  const [activeTasks, setActiveTasks] = useState<Map<string, TaskEntry>>(new Map())
  const [dismissedTaskIds, setDismissedTaskIds] = useState<Set<string>>(new Set())

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const latestImageRef = useRef(uploadedImage)
  latestImageRef.current = uploadedImage
  const latestTaskIdRef = useRef<string | null>(null)
  const taskIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  const visibleTasks = React.useMemo(() => {
    const items = Array.from(activeTasks.values()).filter(task => !dismissedTaskIds.has(task.id))
    return items.sort((a, b) => b.createdAt - a.createdAt)
  }, [activeTasks, dismissedTaskIds])

  // Initialize from URL param
  useEffect(() => {
    const modelParam = searchParams.get('model')
    if (modelParam && AVAILABLE_MODELS.find(m => m.id === modelParam)) {
      setSelectedModel(modelParam)
    }

    // Ensure defaults are set on mount
    if (selectedModel === 'skin-editor') {
      setModelSettings(SKIN_EDITOR_DEFAULTS['Subtle'])
    }
  }, [searchParams])

  // Update mode when model changes
  useEffect(() => {
    const modes = MODES_BY_MODEL[selectedModel] || MODES_BY_MODEL['default'] || []
    if (modes.length > 0 && modes[0]) {
      setEnhancementMode(modes[0].value)
    }
  }, [selectedModel])

  // Update settings when mode changes (specifically for Skin Editor)
  useEffect(() => {
    if (selectedModel === 'skin-editor' && enhancementMode in SKIN_EDITOR_DEFAULTS) {
      const defaults = SKIN_EDITOR_DEFAULTS[enhancementMode as keyof typeof SKIN_EDITOR_DEFAULTS]
      setModelSettings(defaults)
    }
  }, [enhancementMode, selectedModel])

  // Setup default settings when model changes
  useEffect(() => {
    if (selectedModel === 'skin-editor') {
      return
    }
    const defaults: Record<string, any> = {}
    const controls = MODEL_CONTROLS[selectedModel as keyof typeof MODEL_CONTROLS] || {}
    Object.entries(controls).forEach(([k, v]) => {
      // @ts-ignore
      defaults[k] = v.default
    })
    setModelSettings(defaults)
  }, [selectedModel])


  // Calculate credits
  const creditCost = React.useMemo(() => {
    try {
      const result = ModelPricingEngine.calculateCredits(
        imageMetadata.width,
        imageMetadata.height,
        selectedModel,
        modelSettings
      )
      return result.totalCredits
    } catch (error) {
      return 120 // fallback
    }
  }, [imageMetadata, selectedModel, modelSettings])

  // Handlers
  const handleUpload = (files: FileList | null) => {
    if (!files || !files[0]) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImageMetadata({ width: img.width, height: img.height })
        setUploadedImage(e.target?.result as string)
        setEnhancedOutputs([])
        setSelectedOutputIndex(0)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setUploadedImage(null)
    setEnhancedOutputs([])
    setSelectedOutputIndex(0)
    setImageMetadata({ width: 1024, height: 1024 })
  }

  const openPlansPopup = () => window.dispatchEvent(new CustomEvent('sharpii:open-plans'))

  const handleEnhance = async () => {
    if (!uploadedImage) return

    // No credits at all → show pricing plans popup
    if (creditBalance === null || creditBalance <= 0) {
      openPlansPopup()
      return
    }
    // Has some credits but not enough for this task → small top-up notice
    if (creditCost !== null && creditCost !== undefined && creditBalance < creditCost) {
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
    setDismissedTaskIds(prev => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
    setActiveTasks(prev => {
      const newMap = new Map(prev)
      newMap.set(taskId, { id: taskId, progress: 0, status: 'loading', message: 'Enhancing...', createdAt, inputImage })
      return newMap
    })

    setTimeout(() => setIsSubmitting(false), 1000)

    try {
      const shouldSmartUpscale = !!modelSettings['smartUpscale']
      // skin-editor: 70 s without smart upscale, 160 s with it
      const taskDurationSecs = shouldSmartUpscale ? 160 : 70
      const progressInterval = startSmartProgress(taskId, taskDurationSecs, setActiveTasks)
      taskIntervalsRef.current.set(taskId, progressInterval)
      const settingsSnapshot = {
        prompt: 'Enhance skin details, preserve identity, high quality',
        mode: enhancementMode,
        customPrompt: enhancementMode === 'Custom' ? customPrompt : undefined,
        protections: areaSettings,
        style: STYLES.find(s => s.id === selectedStyle)?.value,
        styleName: STYLES.find(s => s.id === selectedStyle)?.name,
        pageName: 'app/editor',
        smartUpscale: shouldSmartUpscale,
        upscaleResolution,
        ...modelSettings
      }

      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: inputImage,
          modelId: 'skin-editor',
          settings: settingsSnapshot
        })
      })

      const interval = taskIntervalsRef.current.get(taskId)
      if (interval) {
        clearInterval(interval)
        taskIntervalsRef.current.delete(taskId)
      }

      const data = await response.json()

      // Insufficient credits — show plans popup, remove task silently (no error toast)
      if (response.status === 402) {
        openPlansPopup()
        setActiveTasks(prev => { const m = new Map(prev); m.delete(taskId); return m })
        return
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Enhancement failed')
      }

      if (data.success && (data.outputs || data.enhancedUrl)) {
        const outputs = normalizeOutputs(data.outputs ?? data.enhancedUrl)
        if (latestTaskIdRef.current === taskId && latestImageRef.current === inputImage) {
          setEnhancedOutputs(outputs)
          setSelectedOutputIndex(0)
        }

        setActiveTasks(prev => {
          const newMap = new Map(prev)
          const task = newMap.get(taskId)
          if (task) newMap.set(taskId, { ...task, progress: 100, status: 'success', message: 'Done!' })
          return newMap
        })
      } else {
        console.error('Enhancement failed:', data.error)
        setActiveTasks(prev => {
          const newMap = new Map(prev)
          const task = newMap.get(taskId)
          if (task) newMap.set(taskId, { ...task, progress: 100, status: 'error', message: data.error || 'Enhancement failed' })
          return newMap
        })
      }

    } catch (error) {
      console.error('Enhancement error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Connection error'
      setActiveTasks(prev => {
        const newMap = new Map(prev)
        const task = newMap.get(taskId)
        if (task) newMap.set(taskId, { ...task, progress: 100, status: 'error', message: errorMsg })
        return newMap
      })
    } finally {
      const interval = taskIntervalsRef.current.get(taskId)
      if (interval) {
        clearInterval(interval)
        taskIntervalsRef.current.delete(taskId)
      }

      setTimeout(() => {
        setActiveTasks(prev => {
          const newMap = new Map(prev)
          newMap.delete(taskId)
          return newMap
        })
        setDismissedTaskIds(prev => {
          const next = new Set(prev)
          next.delete(taskId)
          return next
        })
      }, 4000)
    }
  }

  const handleDownload = async () => {
    if (!selectedOutput) return
    try {
      const response = await fetch(selectedOutput.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `enhanced-${Date.now()}.${selectedOutput.type === 'video' ? 'mp4' : 'png'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback for same-origin or simple cases
      const a = document.createElement('a')
      a.href = selectedOutput.url
      a.download = `enhanced-${Date.now()}.${selectedOutput.type === 'video' ? 'mp4' : 'png'}`
      a.click()
    }
  }

  if (isLoading) return <ElegantLoading message="Initializing Editor..." />

  if (!user && !isDemo) {
    if (typeof window !== 'undefined') {
      window.location.href = '/app/signin'
    }
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

      {/* Main Layout - Grid with Wider Sidebar & Sticky Canvas */}
      <div className="flex-1 pt-16 w-full grid grid-cols-1 lg:grid-cols-[420px_1fr] items-start">

        {/* LEFT SIDEBAR - CONTROLS (Scrolls with page) */}
        <div className="flex flex-col border-r border-white/5 bg-[#0c0c0e] z-20 relative min-h-[calc(100vh-6rem)] lg:pb-32 order-2 lg:order-1">

          {/* 1. TOP SECTION: INPUT & STYLES (SIDE BY SIDE) */}
          <div className="border-b border-white/5">
            <div className="grid grid-cols-[40%_60%] gap-4 px-5 pt-5 pb-[0.3rem]">
              <div className="flex items-center justify-between h-6">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Input Image</span>
                {uploadedImage && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteImage()
                    }}
                    className="p-2 -mr-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-all"
                    title="Delete Image"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center h-6">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Skin Style</span>
              </div>
            </div>

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

              <div className="flex flex-col gap-2 pr-2">
                <div className="grid grid-cols-2 gap-3">
                  {STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={cn(
                        "flex flex-row items-center justify-start px-3 h-10 rounded-md border transition-all gap-3",
                        selectedStyle === style.id
                          ? "bg-[#FFFF00] border-[#FFFF00] text-black"
                          : "bg-white/5 border-white/5 text-white hover:bg-white/10 hover:border-white/10"
                      )}
                    >
                      <style.icon className={cn(
                        "w-5 h-5 flex-shrink-0",
                        selectedStyle === style.id ? "text-black" : "text-white"
                      )} />
                      <span className="text-xs font-bold">{style.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/70 text-left">
                  Enhances natural detail for the highest visual fidelity
                </p>
              </div>
            </div>
          </div>

          {/* 3. SETTINGS SCROLL AREA */}
          <div className="p-3 space-y-3 flex-1">

            {/* GROUP 1: Primary Controls */}
            <div className="space-y-2 px-1">

              {/* Smart Upscale Special Setting */}
              <div className="rounded-xl overflow-hidden border border-white/5">
                <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-black/20 text-[#FFFF00]">
                      <IconSparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Smart Upscale</span>
                  </div>
                  <Switch
                    checked={!!modelSettings['smartUpscale']}
                    onCheckedChange={(c) => setModelSettings(prev => ({ ...prev, smartUpscale: c }))}
                    className="scale-90 data-[state=checked]:bg-[#FFFF00]"
                  />
                </div>

                {/* Cupertino Segmented Control for 4K/8K - ALWAYS VISIBLE */}
                <div className="p-2 bg-black/20">
                  <div className="flex bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)]">
                    {(['4k', '8k'] as const).map((res) => (
                      <button
                        key={res}
                        disabled={!modelSettings['smartUpscale']}
                        onClick={() => setUpscaleResolution(res)}
                        className={cn(
                          "flex-1 py-2 text-[11px] font-black rounded-md transition-all uppercase tracking-wider disabled:opacity-100 disabled:cursor-not-allowed",
                          upscaleResolution === res
                            ? "bg-[#FFFF00] text-black shadow-md scale-[1.02]"
                            : "text-white hover:text-white"
                        )}
                      >
                        {res === '4k' ? '4K Crisp' : '8K Ultra'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Render Model specific controls */}
              {Object.entries(MODEL_CONTROLS[selectedModel as keyof typeof MODEL_CONTROLS] || {}).map(([key, config]) => {
                const conf = config as { type: string; default: any; label: string; min?: number; max?: number; step?: number; leftLabel?: string; rightLabel?: string }
                const currentValue = modelSettings[key] ?? conf.default

                if (conf.type === 'boolean') {
                  return (
                    <div key={key} className="flex items-center justify-between group p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                      <span className="text-xs font-medium text-white transition-colors">{conf.label}</span>
                      <Switch
                        checked={!!currentValue}
                        onCheckedChange={(c) => setModelSettings(prev => ({ ...prev, [key]: c }))}
                        className="scale-90 origin-right"
                      />
                    </div>
                  )
                }

                if (conf.type === 'number') {
                  return (
                    <div key={key} className="space-y-3 group p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-semibold text-white transition-colors">{conf.label}</span>
                        <span className="font-mono text-[12px] text-white bg-white/5 px-1.5 py-0.5 rounded">{Number(currentValue).toFixed(conf.step && conf.step < 1 ? 2 : 0)}</span>
                      </div>
                      <MechanicalSlider
                        value={[Number(currentValue)]}
                        min={conf.min} max={conf.max} step={conf.step || 1}
                        leftLabel={conf.leftLabel}
                        rightLabel={conf.rightLabel}
                        onValueChange={([v]) => setModelSettings(prev => ({ ...prev, [key]: v }))}
                      />
                    </div>
                  )
                }
                return null
              })}
            </div>

            {/* GROUP 2: Area Protection (3 Sections: Face, Eyes, Other) */}
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <IconShield className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Area Protection</span>
              </div>

              {/* Face Features */}
              <div className="grid grid-cols-2 gap-3">
                {/* Face Column */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-white uppercase tracking-wider pl-1 flex items-center gap-1">Face</p>
                  <div className="space-y-1">
                    {Object.entries(areaSettings.face).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                        <span className="text-xs font-medium text-white capitalize transition-colors w-full">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Switch
                          checked={val}
                          onCheckedChange={(c) => setAreaSettings(prev => ({ ...prev, face: { ...prev.face, [key]: c } }))}
                          className="scale-75 origin-right"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Eyes Column */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-white uppercase tracking-wider pl-1 flex items-center gap-1">Eyes</p>
                  <div className="space-y-1">
                    {Object.entries(areaSettings.eyes).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                        <span className="text-xs font-medium text-white capitalize transition-colors w-full">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Switch
                          checked={val}
                          onCheckedChange={(c) => setAreaSettings(prev => ({ ...prev, eyes: { ...prev.eyes, [key]: c } }))}
                          className="scale-75 origin-right"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Other Section - Single Row, 4 Columns */}
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(areaSettings.other).map(([key, val]) => (
                  <div key={key} className="flex flex-col items-center justify-center p-2 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group gap-2">
                    <span className="text-xs font-medium text-white capitalize transition-colors text-center">{key}</span>
                    <Switch
                      checked={val}
                      onCheckedChange={(c) => setAreaSettings(prev => ({ ...prev, other: { ...prev.other, [key]: c } }))}
                      className="scale-75"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 4. FOOTER */}
          <div className="lg:fixed lg:bottom-0 lg:left-0 lg:w-[420px] relative w-full bg-[#0c0c0e] border-t border-white/5 z-40">
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Estimated Cost</span>
                <div className="flex items-center gap-2">
                  <CreditIcon className="w-6 h-6 rounded-md" iconClassName="w-3 h-3" />
                  <span className="font-mono font-medium text-white/90">{creditCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={handleEnhance}
                disabled={!uploadedImage}
                className="w-full bg-[#FFFF00] hover:bg-[#e6e600] text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] text-base uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <IconWand className="w-5 h-5 fill-black" />
                    <span>Enhance Skin</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT MAIN CANVAS */}
        <div className="relative flex flex-col px-4 pt-2 pb-4 lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-4.5rem)] overflow-y-auto custom-scrollbar order-1 lg:order-2">
          <div className="w-full relative flex items-center justify-center bg-[#050505] custom-checkerboard rounded-2xl border border-white/5 overflow-hidden h-[400px] lg:flex-1 lg:min-h-[400px] flex-shrink-0">
            {!uploadedImage ? (
              <div
                className="text-center cursor-pointer p-12 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconUpload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300">No Image Selected</h3>
                <p className="text-sm text-gray-500 mt-2">Upload an image to start editing</p>
              </div>
            ) : (
              selectedOutput ? (
                selectedOutput.type === 'image' ? (
                  <ComparisonView
                    original={uploadedImage}
                    enhanced={selectedOutput.url}
                    onDownload={handleDownload}
                    onExpand={() => setIsExpandViewOpen(true)}
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                    <video
                      src={selectedOutput.url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                )
              ) : (
                <div className="relative w-full h-full">
                  <img src={uploadedImage} className="w-full h-full object-contain opacity-50 blur-sm" alt="Preview" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/80 backdrop-blur px-6 py-3 rounded-full border border-white/10 text-gray-300 text-sm">
                      Click enhance to process
                    </div>
                  </div>
                </div>
              )
            )}

            {enhancedOutputs.length > 1 && (
              <div className="absolute right-4 inset-y-0 z-20 flex flex-col justify-center gap-2 pointer-events-none">
                {enhancedOutputs.map((output, idx) => (
                  <button
                    key={`${output.url}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOutputIndex(idx);
                    }}
                    className={cn(
                      "w-16 h-16 rounded-lg border transition-all overflow-hidden bg-black/50 pointer-events-auto",
                      selectedOutputIndex === idx
                        ? "border-white/70 shadow-[0_0_12px_rgba(255,255,255,0.15)] scale-105"
                        : "border-white/10 hover:border-white/30 hover:scale-105"
                    )}
                  >
                    {output.type === 'image' ? (
                      <img src={output.url} alt={`Output ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                        Video {idx + 1}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* STATUS BAR */}
          <div className="mt-4 flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-wider">
            <div>
              {uploadedImage && <span>Source: {imageMetadata.width}×{imageMetadata.height} • PNG</span>}
            </div>
            <div>
              Sharpii Engine v2.0
            </div>
          </div>


          {/* MODES SECTION - Right Side Below Output */}
          <div className="mt-4 px-4 pb-8 w-full space-y-4">
            <div>
              <h3 className="text-xs font-black text-gray-500 mb-3 flex items-center gap-2 tracking-wider uppercase">
                Dermatology Control
              </h3>
              <div className="flex items-start gap-2">
                <div className="grid grid-cols-4 gap-2 flex-1">
                  {[
                    { id: 'Subtle', label: 'Subtle' },
                    { id: 'Clear', label: 'Clear' },
                    { id: 'Pimples', label: 'Pimples' },
                    { id: 'Freckles', label: 'Freckle' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setEnhancementMode(mode.id)}
                      className={cn(
                        "relative h-14 rounded-lg overflow-hidden group border transition-all flex items-center justify-center",
                        enhancementMode === mode.id
                          ? "border-[#FFFF00] shadow-[0_0_10px_rgba(255,255,0,0.2)] bg-white/5"
                          : "border-white/5 bg-black/40 hover:border-white/20 hover:bg-white/5"
                      )}
                    >
                      {/* Background Image: Use user image or default if none */}
                      {(uploadedImage || '/demo-image.jpg') && (
                        <img
                          src={uploadedImage || '/demo-image.jpg'}
                          alt=""
                          className={cn(
                            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                            enhancementMode === mode.id ? "opacity-50" : "opacity-40 group-hover:opacity-50"
                          )}
                        />
                      )}

                      <span className={cn(
                        "relative z-10 text-[12px] font-black uppercase tracking-wider transition-colors truncate px-1",
                        enhancementMode === mode.id ? "text-[#FFFF00]" : "text-white"
                      )}>
                        {mode.label}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setEnhancementMode('Custom')}
                  className={cn(
                    "w-auto px-4 h-14 rounded-lg flex items-center justify-center transition-all border shrink-0 gap-2",
                    enhancementMode === 'Custom'
                      ? "border-[#FFFF00] text-[#FFFF00] bg-white/5 shadow-[0_0_10px_rgba(255,255,0,0.2)]"
                      : "border-white/5 text-white hover:border-white/20 bg-black/40"
                  )}
                  title="Custom Mode"
                >
                  <IconAdjustmentsHorizontal className="w-6 h-6" />
                  <span className="text-[12px] font-black uppercase tracking-wider">Custom</span>
                </button>
              </div>
            </div>

            {/* Custom Prompt Input - Only visible when Custom mode is selected */}
            {enhancementMode === 'Custom' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/70 px-1">Describe your custom skin dermatology</label>
                <div className="relative">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter additional prompt details..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-all min-h-[80px] resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expand View Modal */}
      {enhancedImage && uploadedImage && (
        <ExpandViewModal
          isOpen={isExpandViewOpen}
          onClose={() => setIsExpandViewOpen(false)}
          originalImage={uploadedImage}
          enhancedImage={enhancedImage}
          onDownload={handleDownload}
        />
      )}

      {/* Multi-task Loading Indicator */}
      <MyLoadingProcessIndicator
        isVisible={visibleTasks.length > 0}
        tasks={visibleTasks}
        onCloseTask={(taskId) => {
          setDismissedTaskIds(prev => {
            const next = new Set(prev)
            next.add(taskId)
            return next
          })
        }}
      />

      {toasts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center">
          {toasts.map((toast) => (
            <div key={toast.id} className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs text-white/90 backdrop-blur border shadow-lg transition-all",
              toast.type === 'error' ? "bg-red-500/20 border-red-500/30 text-red-100" :
                toast.type === 'success' ? "bg-green-500/20 border-green-500/30 text-green-100" :
                  "bg-black/70 border-white/10"
            )}>
              {toast.type === 'success' ? (
                <IconCheck className="w-3.5 h-3.5 text-green-400" />
              ) : toast.type === 'error' ? (
                <IconX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
              )}
              <span className="uppercase tracking-wider font-medium">{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </div >
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<ElegantLoading message="Initializing Editor..." />}>
      <EditorContent />
    </Suspense>
  )
}
