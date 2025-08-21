"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { 
  Sparkles, TrendingUp, Users, CheckCircle, ArrowRight, Play, Crown, Heart, MessageCircle
} from "lucide-react"
import Image from "next/image"

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
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1
    }
  }

  const itemTransition = {
     duration: 0.6
   }

  // AI Influencer Transformations
  const transformations = [
    {
      id: 1,
      name: "Aria Chen",
      username: "@aria_ai",
      category: "Fashion & Lifestyle",
      beforeImage: "/testpics/Girl+1+Before.jpg",
      afterImage: "/testpics/Girl+1+After.png",
      metrics: {
        engagement: "+127%",
        followers: "2.4M",
        authenticity: "94.8%",
        brandDeals: "+89%"
      },
      description: "From natural beauty to AI-enhanced perfection while maintaining authentic appeal"
    },
    {
      id: 2,
      name: "Marcus Digital",
      username: "@marcus_digi", 
      category: "Tech & Innovation",
      beforeImage: "/testpics/Black+Man+1+Before.jpg",
      afterImage: "/testpics/Black+Man+1+After.png",
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
      beforeImage: "/testpics/Girl+2+Before (1).jpg",
      afterImage: "/testpics/Girl+2+After.png",
      metrics: {
        engagement: "+180%",
        followers: "3.1M",
        authenticity: "97.5%",
        brandDeals: "+150%"
      },
      description: "Transforming artistic visions into captivating digital realities with AI"
    }
  ]

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Natural Enhancement",
      description: "Subtle improvements that maintain authenticity"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Audience Connection",
      description: "Build genuine relationships with enhanced appeal"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Performance Boost",
      description: "Measurable improvements in engagement metrics"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Brand Trust",
      description: "Maintain credibility while enhancing visual impact"
    }
  ]

  return (
    <section className="py-24 relative overflow-hidden bg-gray-950">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(30,30,30,0.3),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(20,20,20,0.4),transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Header */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-20"
        >
          <motion.div variants={itemVariants} transition={itemTransition} className="space-y-6">
            <div className="inline-block px-6 py-3 rounded-full glass-card">
              <span className="text-sm font-medium text-accent-neon flex items-center gap-2">
                <Crown className="h-4 w-4" />
                AI Influencer Transformation
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              <span className="text-white">Humanize Your</span>
              <br />
              <span className="text-gradient-neon">AI Influencers</span>
            </h2>
            
            <p className="text-xl text-text-secondary leading-relaxed max-w-4xl mx-auto">
              Transform AI-generated content into authentic, relatable personalities that connect with real audiences and drive genuine engagement.
            </p>
          </motion.div>
        </motion.div>

        {/* Segmented Control with Instagram-Style Profiles */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="inline-flex bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-2 gap-2">
            {transformations.map((influencer, index) => (
              <motion.button
                key={influencer.id}
                onClick={() => setActiveComparison(index)}
                className={`relative flex flex-col items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 min-w-[120px] ${
                  activeComparison === index 
                    ? 'bg-white/10 shadow-lg border border-accent-neon/30' 
                    : 'hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Profile Image with Instagram-style gradient border */}
                <div className={`relative p-0.5 rounded-full transition-all duration-300 ${
                  activeComparison === index 
                    ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 shadow-lg shadow-purple-500/25' 
                    : 'bg-gradient-to-tr from-gray-600 to-gray-400 hover:from-gray-500 hover:to-gray-300'
                }`}>
                  <div className="w-14 h-14 rounded-full bg-black p-0.5">
                    <Image
                      src={influencer.afterImage}
                      alt={influencer.name}
                      width={56}
                      height={56}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  
                  {/* Active indicator */}
                  {activeComparison === index && (
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-neon rounded-full border-2 border-black flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </motion.div>
                  )}
                </div>
                
                {/* Name and Category */}
                <div className="text-center">
                  <div className={`text-sm font-semibold transition-colors duration-300 ${
                    activeComparison === index ? 'text-white' : 'text-gray-400'
                  }`}>
                    {influencer.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {influencer.category}
                  </div>
                </div>
                
                {/* Selection indicator background */}
                {activeComparison === index && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-accent-neon/10 to-accent-blue/10 rounded-xl border border-accent-neon/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ zIndex: -1 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Instagram-Style Comparison */}
        <motion.div
          variants={containerVariants}
          className="mb-20"
        >
          <div className="grid lg:grid-cols-3 gap-4 items-center max-w-6xl mx-auto">
            {/* Before Post - Instagram Style */}
            <motion.div variants={itemVariants} transition={itemTransition} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Before Enhancement</h3>
                <p className="text-text-secondary">Raw AI-generated content</p>
              </div>
              
              {/* Instagram Post Container */}
              <div className="bg-black border border-gray-700 rounded-lg overflow-hidden max-w-sm mx-auto ring-2 ring-gray-600/30">
                {/* Post Header */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
                      <Image
                        src={transformations[activeComparison].beforeImage}
                        alt={transformations[activeComparison].name}
                        width={32}
                        height={32}
                        className="w-full h-full rounded-full object-cover bg-black"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold text-sm">
                          {transformations[activeComparison].username}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        Los Angeles, CA
                      </div>
                    </div>
                  </div>
                  <button className="text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5"/>
                      <circle cx="12" cy="12" r="1.5"/>
                      <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                </div>

                {/* Post Image */}
                <div className="relative aspect-square">
                  <Image
                    src={transformations[activeComparison].beforeImage}
                    alt="Before Enhancement"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />

                </div>

                {/* Post Actions & Stats */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>

                  <div className="text-white text-sm font-semibold mb-2">
                    2,341 likes
                  </div>

                  <div className="text-white text-sm mb-2">
                    <span className="font-semibold">{transformations[activeComparison].username}</span>{' '}
                    Just another day... feeling okay I guess 🤷‍♀️ #nofilter #raw
                  </div>

                  <button className="text-gray-500 text-sm mb-2">
                    View all 89 comments
                  </button>

                  {/* Sample Comments - Added for consistency */}
                  <div className="space-y-1 mb-2">
                    <div className="text-white text-sm">
                      <span className="font-semibold">@friend_jane</span>{' '}
                      <span className="text-gray-500">Looking good! 👍</span>
                    </div>
                    <div className="text-white text-sm">
                      <span className="font-semibold">@casual_user</span>{' '}
                      <span className="text-gray-500">Nice pic!</span>
                    </div>
                  </div>

                  <div className="text-gray-600 text-xs uppercase tracking-wide">2 HOURS AGO</div>
                </div>
              </div>
            </motion.div>

            {/* Arrow & Process */}
            <motion.div variants={itemVariants} transition={itemTransition} className="flex flex-col items-center space-y-6">
              <div className="hidden lg:block">
                <ArrowRight className="w-12 h-12 text-accent-neon" />
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-accent-neon to-accent-blue flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">Sharpii.ai</h4>
                <p className="text-text-secondary text-sm">AI Enhancement</p>
              </div>

              <div className="lg:hidden">
                <ArrowRight className="w-8 h-8 text-accent-neon rotate-90" />
              </div>
            </motion.div>

            {/* After Post - Instagram Style */}
            <motion.div variants={itemVariants} transition={itemTransition} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">After Enhancement</h3>
                <p className="text-text-secondary">Humanized & optimized</p>
              </div>
              
              {/* Instagram Post Container */}
              <div className="bg-black border border-gray-700 rounded-lg overflow-hidden max-w-sm mx-auto ring-2 ring-accent-neon/30">
                {/* Post Header */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
                      <Image
                        src={transformations[activeComparison].afterImage}
                        alt={transformations[activeComparison].name}
                        width={32}
                        height={32}
                        className="w-full h-full rounded-full object-cover bg-black"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold text-sm">
                          {transformations[activeComparison].username}
                        </span>
                        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-gray-500 text-xs">
                        Los Angeles, CA
                      </div>
                    </div>
                  </div>
                  <button className="text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5"/>
                      <circle cx="12" cy="12" r="1.5"/>
                      <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                </div>

                {/* Post Image */}
                <div className="relative aspect-square">
                  <Image
                    src={transformations[activeComparison].afterImage}
                    alt="After Enhancement"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />

                </div>

                {/* Post Actions & Stats */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>

                  <div className="text-white text-sm font-semibold mb-2">
                    47,892 likes
                  </div>

                  <div className="text-white text-sm mb-2">
                    <span className="font-semibold">{transformations[activeComparison].username}</span>{' '}
                    Feeling absolutely radiant today! ✨ Enhanced with @sharpii.ai - still me, just elevated! The confidence boost is real 💫 #AIBeauty #Confidence #Enhanced
                  </div>

                  <button className="text-gray-500 text-sm mb-2">
                    View all 1,234 comments
                  </button>

                  {/* Sample Comments */}
                  <div className="space-y-1 mb-2">
                    <div className="text-white text-sm">
                      <span className="font-semibold">@sarah_beauty</span>{' '}
                      <span className="text-gray-500">Wow! You look amazing! 😍</span>
                    </div>
                    <div className="text-white text-sm">
                      <span className="font-semibold">@tech_mike</span>{' '}
                      <span className="text-gray-500">This is the future! @sharpii.ai 🚀</span>
                    </div>
                  </div>

                  <div className="text-gray-600 text-xs uppercase tracking-wide">1 HOUR AGO</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* AI Enhancement Benefits */}
          <motion.div variants={itemVariants} transition={itemTransition} className="mt-16 space-y-12">


            {/* Key Statistics */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-neon/10 to-accent-blue/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div className="space-y-3">
                    <div className="text-4xl md:text-5xl font-bold text-gradient-neon">96%</div>
                    <div className="text-white font-semibold text-lg">Realism Score</div>
                    <div className="text-text-secondary text-sm">Indistinguishable from natural photos</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-4xl md:text-5xl font-bold text-gradient-neon">4.2x</div>
                    <div className="text-white font-semibold text-lg">Engagement Rate</div>
                    <div className="text-text-secondary text-sm">Higher interaction vs. unenhanced content</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-4xl md:text-5xl font-bold text-gradient-neon">86%</div>
                    <div className="text-white font-semibold text-lg">Trust Retention</div>
                    <div className="text-text-secondary text-sm">Audiences still perceive as authentic</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>


        </motion.div>


      </div>
    </section>
  )
}