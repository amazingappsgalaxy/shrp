"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Plus, Minus, Search, HelpCircle, User, Bot } from "lucide-react"
import { fadeInVariants, staggerContainerVariants } from "@/lib/animations"
import { FAQ_ITEMS } from "@/lib/constants"

export function FAQSection() {
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFAQs = FAQ_ITEMS.filter(
    item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleItem = (itemId: string) => {
    setActiveItem(activeItem === itemId ? null : itemId)
  }

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-background to-surface/20" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-neon/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl" />
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
          >
            <HelpCircle className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-medium text-text-secondary">
              Frequently Asked Questions
            </span>
          </motion.div>

          <motion.h2
            variants={fadeInVariants}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6"
          >
            <span className="text-text-primary">Got</span>
            <br />
            <span className="text-gradient-neon">Questions?</span>
          </motion.h2>

          <motion.p
            variants={fadeInVariants}
            className="text-lg text-text-secondary max-w-3xl mx-auto mb-8"
          >
            Find answers to common questions about Sharpii.ai's AI image enhancement technology.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            variants={fadeInVariants}
            className="max-w-md mx-auto relative"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl glass-card bg-transparent text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-neon focus:glow-neon transition-all duration-300"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Chat-like FAQ Container */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-2xl border border-glass-border-elevated p-6 lg:p-8">
            {/* Chat Header */}
            <div className="flex items-center gap-3 pb-6 border-b border-glass-border mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-neon to-accent-blue flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Sharpii.ai Assistant</h3>
                <p className="text-sm text-text-muted">Online • Ready to help</p>
              </div>
              <div className="ml-auto">
                <div className="w-3 h-3 rounded-full bg-accent-neon animate-pulse" />
              </div>
            </div>

            {/* FAQ Items as Chat Messages */}
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {filteredFAQs.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    {/* User Question */}
                    <div className="flex items-start gap-3 justify-end">
                      <div className="max-w-xs lg:max-w-md">
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-full text-right p-4 rounded-2xl rounded-br-md bg-gradient-to-r from-accent-blue to-accent-purple text-white hover:shadow-neon transition-all duration-300 group"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium leading-relaxed">
                              {item.question}
                            </span>
                            <motion.div
                              animate={{ rotate: activeItem === item.id ? 45 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Plus className="w-4 h-4 flex-shrink-0" />
                            </motion.div>
                          </div>
                        </button>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Bot Answer */}
                    <AnimatePresence>
                      {activeItem === item.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-neon to-accent-blue flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="max-w-xs lg:max-w-md">
                            <div className="p-4 rounded-2xl rounded-bl-md glass-card border border-glass-border">
                              <p className="text-sm text-text-secondary leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                            {/* Typing indicator animation */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-1 mt-2 ml-4"
                            >
                              <div className="text-xs text-text-muted">Sharpii.ai is typing</div>
                              <div className="flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="w-1 h-1 rounded-full bg-accent-neon"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{
                                      duration: 1,
                                      repeat: Infinity,
                                      delay: i * 0.2,
                                    }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* No Results */}
              {filteredFAQs.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <MessageCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted">
                    No questions found matching "{searchQuery}"
                  </p>
                </motion.div>
              )}
            </div>

            {/* Chat Input (Decorative) */}
            <div className="mt-6 pt-6 border-t border-glass-border">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Ask a question..."
                    className="w-full px-4 py-3 rounded-xl glass-card bg-transparent text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-neon transition-all duration-300"
                    disabled
                  />
                </div>
                <button className="p-3 rounded-xl bg-gradient-to-r from-accent-neon to-accent-blue text-white hover:shadow-neon transition-all duration-300 disabled:opacity-50" disabled>
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-text-muted mt-2 text-center">
                Need more help? <span className="text-accent-neon cursor-pointer hover:underline">Contact our support team</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-3 rounded-xl glass-card border border-glass-border hover:glow-neon transition-all duration-300 text-text-primary hover:text-accent-neon">
              📚 Documentation
            </button>
            <button className="px-6 py-3 rounded-xl glass-card border border-glass-border hover:glow-neon transition-all duration-300 text-text-primary hover:text-accent-neon">
              💬 Live Chat
            </button>
            <button className="px-6 py-3 rounded-xl glass-card border border-glass-border hover:glow-neon transition-all duration-300 text-text-primary hover:text-accent-neon">
              📧 Email Support
            </button>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, hsl(180 100% 50%), hsl(199 100% 50%));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, hsl(180 100% 60%), hsl(199 100% 60%));
        }
      `}</style>
    </section>
  )
}