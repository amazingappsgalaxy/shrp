"use client"
import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  IconSparkles, IconPhoto, IconSettings2, IconX, IconPlus,
  IconDownload, IconChevronDown, IconChevronLeft, IconChevronRight,
  IconWand, IconHistory, IconArrowUp, IconLoader2, IconLayoutGrid,
  IconMaximize, IconCopy, IconTrash, IconAdjustments, IconPencil,
  IconCheck, IconRefresh,
} from "@tabler/icons-react"

// ── Mock data ─────────────────────────────────────────────────────────────────
const SESSIONS = [
  {
    id: 's1', label: 'Ethereal Forest', time: '2m ago',
    images: [
      { id: 'i1', url: 'https://picsum.photos/seed/a1/640/768', prompt: 'ethereal forest spirit, volumetric light' },
      { id: 'i2', url: 'https://picsum.photos/seed/a2/640/768', prompt: 'ethereal forest spirit, soft glow' },
    ]
  },
  {
    id: 's2', label: 'Neon City Rain', time: '1h ago',
    images: [
      { id: 'i3', url: 'https://picsum.photos/seed/b1/768/512', prompt: 'neon city rain, reflections, hyperreal' },
      { id: 'i4', url: 'https://picsum.photos/seed/b2/768/512', prompt: 'neon city rain, night, puddles' },
      { id: 'i5', url: 'https://picsum.photos/seed/b3/768/512', prompt: 'neon city rain, wide angle, cinematic' },
      { id: 'i6', url: 'https://picsum.photos/seed/b4/768/512', prompt: 'neon city rain, close-up' },
    ]
  },
  {
    id: 's3', label: 'Surreal Desert', time: '3h ago',
    images: [
      { id: 'i7', url: 'https://picsum.photos/seed/c1/640/640', prompt: 'surreal desert bloom, golden hour' },
      { id: 'i8', url: 'https://picsum.photos/seed/c2/640/640', prompt: 'surreal desert bloom, twilight' },
    ]
  },
  {
    id: 's4', label: 'Ancient Temple', time: 'Yesterday',
    images: [
      { id: 'i9', url: 'https://picsum.photos/seed/d1/640/480', prompt: 'ancient temple, fog, dramatic shadows' },
      { id: 'i10', url: 'https://picsum.photos/seed/d2/640/480', prompt: 'ancient temple, sunrise' },
    ]
  },
]

const ASPECT_OPTIONS = ['1:1', '4:3', '3:4', '16:9', '9:16', '4:5']
const STYLE_OPTIONS = ['None', 'Cinematic', 'Anime', 'Oil Paint', 'Minimal', 'Neon']
const MODEL_OPTIONS = [
  { id: 'flux-pro', label: 'Flux 1.1 Pro', desc: 'Best quality' },
  { id: 'flux-dev', label: 'Flux Dev', desc: 'Balanced' },
  { id: 'flux-schnell', label: 'Flux Schnell', desc: 'Fastest' },
  { id: 'ideogram', label: 'Ideogram 2.0', desc: 'Great text' },
]

type Mode = 'generate' | 'edit'
type Count = 1 | 2 | 4

interface GenImage { id: string; url: string; prompt: string; loading?: boolean }
interface Session { id: string; label: string; time: string; images: GenImage[] }

// ── Mini thumbnail row for sidebar session ────────────────────────────────────
function SessionThumbs({ images }: { images: GenImage[] }) {
  return (
    <div className="flex gap-1 mt-2">
      {images.slice(0, 4).map(img => (
        <div key={img.id} className="w-10 h-10 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
          <img src={img.url} alt="" className="w-full h-full object-cover" />
        </div>
      ))}
      {images.length > 4 && (
        <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center text-[10px] text-white/40 flex-shrink-0">
          +{images.length - 4}
        </div>
      )}
    </div>
  )
}

// ── Context rail item ─────────────────────────────────────────────────────────
function ContextChip({ img, onRemove }: { img: GenImage; onRemove: () => void }) {
  return (
    <div className="flex-shrink-0 relative group">
      <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#FFFF00]/40">
        <img src={img.url} alt="" className="w-full h-full object-cover" />
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <IconX size={8} className="text-white/70" />
      </button>
    </div>
  )
}

