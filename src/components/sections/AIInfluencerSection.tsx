"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import {
  Sparkles, TrendingUp, Users, CheckCircle, ArrowRight, Crown, Heart, MessageCircle, Share2, Award
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function AIInfluencerSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeComparison, setActiveComparison] = useState(0)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" as any }
    }
  }

  // AI Influencer Transformations
  const transformations = [
    {
      id: 1,
      name: "Aria Chen",
      username: "@aria_ai",
      category: "Fashion & Lifestyle",
      beforeImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg",
      afterImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png",
      metrics: {
        engagement: "+127%",
        followers: "2.4M",
        authenticity: "99.8%",
        brandDeals: "+89%"
      },
      description: "From natural beauty to AI-enhanced perfection while maintaining authentic appeal"
    },
    {
      id: 2,
      name: "Marcus Digital",
      username: "@marcus_digi",
      category: "Tech & Innovation",
      beforeImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+Before.jpg",
      afterImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+After.png",
      metrics: {
        engagement: "+156%",
        followers: "1.8M",
        authenticity: "96.2%",
        brandDeals: "+134%"
      },
      description: "Professional enhancement that elevates content while preserving genuine personality"
    },
    {
      id: 3,
      name: "Sophia AI",
      username: "@sophia_ai",
      category: "Art & Creativity",
      beforeImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+2+Before (1).jpg",
      afterImage: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+2+After.png",
      metrics: {
        engagement: "+180%",
        followers: "3.1M",
        authenticity: "97.5%",
        brandDeals: "+150%"
      },
      description: "Transforming artistic visions into captivating digital realities with AI"
    }
  ]

  // Safely determine the active transformation
  const activeTrans = transformations[activeComparison % transformations.length]!

  return (
    <section className="py-32 relative overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-accent-purple/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent-blue/10 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Header */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-24"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-8">
            <Crown className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">Influencer Grade AI</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="font-heading text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white block">Humanize Your</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFF00] via-accent-purple to-accent-pink">
              AI Influencers
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl text-white/60 leading-relaxed max-w-3xl mx-auto">
            Transform AI-generated content into authentic, relatable personalities that connect with real audiences.
          </motion.p>
        </motion.div>

        {/* Improved Segmented Control */}
        <motion.div
          className="flex justify-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="inline-flex glass-card p-2 rounded-2xl gap-2 overflow-x-auto max-w-full">
            {transformations.map((influencer, index) => (
              <button
                key={influencer.id}
                onClick={() => setActiveComparison(index)}
                className={cn(
                  "relative flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 min-w-[200px]",
                  activeComparison === index
                    ? "bg-[#FFFF00]/10 shadow-lg border border-[#FFFF00]/30"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full p-[2px]",
                  activeComparison === index ? "bg-gradient-to-tr from-[#FFFF00] to-accent-purple" : "bg-white/10"
                )}>
                  <Image
                    src={influencer.afterImage}
                    alt={influencer.name}
                    width={40}
                    height={40}
                    className="w-full h-full rounded-full object-cover border-2 border-black"
                  />
                </div>
                <div className="text-left">
                  <div className={cn(
                    "text-sm font-bold transition-colors",
                    activeComparison === index ? "text-white" : "text-white/60"
                  )}>
                    {influencer.name}
                  </div>
                  <div className="text-xs text-white/40">{influencer.category}</div>
                </div>

                {activeComparison === index && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-white/5 -z-10"
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Comparison View */}
        <motion.div variants={containerVariants} className="mb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

            {/* Visual Preview */}
            <motion.div variants={itemVariants} className="relative mx-auto max-w-md w-full">
              {/* Phone Frame Interpretation */}
              <div className="relative rounded-[3rem] border-8 border-white/5 bg-black overflow-hidden shadow-2xl glass-elevated">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                      <Image
                        src={activeTrans.afterImage}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-black"
                      />
                    </div>
                    <span className="font-bold text-white text-sm">{activeTrans.username}</span>
                  </div>
                  <div className="flex gap-4">
                    <Heart className="w-5 h-5 text-white" />
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Main Image with Split Reveal */}
                <div className="relative aspect-[4/5] group cursor-ew-resize">
                  <Image
                    src={activeTrans.afterImage}
                    alt="Enhanced"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-accent-neon" /> AI Enhanced
                    </span>
                  </div>

                  {/* Interactive Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent pt-20">
                    <p className="text-white text-sm leading-relaxed">
                      <span className="font-bold">{activeTrans.username}</span> Just feeling the vibe today! The lighting was absolutely perfect. ✨ #aesthetic #lifestyle
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-white/60 text-xs font-medium">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3 fill-accent-pink text-accent-pink" /> 124K</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 842</span>
                      <span className="ml-auto">2 HOURS AGO</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-1/2 -right-12 -translate-y-1/2 hidden lg:block">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center animate-bounce-slow">
                    <Heart className="w-6 h-6 text-accent-pink fill-accent-pink" />
                  </div>
                  <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center animate-bounce-slow" style={{ animationDelay: "0.2s" }}>
                    <MessageCircle className="w-6 h-6 text-accent-blue fill-accent-blue" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Metrics & Details */}
            <motion.div variants={itemVariants} className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-white">Performance Metrics</h3>
                <p className="text-white/60 leading-relaxed">
                  See how AI enhancement directly impacts audience engagement and account growth.
                  Higher quality visuals lead to significantly better performance.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl glass-card border border-white/5 hover:bg-white/5 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-sm font-medium">Engagement</span>
                    <TrendingUp className="w-5 h-5 text-accent-green" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{activeTrans.metrics.engagement}</div>
                  <div className="text-xs text-accent-green font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> Incredible Growth
                  </div>
                </div>

                <div className="p-6 rounded-3xl glass-card border border-white/5 hover:bg-white/5 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-sm font-medium">Authenticity</span>
                    <Award className="w-5 h-5 text-accent-purple" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{activeTrans.metrics.authenticity}</div>
                  <div className="text-xs text-accent-purple font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" /> AI Verification Pass
                  </div>
                </div>

                <div className="p-6 rounded-3xl glass-card border border-white/5 hover:bg-white/5 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-sm font-medium">Followers</span>
                    <Users className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{activeTrans.metrics.followers}</div>
                  <div className="text-xs text-accent-blue font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" /> Weekly Gain
                  </div>
                </div>

                <div className="p-6 rounded-3xl glass-card border border-white/5 hover:bg-white/5 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-sm font-medium">Brand Deals</span>
                    <Crown className="w-5 h-5 text-accent-yellow" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{activeTrans.metrics.brandDeals}</div>
                  <div className="text-xs text-accent-yellow font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow" /> Revenue Spike
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl glass-subtle border border-accent-neon/20 flex flex-col sm:flex-row gap-6 items-center">
                <div className="w-12 h-12 rounded-full bg-accent-neon/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-accent-neon" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Instant Credibility Boost</h4>
                  <p className="text-sm text-white/60">
                    Our algorithm enhances facial features while maintaining skin texture reality, avoiding the "plastic" AI look.
                  </p>
                </div>
                <div className="bg-accent-neon text-black font-bold px-4 py-2 rounded-xl text-sm whitespace-nowrap">
                  Try Demo
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>

      </div>
    </section>
  )
}