'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, ChevronDown, Sparkles } from "lucide-react"
import { Button } from "./button"

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
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'glass-strong border-b border-glass-border' 
          : 'glass-effect bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-purple rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300" />
            </div>
            <span className="text-xl lg:text-2xl font-bold text-gradient-neon">
              Sharpii.ai
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item, index) => (
              <div
                key={item.name}
                className="relative"
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
                  
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                          targetElement.scrollIntoView({ behavior: 'smooth' });
                  
                          // Fallback: If not scrolled after a short delay, force a page reload
                          setTimeout(() => {
                            if (window.location.hash !== `#${targetId}`) {
                              window.location.href = `/#${targetId}`;
                            }
                          }, 300);
                        } else {
                  
                          window.location.href = `/#${targetId}`;
                        }
                      }
                    }}
                  >
                    <span>{item.name}</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent-blue to-accent-purple group-hover:w-full transition-all duration-300" />
                  </Link>
                )}

                {activeDropdown === item.name && item.children && (
                  <div className="absolute top-full left-0 mt-2 w-56 glass-strong rounded-2xl shadow-2xl py-2 border border-glass-border-elevated">
                    {item.children.map((child) => (
                      <div key={child.name}>
                        <Link
                          href={child.href}
                          className="block px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50 rounded-lg mx-2 group"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-neon opacity-0 group-hover:opacity-100" />
                            <span>{child.name}</span>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50 transition-all duration-300"
              asChild
            >
              <Link href="/app/login">Sign In</Link>
            </Button>
            <Button 
              className="btn-premium relative overflow-hidden"
              asChild
            >
              <Link href="/app/signin?tab=signup">
                <span className="relative z-10">Get Started</span>
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-surface-elevated/50 transition-colors duration-200"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-text-primary" />
            ) : (
              <Menu className="h-6 w-6 text-text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden border-t border-glass-border mt-4">
            <div className="py-6 space-y-6 glass-strong rounded-2xl mt-4 mx-2">
              {navigation.map((item, index) => (
                <div key={item.name}>
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
                        <div key={child.name}>
                          <Link
                            href={child.href}
                            className="block text-sm text-text-secondary hover:text-text-primary transition-colors duration-200 px-6 py-1"
                            onClick={() => setIsOpen(false)}
                          >
                            {child.name}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="pt-6 border-t border-glass-border space-y-3 px-6">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50" 
                  asChild
                >
                  <Link href="/app/login" onClick={() => setIsOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button 
                  className="w-full justify-start btn-premium" 
                  asChild
                >
                  <Link href="/app/signin?tab=signup" onClick={() => setIsOpen(false)}>
                    <span className="relative z-10">Get Started</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
