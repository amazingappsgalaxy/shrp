"use client"

import MagicalPortraitSection from "@/components/sections/MagicalPortraitSection"

export default function MagicalPortraitPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <MagicalPortraitSection
        beforeImage="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg"
        afterImage="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
      />
    </div>
  )
}