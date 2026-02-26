"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  IconSparkles, IconPhotoPlus, IconArrowUp, IconSettings, 
  IconLayoutGrid, IconWand, IconLayersLinked, IconDots,
  IconDownload, IconTrash, IconPlus
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

// High-quality demo images
const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1682687982501-1e58f813022e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687982185-531d09ec56fc?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687220199-d0124f48f95b?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687982134-2ac563b2228b?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687221038-404670f09439?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&auto=format&fit=crop&q=80",
]

export default function Concept1Premium() {
  const [prompt, setPrompt] = useState("")
  const [contextImages, setContextImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [focusedImage, setFocusedImage] = useState<string | null>(null)

  const handleGenerate = () => {
    if (!prompt && contextImages.length === 0) return
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setPrompt("")
    }, 2000)
  }

  const toggleContext = (url: string) => {
    setContextImages(prev => 
      prev.includes(url) ? prev.filter(i => i !== url) : [...prev, url]
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#030303] text-zinc-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* Absolute Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-indigo-500/5 blur-[120px] rounded-[100%] pointer-events-none" />

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md border-b border-white/[0.04] z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <IconSparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-wide text-sm bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
            Studio Canvas
          </span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-500">
            <button className="text-zinc-200 hover:text-white transition-colors">Generations</button>
            <button className="hover:text-white transition-colors">Assets</button>
            <button className="hover:text-white transition-colors">Settings</button>
          </nav>
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-8 pt-8 pb-48">
        <div className="max-w-[1600px] mx-auto">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {DEMO_IMAGES.map((url, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: "easeOut" }}
                key={i} 
                className="relative group rounded-3xl overflow-hidden bg-zinc-900/50 border border-white/[0.05] break-inside-avoid ring-1 ring-black/5"
                onMouseEnter={() => setFocusedImage(url)}
                onMouseLeave={() => setFocusedImage(null)}
              >
                <img 
                  src={url} 
                  alt={`Gen ${i}`} 
                  className={cn(
                    "w-full h-auto object-cover transition-all duration-700 ease-out",
                    focusedImage === url ? "scale-105" : "scale-100"
                  )} 
                />
                
                {/* Premium Glass Hover Overlay */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 flex flex-col justify-between p-5",
                  focusedImage === url ? "opacity-100" : "opacity-0"
                )}>
                  <div className="flex justify-end gap-2">
                    <button className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-black/60 border border-white/10 transition-all">
                      <IconDownload className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-black/60 border border-white/10 transition-all">
                      <IconDots className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2 isolate">
                    <button 
                      onClick={() => toggleContext(url)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 backdrop-blur-xl border transition-all duration-300 shadow-xl",
                        contextImages.includes(url)
                          ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                          : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                      )}
                    >
                      <IconLayersLinked className="w-4 h-4" />
                      {contextImages.includes(url) ? "IN CONTEXT" : "USE CONTEXT"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Glassmorphic Context & Prompt Dock */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-40 pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-3">
          
          {/* Context Chips (Floating slightly above) */}
          <AnimatePresence>
            {contextImages.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
                className="flex items-center gap-2 px-2 overflow-x-auto custom-scrollbar pb-1"
              >
                {contextImages.map((img, i) => (
                  <motion.div 
                    layoutId={`context-${img}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={i}
                    className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-indigo-500 shrink-0 group"
                  >
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => toggleContext(img)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm"
                    >
                      <IconTrash className="w-4 h-4 text-white" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Prompt Dock */}
          <div className="relative bg-[#0d0d11]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex items-end gap-2 transition-all">
            
            <button className="h-12 w-12 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors shrink-0">
              <IconPhotoPlus className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={contextImages.length > 0 ? "Describe how to edit or base generation on context..." : "Describe what you want to imagine..."}
                className="w-full bg-transparent text-zinc-100 placeholder:text-zinc-500 text-[15px] leading-relaxed resize-none focus:outline-none py-3 min-h-[48px] max-h-[160px] custom-scrollbar"
                rows={prompt.split('\n').length > 1 ? Math.min(prompt.split('\n').length, 5) : 1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleGenerate()
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pb-0.5 pr-0.5">
              <button className="h-11 w-11 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                <IconSettings className="w-5 h-5" />
              </button>
              <button 
                onClick={handleGenerate}
                disabled={!prompt && contextImages.length === 0 || isGenerating}
                className="h-11 px-5 rounded-full bg-zinc-100 hover:bg-white text-black font-semibold shadow-lg shadow-white/10 disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>Generate <IconArrowUp className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
