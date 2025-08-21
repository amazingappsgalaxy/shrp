"use client"

import PortraitEnhancementSuite from "@/components/ui/portrait-enhancement-suite"

export default function TestEnhancementPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Portrait Enhancement Suite Test
        </h1>
        
        <PortraitEnhancementSuite
          beforeImage="/testpics/Girl+1+Before.jpg"
          afterImage="/testpics/Girl+1+After.png"
          title="Watch the Magic Happen"
          description="Experience the power of AI as it transforms your portrait in real-time. Watch each enhancement step unfold with cinematic precision and see the magic happen before your eyes."
        />
      </div>
    </div>
  )
}