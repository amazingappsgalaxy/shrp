"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Zap, Sparkles, Grid3X3, Maximize2, Image } from "lucide-react"
import { SimpleImageViewer } from "../ui/simple-image-viewer"
import { EnhancementGalleryModal } from "../ui/enhancement-gallery-modal"
import { IMAGE_ASSETS } from "@/lib/constants"

interface GalleryItem {
  before: string
  after: string
  title: string
  description: string
  category: string
  improvement: string
  processingTime: string
}

// Static values to prevent hydration mismatch
const staticImprovements = ["94%", "91%", "96%", "89%", "92%", "95%", "93%", "97%", "88%", "90%"]
const staticProcessingTimes = ["28s", "32s", "25s", "30s", "29s", "26s", "31s", "27s", "33s", "24s"]

const galleryItems: GalleryItem[] = IMAGE_ASSETS.beforeAfterPairs.map((pair, index) => ({
  before: pair.before,
  after: pair.after,
  title: pair.title,
  description: "AI-powered image enhancement with professional results",
  category: index < 3 ? 'Portrait' : index < 6 ? 'Professional' : 'Artistic',
  improvement: staticImprovements[index] || "93%",
  processingTime: staticProcessingTimes[index] || "28s"
}))

const categories = ["All", "Portrait", "Professional", "Artistic"]

export function GallerySection() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)

  const filteredItems = selectedCategory === "All" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory)

  const handleImageClick = (index: number) => {
    setModalIndex(index)
    setIsModalOpen(true)
  }

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface-elevated to-surface opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-neon/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <Image className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-medium text-text-secondary">AI Enhanced Gallery</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8">
            <span className="text-white">Transform Your</span>
            <br />
            <span className="text-gradient-neon">Images</span>
          </h2>
          
          <p className="text-lg text-text-secondary text-center max-w-3xl mx-auto mb-12">
            See the incredible results of our AI enhancement technology. From portraits to landscapes, 
            every image gets the professional treatment it deserves.
          </p>
        </motion.div>

        {/* Filter Controls */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 p-2 glass-card rounded-2xl border border-glass-border">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-6 py-3 rounded-xl font-medium transition-all duration-300
                  ${selectedCategory === category
                    ? "bg-accent-neon text-white shadow-neon"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Unified Image Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <SimpleImageViewer
            pairs={filteredItems}
            showStats={true}
            className="max-w-6xl mx-auto"
            onImageClick={handleImageClick}
          />
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="text-center p-6 glass-card rounded-2xl border border-glass-border">
            <div className="w-12 h-12 bg-accent-neon/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-accent-neon" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Interactive Comparison</h3>
            <p className="text-text-secondary text-sm">Drag the slider to see before and after results in real-time</p>
          </div>

          <div className="text-center p-6 glass-card rounded-2xl border border-glass-border">
            <div className="w-12 h-12 bg-accent-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-6 h-6 text-accent-blue" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Zoom & Pan</h3>
            <p className="text-text-secondary text-sm">Click and drag to explore details, scroll to zoom in and out</p>
          </div>

          <div className="text-center p-6 glass-card rounded-2xl border border-glass-border">
            <div className="w-12 h-12 bg-accent-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-accent-purple" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Multiple Views</h3>
            <p className="text-text-secondary text-sm">Switch between comparison, before-only, and after-only views</p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <motion.button
            className="btn-premium inline-flex items-center gap-3 text-lg px-8 py-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5" />
            Transform Your Images Now
          </motion.button>
        </motion.div>
      </div>

      {/* Enhanced Gallery Modal */}
      <EnhancementGalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pairs={filteredItems}
        initialIndex={modalIndex}
      />
    </section>
  )
}