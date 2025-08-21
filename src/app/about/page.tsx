'use client'

import { motion } from "framer-motion"
import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"
import { Sparkles, Globe, Smartphone, Code, Mail, MapPin } from "lucide-react"
import { staggerContainerVariants, fadeInVariants } from "@/lib/animations"



export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <NavigationHero4 />
      
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden pt-20">
        {/* Background with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-surface-elevated" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 lg:px-6 min-h-screen flex items-center">
          <motion.div
            className="max-w-6xl mx-auto w-full"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              variants={fadeInVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-glass-border mb-8"
            >
              <Sparkles className="h-4 w-4 text-accent-neon" />
              <span className="text-sm font-medium text-text-secondary">
                Small Team, Big Ideas
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={fadeInVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tight mb-6"
            >
              <span className="text-hero">
                We&apos;re a{" "}
              </span>
              <br />
              <span className="bg-gradient-to-r from-accent-blue via-accent-purple to-accent-neon bg-clip-text text-transparent">
                Creative Force
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInVariants}
              className="text-lg sm:text-xl md:text-2xl text-text-secondary leading-relaxed mb-12 max-w-4xl"
            >
              A small team of passionate developers crafting innovative mobile apps and beautiful websites. 
              We focus on creativity, intuitive design, and custom solutions that make a difference.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* About Content Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6">
          <motion.div
            className="max-w-6xl mx-auto"
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Company Story */}
            <motion.div
              variants={fadeInVariants}
              className="glass-card-elevated rounded-3xl p-8 lg:p-12 mb-16"
            >
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                    Our Story
                  </h2>
                  <p className="text-lg text-text-secondary leading-relaxed mb-6">
                    DopeStar Studios started as a small group of developers who shared a passion 
                    for creating apps that people actually love to use.
                  </p>
                  <p className="text-lg text-text-secondary leading-relaxed">
                    We&apos;re not a big agency, but what we lack in size, we make up for in creativity, 
                    attention to detail, and genuine care for our clients&apos; projects.
                  </p>
                </div>
                <div className="relative">
                  <div className="glass-subtle rounded-2xl p-8 text-center">
                    <Globe className="h-16 w-16 mx-auto mb-4 text-accent-neon" />
                    <h3 className="text-xl font-semibold mb-2">Global Vision</h3>
                    <p className="text-text-secondary">Connecting ideas across borders</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Services Grid */}
            <motion.div
              variants={fadeInVariants}
              className="grid md:grid-cols-3 gap-8 mb-16"
            >
              {/* Mobile Apps */}
              <div className="glass-card rounded-2xl p-8 group hover:glass-card-elevated transition-all duration-500">
                <div className="flex items-start gap-4 mb-6">
                  <div className="glass-subtle rounded-xl p-3">
                    <Smartphone className="h-6 w-6 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Mobile Apps</h3>
                    <p className="text-text-secondary leading-relaxed">
                      Innovative iOS and Android apps with intuitive interfaces and smooth user experiences. 
                      We build apps that users actually enjoy using.
                    </p>
                  </div>
                </div>
              </div>

              {/* Websites */}
              <div className="glass-card rounded-2xl p-8 group hover:glass-card-elevated transition-all duration-500">
                <div className="flex items-start gap-4 mb-6">
                  <div className="glass-subtle rounded-xl p-3">
                    <Code className="h-6 w-6 text-accent-purple" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Websites & Web Apps</h3>
                    <p className="text-text-secondary leading-relaxed">
                      Beautiful, responsive websites and powerful web applications. 
                      We handle everything from design to custom development.
                    </p>
                  </div>
                </div>
              </div>

              {/* UI/UX & Custom Development */}
              <div className="glass-card rounded-2xl p-8 group hover:glass-card-elevated transition-all duration-500">
                <div className="flex items-start gap-4 mb-6">
                  <div className="glass-subtle rounded-xl p-3">
                    <Sparkles className="h-6 w-6 text-accent-neon" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">UI/UX & Custom Dev</h3>
                    <p className="text-text-secondary leading-relaxed">
                      Creative design solutions and custom development for unique requirements. 
                      We bring your ideas to life with attention to every detail.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              variants={fadeInVariants}
              className="glass-premium rounded-3xl p-8 lg:p-12 text-center"
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-8 bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                Ready to Work Together?
              </h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 justify-center">
                  <Mail className="h-5 w-5 text-accent-neon" />
                  <span className="text-text-secondary">dopestarstudios@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <MapPin className="h-5 w-5 text-accent-neon" />
                  <span className="text-text-secondary">India</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
