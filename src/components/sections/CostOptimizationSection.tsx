"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { 
  DollarSign, 
  TrendingDown, 
  Zap, 
  Calculator, 
  PiggyBank,
  Clock,
  Target,
  ArrowRight,
  CheckCircle,
  Sparkles,
  BarChart3,
  Coins,
  Timer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

export function CostOptimizationSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [imagesPerMonth, setImagesPerMonth] = useState([100])
  const [activeFeature, setActiveFeature] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  } as const

  const cardVariants = {
    hidden: { opacity: 0, y: 40, rotateX: 15 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  } as const

  const costFeatures = [
    {
      icon: TrendingDown,
      title: "Smart Credit Usage",
      description: "AI-powered algorithms automatically optimize processing parameters to minimize credit consumption while maintaining premium quality output",
      savings: "Up to 40%",
      color: "from-accent-neon to-accent-blue",
      bgGlow: "bg-gradient-to-r from-accent-neon/20 to-accent-blue/20",
      features: ["Intelligent compression", "Quality optimization", "Auto-enhancement"]
    },
    {
      icon: Zap,
      title: "Batch Processing",
      description: "Process hundreds of images simultaneously with bulk discounts, queue optimization, and parallel processing for maximum efficiency",
      savings: "Up to 60%",
      color: "from-accent-blue to-accent-purple",
      bgGlow: "bg-gradient-to-r from-accent-blue/20 to-accent-purple/20",
      features: ["Bulk discounts", "Queue optimization", "Parallel processing"]
    },
    {
      icon: BarChart3,
      title: "Usage Analytics",
      description: "Real-time monitoring, detailed usage reports, and AI-powered recommendations to optimize your credit spending patterns",
      savings: "Up to 25%",
      color: "from-accent-purple to-accent-pink",
      bgGlow: "bg-gradient-to-r from-accent-purple/20 to-accent-pink/20",
      features: ["Real-time monitoring", "Usage reports", "Smart recommendations"]
    }
  ]

  const pricingComparison = [
    { 
      service: "Traditional Editing", 
      cost: "$50-200", 
      time: "2-8 hours", 
      quality: "Variable",
      icon: Clock,
      color: "text-red-400",
      bgColor: "bg-red-500/10"
    },
    { 
      service: "Other AI Tools", 
      cost: "$20-80", 
      time: "30-60 min", 
      quality: "Inconsistent",
      icon: Timer,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10"
    },
    { 
      service: "Sharpii.ai", 
      cost: "Starting at $9", 
      time: "< 30 sec", 
      quality: "Professional",
      icon: Zap,
      color: "text-accent-neon",
      bgColor: "bg-accent-neon/10",
      recommended: true
    }
  ]

  // Calculate savings based on slider value
  const calculateSavings = (images: number) => {
    const traditionalCost = images * 125 // Average $125 per image
    const otherAICost = images * 50 // Average $50 per image
    const sharpiiCost = images * 10 // Average $10 per image
    
    return {
      traditional: traditionalCost - sharpiiCost,
      otherAI: otherAICost - sharpiiCost,
      timeTraditional: images * 5, // 5 hours per image
      timeOtherAI: images * 0.75, // 45 minutes per image
      timeSharpii: images * 0.008 // 30 seconds per image
    }
  }

  const savings = calculateSavings(imagesPerMonth[0])

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-surface/5 via-background to-surface/10" />
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-20 w-80 h-80 bg-gradient-to-r from-accent-neon/15 to-accent-blue/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-gradient-to-r from-accent-purple/15 to-accent-pink/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 rounded-full blur-2xl animate-pulse delay-500" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3e%3cpath d='m 40 0 l 0 40 l -40 0 l 0 -40 z' fill='none' stroke='%23ffffff' stroke-width='1'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23grid)' /%3e%3c/svg%3e")`
          }}
        />
        
        {/* Floating elements */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-accent-neon rounded-full animate-ping" />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-accent-blue rounded-full animate-ping delay-700" />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-accent-purple rounded-full animate-ping delay-1000" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-20"
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-card-elevated backdrop-blur-glass-heavy mb-8 border border-accent-neon/30">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <PiggyBank className="h-5 w-5 text-accent-neon" />
              </motion.div>
              <span className="text-sm font-semibold text-text-secondary">Smart Cost Optimization</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-text-primary">Save</span>{" "}
              <span className="text-gradient-neon bg-gradient-to-r from-accent-neon via-accent-blue to-accent-purple bg-clip-text text-transparent">
                Up to 85%
              </span>
              <br />
              <span className="text-text-primary">on Image Processing</span>
            </h2>
            
            <p className="text-xl text-text-secondary max-w-4xl mx-auto leading-relaxed">
              Our revolutionary AI-powered cost optimization system automatically reduces expenses 
              while delivering professional-grade results. Experience the future of efficient image processing.
            </p>
          </motion.div>

          {/* Key Stats */}
          <motion.div variants={itemVariants} className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="glass-card-elevated rounded-2xl p-6 border border-glass-border-elevated backdrop-blur-glass-heavy">
                <div className="text-3xl font-bold text-accent-neon mb-2">85%</div>
                <div className="text-sm text-text-secondary">Cost Reduction</div>
              </div>
              <div className="glass-card-elevated rounded-2xl p-6 border border-glass-border-elevated backdrop-blur-glass-heavy">
                <div className="text-3xl font-bold text-accent-blue mb-2">30s</div>
                <div className="text-sm text-text-secondary">Processing Time</div>
              </div>
              <div className="glass-card-elevated rounded-2xl p-6 border border-glass-border-elevated backdrop-blur-glass-heavy">
                <div className="text-3xl font-bold text-accent-purple mb-2">99.9%</div>
                <div className="text-sm text-text-secondary">Quality Maintained</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Interactive Cost Features */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-20"
        >
          <div className="grid lg:grid-cols-3 gap-8">
            {costFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  className="group relative"
                  onHoverStart={() => setHoveredCard(index)}
                  onHoverEnd={() => setHoveredCard(null)}
                >
                  <motion.div
                    className="relative glass-card-elevated rounded-3xl p-8 border border-glass-border-elevated backdrop-blur-glass-heavy overflow-hidden h-full"
                    whileHover={{ 
                      scale: 1.02,
                      y: -8,
                      borderColor: "rgba(0, 255, 255, 0.4)"
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {/* Background glow */}
                    <div className={`absolute inset-0 ${feature.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
                    
                    {/* Savings badge */}
                    <div className="absolute top-6 right-6">
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${feature.color} text-white text-xs font-bold`}>
                        {feature.savings}
                      </div>
                    </div>
                    
                    {/* Icon */}
                    <div className="mb-6 relative z-10">
                      <motion.div
                        className={`p-4 rounded-2xl glass-card border border-glass-border w-fit bg-gradient-to-r ${feature.color} bg-clip-text`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4 relative z-10">
                      <h3 className="text-2xl font-bold text-text-primary group-hover:text-accent-neon transition-colors duration-300">
                        {feature.title}
                      </h3>
                      
                      <p className="text-text-secondary leading-relaxed">
                        {feature.description}
                      </p>
                      
                      {/* Feature list */}
                      <div className="space-y-2">
                        {feature.features.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-accent-neon" />
                            <span className="text-sm text-text-secondary">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Hover arrow */}
                    <motion.div
                      className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      <ArrowRight className="h-5 w-5 text-accent-neon" />
                    </motion.div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Why Choose Sharpii.ai - Redesigned */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-20"
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-text-primary">Why Choose</span>{" "}
              <span className="text-gradient-neon">Sharpii.ai?</span>
            </h3>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Experience the future of image enhancement with our revolutionary AI technology
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {pricingComparison.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <motion.div
                    key={index}
                    className={`relative group ${
                      item.recommended 
                        ? 'order-first md:order-none' 
                        : ''
                    }`}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {item.recommended && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-accent-neon to-accent-blue text-white text-sm font-bold shadow-lg">
                          ✨ BEST VALUE
                        </div>
                      </div>
                    )}
                    
                    <div className={`relative h-full p-8 rounded-2xl border transition-all duration-300 ${
                      item.recommended 
                        ? 'bg-gradient-to-br from-accent-neon/5 to-accent-blue/5 border-accent-neon/30 shadow-xl shadow-accent-neon/10' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}>
                      
                      {/* Icon */}
                      <div className="flex justify-center mb-6">
                        <div className={`p-4 rounded-xl ${
                          item.recommended 
                            ? 'bg-gradient-to-br from-accent-neon/20 to-accent-blue/20' 
                            : item.bgColor
                        }`}>
                          <IconComponent className={`h-8 w-8 ${
                            item.recommended ? 'text-accent-neon' : item.color
                          }`} />
                        </div>
                      </div>
                      
                      {/* Service Name */}
                      <h4 className={`text-xl font-bold text-center mb-6 ${
                        item.recommended ? 'text-accent-neon' : 'text-white'
                      }`}>
                        {item.service}
                      </h4>
                      
                      {/* Pricing */}
                      <div className="text-center mb-6">
                        <div className={`text-3xl font-bold mb-2 ${
                          item.recommended ? 'text-accent-neon' : item.color
                        }`}>
                          {item.cost}
                        </div>
                        <div className="text-sm text-gray-400">per image</div>
                      </div>
                      
                      {/* Features */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                          <span className="text-gray-300">Processing Time</span>
                          <span className={`font-semibold ${
                            item.recommended ? 'text-accent-neon' : item.color
                          }`}>
                            {item.time}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-300">Quality</span>
                          <span className={`font-semibold ${
                            item.recommended ? 'text-accent-neon' : item.color
                          }`}>
                            {item.quality}
                          </span>
                        </div>
                      </div>
                      
                      {item.recommended && (
                        <div className="mt-6 pt-6 border-t border-accent-neon/20">
                          <Button className="w-full bg-gradient-to-r from-accent-neon to-accent-blue hover:from-accent-neon/80 hover:to-accent-blue/80 text-white font-semibold py-3 rounded-xl transition-all duration-300">
                            Get Started
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>


      </div>
    </section>
  )
}