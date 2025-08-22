"use client"

import { motion } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { 
  Sparkles, 
  Eye, 
  SplitSquareHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  Zap,
  Star,
  Crown,
  ArrowUpRight,
  Sparkles as SparklesIcon
} from "lucide-react"
import { IMAGE_ASSETS } from "@/lib/constants"

interface ComparisonPair {
  before: string
  after: string
  title: string
  description?: string
  improvement?: string
  processingTime?: string
  category?: string
}

export function ComparisonSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAfter, setShowAfter] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [hasShownPopup, setHasShownPopup] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const comparisonSectionRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  // Static values to prevent hydration mismatch
  const staticImprovements = ["94%", "91%", "96%", "89%", "92%", "95%", "93%", "90%", "97%", "88%"]
  const staticProcessingTimes = ["28s", "32s", "25s", "30s", "29s", "26s", "31s", "27s", "24s", "33s"]
  const categories = ["Portrait", "Professional", "Lifestyle", "Creative", "Business"]
  
  // Select featured comparison pairs
  const comparisonPairs: ComparisonPair[] = IMAGE_ASSETS.beforeAfterPairs.slice(0, 4).map((pair, index) => ({
    before: pair.before,
    after: pair.after,
    title: pair.title,
    description: "AI-powered enhancement with professional results",
    improvement: staticImprovements[index] || "93%",
    processingTime: staticProcessingTimes[index] || "28s",
    category: categories[index % categories.length]
  }))

  const currentPair = comparisonPairs[currentIndex]

  // Show popup only once at the beginning
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setHasShownPopup(true)
    }, 2000) // Show after 2 seconds

    return () => {
      clearTimeout(showTimer)
    }
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % comparisonPairs.length)
        setShowAfter(false)
        setHasShownPopup(false) // Hide popup during auto-play
      }, 5000)
    } else if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, comparisonPairs.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + comparisonPairs.length) % comparisonPairs.length)
    setShowAfter(false)
    setHasShownPopup(false) // Hide popup when navigating
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % comparisonPairs.length)
    setShowAfter(false)
    setHasShownPopup(false) // Hide popup when navigating
  }

  const handleButtonClick = () => {
    setShowAfter(!showAfter)
    setHasShownPopup(false) // Hide popup permanently after first interaction
  }

  const scrollToComparison = () => {
    if (comparisonSectionRef.current) {
      comparisonSectionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <section id="comparison-section" className="content-section py-24 lg:py-32 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-surface/50 to-background" />
      <div className="absolute inset-0">
        {/* Floating geometric shapes */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-accent-neon/10 rounded-full blur-xl"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-32 w-24 h-24 bg-accent-purple/10 rounded-full blur-xl"
          animate={{
            y: [0, 15, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div
          className="absolute bottom-40 left-1/3 w-20 h-20 bg-accent-blue/10 rounded-full blur-xl"
          animate={{
            y: [0, -10, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-card mb-8"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-2 h-2 bg-accent-neon rounded-full animate-pulse" />
            <span className="text-sm font-medium text-text-secondary">AI Transformation Gallery</span>
            <div className="w-2 h-2 bg-accent-purple rounded-full animate-pulse" />
          </motion.div>
            
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-8">
            <span className="text-white">Witness the</span>
              <br />
            <span className="text-gradient-neon">Magic</span>
            </h2>
            
          <p className="text-xl text-text-secondary text-center max-w-4xl mx-auto mb-12 leading-relaxed">
            Experience the power of AI enhancement through our intuitive comparison interface. 
            Click the button to reveal the transformation.
            </p>
          </motion.div>

        {/* Simple Image Comparison Interface */}
        <motion.div
          ref={comparisonSectionRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-20"
        >
          <div className="max-w-6xl mx-auto">
            {/* Image Container */}
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden glass">
              {/* Before Image */}
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 1 }}
                animate={{ opacity: showAfter ? 0 : 1 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <Image
                  src={currentPair.before}
                  alt={`${currentPair.title} - Before`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                  priority
                />
              </motion.div>

              {/* After Image */}
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: showAfter ? 1 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <Image
                  src={currentPair.after}
                  alt={`${currentPair.title} - After`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                  priority
                />
              </motion.div>

              {/* Magic Button - Positioned on top of image */}
              <motion.button
                className="absolute z-20 w-20 h-20 rounded-full flex items-center justify-center group relative overflow-hidden"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '5px solid rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  boxShadow: `
                    0 0 40px rgba(255, 255, 255, 0.15),
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.1)
                  `
                }}
                onClick={handleButtonClick}
                initial={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = `
                    0 0 60px rgba(255, 255, 255, 0.25),
                    0 12px 40px rgba(0, 0, 0, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.15),
                    0 0 0 1px rgba(255, 255, 255, 0.15)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.boxShadow = `
                    0 0 40px rgba(255, 255, 255, 0.15),
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.1)
                  `;
                }}
              >
                {/* Inner glow effect */}
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)',
                    filter: 'blur(1px)'
                  }}
                />
                
                {/* Surface highlight */}
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.1) 100%)'
                  }}
                />
                
                <motion.div
                  animate={{ rotate: showAfter ? 180 : 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center justify-center relative z-10"
                >
                  <Sparkles className="w-10 h-10 text-white drop-shadow-lg" />
                </motion.div>
              </motion.button>

              {/* Glass Morphism Popup - Show only once at the beginning */}
              {!showAfter && hasShownPopup && (
                <motion.div
                  className="absolute z-30 pointer-events-none bg-white/8 border-2 border-white/25 rounded-2xl p-3 backdrop-blur-3xl shadow-2xl max-w-[320px] whitespace-nowrap"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    marginTop: '-120px',
                    marginLeft: '80px',
                    boxShadow: `
                      0 0 40px rgba(255, 255, 255, 0.15),
                      0 8px 32px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2),
                      inset 0 -1px 0 rgba(255, 255, 255, 0.1),
                      0 0 0 1px rgba(255, 255, 255, 0.1)
                    `
                  }}
                  initial={{ opacity: 0, scale: 0.7, y: 20, x: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: 20, x: -20 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: 0.5
                  }}
                >
                  {/* Glass morphism inner glow */}
                  <div 
                    className="absolute inset-0 rounded-[14px] pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)',
                      filter: 'blur(1px)'
                    }}
                  />
                  
                  {/* Surface highlight */}
                  <div 
                    className="absolute inset-0 rounded-[14px] pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(255, 255, 255, 0.08) 100%)'
                    }}
                  />
                  
                  {/* Message Text */}
                  <div className="text-white text-sm font-medium leading-tight tracking-wide relative z-10 text-center">
                    Click to see the magic happen ✨
                  </div>
                </motion.div>
              )}

              {/* Content Overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                  <div className="px-3 py-2 glass-elevated border border-glass-border-elevated rounded-lg backdrop-blur-xl">
                    <h3 className="text-lg font-bold text-white">{currentPair.title}</h3>
                    <p className="text-white/90 text-xs">
                      {showAfter ? "AI Enhanced Version" : currentPair.description}
                    </p>
                  </div>
                  <div className="px-3 py-2 glass-elevated border border-glass-border-elevated rounded-lg backdrop-blur-xl text-right">
                    <div className="text-xl font-bold text-accent-neon">
                      {showAfter ? "After" : "Before"}
                    </div>
                    <div className="text-white/90 text-xs">
                      {showAfter ? `+${currentPair.improvement} Quality` : "Original Image"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <motion.div
                className="absolute top-4 right-4 z-30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="px-4 py-2 bg-green-500/20 backdrop-blur-xl rounded-lg border border-green-500/30 text-sm font-medium text-green-400">
                  {currentPair.processingTime} Processing
                </div>
              </motion.div>
            </div>

            {/* Button Instructions */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-text-secondary text-sm">
                Click the button on the image to {showAfter ? 'show original' : 'reveal enhancement'}
              </p>
            </motion.div>

            {/* Control Panel */}
            <motion.div
              className="mt-8 flex items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <button
                onClick={goToPrevious}
                className="p-3 glass-elevated border border-glass-border-elevated rounded-xl hover:border-white/30 transition-all duration-300 group"
              >
                <ChevronLeft className="w-5 h-5 text-text-secondary group-hover:text-white transition-colors duration-300" />
              </button>

              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="px-6 py-3 glass-elevated border border-glass-border-elevated rounded-xl hover:border-white/30 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2">
                  {isAutoPlaying ? (
                    <Pause className="w-4 h-4 text-text-secondary group-hover:text-white transition-colors duration-300" />
                  ) : (
                    <Play className="w-4 h-4 text-text-secondary group-hover:text-white transition-colors duration-300" />
                  )}
                  <span className="text-text-secondary group-hover:text-white transition-colors duration-300 font-medium text-sm">
                    {isAutoPlaying ? 'Pause' : 'Auto-play'}
                  </span>
                </div>
              </button>

              <button
                onClick={goToNext}
                className="p-3 glass-elevated border border-glass-border-elevated rounded-xl hover:border-white/30 transition-all duration-300 group"
              >
                <ChevronRight className="w-5 h-5 text-text-secondary group-hover:text-white transition-colors duration-300" />
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Interactive Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-20"
        >
          <div className="max-w-6xl mx-auto px-2 md:px-4">
            <h3 className="text-3xl font-bold text-text-primary text-center mb-12">
              Explore All Transformations
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {comparisonPairs.map((pair, index) => (
                <motion.div
                  key={index}
                  className="relative group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    rotateY: 2,
                    rotateX: -1
                  }}
                  onClick={() => {
                    setCurrentIndex(index)
                    setShowAfter(false)
                    scrollToComparison()
                  }}
                >
                  <div className="aspect-square rounded-xl overflow-hidden glass relative">
                    <Image
                      src={pair.before}
                      alt={`${pair.title} - Before`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 40vw, (max-width: 1200px) 25vw, 20vw"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Enhanced Version Preview */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <Image
                        src={pair.after}
                        alt={`${pair.title} - After`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 40vw, (max-width: 1200px) 25vw, 20vw"
                      />
                    </div>
            
                    {/* Content with Glass Container - Smaller and positioned better */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="px-2 py-1 glass-elevated border border-glass-border-elevated rounded-md backdrop-blur-xl text-center">
                        <div className="text-white text-xs font-medium truncate">{pair.title}</div>
                      </div>
                    </div>
                  </div>
            
                  {/* Active indicator */}
                  {index === currentIndex && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-neon rounded-full border-2 border-background" />
                  )}
                </motion.div>
              ))}
            </div>
            </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <motion.button
            className="btn-premium text-xl px-12 py-6 rounded-3xl group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-0 flex items-center gap-4">
              Start Your Transformation
              <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}