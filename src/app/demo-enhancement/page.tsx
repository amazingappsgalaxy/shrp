"use client"

import PortraitEnhancementSuite from "@/components/ui/portrait-enhancement-suite"

export default function DemoEnhancementPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <PortraitEnhancementSuite
        beforeImage="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg"
        afterImage="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
        title="Watch the Magic Happen"
        description="Experience the power of AI as it transforms your portrait in real-time. Watch each enhancement step unfold with cinematic precision and see the magic happen before your eyes."
      />
    </div>
  )
}