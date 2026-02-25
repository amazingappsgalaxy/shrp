"use client"
import React, { useState, useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  IconSparkles, IconPhoto, IconX, IconArrowUp, IconLoader2,
  IconWand, IconLayoutGrid, IconZoomIn, IconZoomOut, IconMaximize,
  IconDownload, IconPlus, IconAdjustments, IconPencil, IconCheck,
  IconRefresh, IconChevronDown,
} from "@tabler/icons-react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface ScatterImage {
  id: string
  url: string
  prompt: string
  x: number          // % of canvas width
  y: number          // % of canvas height
  w: number          // px
  h: number
  rotation: number   // degrees, subtle
  clusterId: string
  loading?: boolean
  selected?: boolean
}

interface Cluster {
  id: string
  prompt: string
  color: string
  images: ScatterImage[]
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CLUSTER_COLORS = ['#FFFF00', '#A8D5BA', '#E8B4B8', '#7EB8F7', '#C4A8F0']

const ASPECT_OPTIONS = ['1:1', '4:3', '3:4', '16:9', '4:5']
const STYLE_OPTIONS = ['None', 'Cinematic', 'Anime', 'Neon', 'Minimal']
const MODEL_OPTIONS = [
  { id: 'flux-pro', label: 'Flux 1.1 Pro' },
  { id: 'flux-dev', label: 'Flux Dev' },
  { id: 'ideogram', label: 'Ideogram 2' },
]

type Mode = 'generate' | 'edit'
type Count = 1 | 2 | 4

// ── Seed clusters ─────────────────────────────────────────────────────────────
function makeSeedClusters(): Cluster[] {
  const clusterDefs = [
    { id: 'c1', prompt: 'ethereal forest spirit, volumetric light', color: CLUSTER_COLORS[0],
      seeds: [{ s: 'a1', w: 240, h: 290, ar: '4/5', x: 8, y: 10, r: -2.1 },
              { s: 'a2', w: 280, h: 210, ar: '4/3', x: 5, y: 55, r: 1.4 }] },
    { id: 'c2', prompt: 'neon city rain, reflections, hyperreal', color: CLUSTER_COLORS[1],
      seeds: [{ s: 'b1', w: 290, h: 163, ar: '16/9', x: 32, y: 6, r: 0.8 },
              { s: 'b2', w: 260, h: 195, ar: '4/3', x: 30, y: 35, r: -1.2 },
              { s: 'b3', w: 230, h: 230, ar: '1/1', x: 60, y: 10, r: 2.1 },
              { s: 'b4', w: 260, h: 195, ar: '4/3', x: 58, y: 42, r: -0.5 }] },
    { id: 'c3', prompt: 'surreal desert bloom, golden hour', color: CLUSTER_COLORS[2],
      seeds: [{ s: 'c1', w: 240, h: 300, ar: '4/5', x: 72, y: 5, r: 1.8 },
              { s: 'c2', w: 240, h: 240, ar: '1/1', x: 74, y: 54, r: -0.9 }] },
    { id: 'c4', prompt: 'ancient temple, fog, dramatic', color: CLUSTER_COLORS[3],
      seeds: [{ s: 'd1', w: 280, h: 157, ar: '16/9', x: 12, y: 78, r: -1.5 },
              { s: 'd2', w: 240, h: 300, ar: '4/5', x: 40, y: 72, r: 0.6 }] },
  ]

  return clusterDefs.map(c => ({
    id: c.id,
    prompt: c.prompt,
    color: c.color,
    images: c.seeds.map((s, i) => ({
      id: `${c.id}-${i}`,
      url: `https://picsum.photos/seed/${s.s}/${s.w}/${s.h}`,
      prompt: c.prompt,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
      rotation: s.r,
      clusterId: c.id,
      loading: false,
      selected: false,
    }))
  }))
}

// ── Canvas image node ─────────────────────────────────────────────────────────
function ScatterNode({
  img,
  clusterColor,
  onSelect,
}: {
  img: ScatterImage
  clusterColor: string
  onSelect: () => void
}) {
  return (
    <div
      className="absolute group cursor-pointer"
      style={{
        left: `${img.x}%`,
        top: `${img.y}%`,
        width: img.w,
        height: img.h,
        transform: `rotate(${img.rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: img.selected ? 50 : 10,
      }}
      onClick={onSelect}
    >
      {img.loading ? (
        <div
          className="w-full h-full rounded-2xl bg-white/5 animate-pulse flex items-center justify-center"
          style={{ border: `2px solid ${clusterColor}33` }}
        >
          <IconLoader2 size={20} className="animate-spin" style={{ color: clusterColor }} />
        </div>
      ) : (
        <>
          <div
            className="w-full h-full rounded-2xl overflow-hidden transition-all duration-200"
            style={{
              border: img.selected ? `2.5px solid ${clusterColor}` : '2px solid transparent',
              boxShadow: img.selected
                ? `0 0 0 1px ${clusterColor}40, 0 8px 32px rgba(0,0,0,0.6)`
                : '0 4px 24px rgba(0,0,0,0.5)',
            }}
          >
            <img
              src={img.url}
              alt={img.prompt}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-2xl flex items-end p-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={e => { e.stopPropagation() }}
                className="w-7 h-7 rounded-lg bg-black/50 flex items-center justify-center ml-auto"
              >
                <IconDownload size={12} className="text-white" />
              </button>
            </div>
          </div>
          {/* Selected badge */}
          {img.selected && (
            <div
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: clusterColor }}
            >
              <IconCheck size={10} className="text-black" />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Cluster label ─────────────────────────────────────────────────────────────
function ClusterLabel({ cluster }: { cluster: Cluster }) {
  // position label above the topmost image of the cluster
  const topmost = cluster.images.reduce((a, b) => (a.y < b.y ? a : b))
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{ left: `${topmost.x}%`, top: `calc(${topmost.y}% - 22px)` }}
    >
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
        style={{ backgroundColor: `${cluster.color}18`, border: `1px solid ${cluster.color}40`, color: cluster.color }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: cluster.color }}
        />
        {cluster.prompt.slice(0, 28)}
        {cluster.prompt.length > 28 ? '…' : ''}
      </div>
    </div>
  )
}

// ── Context chip in HUD ───────────────────────────────────────────────────────
function HUDChip({ img, color, onRemove }: { img: ScatterImage; color: string; onRemove: () => void }) {
  return (
    <div className="flex-shrink-0 relative group">
      <div
        className="w-10 h-10 rounded-xl overflow-hidden"
        style={{ border: `1.5px solid ${color}60` }}
      >
        <img src={img.url} alt="" className="w-full h-full object-cover" />
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <IconX size={7} className="text-white/80" />
      </button>
    </div>
  )
}

export default function ImageUIConcept3() {
  const [mode, setMode] = useState<Mode>('generate')
  const [count, setCount] = useState<Count>(4)
  const [prompt, setPrompt] = useState('')
  const [clusters, setClusters] = useState<Cluster[]>(makeSeedClusters)
  const [generating, setGenerating] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aspect, setAspect] = useState('4:5')
  const [style, setStyle] = useState('None')
  const [model, setModel] = useState('flux-pro')
  const [zoom, setZoom] = useState(1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const allImages = clusters.flatMap(c => c.images)
  const selectedImages = allImages.filter(img => img.selected)

  // cluster color map
  const clusterColorMap = Object.fromEntries(clusters.map(c => [c.id, c.color]))

  function toggleSelect(id: string) {
    setClusters(prev => prev.map(c => ({
      ...c,
      images: c.images.map(img => img.id === id ? { ...img, selected: !img.selected } : img)
    })))
  }

  function removeFromContext(id: string) {
    setClusters(prev => prev.map(c => ({
      ...c,
      images: c.images.map(img => img.id === id ? { ...img, selected: false } : img)
    })))
  }

  function handleGenerate() {
    if (generating || !prompt.trim()) return
    setGenerating(true)

    const colorIdx = clusters.length % CLUSTER_COLORS.length
    const color = CLUSTER_COLORS[colorIdx]
    const baseX = 10 + (clusters.length * 15) % 60
    const baseY = 10 + (clusters.length * 20) % 60

    const loadingImages: ScatterImage[] = Array.from({ length: count }, (_, i) => ({
      id: `gen-${Date.now()}-${i}`,
      url: '',
      prompt: prompt.trim(),
      x: baseX + (i % 2) * 22,
      y: baseY + Math.floor(i / 2) * 30,
      w: 260, h: 195,
      rotation: (Math.random() - 0.5) * 4,
      clusterId: `c-new-${Date.now()}`,
      loading: true,
      selected: false,
    }))

    const newCluster: Cluster = {
      id: `c-new-${Date.now()}`,
      prompt: prompt.trim(),
      color,
      images: loadingImages,
    }
    // fix clusterId
    newCluster.images = loadingImages.map(img => ({ ...img, clusterId: newCluster.id }))

    setClusters(prev => [...prev, newCluster])

    setTimeout(() => {
      setClusters(prev => prev.map(c =>
        c.id === newCluster.id
          ? {
            ...c,
            images: c.images.map((img, i) => ({
              ...img,
              loading: false,
              url: `https://picsum.photos/seed/gen${Date.now()}${i}/${img.w}/${img.h}`,
            }))
          }
          : c
      ))
      setGenerating(false)
    }, 2800)
  }

  // auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 88) + 'px'
  }, [prompt])

  return (
    <div className="h-screen w-full bg-[#080808] overflow-hidden text-white flex flex-col pt-16">

      {/* ── Canvas area ── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
          }}
        />

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-40 flex flex-col gap-1">
          <button
            onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
          >
            <IconZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
          >
            <IconZoomOut size={14} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
          >
            <IconMaximize size={14} />
          </button>
        </div>

        {/* Canvas */}
        <div
          className="absolute inset-0"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}
        >
          {/* Cluster labels */}
          {clusters.map(c => (
            <ClusterLabel key={c.id} cluster={c} />
          ))}

          {/* Scattered images */}
          {allImages.map(img => (
            <ScatterNode
              key={img.id}
              img={img}
              clusterColor={clusterColorMap[img.clusterId] ?? '#FFFF00'}
              onSelect={() => toggleSelect(img.id)}
            />
          ))}
        </div>

        {/* Empty state */}
        {allImages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/15 pointer-events-none">
            <IconPhoto size={56} strokeWidth={0.8} />
            <p className="text-sm">Your canvas is empty. Generate something below.</p>
          </div>
        )}
      </div>

      {/* ── Floating HUD ── */}
      <div className="flex-shrink-0 pb-6 px-6">
        <div
          className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#111]/90 backdrop-blur-xl shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 -4px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' }}
        >
          {/* Mode + count strip */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5">
            {/* Mode */}
            <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-lg">
              {(['generate', 'edit'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 h-6 rounded-md text-[11px] font-semibold transition-all capitalize",
                    mode === m ? "bg-[#FFFF00] text-black" : "text-white/35 hover:text-white/60"
                  )}
                >
                  {m === 'generate' ? <IconSparkles size={10} /> : <IconPencil size={10} />}
                  {m}
                </button>
              ))}
            </div>

            {/* Count */}
            <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-lg">
              {([1, 2, 4] as Count[]).map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={cn(
                    "w-6 h-6 rounded-md text-[11px] font-bold transition-all",
                    count === n ? "bg-white/[0.09] text-[#FFFF00]" : "text-white/25 hover:text-white/55"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Settings toggle */}
            <button
              onClick={() => setSettingsOpen(v => !v)}
              className={cn(
                "flex items-center gap-1 px-2.5 h-6 rounded-lg text-[11px] font-semibold transition-all",
                settingsOpen ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
              )}
            >
              <IconAdjustments size={12} />
              {settingsOpen ? 'Hide' : 'Settings'}
            </button>
          </div>

          {/* Settings panel (collapsible) */}
          {settingsOpen && (
            <div className="px-4 py-3 border-b border-white/5 grid grid-cols-3 gap-4">
              {/* Model */}
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-black mb-1.5">Model</p>
                <div className="space-y-1">
                  {MODEL_OPTIONS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                        model === m.id ? "bg-[#FFFF00] text-black" : "bg-white/5 text-white/50 hover:text-white/80"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect */}
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-black mb-1.5">Aspect</p>
                <div className="grid grid-cols-2 gap-1">
                  {ASPECT_OPTIONS.map(a => (
                    <button
                      key={a}
                      onClick={() => setAspect(a)}
                      className={cn(
                        "py-1 rounded-lg text-[10px] font-semibold transition-all",
                        aspect === a ? "bg-white/[0.09] text-[#FFFF00]" : "bg-white/5 text-white/35 hover:text-white/65"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-black mb-1.5">Style</p>
                <div className="space-y-1">
                  {STYLE_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                        style === s ? "bg-white/[0.09] text-[#FFFF00]" : "bg-white/5 text-white/50 hover:text-white/80"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Context rail */}
          {selectedImages.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
              <span className="text-[9px] text-white/25 uppercase tracking-wider flex-shrink-0">Using</span>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {selectedImages.map(img => (
                  <HUDChip
                    key={img.id}
                    img={img}
                    color={clusterColorMap[img.clusterId] ?? '#FFFF00'}
                    onRemove={() => removeFromContext(img.id)}
                  />
                ))}
              </div>
              <button
                onClick={() => setClusters(prev => prev.map(c => ({
                  ...c, images: c.images.map(img => ({ ...img, selected: false }))
                })))}
                className="ml-auto text-[9px] text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
              >
                Clear
              </button>
            </div>
          )}

          {/* Prompt input + generate */}
          <div className="flex items-end gap-3 px-4 py-3">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate()
              }}
              placeholder={
                selectedImages.length > 0
                  ? `Edit ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}… describe the change`
                  : mode === 'generate'
                    ? "What do you want to imagine…"
                    : "Describe the edit to apply…"
              }
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 resize-none outline-none leading-relaxed"
              style={{ height: 'auto', minHeight: '24px', maxHeight: '88px', overflowY: 'auto' }}
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all font-bold",
                generating || !prompt.trim()
                  ? "bg-white/5 text-white/15 cursor-not-allowed"
                  : "bg-[#FFFF00] text-black hover:bg-yellow-300 active:scale-95"
              )}
            >
              {generating
                ? <IconLoader2 size={16} className="animate-spin" />
                : <IconArrowUp size={16} strokeWidth={2.5} />
              }
            </button>
          </div>
        </div>

        {/* Hint */}
        <p className="text-center text-[10px] text-white/15 mt-2">
          Click images to add to context · ⌘↩ to generate
        </p>
      </div>
    </div>
  )
}
