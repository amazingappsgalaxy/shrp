"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MessageCircle, Plus, Minus, User, Bot, Sparkles, MessageSquare } from "lucide-react" // Import specific icons
import { cn } from "@/lib/utils"

// Define FAQ interface
interface FAQ {
  question: string
  answer: string
  category?: string
}

const faqs: FAQ[] = [
  {
    question: "How does the AI enhancement work?",
    answer: "Our AI uses advanced deep learning algorithms trained on millions of high-quality images. It analyzes your photo to understand its content and context, then intelligently reconstructs missing details, reduces noise, and corrects colors while maintaining the natural look of the original subject.",
    category: "Technology"
  },
  {
    question: "What types of images work best?",
    answer: "Sharpii works best with portraits, product photos, real estate imagery, and scanned old photos. While it can enhance almost any image, results are most dramatic on images with minor blur, low resolution, or noise issues. Heavily damaged or completely unrecognizable images may have limited improvement.",
    category: "Usage"
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We treat your images with the highest level of privacy. Your uploaded photos are processed securely on our encrypted servers and are automatically deleted after 24 hours. We do not use your images for training our models or share them with third parties without your explicit permission.",
    category: "Privacy"
  },
  {
    question: "Can I use Sharpii for commercial purposes?",
    answer: "Yes! All images enhanced with our paid plans include a commercial license. You are free to use the enhanced results for your business, marketing materials, client work, or any other commercial application.",
    category: "Licensing"
  },
  {
    question: "What if I'm not satisfied with the results?",
    answer: "We strive for perfection but understand AI isn't magic. If you're not happy with a specific enhancement, you can try regenerating it with different settings. If you're on a paid plan and consistently unhappy, our support team can help or process a refund within our 7-day money-back guarantee period.",
    category: "Support"
  }
]

export function FAQChatAccordion() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <section className="py-24 relative overflow-hidden bg-black/40">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[100px] mix-blend-screen opacity-30" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-accent-purple/5 rounded-full blur-[100px] mix-blend-screen opacity-30" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10 max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-6">
            <MessageSquare className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">Support & FAQ</span>
          </div>

          <h2 className="text-5xl font-bold font-heading mb-6 text-white">
            Questions? <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-neon to-accent-purple">We&apos;ve got answers.</span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Everything you need to know about our technology, billing, and privacy.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-12 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-white/40 group-focus-within:text-accent-neon transition-colors duration-300" />
          </div>
          <input
            type="text"
            placeholder="Search for answers..."
            className="w-full pl-12 pr-4 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-neon/50 focus:bg-white/10 transition-all duration-300 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none -z-10 blur-xl" />
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={cn(
                  "group rounded-2xl border transition-all duration-500 overflow-hidden",
                  expandedIndex === index
                    ? "bg-white/10 border-accent-neon/30 shadow-[0_0_30px_-10px_rgba(45,212,191,0.2)]"
                    : "bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10"
                )}
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      expandedIndex === index ? "bg-accent-neon text-black" : "bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white"
                    )}>
                      <User className="w-5 h-5" />
                    </div>
                    <span className={cn(
                      "text-lg font-medium transition-colors duration-300",
                      expandedIndex === index ? "text-white" : "text-white/80 group-hover:text-white"
                    )}>
                      {faq.question}
                    </span>
                  </div>

                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300",
                    expandedIndex === index ? "border-accent-neon text-accent-neon rotate-180" : "border-white/10 text-white/40 group-hover:border-white/30 group-hover:text-white"
                  )}>
                    {expandedIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                {/* Answer Content */}
                <AnimatePresence>
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as any }}
                    >
                      <div className="px-6 pb-6 pl-[4.5rem]">
                        <div className="relative p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg border border-white/20">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-white/70 leading-relaxed text-sm md:text-base">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12 text-white/40">
              <p>No answers found matching &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}