// ── Canvas image card ─────────────────────────────────────────────────────────
function CanvasCard({
  img, selected, onSelect, onDownload
}: {
  img: GenImage; selected: boolean; onSelect: () => void; onDownload: () => void
}) {
  if (img.loading) {
    return (
      <div className="rounded-xl overflow-hidden bg-white/5 animate-pulse flex items-center justify-center min-h-[200px]">
        <IconLoader2 size={24} className="text-white/20 animate-spin" />
      </div>
    )
  }
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden cursor-pointer group transition-all",
        selected ? "ring-2 ring-[#FFFF00]" : "ring-1 ring-white/5 hover:ring-white/20"
      )}
      onClick={onSelect}
    >
      <img src={img.url} alt={img.prompt} className="w-full h-full object-cover block" />
      {/* Selection check */}
      <div className={cn(
        "absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
        selected ? "bg-[#FFFF00] border-[#FFFF00]" : "bg-black/40 border-white/30 opacity-0 group-hover:opacity-100"
      )}>
        {selected && <IconCheck size={10} className="text-black" />}
      </div>
      {/* Actions overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 to-transparent">
        <button
          onClick={e => { e.stopPropagation(); onDownload() }}
          className="w-7 h-7 rounded-lg bg-black/50 flex items-center justify-center hover:bg-white/20"
        >
          <IconDownload size={13} className="text-white" />
        </button>
        <button
          onClick={e => { e.stopPropagation() }}
          className="w-7 h-7 rounded-lg bg-black/50 flex items-center justify-center hover:bg-white/20"
        >
          <IconMaximize size={13} className="text-white" />
        </button>
      </div>
    </div>
  )
}

export default function ImageUIConcept2() {
  const [mode, setMode] = useState<Mode>('generate')
  const [count, setCount] = useState<Count>(2)
  const [prompt, setPrompt] = useState('')
  const [sessions, setSessions] = useState<Session[]>(SESSIONS)
  const [activeSessionId, setActiveSessionId] = useState('s2')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aspect, setAspect] = useState('16:9')
  const [style, setStyle] = useState('Cinematic')
  const [model, setModel] = useState('flux-pro')
  const [steps, setSteps] = useState(30)
  const [guidance, setGuidance] = useState(7)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId)!
  const canvasImages = activeSession?.images ?? []
  const selectedImages = canvasImages.filter(img => selectedIds.has(img.id))

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleGenerate() {
    if (generating || !prompt.trim()) return
    setGenerating(true)
    const seeds = Array.from({ length: count }, (_, i) => `new${Date.now()}${i}`)
    const newImgs: GenImage[] = seeds.map((s, i) => ({
      id: `gen-${s}`, url: '', prompt: prompt.trim(), loading: true
    }))
    const newSession: Session = {
      id: `s-${Date.now()}`,
      label: prompt.trim().slice(0, 24),
      time: 'Just now',
      images: newImgs,
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    setSelectedIds(new Set())

    setTimeout(() => {
      setSessions(prev => prev.map(sess =>
        sess.id === newSession.id
          ? {
            ...sess, images: seeds.map((s, i) => ({
              id: `gen-${s}`,
              url: `https://picsum.photos/seed/${s}/${aspect === '16:9' ? '768/432' : aspect === '1:1' ? '640/640' : '640/768'}`,
              prompt: prompt.trim(),
              loading: false,
            }))
          }
          : sess
      ))
      setGenerating(false)
    }, 2800)
  }

  // auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
  }, [prompt])

  return (
    <div className="h-screen w-full bg-[#0A0A0A] flex flex-col overflow-hidden text-white pt-16">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 h-12 border-b border-white/5 flex items-center px-4 gap-3">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
        >
          <IconHistory size={16} />
        </button>
        <div className="w-px h-5 bg-white/10" />

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg">
          {(['generate', 'edit'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-semibold transition-all capitalize",
                mode === m ? "bg-[#FFFF00] text-black" : "text-white/40 hover:text-white/70"
              )}
            >
              {m === 'generate' ? <IconSparkles size={12} /> : <IconPencil size={12} />}
              {m}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg">
          {([1, 2, 4] as Count[]).map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={cn(
                "w-7 h-7 rounded-md text-xs font-bold transition-all",
                count === n ? "bg-white/[0.09] text-[#FFFF00]" : "text-white/30 hover:text-white/60"
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
            "flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-all",
            settingsOpen ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
          )}
        >
          <IconAdjustments size={14} />
          Settings
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── History sidebar ── */}
        <div className={cn(
          "flex-shrink-0 border-r border-white/5 flex flex-col overflow-hidden transition-all duration-300",
          sidebarOpen ? "w-60" : "w-0"
        )}>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
            <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold px-1 mb-3">History</p>
            {sessions.map(sess => (
              <button
                key={sess.id}
                onClick={() => { setActiveSessionId(sess.id); setSelectedIds(new Set()) }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl transition-all",
                  sess.id === activeSessionId ? "bg-white/10 ring-1 ring-white/10" : "hover:bg-white/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-white/80 truncate flex-1">{sess.label}</p>
                  <span className="text-[10px] text-white/25 flex-shrink-0 pt-0.5">{sess.time}</span>
                </div>
                <SessionThumbs images={sess.images} />
              </button>
            ))}
          </div>
          {/* New session */}
          <div className="flex-shrink-0 p-3 border-t border-white/5">
            <button
              onClick={() => {
                const ns: Session = { id: `s-new-${Date.now()}`, label: 'New session', time: 'Just now', images: [] }
                setSessions(prev => [ns, ...prev])
                setActiveSessionId(ns.id)
                setSelectedIds(new Set())
              }}
              className="w-full h-8 rounded-xl border border-dashed border-white/10 flex items-center justify-center gap-1.5 text-white/30 hover:text-white/60 hover:border-white/20 text-xs transition-all"
            >
              <IconPlus size={12} />
              New session
            </button>
          </div>
        </div>

        {/* ── Canvas ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas scroll area */}
          <div className="flex-1 overflow-y-auto p-5">
            {canvasImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
                <IconPhoto size={48} strokeWidth={1} />
                <p className="text-sm">Start generating to see images here</p>
              </div>
            ) : (
              <div className={cn(
                "grid gap-3",
                count === 1 ? "grid-cols-1 max-w-lg mx-auto" :
                count === 2 ? "grid-cols-2 max-w-3xl mx-auto" :
                "grid-cols-2"
              )}>
                {canvasImages.map(img => (
                  <CanvasCard
                    key={img.id}
                    img={img}
                    selected={selectedIds.has(img.id)}
                    onSelect={() => toggleSelect(img.id)}
                    onDownload={() => {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Prompt bar ── */}
          <div className="flex-shrink-0 p-4 border-t border-white/5">
            {/* Context rail */}
            {selectedImages.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-white/30 uppercase tracking-wider flex-shrink-0">Context</span>
                <div className="flex gap-2 flex-wrap">
                  {selectedImages.map(img => (
                    <ContextChip
                      key={img.id}
                      img={img}
                      onRemove={() => toggleSelect(img.id)}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="ml-auto text-[10px] text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="flex gap-3 items-end">
              <div className="flex-1 bg-white/5 rounded-xl border border-white/10 focus-within:border-white/25 transition-all px-4 py-3">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate()
                  }}
                  placeholder={mode === 'generate' ? "Describe what you want to create…" : "Describe the edit to apply…"}
                  rows={1}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/20 resize-none outline-none leading-relaxed"
                  style={{ height: 'auto', minHeight: '24px', maxHeight: '96px', overflowY: 'auto' }}
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all font-bold",
                  generating || !prompt.trim()
                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                    : "bg-[#FFFF00] text-black hover:bg-yellow-300 active:scale-95"
                )}
              >
                {generating
                  ? <IconLoader2 size={18} className="animate-spin" />
                  : <IconArrowUp size={18} strokeWidth={2.5} />
                }
              </button>
            </div>
            <p className="text-[10px] text-white/15 mt-2 text-right">⌘↩ to generate</p>
          </div>
        </div>

        {/* ── Settings panel ── */}
        <div className={cn(
          "flex-shrink-0 border-l border-white/5 flex flex-col overflow-y-auto scrollbar-hide transition-all duration-300",
          settingsOpen ? "w-64" : "w-0"
        )}>
          <div className="p-4 space-y-6 min-w-64">
            <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Settings</p>

            {/* Model */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-black mb-2">Model</p>
              <div className="space-y-1">
                {MODEL_OPTIONS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all",
                      model === m.id
                        ? "bg-[#FFFF00] text-black"
                        : "bg-white/5 text-white/60 hover:bg-white/8 hover:text-white/80"
                    )}
                  >
                    <span className="font-semibold">{m.label}</span>
                    <span className={cn("text-[10px]", model === m.id ? "text-black/60" : "text-white/30")}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect ratio */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-black mb-2">Aspect Ratio</p>
              <div className="grid grid-cols-3 gap-1">
                {ASPECT_OPTIONS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    className={cn(
                      "py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                      aspect === a
                        ? "bg-white/[0.09] text-[#FFFF00]"
                        : "bg-white/5 text-white/40 hover:text-white/70"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-black mb-2">Style</p>
              <div className="grid grid-cols-2 gap-1">
                {STYLE_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={cn(
                      "py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                      style === s
                        ? "bg-white/[0.09] text-[#FFFF00]"
                        : "bg-white/5 text-white/40 hover:text-white/70"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-black">Steps</p>
                <span className="text-xs font-bold text-[#FFFF00]">{steps}</span>
              </div>
              <input
                type="range" min={10} max={50} value={steps}
                onChange={e => setSteps(Number(e.target.value))}
                className="w-full accent-[#FFFF00] h-1 cursor-pointer"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/20">Fast</span>
                <span className="text-[10px] text-white/20">Quality</span>
              </div>
            </div>

            {/* Guidance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-black">Guidance</p>
                <span className="text-xs font-bold text-[#FFFF00]">{guidance}</span>
              </div>
              <input
                type="range" min={1} max={20} value={guidance}
                onChange={e => setGuidance(Number(e.target.value))}
                className="w-full accent-[#FFFF00] h-1 cursor-pointer"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/20">Creative</span>
                <span className="text-[10px] text-white/20">Precise</span>
              </div>
            </div>

            {/* Seed */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-black mb-2">Seed</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Random"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/25"
                />
                <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
                  <IconRefresh size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
