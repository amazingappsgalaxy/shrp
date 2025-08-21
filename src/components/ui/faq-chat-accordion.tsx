"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { ChevronDown, MessageCircle, User, Bot } from "lucide-react"

interface FAQItem {
  id: number
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "How does the AI image enhancement work?",
    answer: "Our AI uses advanced neural networks trained on millions of high-quality images. It analyzes your photo pixel by pixel, identifying areas that need enhancement like skin texture, lighting, and detail clarity. The AI then applies sophisticated algorithms to improve these areas while maintaining natural-looking results.",
    category: "Technology"
  },
  {
    id: 2,
    question: "What image formats do you support?",
    answer: "We support all major image formats including JPEG, PNG, TIFF, WebP, and RAW files from most camera manufacturers. Our system can handle images up to 8K resolution and file sizes up to 50MB.",
    category: "Technical"
  },
  {
    id: 3,
    question: "How long does processing take?",
    answer: "Most images are processed in under 30 seconds. Processing time depends on image size and complexity. High-resolution images (4K+) may take up to 2 minutes for optimal results.",
    category: "Performance"
  },
  {
    id: 4,
    question: "Is my data secure and private?",
    answer: "Absolutely. We use enterprise-grade encryption for all uploads and processing. Your images are automatically deleted from our servers after 24 hours. We never store, share, or use your images for training purposes without explicit consent.",
    category: "Privacy"
  },
  {
    id: 5,
    question: "Can I use enhanced images commercially?",
    answer: "Yes! All enhanced images are yours to use however you like, including commercial purposes. We don't claim any rights to your original or enhanced images.",
    category: "Licensing"
  },
  {
    id: 6,
    question: "What's the difference between plans?",
    answer: "Our Free plan includes 5 enhancements per month with standard processing. Pro plan offers unlimited enhancements, priority processing, batch uploads, and access to advanced AI models. Enterprise includes API access and custom integrations.",
    category: "Pricing"
  }
]

export function FAQChatAccordion() {
  const [openItem, setOpenItem] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredFAQs = faqData.filter(
    item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id)
  }

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-gradient-purple">Frequently Asked Questions</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Get instant answers to common questions about our AI image enhancement service.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <MessageCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 glass rounded-2xl border border-glass-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-neon/50 focus:border-accent-neon/50 transition-all duration-300"
              />
            </div>
          </motion.div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.map((item, index) => (
              <motion.div
                key={item.id}
                className="glass rounded-2xl border border-glass-border overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Question */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-6 text-left flex items-center justify-between hover:glass-elevated transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      {/* Category Badge */}
                      <div className="inline-block px-3 py-1 rounded-full bg-accent-neon/10 border border-accent-neon/20 mb-2">
                        <span className="text-xs font-medium text-accent-neon">
                          {item.category}
                        </span>
                      </div>
                      
                      {/* Question Text */}
                      <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-neon transition-colors duration-300">
                        {item.question}
                      </h3>
                    </div>
                  </div>

                  {/* Chevron */}
                  <motion.div
                    animate={{ rotate: openItem === item.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="ml-4 flex-shrink-0"
                  >
                    <ChevronDown className="h-5 w-5 text-text-muted group-hover:text-accent-neon transition-colors duration-300" />
                  </motion.div>
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {openItem === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <div className="flex items-start gap-4">
                          {/* Bot Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-neon to-accent-purple flex items-center justify-center flex-shrink-0">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                          
                          {/* Answer Content */}
                          <div className="flex-1">
                            <motion.div
                              className="glass-elevated rounded-2xl p-4 border border-glass-border-elevated"
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                            >
                              <p className="text-text-secondary leading-relaxed">
                                {item.answer}
                              </p>
                            </motion.div>
                            
                            {/* Helpful Actions */}
                            <motion.div
                              className="flex items-center gap-4 mt-4 text-sm text-text-muted"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.2 }}
                            >
                              <button className="hover:text-accent-neon transition-colors duration-300">
                                Was this helpful?
                              </button>
                              <button className="hover:text-accent-neon transition-colors duration-300">
                                👍 Yes
                              </button>
                              <button className="hover:text-accent-neon transition-colors duration-300">
                                👎 No
                              </button>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* No Results */}
          {filteredFAQs.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <MessageCircle className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No questions found
              </h3>
              <p className="text-text-secondary">
                Try adjusting your search terms or browse all questions above.
              </p>
            </motion.div>
          )}

          {/* Contact Support */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="glass rounded-2xl p-8 border border-glass-border">
              <h3 className="text-xl font-semibold text-text-primary mb-4">
                Still have questions?
              </h3>
              <p className="text-text-secondary mb-6">
                Our support team is here to help you get the most out of Sharpii.ai
              </p>
              <button className="btn-premium">
                Contact Support
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}