'use client'

import { Sparkles } from 'lucide-react'

interface ElegantLoadingProps {
  message?: string
  className?: string
}

export function ElegantLoading({ message = "Loading...", className = "" }: ElegantLoadingProps) {
  return (
    <div className={`min-h-screen bg-black text-white flex items-center justify-center ${className}`}>
      <div className="text-center">
        {/* Simple Circular Spinner */}
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>

        {/* Loading Text */}
        <div className="text-white/60 text-sm">{message}</div>
      </div>
    </div>
  )
}

export default ElegantLoading