"use client"

import React from "react"
import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface Testimonial {
  id: number
  text: string
  imageSrc: string
  name: string
  username: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    text: "SharpII has revolutionized our workflow. The AI enhancement quality is incredible, and it saves us hours of manual editing.",
    imageSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Sarah Chen",
    username: "@sarahc_design"
  },
  {
    id: 2,
    text: "As a wedding photographer, I need my images to be perfect. SharpII consistently delivers stunning results that exceed my expectations.",
    imageSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Marcus Rodriguez",
    username: "@marcusphoto"
  },
  {
    id: 3,
    text: "The batch processing feature is a game-changer for our marketing campaigns. We can enhance hundreds of images in minutes.",
    imageSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Emily Watson",
    username: "@emilyw_marketing"
  },
  {
    id: 4,
    text: "Since using SharpII, our product images look more professional and our conversion rates have increased by 40%.",
    imageSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "David Kim",
    username: "@davidk_ecom"
  },
  {
    id: 5,
    text: "The AI models are incredibly sophisticated. I can enhance vintage photos and restore old family pictures with amazing results.",
    imageSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Lisa Thompson",
    username: "@lisadesigns"
  },
  {
    id: 6,
    text: "SharpII has made my content creation process so much more efficient. The quality improvements are noticeable.",
    imageSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    name: "Alex Johnson",
    username: "@alexcreates"
  },
  {
    id: 7,
    text: "The real-time preview feature helps me see exactly how my images will look before processing. It's incredibly useful.",
    imageSrc: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    name: "Jennifer Lee",
    username: "@jenlee_photo"
  },
  {
    id: 8,
    text: "Customer support is outstanding. They helped me optimize my workflow and I'm seeing much better results now.",
    imageSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "Michael Brown",
    username: "@mikebrown_studio"
  },
  {
    id: 9,
    text: "The API integration was seamless. We've automated our entire image processing pipeline with SharpII.",
    imageSrc: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    name: "Rachel Green",
    username: "@rachelg_dev"
  }
]

const TestimonialsColumn = (props: {
  className?: string
  testimonials: Testimonial[]
  duration?: number
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, name, username, imageSrc }, i) => (
                <div className="p-8 rounded-3xl glass-card border border-white/5 hover:border-white/20 transition-all cursor-default group" key={i}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-blue to-accent-purple blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
                      <Image
                        src={imageSrc}
                        alt={name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white/10 relative z-10"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{name}</h4>
                      <p className="text-sm text-accent-blue">{username}</p>
                    </div>
                    <Quote className="ml-auto w-8 h-8 text-white/5" />
                  </div>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    "{text}"
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < 5
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-600"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  )
}

// Split testimonials into three columns
const firstColumn = testimonials.slice(0, 3)
const secondColumn = testimonials.slice(3, 6)
const thirdColumn = testimonials.slice(6, 9)

export function TestimonialsSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-black">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(76,29,149,0.1),transparent_70%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-3xl mx-auto mb-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle border border-white/10 mb-6">
            <Star className="w-4 h-4 text-accent-neon fill-accent-neon" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Trusted by Professionals</span>
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 text-white">
            Loved solely by <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink">
              Creators Worldwide
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Join thousands of photographers, designers, and creators who trust SharpII
            to enhance their visual content.
          </p>
        </motion.div>

        {/* Testimonials Columns */}
        <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[800px] overflow-hidden -mx-4 sm:mx-0">
          <TestimonialsColumn testimonials={firstColumn} duration={40} className="w-full sm:w-1/2 lg:w-1/3" />
          <TestimonialsColumn testimonials={secondColumn} duration={35} className="hidden sm:block sm:w-1/2 lg:w-1/3" />
          <TestimonialsColumn testimonials={thirdColumn} duration={45} className="hidden lg:block lg:w-1/3" />
        </div>
      </div>
    </section>
  )
}