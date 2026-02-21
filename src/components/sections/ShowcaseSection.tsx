"use client"

import { motion } from "framer-motion"
import { Sparkles, Image as ImageIcon, Video, Mic, Move, Zap } from "lucide-react"

const workflows = [
  {
    title: "AI Skin Enhancement",
    desc: "Dermatogically accurate texture reconstruction.",
    icon: Sparkles,
    color: "text-[#FFFF00]",
    bg: "bg-[#FFFF00]/10",
    border: "border-[#FFFF00]/20"
  },
  {
    title: "Image Generation",
    desc: "High-fidelity synthesis from text or reference.",
    icon: ImageIcon,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20"
  },
  {
    title: "Video Generation",
    desc: "Temporal coherence for cinematic motion.",
    icon: Video,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20"
  },
  {
    title: "Motion Transfer",
    desc: "Targeted movement mapping for digital avatars.",
    icon: Move,
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/20"
  },
  {
    title: "Lip Syncing",
    desc: "Perfect audio-visual alignment engine.",
    icon: Mic,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20"
  }
]

export function ShowcaseSection() {
  return (
    <section className="py-32 bg-black relative">
      <div className="container mx-auto px-4 relative z-10">

        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold font-heading text-white mb-6">
            Powered by <br />
            <span className="text-[#FFFF00]">Leading AI Models.</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            Our unified platform combines specialized neural networks for every creative dimension.
          </p>
        </div>

        {/* Modern Bento-Style Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {workflows.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-3xl border ${item.border} ${item.bg} backdrop-blur-sm relative group overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity duration-500 scale-150 group-hover:scale-100 transform origin-top-right`}>
                <item.icon className={`w-24 h-24 ${item.color}`} />
              </div>

              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center mb-6`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/60 font-medium">{item.desc}</p>
              </div>
            </motion.div>
          ))}

          {/* Last "All in One" card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-8 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center text-center group hover:bg-white/10 transition-colors"
          >
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Infinite Possibilities</h3>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}