"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  IconLayoutSidebar, IconPhotoPlus, IconSend, 
  IconSettings, IconAdjustmentsHorizontal, IconX,
  IconSparkles, IconLock, IconFolder, IconEye
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1682687982501-1e58f813022e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687982185-531d09ec56fc?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687220199-d0124f48f95b?w=800&auto=format&fit=crop&q=80",
]

export default function Concept3Premium() {
  const [prompt, setPrompt] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeContexts, setActiveContexts] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    if (!prompt && activeContexts.length === 0) return
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setPrompt("")
    }, 2000)
  }

  const handleImageClick = (url: string) => {
    if (!activeContexts.includes(url)) {
      setActiveContexts(prev => [...prev, url])
      setIsSidebarOpen(true)
    }
  }

  return (
    <div className="flex h-screen bg-[#000000] text-zinc-300 font-sans overflow-hidden">
      
      {/* Precision Context Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-[#0a0a0c] border-r border-white/5 flex flex-col shrink-0 overflow-hidden relative z-20"
          >
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-transparent">
              <span className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                <IconFolder className="w-4 h-4 text-emerald-400" />
                Context Assets
              </span>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <IconLayoutSidebar className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Active References</span>
                  <span className="text-[10px] font-mono text-zinc-600 bg-white/5 px-2 py-0.5 rounded">{activeContexts.length}/4</span>
                </div>

                <AnimatePresence>
                  {activeContexts.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-white/[0.02]"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <IconPhotoPlus className="w-5 h-5 text-zinc-600" />
                      </div>
                      <p className="text-xs text-zinc-500">Tap any generated asset to inject it into context.</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {activeContexts.map((url, i) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          key={url}
                          className="group bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all rounded-2xl p-3 flex gap-3 items-center"
                        >
                          <img src={url} className="w-14 h-14 rounded-xl object-cover shadow-inner bg-black" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-zinc-200">Reference #{i+1}</h4>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500">
                              <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
                              Identity Enabled
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveContexts(prev => prev.filter(c => c !== url))}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors"
                          >
                            <IconX className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Global Parameters</span>
                <div className="bg-[#111115] border border-emerald-500/20 rounded-2xl p-4 flex gap-3 items-start">
                  <IconLock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-400">Strict Character Lock</h4>
                    <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">The active reference images will be used directly as character targets for Grok/Seedream generation.</p>
                  </div>
                </div>
              </div>

            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-full bg-[#050505] relative z-10">
        
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md sticky top-0 z-10 pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 border border-white/5 transition-colors">
                <IconLayoutSidebar className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400">
            <IconSparkles className="w-3.5 h-3.5" /> Engine: Grok 2 Image
          </div>
        </header>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12 pb-48">
          <div className="max-w-7xl mx-auto columns-1 sm:columns-2 xl:columns-3 gap-8 space-y-8">
            {DEMO_IMAGES.map((url, i) => (
              <div 
                key={i} 
                className="relative group rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 break-inside-avoid shadow-2xl"
              >
                <img src={url} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <button 
                    onClick={() => handleImageClick(url)}
                    className="w-full py-3 bg-white text-black rounded-xl text-xs font-bold shadow-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <IconEye className="w-4 h-4" /> Use as Context
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heavy-duty Command Area */}
        <div className="absolute bottom-0 inset-x-0 bg-[#0a0a0c] border-t border-white/5 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-30">
          <div className="max-w-6xl mx-auto flex gap-4 items-end">
            
            <button className="h-[60px] w-[60px] rounded-2xl bg-[#141418] border border-white/10 hover:border-white/20 flex items-center justify-center text-zinc-500 hover:text-white transition-all shrink-0">
              <IconAdjustmentsHorizontal className="w-6 h-6" />
            </button>

            <div className="flex-1 bg-[#141418] border border-white/10 rounded-2xl focus-within:border-white/20 focus-within:bg-[#1a1a1f] transition-all flex flex-col shadow-inner">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-5 pt-3">Command Box</span>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What are we building today?"
                className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-600 text-[15px] resize-none focus:outline-none px-5 py-3 h-[60px] custom-scrollbar"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
              />
            </div>

            <button 
               onClick={handleGenerate}
               disabled={!prompt && activeContexts.length === 0 || isGenerating}
               className="h-[60px] px-8 rounded-2xl bg-zinc-100 hover:bg-white disabled:bg-white/10 disabled:text-zinc-600 text-black font-bold flex items-center justify-center gap-2 shrink-0 transition-all shadow-xl"
            >
              {isGenerating ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : (
                <>Generate <IconSend className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

      </main>

    </div>
  )
}
