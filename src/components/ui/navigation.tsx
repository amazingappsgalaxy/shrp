'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Menu, X, ChevronDown, Sparkles } from "lucide-react"
import { Button } from "./button"
import { LogoAnimation } from "./logo-animation"
import { logoGlowVariants } from "@/lib/animations"

const navigation = [
  {
    name: "Features",
    href: "/features",
    children: [
      { name: "AI Enhancement", href: "/ai-image-enhancement" },
      { name: "Skin Upscaling", href: "/features/skin-upscaling" },
      { name: "Batch Processing", href: "/features/batch" },
      { name: "API Access", href: "/features/api" }
    ]
  },
  {
    name: "Solutions",
    href: "/solutions",
    children: [
      { name: "Photographers", href: "/solutions/photographers" },
      { name: "Studios", href: "/solutions/studios" },
      { name: "Agencies", href: "/solutions/agencies" },
      { name: "Enterprise", href: "/solutions/enterprise" }
    ]
  },
  {
    name: "Gallery",
    href: "/gallery",
    children: [
      { name: "Before & After", href: "/gallery" },
      { name: "Case Studies", href: "/gallery/case-studies" },
      { name: "Featured Work", href: "/gallery/featured" }
    ]
  },
  {
    name: "Pricing",
    href: "/#pricing-section",
  }
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'glass-strong border-b border-glass-border' 
          : 'glass-effect bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Animated Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div 
              className="relative"
              variants={logoGlowVariants}
              initial="initial"
              animate="animate"
            >
              <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300" />
            </motion.div>
            <motion.span 
              className="text-xl lg:text-2xl font-bold text-gradient-neon"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Sharpii.ai
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                className="relative"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                onMouseEnter={() => item.children && setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {item.children ? (
                  <button className="flex items-center space-x-1 text-sm font-medium text-text-secondary hover:text-text-primary transition-all duration-300 py-2 group">
                    <span>{item.name}</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                  </button>
                ) : (
                  <Link 
                    href={item.href}
                    className="text-sm font-medium text-text-secondary hover:text-text-primary transition-all duration-300 py-2 relative group"
                    onClick={(e) => {
                      if (item.href.startsWith('/#')) {
                        e.preventDefault();
                        const targetId = item.href.substring(2);
                        console.log(`Attempting to scroll to: ${targetId}`);
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                          targetElement.scrollIntoView({ behavior: 'smooth' });
                          console.log(`Scrolled to: ${targetId}`);
                          // Fallback: If not scrolled after a short delay, force a page reload
                          setTimeout(() => {
                            if (window.location.hash !== `#${targetId}`) {
                              window.location.href = `/#${targetId}`;
                            }
                          }, 300);
                        } else {
                          console.log(`Element with ID ${targetId} not found. Forcing navigation.`);
                          window.location.href = `/#${targetId}`;
                        }
                      }
                    }}
                  >
                    <span>{item.name}</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent-blue to-accent-purple group-hover:w-full transition-all duration-300" />
                  </Link>
                )}

                <AnimatePresence>
                  {activeDropdown === item.name && item.children && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="absolute top-full left-0 mt-2 w-56 glass-strong rounded-2xl shadow-2xl py-2 border border-glass-border-elevated"
                    >
                      {item.children.map((child, childIndex) => (
                        <motion.div
                          key={child.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: childIndex * 0.05, duration: 0.3 }}
                        >
                          <Link
                            href={child.href}
                            className="block px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50 transition-all duration-200 rounded-lg mx-2 group"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent-neon opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              <span>{child.name}</span>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <motion.div 
            className="hidden lg:flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Button 
              variant="ghost" 
              className="text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50 transition-all duration-300"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button 
              className="btn-premium relative overflow-hidden"
              asChild
            >
              <Link href="/signup">
                <span className="relative z-10">Get Started</span>
              </Link>
            </Button>
          </motion.div>

          {/* Mobile menu button */}
          <motion.button
            className="lg:hidden p-2 rounded-xl hover:bg-surface-elevated/50 transition-colors duration-200"
            onClick={() => setIsOpen(!isOpen)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6 text-text-primary" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-6 w-6 text-text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:hidden border-t border-glass-border mt-4"
            >
              <div className="py-6 space-y-6 glass-strong rounded-2xl mt-4 mx-2">
                {navigation.map((item, index) => (
                  <motion.div 
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <Link
                      href={item.href}
                      className="block text-lg font-medium text-text-primary hover:text-accent-neon transition-colors duration-200 px-6 py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                    {item.children && (
                      <div className="ml-6 mt-3 space-y-2">
                        {item.children.map((child, childIndex) => (
                          <motion.div
                            key={child.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (index * 0.1) + (childIndex * 0.05) + 0.2, duration: 0.3 }}
                          >
                            <Link
                              href={child.href}
                              className="block text-sm text-text-secondary hover:text-text-primary transition-colors duration-200 px-6 py-1"
                              onClick={() => setIsOpen(false)}
                            >
                              {child.name}
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
                
                <motion.div 
                  className="pt-6 border-t border-glass-border space-y-3 px-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50" 
                    asChild
                  >
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button 
                    className="w-full justify-start btn-premium" 
                    asChild
                  >
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      <span className="relative z-10">Get Started</span>
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
