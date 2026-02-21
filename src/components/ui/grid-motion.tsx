"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Sparkles, Zap, Shield, Clock, Star, Award } from "lucide-react"

interface FeatureCard {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}

const features: FeatureCard[] = [
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: "AI-Powered Enhancement",
    description: "Advanced neural networks analyze and enhance every pixel with precision",
    gradient: "from-accent-neon to-accent-blue"
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Lightning Fast",
    description: "Process 8K images in under 30 seconds with our optimized AI pipeline",
    gradient: "from-accent-blue to-accent-purple"
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Privacy First",
    description: "Your images are processed securely and deleted after enhancement",
    gradient: "from-accent-purple to-accent-pink"
  },
  {
    icon: <Clock className="h-8 w-8" />,
    title: "Real-time Preview",
    description: "See enhancements in real-time before downloading your final image",
    gradient: "from-accent-pink to-accent-neon"
  },
  {
    icon: <Star className="h-8 w-8" />,
    title: "Professional Quality",
    description: "Studio-grade results that rival professional photo editing software",
    gradient: "from-accent-neon to-accent-purple"
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Award Winning",
    description: "Recognized by industry leaders for innovation in AI image processing",
    gradient: "from-accent-blue to-accent-pink"
  }
]

export function GridMotion() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

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
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  }

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-6">
            <span className="text-gradient-neon">Powered by Leading AI Models</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Our cutting-edge AI models deliver professional-grade image enhancement with unmatched precision and speed.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative"
            >
              {/* Card */}
              <div className="card-premium h-full p-8 relative overflow-hidden">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 relative z-10`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold font-heading mb-3 text-text-primary group-hover:text-gradient-neon transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10`} />
              </div>

              {/* Floating Animation */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 3 + index * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.1
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="text-text-muted mb-6">
            Ready to experience the future of image enhancement?
          </p>
          <motion.button
            className="btn-premium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}