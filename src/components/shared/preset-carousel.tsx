'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Preset {
  id: string
  name: string
  description: string
  thumbnail: string
  settings: any
}

interface PresetCarouselProps {
  presets: Preset[]
  selectedPreset?: string
  onPresetSelect: (preset: Preset) => void
  className?: string
}

export function PresetCarousel({ 
  presets, 
  selectedPreset, 
  onPresetSelect, 
  className 
}: PresetCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerPage = 4

  const nextPage = () => {
    setCurrentIndex(prev => 
      Math.min(prev + itemsPerPage, presets.length - itemsPerPage)
    )
  }

  const prevPage = () => {
    setCurrentIndex(prev => Math.max(prev - itemsPerPage, 0))
  }

  const visiblePresets = presets.slice(currentIndex, currentIndex + itemsPerPage)
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex + itemsPerPage < presets.length

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevPage}
          disabled={!canGoPrev}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 grid grid-cols-4 gap-4">
          {visiblePresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onPresetSelect(preset)}
              className={cn(
                "cursor-pointer rounded-lg border-2 p-2 transition-all",
                selectedPreset === preset.id
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="aspect-square rounded-md overflow-hidden mb-2">
                <img
                  src={preset.thumbnail}
                  alt={preset.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{preset.name}</p>
                <p className="text-xs text-gray-500">{preset.description}</p>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextPage}
          disabled={!canGoNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
