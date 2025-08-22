"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useEffect, useState } from "react"

interface SliderItem {
  id: string
  name: string
  image: string
  url?: string
}

interface InfiniteSliderHorizontalProps {
  items: SliderItem[]
  className?: string
  speed?: number
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
  itemWidth?: number
  itemHeight?: number
}

export function InfiniteSliderHorizontal({
  items,
  className = "",
  speed = 30,
  direction = 'left',
  pauseOnHover = true,
  itemWidth = 120,
  itemHeight = 60,
}: InfiniteSliderHorizontalProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [duplicatedItems, setDuplicatedItems] = useState<SliderItem[]>([])

  // Duplicate items to create seamless loop
  useEffect(() => {
    const duplicateCount = Math.ceil(1200 / (itemWidth + 32)) // Ensure enough items for smooth loop
    const duplicated = []
    
    for (let i = 0; i < duplicateCount; i++) {
      duplicated.push(...items)
    }
    
    setDuplicatedItems(duplicated)
  }, [items, itemWidth])

  const totalWidth = duplicatedItems.length * (itemWidth + 32) // 32px for gap

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Gradient Overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Sliding Container */}
      <motion.div
        className="flex gap-8 items-center"
        animate={{
          x: direction === 'left' ? [-totalWidth / 2, 0] : [0, -totalWidth / 2],
        }}
        transition={{
          duration: totalWidth / speed,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          width: totalWidth,
        }}
        whileHover={pauseOnHover ? { animationPlayState: 'paused' } : {}}
      >
        {duplicatedItems.map((item, index) => (
          <motion.div
            key={`${item.id}-${index}`}
            className="flex-shrink-0 group cursor-pointer"
            style={{ width: itemWidth, height: itemHeight }}
            whileHover={{ scale: 1.1, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                <ItemContent item={item} itemWidth={itemWidth} itemHeight={itemHeight} />
              </a>
            ) : (
              <ItemContent item={item} itemWidth={itemWidth} itemHeight={itemHeight} />
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function ItemContent({ 
  item, 
  itemWidth, 
  itemHeight 
}: { 
  item: SliderItem
  itemWidth: number
  itemHeight: number
}) {
  return (
    <div className="relative w-full h-full rounded-xl glass border border-glass-border hover:glass-elevated hover:border-glass-border-elevated transition-all duration-300 p-4 flex items-center justify-center group">
      {/* Logo/Image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={item.image}
          alt={item.name}
          width={itemWidth - 32}
          height={itemHeight - 32}
          className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-60 group-hover:opacity-100"
        />
      </div>

      {/* Hover Glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-neon/5 to-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Name Tooltip */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-lg glass-elevated border border-glass-border-elevated text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
        {item.name}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-glass-border-elevated" />
      </div>
    </div>
  )
}

// Preset configurations for common use cases
export const PARTNER_LOGOS: SliderItem[] = [
  { id: '1', name: 'Adobe', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/Adobe Firefly.png' },
  { id: '2', name: 'DALL-E', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/Dalle.png' },
  { id: '3', name: 'Flux', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/Flux.png' },
  { id: '4', name: 'Midjourney', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/Midjourney2.png' },
  { id: '5', name: 'Stability AI', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/stability.png' },
  { id: '6', name: 'Grok', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/grok.png' },
]

export const FEATURED_RESULTS: SliderItem[] = [
  { id: '1', name: 'Portrait Enhancement', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/portfolio/Tove1.png' },
  { id: '2', name: 'Professional Headshot', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/portfolio/Tove2.png' },
  { id: '3', name: 'Creative Portrait', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/portfolio/Tove3.png' },
  { id: '4', name: 'Artistic Enhancement', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/portfolio/Tove4.png' },
  { id: '5', name: 'High Resolution', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/demos/4kresolution.png' },
  { id: '6', name: 'Beauty Enhancement', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/demos/ladypink.png' },
]