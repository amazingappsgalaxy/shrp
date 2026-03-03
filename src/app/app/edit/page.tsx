'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client-simple'
import { CreditIcon } from '@/components/ui/CreditIcon'
import { MODEL_REGISTRY } from '@/services/models'
import { cn } from '@/lib/utils'
import {
  IconUpload, IconTrash, IconPlus, IconWand, IconEraser,
  IconBrush, IconLoader2, IconCheck, IconDownload, IconChevronDown
} from '@tabler/icons-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const EDIT_MODELS = ['nano-banana-2', 'nano-banana-pro', 'nano-banana-2-2k']

const LAYER_COLORS = [
  { hex: '#FF4444', name: 'red' },
  { hex: '#4488FF', name: 'blue' },
  { hex: '#44DD88', name: 'green' },
  { hex: '#FFD700', name: 'yellow' },
  { hex: '#FF44FF', name: 'pink' },
  { hex: '#44EEFF', name: 'cyan' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaskLayer {
  id: string
  color: string      // hex
  colorName: string  // human-readable
  prompt: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // offscreen canvases per layer, keyed by layer id
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map())
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const canvasSizeRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 })

  // Drawing state (refs to avoid re-render on every stroke)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  // Component state
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [layers, setLayers] = useState<MaskLayer[]>([])
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(24)
  const [isErasing, setIsErasing] = useState(false)
  const [selectedModel, setSelectedModel] = useState('nano-banana-2')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)

  const creditCost = MODEL_REGISTRY[selectedModel]?.credits ?? 20

  // ── Fetch credits ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          fetch('/api/user/credits')
            .then(r => r.json())
            .then(c => {
              const total = (c.subscription_credits ?? 0) + (c.permanent_credits ?? 0)
              setCreditBalance(total)
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  // ── Canvas rendering ───────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background image
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height)
    } else {
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Draw each layer's mask canvas at 50% opacity
    for (const layer of layers) {
      const layerCanvas = layerCanvasesRef.current.get(layer.id)
      if (!layerCanvas) continue
      ctx.globalAlpha = 0.5
      ctx.drawImage(layerCanvas, 0, 0)
      ctx.globalAlpha = 1
    }
  }, [layers])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  // ── Load image onto canvas ─────────────────────────────────────────────────
  const loadImage = useCallback((src: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      bgImageRef.current = img

      // Fit image to max 900px wide / 700px tall while preserving aspect ratio
      const maxW = 900
      const maxH = 700
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }

      canvasSizeRef.current = { w, h }
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = w
      canvas.height = h

      // Resize all existing layer canvases
      for (const [id, lc] of layerCanvasesRef.current) {
        const imgData = lc.getContext('2d')?.getImageData(0, 0, lc.width, lc.height)
        lc.width = w
        lc.height = h
        if (imgData) lc.getContext('2d')?.putImageData(imgData, 0, 0)
      }

      renderCanvas()
    }
    img.src = src
  }, [renderCanvas])

  // ── Handle file upload ─────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return

    // First show a local preview immediately
    const localUrl = URL.createObjectURL(file)
    setImageUrl(localUrl)
    loadImage(localUrl)
    setResult(null)
    setError(null)

    // Upload to Bunny CDN in background
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/images/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.image?.url) setImageUrl(data.image.url)
    } catch {
      // Keep local URL if upload fails
    }
  }, [loadImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ── Layer management ───────────────────────────────────────────────────────
  const addLayer = useCallback(() => {
    const usedColors = new Set(layers.map(l => l.color))
    const nextColor = LAYER_COLORS.find(c => !usedColors.has(c.hex)) ?? LAYER_COLORS[layers.length % LAYER_COLORS.length]
    const id = uuidv4()
    const { w, h } = canvasSizeRef.current

    // Create offscreen canvas for this layer
    const lc = document.createElement('canvas')
    lc.width = w
    lc.height = h
    layerCanvasesRef.current.set(id, lc)

    const newLayer: MaskLayer = { id, color: nextColor!.hex, colorName: nextColor!.name, prompt: '' }
    setLayers(prev => [...prev, newLayer])
    setActiveLayerId(id)
  }, [layers])

  const removeLayer = useCallback((id: string) => {
    layerCanvasesRef.current.delete(id)
    setLayers(prev => {
      const next = prev.filter(l => l.id !== id)
      return next
    })
    setActiveLayerId(prev => {
      if (prev === id) return null
      return prev
    })
    setTimeout(renderCanvas, 0)
  }, [renderCanvas])

  const updateLayerPrompt = useCallback((id: string, prompt: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, prompt } : l))
  }, [])

  const clearLayer = useCallback((id: string) => {
    const lc = layerCanvasesRef.current.get(id)
    if (lc) {
      lc.getContext('2d')?.clearRect(0, 0, lc.width, lc.height)
      renderCanvas()
    }
  }, [renderCanvas])

  // ── Drawing ────────────────────────────────────────────────────────────────
  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? e.touches[0]!.clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0]!.clientY : (e as React.MouseEvent).clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  const paintAt = useCallback((x: number, y: number, prevX: number | null, prevY: number | null) => {
    if (!activeLayerId) return
    const lc = layerCanvasesRef.current.get(activeLayerId)
    if (!lc) return
    const ctx = lc.getContext('2d')
    if (!ctx) return

    const activeLayer = layerCanvasesRef.current.get(activeLayerId)
    if (!activeLayer) return

    const layer = layers.find(l => l.id === activeLayerId)
    if (!layer) return

    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over'
    ctx.strokeStyle = layer.color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = 1

    ctx.beginPath()
    ctx.moveTo(prevX ?? x, prevY ?? y)
    ctx.lineTo(x, y)
    ctx.stroke()

    renderCanvas()
  }, [activeLayerId, layers, brushSize, isErasing, renderCanvas])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!activeLayerId || !bgImageRef.current) return
    e.preventDefault()
    isDrawingRef.current = true
    const pos = getCanvasPos(e)
    if (pos) {
      lastPosRef.current = pos
      paintAt(pos.x, pos.y, null, null)
    }
  }, [activeLayerId, getCanvasPos, paintAt])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingRef.current) return
    const pos = getCanvasPos(e)
    if (pos) {
      paintAt(pos.x, pos.y, lastPosRef.current?.x ?? null, lastPosRef.current?.y ?? null)
      lastPosRef.current = pos
    }
  }, [getCanvasPos, paintAt])

  const onMouseUp = useCallback(() => {
    isDrawingRef.current = false
    lastPosRef.current = null
  }, [])

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !imageUrl || layers.length === 0) return
    if (!layers.some(l => l.prompt.trim())) {
      setError('Add at least one prompt to a mask layer before generating.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      // Export the display canvas (original image + all colored mask overlays)
      const compositeDataUrl = canvas.toDataURL('image/png')

      // Build combined prompt from all layers that have prompts
      const activeMasks = layers.filter(l => l.prompt.trim())
      const combinedPrompt =
        activeMasks.map(l => `In the ${l.colorName} highlighted region: ${l.prompt.trim()}`).join('. ') +
        '. Keep all non-highlighted areas completely unchanged.'

      const res = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositeDataUrl,
          originalImageUrl: imageUrl,
          masks: layers.map(l => ({ color: l.color, colorName: l.colorName, prompt: l.prompt })),
          model: selectedModel,
          combinedPrompt,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          setError('Not enough credits. Please top up to continue.')
        } else {
          setError(data.error ?? 'Generation failed. Please try again.')
        }
        return
      }

      setResult(data.outputUrl)
      // Refresh credit balance
      fetch('/api/user/credits')
        .then(r => r.json())
        .then(c => setCreditBalance((c.subscription_credits ?? 0) + (c.permanent_credits ?? 0)))
        .catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsGenerating(false)
    }
  }, [imageUrl, layers, selectedModel])

  // ── Cursor style ───────────────────────────────────────────────────────────
  const canvasCursor = !bgImageRef.current ? 'default'
    : !activeLayerId ? 'not-allowed'
    : isErasing ? 'cell'
    : 'crosshair'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#FFFF00] selection:text-black">
      {/* Header */}
      <div className="pt-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Image Edit</h1>
            <p className="text-white/40 text-sm mt-0.5">Paint masks on your image — all edits in one generation</p>
          </div>
          {creditBalance !== null && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <CreditIcon className="w-4 h-4" />
              <span>{creditBalance.toLocaleString()} credits</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 pb-12">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* ── Left: Canvas ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Upload zone or canvas */}
            {!imageUrl ? (
              <label
                className={cn(
                  'flex flex-col items-center justify-center h-[520px] rounded-2xl border-2 border-dashed cursor-pointer transition-all',
                  isDragging
                    ? 'border-[#FFFF00] bg-[#FFFF00]/5'
                    : 'border-white/20 bg-white/[0.02] hover:border-white/40'
                )}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                <div className="flex flex-col items-center gap-3 pointer-events-none">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <IconUpload className="w-7 h-7 text-white/40" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Drop an image or click to upload</p>
                    <p className="text-white/40 text-sm mt-1">PNG, JPG, WebP — max 10MB</p>
                  </div>
                </div>
              </label>
            ) : (
              <div>
                {/* Canvas toolbar */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  {/* Re-upload */}
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 cursor-pointer text-sm transition-colors">
                    <IconUpload className="w-3.5 h-3.5" />
                    <span>New image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                  </label>

                  <div className="h-5 w-px bg-white/10" />

                  {/* Brush / Erase toggle */}
                  <button
                    onClick={() => setIsErasing(false)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                      !isErasing
                        ? 'bg-[#FFFF00]/10 border-[#FFFF00]/40 text-[#FFFF00]'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                    )}
                  >
                    <IconBrush className="w-3.5 h-3.5" />
                    Paint
                  </button>
                  <button
                    onClick={() => setIsErasing(true)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                      isErasing
                        ? 'bg-[#FFFF00]/10 border-[#FFFF00]/40 text-[#FFFF00]'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                    )}
                  >
                    <IconEraser className="w-3.5 h-3.5" />
                    Erase
                  </button>

                  <div className="h-5 w-px bg-white/10" />

                  {/* Brush size */}
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs">Size</span>
                    <input
                      type="range"
                      min={4}
                      max={80}
                      value={brushSize}
                      onChange={e => setBrushSize(Number(e.target.value))}
                      className="w-24 accent-[#FFFF00]"
                    />
                    <span className="text-white/40 text-xs w-6">{brushSize}</span>
                  </div>

                  {/* Active layer indicator */}
                  {activeLayerId && (() => {
                    const layer = layers.find(l => l.id === activeLayerId)
                    return layer ? (
                      <div className="flex items-center gap-1.5 ml-auto text-sm text-white/60">
                        <div className="w-3 h-3 rounded-full" style={{ background: layer.color }} />
                        <span>Painting on <span className="text-white">{layer.colorName}</span> layer</span>
                      </div>
                    ) : null
                  })()}
                  {!activeLayerId && layers.length > 0 && (
                    <span className="text-white/30 text-sm ml-auto">Select a layer to paint</span>
                  )}
                  {layers.length === 0 && (
                    <span className="text-white/30 text-sm ml-auto">Add a mask layer to start painting →</span>
                  )}
                </div>

                {/* Canvas container */}
                <div ref={containerRef} className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                  <canvas
                    ref={canvasRef}
                    className="block w-full"
                    style={{ cursor: canvasCursor, touchAction: 'none' }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                  />
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-white/70">Generated Result</h3>
                  <a
                    href={result}
                    download="edit-result.jpg"
                    className="flex items-center gap-1.5 text-xs text-[#FFFF00]/80 hover:text-[#FFFF00] transition-colors"
                  >
                    <IconDownload className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
                <div className="rounded-xl overflow-hidden border border-[#FFFF00]/20">
                  <img src={result} alt="Generated result" className="w-full" />
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Controls ──────────────────────────────────────────── */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0 space-y-4">

            {/* Mask Layers */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white/80">Mask Layers</h2>
                <button
                  onClick={addLayer}
                  disabled={!imageUrl}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFFF00]/10 border border-[#FFFF00]/30 text-[#FFFF00] text-xs font-medium hover:bg-[#FFFF00]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <IconPlus className="w-3.5 h-3.5" />
                  Add Layer
                </button>
              </div>

              {layers.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">
                  {imageUrl ? 'Click "Add Layer" to create your first mask' : 'Upload an image first'}
                </p>
              ) : (
                <div className="space-y-3">
                  {layers.map(layer => (
                    <div
                      key={layer.id}
                      onClick={() => setActiveLayerId(layer.id)}
                      className={cn(
                        'rounded-xl border p-3 cursor-pointer transition-all',
                        activeLayerId === layer.id
                          ? 'border-white/30 bg-white/[0.06]'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {/* Color indicator */}
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white/20"
                          style={{ background: layer.color }}
                        />
                        <span className="text-xs text-white/60 capitalize flex-1">{layer.colorName} mask</span>
                        {activeLayerId === layer.id && (
                          <span className="text-xs text-[#FFFF00]/70 mr-1">active</span>
                        )}
                        {/* Clear strokes */}
                        <button
                          onClick={e => { e.stopPropagation(); clearLayer(layer.id) }}
                          className="text-white/20 hover:text-white/60 transition-colors text-xs px-1"
                          title="Clear strokes"
                        >
                          clear
                        </button>
                        {/* Remove layer */}
                        <button
                          onClick={e => { e.stopPropagation(); removeLayer(layer.id) }}
                          className="text-white/20 hover:text-red-400 transition-colors"
                          title="Remove layer"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Prompt */}
                      <textarea
                        value={layer.prompt}
                        onChange={e => updateLayerPrompt(layer.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        placeholder={`What to do in the ${layer.colorName} area…`}
                        rows={2}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              )}

              {layers.length > 0 && (
                <p className="text-white/25 text-xs mt-3 leading-relaxed">
                  All {layers.length} layer{layers.length !== 1 ? 's' : ''} will be processed in a single generation — no extra credits per layer.
                </p>
              )}
            </div>

            {/* Model picker */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-white/80 mb-3">Model</h2>
              <div className="relative">
                <button
                  onClick={() => setShowModelPicker(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white hover:border-white/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{MODEL_REGISTRY[selectedModel]?.label ?? selectedModel}</span>
                    <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                      {MODEL_REGISTRY[selectedModel]?.tag}
                    </span>
                  </div>
                  <IconChevronDown className={cn('w-4 h-4 text-white/40 transition-transform', showModelPicker && 'rotate-180')} />
                </button>
                {showModelPicker && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-neutral-950 border border-white/15 rounded-xl overflow-hidden shadow-2xl">
                    {EDIT_MODELS.map(id => {
                      const m = MODEL_REGISTRY[id]
                      if (!m) return null
                      return (
                        <button
                          key={id}
                          onClick={() => { setSelectedModel(id); setShowModelPicker(false) }}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/5 transition-colors',
                            selectedModel === id ? 'text-[#FFFF00]' : 'text-white/80'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {selectedModel === id && <IconCheck className="w-3.5 h-3.5 text-[#FFFF00]" />}
                            <span className={selectedModel === id ? '' : 'ml-5'}>{m.label}</span>
                            <span className="text-xs text-white/30">{m.tag}</span>
                          </div>
                          <div className="flex items-center gap-1 text-white/40 text-xs">
                            <CreditIcon className="w-3 h-3" />
                            {m.credits}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <p className="text-white/30 text-xs mt-2">{MODEL_REGISTRY[selectedModel]?.description}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !imageUrl || layers.length === 0 || !layers.some(l => l.prompt.trim())}
              className="w-full h-14 rounded-xl bg-[#FFFF00] text-black font-bold text-base flex items-center justify-center gap-2 hover:bg-[#FFFF00]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(255,255,0,0.15)] hover:shadow-[0_0_40px_rgba(255,255,0,0.25)]"
            >
              {isGenerating ? (
                <>
                  <IconLoader2 className="w-5 h-5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <IconWand className="w-5 h-5" />
                  Generate Edit
                  <div className="flex items-center gap-1 ml-1 text-black/60 text-sm font-normal">
                    <CreditIcon className="w-3.5 h-3.5" />
                    {creditCost}
                  </div>
                </>
              )}
            </button>

            <p className="text-white/25 text-xs text-center leading-relaxed">
              All mask layers are combined into a single generation. You're only charged once regardless of how many masks you paint.
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tiny uuid helper (same as uuid v4 but no import needed for client) ─────────
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
