"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IMAGE_ASSETS } from "@/lib/constants"
import Image from "next/image"
import { cn } from "@/lib/utils"
import MyPopupView from "@/components/ui/my-popup-view"

const galleryItems = IMAGE_ASSETS.beforeAfterPairs.slice(0, 8)

export function InteractiveBentoGallerySecond() {
  const [selectedItem, setSelectedItem] = useState<any>(null)

  return (
    <section className="py-32 relative bg-black">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[800px] h-[800px] bg-[#FFFF00]/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-6xl font-bold text-center mb-6 leading-tight text-white">
            Masterpiece Collection
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto mb-8">
            State-of-the-art restoration. Tap any image to examine the details.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {galleryItems.map((item, index) => (
            <GalleryCard
              key={index}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      </div>

      <MyPopupView
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        beforeImage={selectedItem?.before || ""}
        afterImage={selectedItem?.after || ""}
        title="Enhancement Details"
        description="Experience the difference with our AI-powered restoration."
      />
    </section>
  )
}

function GalleryCard({ item, onClick }: { item: any, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-[#FFFF00]/50 transition-colors duration-300"
    >
      {/* AFTER Image (Default) */}
      <Image
        src={item.after}
        alt="After Enhancement"
        fill
        className="object-cover transition-opacity duration-300 ease-in-out group-hover:opacity-0"
        priority
      />

      {/* BEFORE Image (Revealed on Hover) */}
      <Image
        src={item.before}
        alt="Original Image"
        fill
        className="object-cover absolute inset-0 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
      />

      {/* Status Badges */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-white/70 uppercase">
          Original
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
        <div className="px-2 py-1 rounded bg-[#FFFF00]/10 backdrop-blur-sm border border-[#FFFF00]/20 text-[10px] font-bold text-[#FFFF00] uppercase">
          Masterpiece
        </div>
      </div>
    </div>
  )
}