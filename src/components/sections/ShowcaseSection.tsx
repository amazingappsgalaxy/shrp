"use client"

import { motion, useInView } from "framer-motion"
import { useState, useRef } from "react"
import { ScrollXCarousel } from "@/components/ui/scroll-x-carousel"
import { InfiniteSliderHorizontal, PARTNER_LOGOS, FEATURED_RESULTS } from "@/components/ui/infinite-slider-horizontal"
import { fadeInVariants, staggerContainerVariants } from "@/lib/animations"
import type { Variants } from "framer-motion"
import { Award, Users, Zap, Sparkles, ArrowRight, TrendingUp, Star, CheckCircle, Eye, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

// Enhanced case study data
const caseStudies = [
  {
    id: '1',
    title: 'Fashion Photography Studio',
    company: 'Elite Fashion Co.',
    description: 'Reduced post-processing time by 80% while maintaining professional quality standards for high-end fashion shoots.',
    image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png',
    category: 'Fashion',
    categoryColor: 'from-pink-500 to-purple-600',
    bgGlow: 'bg-gradient-to-br from-pink-500/20 to-purple-600/20',
    stats: [
      { label: 'Time Saved', value: '80%', icon: Clock },
      { label: 'Quality Score', value: '98%', icon: Star },
      { label: 'Client Satisfaction', value: '100%', icon: CheckCircle },
    ],
    testimonial: "Sharpii.ai transformed our workflow completely. What used to take hours now takes minutes.",
    author: "Sarah Chen, Creative Director"
  },
  {
    id: '2',
    title: 'Portrait Photography Agency',
    company: 'ProPortrait Studios',
    description: 'Enhanced over 10,000 portraits with consistent, natural-looking results that exceeded client expectations.',
    image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Man+1+After.png',
    category: 'Portraits',
    categoryColor: 'from-blue-500 to-cyan-600',
    bgGlow: 'bg-gradient-to-br from-blue-500/20 to-cyan-600/20',
    stats: [
      { label: 'Images Enhanced', value: '10K+', icon: Eye },
      { label: 'Client Satisfaction', value: '99%', icon: Star },
      { label: 'Revenue Growth', value: '+250%', icon: TrendingUp },
    ],
    testimonial: "The consistency and quality we achieve with Sharpii.ai is unmatched. Our clients love the results.",
    author: "Michael Rodriguez, Studio Owner"
  },
  {
    id: '3',
    title: 'Wedding Photography Business',
    company: 'Eternal Moments',
    description: 'Streamlined wedding photo delivery from weeks to days, allowing photographers to take on more clients.',
    image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Girl+6+after.jpg',
    category: 'Weddings',
    categoryColor: 'from-rose-500 to-pink-600',
    bgGlow: 'bg-gradient-to-br from-rose-500/20 to-pink-600/20',
    stats: [
      { label: 'Delivery Speed', value: '5x Faster', icon: Clock },
      { label: 'New Clients', value: '+150%', icon: Users },
      { label: 'Profit Margin', value: '+85%', icon: TrendingUp },
    ],
    testimonial: "We can now deliver wedding albums in days instead of weeks. Our booking calendar is completely full.",
    author: "Emma Thompson, Lead Photographer"
  },
  {
    id: '4',
    title: 'Corporate Headshot Service',
    company: 'Executive Portraits Inc.',
    description: 'Automated professional headshot enhancement for Fortune 500 companies, ensuring brand consistency.',
    image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+After.png',
    category: 'Corporate',
    categoryColor: 'from-emerald-500 to-teal-600',
    bgGlow: 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20',
    stats: [
      { label: 'Fortune 500 Clients', value: '50+', icon: Target },
      { label: 'Headshots Enhanced', value: '25K+', icon: Eye },
      { label: 'Brand Consistency', value: '100%', icon: CheckCircle },
    ],
    testimonial: "Sharpii.ai ensures every headshot meets our corporate standards. The consistency is remarkable.",
    author: "David Park, Operations Manager"
  },
  {
    id: '5',
    title: 'Beauty & Cosmetics Brand',
    company: 'Luxe Beauty Co.',
    description: 'Enhanced product photography and model shots for social media campaigns with natural, authentic results.',
    image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Face+1+After.png',
    category: 'Beauty',
    categoryColor: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-gradient-to-br from-violet-500/20 to-purple-600/20',
    stats: [
      { label: 'Social Engagement', value: '+200%', icon: TrendingUp },
      { label: 'Conversion Rate', value: '+45%', icon: Target },
      { label: 'Campaign ROI', value: '+180%', icon: Star },
    ],
    testimonial: "Our social media engagement skyrocketed after using Sharpii.ai for our campaign images.",
    author: "Jessica Liu, Marketing Director"
  },
]

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
}

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
}

