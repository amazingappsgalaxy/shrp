"use client"

import MagicalPortraitSection from "@/components/sections/MagicalPortraitSection"

export default function MagicalPortraitPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <MagicalPortraitSection
        beforeImage="/testpics/Girl+1+Before.jpg"
        afterImage="/testpics/Girl+1+After.png"
      />
    </div>
  )
}