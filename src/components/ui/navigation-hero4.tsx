'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Menu, X, Sparkles } from 'lucide-react'

const menuItems = [
  { name: 'Features', href: '/features' },
  { name: 'Gallery', href: '/gallery' },

  { name: 'Pricing', href: '/#pricing-section' },
  { name: 'About', href: '/about' },
]

export function NavigationHero4() {
  const [menuState, setMenuState] = React.useState(false)

  const navigationContent = (
    <header>
      <nav
        data-state={menuState && 'active'}
        className="group w-full"
        style={{
          zIndex: 2147483646,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(80px)',
          WebkitBackdropFilter: 'blur(80px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          isolation: 'isolate',
          transform: 'translateZ(0)',
          willChange: 'backdrop-filter'
        }}
      >
        <div className="mx-auto max-w-6xl px-6 transition-all duration-300">
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                <Logo />
              </Link>
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                className="relative z-[2] -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
              <div className="hidden lg:block">
                <ul className="flex gap-8 text-sm">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                    href={item.href}
                    className="text-white/80 hover:text-white block duration-200 transition-colors font-medium"
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
                  </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-black/95 backdrop-blur-xl group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-white/10 p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-white/80 hover:text-white block duration-200 transition-colors font-medium"
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
                          setMenuState(false);
                        }}
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                >
                  <Link href="/login">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-accent-blue to-accent-purple text-white hover:from-accent-blue/90 hover:to-accent-purple/90 transition-all duration-200"
                >
                  <Link href="/signup">
                    <span>Sign Up</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )

  // Use portal to render navigation outside the normal DOM hierarchy
  return typeof window !== 'undefined' 
    ? createPortal(navigationContent, document.body)
    : navigationContent
}

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg">
        <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
      </div>
      <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-accent-blue to-accent-neon bg-clip-text text-transparent">
        Sharpii.ai
      </span>
    </div>
  )
}