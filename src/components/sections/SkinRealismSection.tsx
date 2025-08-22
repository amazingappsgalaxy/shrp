"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Star, Zap, Sparkles, ArrowRight, CheckCircle, Play, Camera, Zap as Lightning, Shield, Target, Award } from "lucide-react"
import Image from "next/image"
import { HighlightText } from "@/components/ui/highlight-text"

export function SkinRealismSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0
    }
  }

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1
    }
  }

  return (
    <section className="relative py-20 bg-black overflow-hidden">
      {/* Background with Fixed Dots and Fades */}
      <div className="absolute inset-0">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900/20 to-black" />
        
        {/* Fixed dot pattern - closer spacing */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" patternUnits="userSpaceOnUse" width="40" height="40">
                <circle cx="20" cy="20" r="1" fill="white" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        
        {/* Top fade to background black */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent" />
        
        {/* Bottom fade to background black */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Header */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-card mb-8">
            <Shield className="h-5 w-5 text-accent-neon" />
            <span className="text-sm font-medium text-accent-neon">Professional Skin Enhancement</span>
            <Target className="h-5 w-5 text-accent-neon" />
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
            <span className="text-white">Achieve New Levels of</span>
            <br />
            <HighlightText highlightClassName="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              <span className="text-white">Skin Realism</span>
            </HighlightText>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-xl text-text-secondary leading-relaxed max-w-4xl mx-auto">
            Our advanced AI technology delivers unprecedented skin enhancement that maintains natural texture and authenticity. 
            Experience professional-grade results that preserve the essence of natural beauty while eliminating imperfections.
          </motion.p>
        </motion.div>

        {/* Two Different Enhanced Images - Clean Design */}
        <motion.div variants={containerVariants} className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Portrait Enhancement */}
            <motion.div variants={imageVariants} className="order-2 lg:order-1">
              <div className="relative">
                {/* Main Image Container - Clean, no overlays */}
                <div className="relative rounded-3xl overflow-hidden glass-premium mb-8">
                  <Image
                    src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Face+1+After.png"
                    alt="Enhanced Portrait Skin Quality"
                    width={600}
                    height={750}
                    className="w-full h-auto object-cover"
                  />
                  
                  {/* Clean label - top right corner */}
                  <div className="absolute top-4 right-4">
                    <div className="px-4 py-2 rounded-full glass-card-elevated border border-blue-400/30">
                      <span className="text-sm font-bold text-blue-400">PORTRAIT</span>
                    </div>
                  </div>
                </div>

                {/* Feature List - Clean text below image */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-4">Portrait Enhancement Features</h3>
                  {[
                    { text: "Professional skin smoothing", color: "text-blue-400", icon: "●" },
                    { text: "Natural texture preservation", color: "text-cyan-400", icon: "●" },
                    { text: "Advanced pore refinement", color: "text-teal-400", icon: "●" },
                    { text: "Celebrity-grade results", color: "text-indigo-400", icon: "●" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className={`text-lg ${item.color}`}>{item.icon}</span>
                      <span className="text-text-secondary">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Side - Fashion Photography Enhancement */}
            <motion.div variants={imageVariants} className="order-1 lg:order-2">
              <div className="relative">
                {/* Main Image Container - Clean, no overlays */}
                <div className="relative rounded-3xl overflow-hidden glass-premium mb-8">
                  <Image
                    src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
                    alt="Fashion Photography Skin Enhancement"
                    width={600}
                    height={750}
                    className="w-full h-auto object-cover"
                  />
                  
                  {/* Clean label - top left corner */}
                  <div className="absolute top-4 left-4">
                    <div className="px-4 py-2 rounded-full glass-card-elevated border border-purple-400/30">
                      <span className="text-sm font-bold text-purple-400">FASHION</span>
                    </div>
                  </div>
                </div>

                {/* Feature List - Clean text below image */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-4">Fashion Photography Features</h3>
                  {[
                    { text: "Runway-ready skin quality", color: "text-purple-400", icon: "●" },
                    { text: "Editorial-grade enhancement", color: "text-pink-400", icon: "●" },
                    { text: "Professional blemish removal", color: "text-rose-400", icon: "●" },
                    { text: "Commercial photography ready", color: "text-fuchsia-400", icon: "●" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className={`text-lg ${item.color}`}>{item.icon}</span>
                      <span className="text-text-secondary">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Clean Processing Indicator */}
          <motion.div variants={itemVariants} className="text-center mt-12">
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full glass-card-elevated border border-accent-neon/30">
              <Award className="w-5 h-5 text-accent-neon" />
              <span className="text-accent-neon font-medium">Industry-Leading Processing: 23 seconds</span>
              <div className="w-2 h-2 bg-accent-neon rounded-full animate-pulse" />
            </div>
          </motion.div>
        </motion.div>

        {/* Unique Features Section - Different from other sections */}
        <motion.div variants={containerVariants} className="mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Professional Studio Quality",
                description: "Achieve studio-grade results without expensive equipment or lighting setups",
                gradient: "from-blue-400 to-indigo-500",
                delay: 0.1
              },
              {
                icon: <Target className="h-8 w-8" />,
                title: "Precision Enhancement",
                description: "Target specific areas while maintaining natural skin characteristics",
                gradient: "from-emerald-400 to-teal-500",
                delay: 0.2
              },
              {
                icon: <Award className="h-8 w-8" />,
                title: "Industry Standard Results",
                description: "Meet professional photography and modeling industry requirements",
                gradient: "from-purple-400 to-pink-500",
                delay: 0.3
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                transition={{ delay: feature.delay }}
                className="group p-6 rounded-2xl glass-card hover:glass-card-elevated transition-all duration-300 hover:scale-105"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6`}>
                  <div className="w-full h-full rounded-2xl bg-black/80 flex items-center justify-center">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Unique Technology Showcase - Different content */}
        <motion.div variants={containerVariants} className="text-center">
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-subtle mb-8">
              <Star className="h-5 w-5 text-accent-neon" />
              <span className="text-sm font-medium text-accent-neon">Studio-Grade Technology</span>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Professional Photography Results in Seconds
            </h3>
            
            <p className="text-xl text-text-secondary leading-relaxed mb-12">
              Our proprietary AI algorithms are trained on millions of professional photography samples, 
              delivering results that meet the highest industry standards for skin enhancement and quality.
            </p>

            {/* Unique Stats - Different metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Studio Quality", value: "99.2%", color: "text-blue-400", icon: "🎬" },
                { label: "Processing Speed", value: "23s", color: "text-emerald-400", icon: "⚡" },
                { label: "Industry Rating", value: "A+", color: "text-purple-400", icon: "🏆" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl glass-card hover:glass-card-elevated transition-all duration-300"
                >
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <div className="text-text-secondary text-sm mb-2">{stat.label}</div>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}