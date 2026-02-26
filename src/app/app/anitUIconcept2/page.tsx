"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  IconSparkles, IconWand, IconDragDrop, IconMenu2,
  IconArrowRight, IconLayersIntersect, IconMaximize,
  IconX, IconUpload
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1682687982501-1e58f813022e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687982185-531d09ec56fc?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687220199-d0124f48f95b?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1682687982134-2ac563b2228b?w=800&auto=format&fit=crop&q=80",
]

export default function Concept2Premium() {
  const [prompt, setPrompt] = useState("")
  const [contextTokens, setContextTokens] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    if (!prompt && contextTokens.length === 0) return
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setPrompt("")
    }, 2000)
  }

  const toggleContext = (img: string) => {
    setContextTokens(prev => prev.includes(img) ? prev.filter(i => i !== img) : [...prev, img])
  }

  return (
    <div className="flex flex-col h-screen bg-[#070709] text-zinc-200 font-sans overflow-hidden">
      
      {/* Ambient background styling */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Modern Top Nav */}
      <nav className="h-16 flex items-center justify-between px-6 absolute top-0 w-full z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 pl-2 pr-4 py-1.5 rounded-full shadow-lg">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <IconSparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-semibold text-sm">Flow Workspace</span>
        </div>
        
        <div className="pointer-events-auto bg-white/5 backdrop-blur-xl border border-white/10 p-1.5 rounded-full flex gap-1 shadow-lg">
          <button className="px-4 py-1.5 text-xs font-semibold rounded-full bg-white/10 text-white">Grid</button>
          <button className="px-4 py-1.5 text-xs font-semibold rounded-full hover:bg-white/10 text-zinc-400 transition-colors">Canvas</button>
        </div>
      </nav>

      {/* Immersive Main Feed */}
      <main className="flex-1 w-full h-full pt-24 pb-40 px-6 overflow-y-auto custom-scrollbar relative z-10">
        <div className="max-w-[1800px] mx-auto columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
          {DEMO_IMAGES.map((url, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              key={i} 
              className="relative group rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 break-inside-avoid"
            >
              <img src={url} className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Blur Overlay on Hover */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="absolute bottom-6 inset-x-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                <button 
                  onClick={() => toggleContext(url)}
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-xs font-semibold backdrop-blur-xl border flex items-center gap-2 transition-all shadow-xl",
                    contextTokens.includes(url)
                      ? "bg-white text-black border-transparent"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  )}
                >
                  <IconLayersIntersect className="w-4 h-4" />
                  {contextTokens.includes(url) ? "Added" : "Add to Input"}
                </button>
                
                <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                  <IconMaximize className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* The Floating Pill Input (Extremely Polished) */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-40 pointer-events-none">
        <div className="pointer-events-auto bg-[#18181b]/80 backdrop-blur-2xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] rounded-full p-2 flex items-center transition-all duration-300">
          
          <button className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors shrink-0">
            <IconUpload className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex items-center gap-2 px-2 overflow-x-auto custom-scrollbar min-w-0">
            {/* Inline image tokens */}
            <AnimatePresence>
              {contextTokens.map((img, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 'auto' }}
                  exit={{ opacity: 0, scale: 0.5, width: 0 }}
                  key={i}
                  className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full py-1 pl-1 pr-3 shrink-0"
                >
                  <img src={img} className="w-7 h-7 rounded-full object-cover" />
                  <span className="text-xs font-medium text-zinc-300">Ref</span>
                  <button onClick={() => toggleContext(img)} className="text-zinc-500 hover:text-white ml-1">
                    <IconX className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <input 
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Start creating..."
              className="flex-1 bg-transparent text-white text-[15px] placeholder:text-zinc-500 focus:outline-none min-w-[200px]"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!prompt && contextTokens.length === 0 || isGenerating}
            className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:grayscale transition-all shrink-0 ml-2"
          >
            {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
    </div>
  )
}
