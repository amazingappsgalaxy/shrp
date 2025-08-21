"use client"

import { motion } from "framer-motion"

export function GlassTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface/50 to-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-white mb-12">
          Glassmorphism Test
        </h1>
        
        {/* Basic Glass Test */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass backdrop-blur-glass p-8 rounded-2xl border border-glass-border">
            <h3 className="text-xl font-semibold text-white mb-4">Basic Glass</h3>
            <p className="text-text-secondary">
              This should have a subtle glass effect with backdrop blur.
            </p>
          </div>
          
          <div className="glass-elevated backdrop-blur-glass p-8 rounded-2xl border border-glass-border-elevated">
            <h3 className="text-xl font-semibold text-white mb-4">Elevated Glass</h3>
            <p className="text-text-secondary">
              This should have a more pronounced glass effect.
            </p>
          </div>
        </div>
        
        {/* Premium Glass Test */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-premium backdrop-blur-glass-heavy p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-3">Premium Glass</h3>
            <p className="text-sm text-text-secondary">
              Heavy backdrop blur effect.
            </p>
          </div>
          
          <div className="glass-card backdrop-blur-glass p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-3">Glass Card</h3>
            <p className="text-sm text-text-secondary">
              Card-style glass effect.
            </p>
          </div>
          
          <div className="glass-subtle backdrop-blur-glass p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-3">Subtle Glass</h3>
            <p className="text-sm text-text-secondary">
              Very subtle glass effect.
            </p>
          </div>
        </div>
        
        {/* Interactive Glass Test */}
        <motion.div 
          className="glass-card-elevated backdrop-blur-glass-heavy p-8 rounded-3xl border border-glass-border-elevated text-center"
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-white mb-4">Interactive Glass</h3>
          <p className="text-text-secondary mb-6">
            Hover over this card to see the glass effect in action.
          </p>
          <div className="flex justify-center space-x-4">
            <div className="w-4 h-4 bg-accent-neon rounded-full animate-pulse" />
            <div className="w-4 h-4 bg-accent-blue rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-4 h-4 bg-accent-purple rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </motion.div>
        
        {/* Browser Support Info */}
        <div className="glass backdrop-blur-glass p-6 rounded-2xl border border-glass-border">
          <h3 className="text-lg font-semibold text-white mb-3">Browser Support</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <div>✅ Chrome/Edge: Full support</div>
            <div>✅ Safari: Full support</div>
            <div>✅ Firefox: Full support</div>
            <div>⚠️ Fallback: Semi-transparent background for older browsers</div>
          </div>
        </div>
      </div>
    </div>
  )
}
