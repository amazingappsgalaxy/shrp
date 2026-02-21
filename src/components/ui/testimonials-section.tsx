"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import Image from "next/image"
import { Star, Quote, Users, Award, TrendingUp } from "lucide-react"
import { fadeInVariants, staggerContainerVariants } from "@/lib/animations"
import { TESTIMONIALS } from "@/lib/constants"

export function TestimonialsSection() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const renderStars = (rating: number, testimonialId: string) => {
    return [...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          delay: i * 0.1,
          duration: 0.3,
          type: "spring",
          stiffness: 200
        }}
      >
        <Star
          className={`w-4 h-4 ${i < rating
              ? 'fill-accent-neon text-accent-neon'
              : 'text-text-muted'
            }`}
        />
      </motion.div>
    ))
  }

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-background to-surface/20" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-blue/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Header */}
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.div
            variants={fadeInVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-glass-border mb-6"
          >
            <Users className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-medium text-text-secondary">
              Customer Stories
            </span>
          </motion.div>

          <motion.h2
            variants={fadeInVariants}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6"
          >
            <span className="text-text-primary">Trusted by</span>
            <br />
            <span className="text-gradient-neon">Creative Professionals</span>
          </motion.h2>

          <motion.p
            variants={fadeInVariants}
            className="text-lg text-text-secondary max-w-2xl mx-auto"
          >
            See what photographers, studios, and agencies are saying about
            the transformative power of Sharpii.ai
          </motion.p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16"
        >
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              variants={fadeInVariants}
              className={`
                relative group cursor-pointer
                ${testimonial.featured ? 'md:col-span-2 lg:col-span-1' : ''}
                ${index === 0 ? 'lg:row-span-2' : ''}
              `}
              onMouseEnter={() => setHoveredCard(testimonial.id)}
              onMouseLeave={() => setHoveredCard(null)}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`
                card-premium h-full relative overflow-hidden
                ${hoveredCard === testimonial.id ? 'glow-neon' : ''}
                ${testimonial.featured ? 'border-accent-neon/30' : ''}
              `}>
                {/* Featured Badge */}
                {testimonial.featured && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-accent-neon to-accent-blue text-xs font-medium text-white">
                      <Award className="w-3 h-3 inline mr-1" />
                      Featured
                    </div>
                  </div>
                )}

                {/* Quote Icon */}
                <div className="absolute top-6 left-6 opacity-20">
                  <Quote className="w-8 h-8 text-accent-neon" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-6 h-full flex flex-col">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {renderStars(testimonial.rating, testimonial.id)}
                  </div>

                  {/* Testimonial Text */}
                  <blockquote className="text-text-secondary leading-relaxed mb-6 flex-1">
                    "{testimonial.content}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover ring-2 ring-accent-neon/20"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-neon/20 to-accent-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary group-hover:text-accent-neon transition-colors duration-300">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-text-muted">
                        {testimonial.role}
                      </p>
                      <p className="text-xs text-text-muted">
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-neon/5 to-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-8 px-8 py-6 glass-elevated rounded-2xl border border-glass-border-elevated">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-accent-neon mr-2" />
                <div className="text-2xl md:text-3xl font-bold text-gradient-neon">
                  50K+
                </div>
              </div>
              <div className="text-sm text-text-muted">Happy Customers</div>
            </div>

            <div className="w-px h-12 bg-glass-border" />

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-accent-neon mr-2 fill-current" />
                <div className="text-2xl md:text-3xl font-bold text-gradient-neon">
                  4.9/5
                </div>
              </div>
              <div className="text-sm text-text-muted">Average Rating</div>
            </div>

            <div className="w-px h-12 bg-glass-border" />

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-accent-neon mr-2" />
                <div className="text-2xl md:text-3xl font-bold text-gradient-neon">
                  10M+
                </div>
              </div>
              <div className="text-sm text-text-muted">Images Enhanced</div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.button
            className="btn-premium text-lg px-8 py-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Trusted by Professionals</span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