export function ShowcaseSection() {
  const [activeCase, setActiveCase] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-surface/5 via-background to-surface/5" />
        
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-accent-neon/10 to-accent-blue/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-accent-purple/10 to-accent-pink/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3e%3cpath d='m 60 0 l 0 60 l -60 0 l 0 -60 z' fill='none' stroke='%23ffffff' stroke-width='1'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23grid)' /%3e%3c/svg%3e")`
          }}
        />
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
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-card-elevated mb-8 border border-accent-neon/30 backdrop-blur-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-5 w-5 text-accent-neon" />
              </motion.div>
              <span className="text-sm font-semibold text-text-secondary">Success Stories</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-text-primary">Real Results from</span>
              <br />
              <span className="text-gradient-neon bg-gradient-to-r from-accent-neon via-accent-blue to-accent-purple bg-clip-text text-transparent">
                Real Businesses
              </span>
            </h2>

            <p className="text-xl text-text-secondary max-w-4xl mx-auto leading-relaxed">
              Discover how creative professionals and businesses worldwide are revolutionizing 
              their workflows with Sharpii.ai's cutting-edge AI enhancement technology.
            </p>
          </motion.div>
        </motion.div>

        {/* Interactive Case Studies Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-20"
        >
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {caseStudies.map((study, index) => (
              <motion.div
                key={study.id}
                variants={cardVariants}
                className="group relative"
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <motion.div
                  className="relative glass-card-elevated rounded-3xl p-8 border border-glass-border-elevated backdrop-blur-xl overflow-hidden h-full"
                  whileHover={{ 
                    scale: 1.02,
                    y: -8,
                    borderColor: "rgba(0, 255, 255, 0.4)"
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Background glow */}
                  <div className={`absolute inset-0 ${study.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
                  
                  {/* Category badge */}
                  <div className={`absolute top-6 right-6 px-3 py-1 rounded-full bg-gradient-to-r ${study.categoryColor} text-white text-xs font-semibold`}>
                    {study.category}
                  </div>
                  
                  {/* Image */}
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-surface/20 to-surface/40">
                    <Image
                      src={study.image}
                      alt={study.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-4 relative z-10">
                    <div>
                      <h3 className="text-xl font-bold text-text-primary mb-1 group-hover:text-accent-neon transition-colors duration-300">
                        {study.title}
                      </h3>
                      <p className="text-sm text-accent-neon font-medium">
                        {study.company}
                      </p>
                    </div>
                    
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {study.description}
                    </p>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      {study.stats.map((stat, statIndex) => {
                        const IconComponent = stat.icon
                        return (
                          <div key={statIndex} className="text-center p-3 rounded-xl glass-card border border-glass-border">
                            <IconComponent className="h-4 w-4 text-accent-neon mx-auto mb-1" />
                            <div className="text-lg font-bold text-text-primary">{stat.value}</div>
                            <div className="text-xs text-text-muted">{stat.label}</div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Testimonial */}
                    <div className="p-4 rounded-xl glass-card border border-glass-border">
                      <p className="text-sm text-text-secondary italic mb-2">
                        "{study.testimonial}"
                      </p>
                      <p className="text-xs text-accent-neon font-medium">
                        — {study.author}
                      </p>
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
            ))}
          </div>
        </motion.div>

        {/* Partner Logos Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-20"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-card mb-6 border border-accent-neon/30">
              <Users className="h-4 w-4 text-accent-neon" />
              <span className="text-sm font-medium text-text-secondary">
                Trusted by Industry Leaders
              </span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-text-primary">Powered by</span>{" "}
              <span className="text-gradient-neon">Leading AI Models</span>
            </h3>

            <p className="text-text-secondary max-w-3xl mx-auto">
              We integrate with the world's most advanced AI models to deliver 
              unparalleled image enhancement quality and consistency.
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <InfiniteSliderHorizontal
              items={PARTNER_LOGOS}
              speed={25}
              direction="left"
              pauseOnHover={true}
              itemWidth={140}
              itemHeight={80}
              className="mb-8"
            />
          </motion.div>
        </motion.div>

        {/* Featured Results Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-16"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-card mb-6 border border-accent-neon/30">
              <Zap className="h-4 w-4 text-accent-neon" />
              <span className="text-sm font-medium text-text-secondary">
                Featured Enhancements
              </span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-text-primary">Premium</span>{" "}
              <span className="text-gradient-neon">Enhancement Gallery</span>
            </h3>

            <p className="text-text-secondary max-w-3xl mx-auto">
              Experience the transformative power of our AI technology through 
              these carefully curated enhancement examples.
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <InfiniteSliderHorizontal
              items={FEATURED_RESULTS}
              speed={20}
              direction="right"
              pauseOnHover={true}
              itemWidth={160}
              itemHeight={120}
            />
          </motion.div>
        </motion.div>

        {/* Enhanced CTA Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center"
        >
          <div className="glass-card-elevated rounded-3xl p-8 md:p-12 border border-glass-border-elevated backdrop-blur-xl">
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-3xl md:text-4xl font-bold text-text-primary">
                Ready to Join These Success Stories?
              </h3>
              
              <p className="text-xl text-text-secondary">
                Transform your business with the same AI technology trusted by industry leaders worldwide.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  className="btn-premium px-8 py-4 text-lg font-semibold group"
                  size="lg"
                >
                  <Sparkles className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Start Your Success Story
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
                
                <div className="text-sm text-text-muted">
                  Join 50,000+ professionals • Free trial available
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}