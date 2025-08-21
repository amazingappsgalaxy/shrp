'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Menu, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Settings,
  User,
  LogOut
} from 'lucide-react'

interface NavigationProps {
  showAuthButtons?: boolean
  showUserMenu?: boolean
}

export default function Navigation({ showAuthButtons = false, showUserMenu = false }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()

  const navigationItems = [
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/gallery', label: 'Gallery', icon: ImageIcon },
    { href: '/editor', label: 'Editor', icon: Sparkles },
    { href: '/dashboard', label: 'Dashboard', icon: Settings },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sharpii.ai
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {showAuthButtons ? (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : showUserMenu ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Account</span>
                </Button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
                    <Link href="/profile">
                      <div className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                        Profile
                      </div>
                    </Link>
                    <Link href="/settings">
                      <div className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                        Settings
                      </div>
                    </Link>
                    <Link href="/billing">
                      <div className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                        Billing
                      </div>
                    </Link>
                    <div className="border-t border-slate-200 my-1" />
                    <div className="px-4 py-2 text-sm text-red-600 hover:bg-slate-50 cursor-pointer flex items-center space-x-2">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-200">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
