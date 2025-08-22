"use client"

import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import MyPopupView from "./my-popup-view"
import { Maximize2, Eye, Download, Sparkles } from "lucide-react"

interface GalleryItem {
  id: number
  title: string
  description: string
  beforeImage: string
  afterImage: string
  category: string
  size: "small" | "medium" | "large"
}

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: "Portrait Enhancement",
    description: "Professional skin smoothing and detail enhancement",
    beforeImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg",
    afterImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png",
    category: "Portrait",
    size: "large"
  },
  {
    id: 2,
    title: "Asian Portrait",
    description: "Advanced texture recovery and sharpening",
    beforeImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+before.jpg",
    afterImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+after.png",
    category: "Portrait",
    size: "medium"
  },
  {
    id: 3,
    title: "Professional Male",
    description: "AI-powered skin enhancement and detail boost",
    beforeImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Man+1+Before.jpg",
    afterImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Man+1+After.png",
    category: "Professional",
    size: "medium"
  },
  {
    id: 4,
    title: "Detail Enhancement",
    description: "Micro-detail recovery and clarity boost",
    beforeImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Face+1+Before.jpg",
    afterImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Face+1+After.png",
    category: "Detail",
    size: "small"
  },
  {
    id: 5,
    title: "Skin Perfection",
    description: "Advanced skin smoothing while preserving natural texture",
    beforeImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Girl+6+before.jpg",
    afterImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Girl+6+after.jpg",
    category: "Beauty",
    size: "small"
  },
  {
    id: 6,
    title: "Professional Headshot",
    description: "Studio-quality enhancement for business portraits",
    beforeImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Man+1+Before.jpg",
    afterImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Man+1+After.png",
    category: "Business",
    size: "large"
  }
]

export function InteractiveBentoGallery() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0, 0, 0.2, 1] as const
      }
    }
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "large":
        return "md:col-span-3 md:row-span-3 h-96 md:h-full"
      case "medium":
        return "md:col-span-2 md:row-span-2 h-80 md:h-full"
      case "small":
        return "md:col-span-1 md:row-span-1 h-64"
      default:
        return "h-64"
    }
  }

  return (
    <section className="content-section py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-purple/10" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-gradient-purple">Enhancement Gallery</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Explore real examples of our AI-powered image enhancement technology in action.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-6 gap-6 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {galleryItems.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className={`group relative overflow-hidden rounded-2xl glass cursor-pointer ${getSizeClasses(item.size)}`}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => setSelectedItem(item)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {/* Before/After Images */}
              <div className="relative w-full h-full overflow-hidden">
                {/* Before Image */}
                <Image
                  src={item.beforeImage}
                  alt={`${item.title} - Before`}
                  fill
                  className="object-cover transition-opacity duration-500"
                  style={{
                    opacity: hoveredItem === item.id ? 0 : 1
                  }}
                />
                
                {/* After Image */}
                <Image
                  src={item.afterImage}
                  alt={`${item.title} - After`}
                  fill
                  className="object-cover transition-opacity duration-500"
                  style={{
                    opacity: hoveredItem === item.id ? 1 : 0
                  }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <motion.div
                  className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  {/* Category Badge */}
                  <div className="inline-block px-3 py-1 rounded-full bg-accent-neon/20 border border-accent-neon/30 mb-3">
                    <span className="text-xs font-medium text-accent-neon">
                      {item.category}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    {item.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <Eye className="h-4 w-4 text-white" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <Maximize2 className="h-4 w-4 text-white" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <Download className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </motion.div>

                {/* Hover Indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="px-3 py-1 rounded-full bg-accent-neon/20 border border-accent-neon/30">
                    <span className="text-xs font-medium text-accent-neon">
                      {hoveredItem === item.id ? "After" : "Before"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-neon/20 to-accent-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
            </motion.div>
          ))}
        </motion.div>

        {/* MyPopupView for Selected Item */}
        <MyPopupView
          beforeImage={selectedItem?.beforeImage || ""}
          afterImage={selectedItem?.afterImage || ""}
          title={selectedItem?.title || ""}
          description={selectedItem?.description || ""}
          onClose={() => setSelectedItem(null)}
          isOpen={!!selectedItem}
        />
      </div>
    </section>
  )
}

export function InteractiveBentoGallerySecond() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0, 0, 0.2, 1] as const
      }
    }
  }

  // Mock processing data for each item
  const getProcessingInfo = (itemId: number) => {
    const processingTimes = ["23s", "19s", "27s", "21s", "25s", "29s"]
    const resolutions = ["4K", "2K", "4K", "HD", "2K", "4K"]
    const improvements = ["85%", "92%", "78%", "88%", "91%", "87%"]
    
    return {
      time: processingTimes[itemId - 1] || "22s",
      resolution: resolutions[itemId - 1] || "HD",
      improvement: improvements[itemId - 1] || "85%"
    }
  }

  return (
    <section className="content-section py-24 relative overflow-hidden">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-neon/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-gradient-neon">AI Enhanced Gallery</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Hover to see the AI enhancement results. Crystal clear quality with no distractions.
          </p>
        </motion.div>

        {/* 2x2 Grid - Only 4 Photos */}
        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {galleryItems.slice(0, 4).map((item) => {
            const processingInfo = getProcessingInfo(item.id)
            
            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-3xl glass-card cursor-pointer"
                style={{ aspectRatio: '3/4' }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => setSelectedItem(item)}
              >
                {/* Image Container - NO OVERLAYS */}
                <div className="relative w-full h-full overflow-hidden rounded-3xl">
                  {/* Before Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={item.beforeImage}
                      alt={`${item.title} - Before`}
                      fill
                      className="object-cover transition-opacity duration-300"
                      style={{ opacity: hoveredItem === item.id ? 0 : 1 }}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={item.id <= 2}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  </div>

                  {/* After Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={item.afterImage}
                      alt={`${item.title} - After`}
                      fill
                      className="object-cover transition-opacity duration-300"
                      style={{ opacity: hoveredItem === item.id ? 1 : 0 }}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={item.id <= 2}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  </div>

                  {/* AI Enhanced Tag - Only on Hover */}
                  {hoveredItem === item.id && (
                    <div className="absolute top-4 right-4 z-30">
                      <div className="px-3 py-1 rounded-full glass-subtle flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-accent-neon" />
                        <span className="text-xs font-medium text-accent-neon">AI Enhanced</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Minimal Processing Info Dock - Only on Hover */}
                {hoveredItem === item.id && (
                  <div className="absolute bottom-3 left-3 right-3 z-30">
                    <div className="glass-card rounded-xl p-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-gray-400 mb-1">Time</div>
                            <div className="text-white font-medium">{processingInfo.time}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400 mb-1">Quality</div>
                            <div className="text-white font-medium">{processingInfo.resolution}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400 mb-1">Enhanced</div>
                            <div className="text-accent-neon font-medium">+{processingInfo.improvement}</div>
                          </div>
                        </div>
                        <button className="px-3 py-1 rounded-md glass-subtle hover:border-accent-neon/50 transition-all duration-300 text-white hover:text-accent-neon text-xs font-medium">
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                )}


              </motion.div>
            )
          })}
        </motion.div>

        {/* Popup for Selected Item */}
        <MyPopupView
          beforeImage={selectedItem?.beforeImage || ""}
          afterImage={selectedItem?.afterImage || ""}
          title={selectedItem?.title || ""}
          description={selectedItem?.description || ""}
          onClose={() => setSelectedItem(null)}
          isOpen={!!selectedItem}
        />
      </div>
    </section>
  )
}