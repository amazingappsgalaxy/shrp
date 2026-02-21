"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, HelpCircle } from "lucide-react"
import { FAQ_ITEMS } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-32 relative bg-black overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFFF00]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-6 relative z-10 w-full max-w-4xl">

        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6">
            <HelpCircle className="h-4 w-4 text-[#FFFF00]" />
            <span className="text-sm font-bold text-white tracking-widest uppercase">Support Center</span>
          </div>
          <h2 className="font-heading text-4xl md:text-6xl font-bold text-white mb-6">
            Frequently Asked <span className="text-[#FFFF00]">Questions</span>
          </h2>
          <p className="text-white/60 text-lg">
            Everything you need to know about the product and billing.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={index}
              className={cn(
                "group rounded-2xl border transition-all duration-300 overflow-hidden",
                openIndex === index
                  ? "bg-white/10 border-[#FFFF00]/30 shadow-[0_0_30px_-10px_rgba(255,255,0,0.1)]"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-center justify-between w-full p-6 text-left"
              >
                <span className={cn(
                  "text-lg font-bold transition-colors",
                  openIndex === index ? "text-white" : "text-white/80"
                )}>
                  {item.question}
                </span>
                <span className={cn(
                  "p-2 rounded-full transition-all duration-300",
                  openIndex === index ? "bg-[#FFFF00] text-black rotate-180" : "bg-white/10 text-white"
                )}>
                  {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 pt-0 text-white/70 leading-relaxed border-t border-white/5 mt-2">
                      <div className="pt-4">
                        {item.answer}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}