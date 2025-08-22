'use client'

import { motion } from "framer-motion"
import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"
import { Sparkles, Globe, Zap, Code, Mail, MapPin, Users, Rocket } from "lucide-react"
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
                DopeStar Studios LLP
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={fadeInVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tight mb-6"
            >
              <span className="text-hero">
                Welcome to{" "}
              </span>
              <br />
              <span className="bg-gradient-to-r from-accent-blue via-accent-purple to-accent-neon bg-clip-text text-transparent">
                sharpii.AI
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInVariants}
              className="text-lg sm:text-xl md:text-2xl text-text-secondary leading-relaxed mb-12 max-w-4xl"
            >
              An innovative AI-powered SAAS platform designed to revolutionize how businesses and individuals 
              approach image enhancement and creative solutions. Built with cutting-edge technology from India.
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
                    Hey there! We're DopeStar Studios LLP - a bunch of tech enthusiasts from India who love 
                    playing with AI and making cool stuff happen. We started this journey because we thought 
                    everyone should have access to amazing AI tools, not just the big tech companies.
                  </p>
                  <p className="text-lg text-text-secondary leading-relaxed">
                    sharpii.AI was born from late-night coding sessions and countless cups of chai. We wanted 
                    to create something that could make anyone's photos look amazing with just a few clicks. 
                    No more complicated software, no more expensive subscriptions - just simple, powerful AI 
                    that actually works!
                  </p>
                </div>
                <div className="relative">
                  <div className="glass-subtle rounded-2xl p-8 text-center">
                    <Globe className="h-16 w-16 mx-auto mb-4 text-accent-neon" />
                    <h3 className="text-xl font-semibold mb-2">Made in India</h3>
                    <p className="text-text-secondary">Global innovation, local roots</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* sharpii.AI Features Grid */}
            <motion.div
              variants={fadeInVariants}
              className="grid md:grid-cols-3 gap-8 mb-16"
            >
              {/* AI-Powered Enhancement */}
              <div className="glass-card rounded-2xl p-8 group hover:glass-card-elevated transition-all duration-500">
                <div className="flex items-start gap-4 mb-6">
                  <div className="glass-subtle rounded-xl p-3">
                    <Zap className="h-6 w-6 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">AI-Powered Enhancement</h3>
                    <p className="text-text-secondary leading-relaxed">
                      Our smart AI automatically fixes blurry photos, removes unwanted objects, enhances colors, 
                      and makes your images look professional. Perfect for social media, portfolios, or just 
                      making memories look amazing!
                    </p>
                  </div>
                </div>
              </div>

              {/* Multiple Applications */}
              <div className="glass-card rounded-2xl p-8 group hover:glass-card-elevated transition-all duration-500">
                <div className="flex items-start gap-4 mb-6">
                  <div className="glass-subtle rounded-xl p-3">
                    <Code className="h-6 w-6 text-accent-purple" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Works Everywhere</h3>
                    <p className="text-text-secondary leading-relaxed">
                      Whether you're a photographer, e-commerce seller, social media influencer, or just someone 
                      who loves taking photos, sharpii.AI fits right into your workflow. No more switching between 
                      different apps!
                    </p>
                  </div>
                </div>
              </div>

              {/* Commercial Use */}
              <div className="glass-card rounded-2xl p-8 group hover:glass-card-elevated transition-all duration-500">
                <div className="flex items-start gap-4 mb-6">
                  <div className="glass-subtle rounded-xl p-3">
                    <Users className="h-6 w-6 text-accent-neon" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Business Ready</h3>
                    <p className="text-text-secondary leading-relaxed">
                      Need to process hundreds of product photos? No problem! Our SAAS platform scales with your 
                      business, offering bulk processing, team collaboration, and enterprise features that grow 
                      with you.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SAAS Benefits Section */}
            <motion.div
              variants={fadeInVariants}
              className="glass-card-elevated rounded-3xl p-8 lg:p-12 mb-16"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                  Why SAAS Makes Sense
                </h2>
                <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mx-auto">
                  Unlike traditional software that you buy once and install, sharpii.AI gives you access to 
                  the latest AI technology through a simple subscription model. Here's why it's better:
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-subtle rounded-2xl p-6">
                  <div className="w-16 h-16 bg-accent-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-accent-blue font-bold text-2xl">💻</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-center">Access Anywhere</h3>
                  <p className="text-text-secondary text-center">
                    Use sharpii.AI from your phone, tablet, or computer. No need to carry your work computer 
                    everywhere - just log in to our web platform and continue editing from anywhere in the world.
                  </p>
                </div>
                
                <div className="glass-subtle rounded-2xl p-6">
                  <div className="w-16 h-16 bg-accent-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-accent-purple font-bold text-2xl">🔄</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-center">Always Updated</h3>
                  <p className="text-text-secondary text-center">
                    Get the latest AI improvements automatically. We update our models and features regularly, 
                    so you never have to worry about downloading updates or buying new versions.
                  </p>
                </div>
                
                <div className="glass-subtle rounded-2xl p-6">
                  <div className="w-16 h-16 bg-accent-neon/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-accent-neon font-bold text-2xl">💰</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-center">Pay as You Grow</h3>
                  <p className="text-text-secondary text-center">
                    Start with a basic plan and upgrade as your needs grow. No huge upfront costs for expensive 
                    software licenses - just a simple monthly or yearly subscription that scales with you.
                  </p>
                </div>
                
                <div className="glass-subtle rounded-2xl p-6">
                  <div className="w-16 h-16 bg-accent-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-accent-blue font-bold text-2xl">☁️</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-center">Cloud-Powered</h3>
                  <p className="text-text-secondary text-center">
                    All processing happens on our powerful cloud servers. Your device doesn't need to be powerful 
                    - just upload photos and let our AI do the heavy lifting in the cloud.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              variants={fadeInVariants}
              className="glass-premium rounded-3xl p-8 lg:p-12 text-center"
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-8 bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                Get in Touch
              </h2>
              <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div className="flex items-center gap-3 justify-center">
                  <Mail className="h-5 w-5 text-accent-neon" />
                  <span className="text-text-secondary">dopestarstudios@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <MapPin className="h-5 w-5 text-accent-neon" />
                  <span className="text-text-secondary">India</span>
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <Globe className="h-5 w-5 text-accent-neon" />
                  <span className="text-text-secondary">sharpii.ai</span>
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
