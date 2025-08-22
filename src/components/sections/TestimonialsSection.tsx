"use client"

import React from "react"
import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

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
    imageSrc: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
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
              {props.testimonials.map(({ text, name, username }, i) => (
                <div className="p-6 rounded-3xl glass-premium max-w-xs w-full" key={i}>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={props.testimonials.find(t => t.name === name)?.imageSrc || 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Face+1+After.png'} 
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-white">{name}</h4>
                      <p className="text-sm text-text-secondary">{username}</p>
                    </div>
                  </div>
                  <p className="text-text-secondary mb-4 leading-relaxed">
                    {text}
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < 5
                            ? "text-yellow-400 fill-current"
                            : "text-gray-400"
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
    <section className="py-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-10"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg text-sm text-text-secondary">Testimonials</div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 text-center">
            <span className="text-gradient-neon">What our users say</span>
          </h2>
          <p className="text-center mt-5 opacity-75 text-text-secondary">
            See what our customers have to say about us.
          </p>
        </motion.div>

        {/* Testimonials Columns */}
        <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  )
}