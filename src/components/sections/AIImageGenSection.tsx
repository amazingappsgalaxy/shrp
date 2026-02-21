"use client"

import { motion } from "framer-motion"
import { Sparkles, Wand2, Image as ImageIcon, Zap } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export default function AIImageGenSection() {
    const [activePrompt, setActivePrompt] = useState(0)

    const showcaseItems = [
        {
            prompt: "A futuristic city with neon lights and flying cars, cyberpunk style, highly detailed, 8k",
            image: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/gen/city-gen.jpg", // Placeholder
            color: "from-accent-neon to-accent-blue"
        },
        {
            prompt: "Portrait of a warrior princess with golden armor, intricate design, fantasy art",
            image: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/gen/warrior-gen.jpg", // Placeholder
            color: "from-accent-purple to-accent-pink"
        },
        {
            prompt: "A serene landscape of a mountain lake at sunset, photorealistic, cinematic lighting",
            image: "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/gen/landscape-gen.jpg", // Placeholder
            color: "from-orange-500 to-accent-neon"
        }
    ]

    return (
        <section className="relative py-24 bg-black overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-purple/10 via-black to-black pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Text Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10">
                            <Wand2 className="w-4 h-4 text-accent-neon" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Text to Image</span>
                        </div>

                        <h2 className="font-heading text-4xl md:text-6xl font-bold leading-tight">
                            <span className="text-white">Imagine it.</span><br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-neon to-accent-purple">We generate it.</span>
                        </h2>

                        <p className="text-white/60 text-lg leading-relaxed max-w-lg">
                            Turn your wildest ideas into stunning visuals in seconds. Our state-of-the-art diffusion models understand complex prompts and deliver photorealistic results.
                        </p>

                        <div className="space-y-4 pt-4">
                            {showcaseItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setActivePrompt(idx)}
                                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${activePrompt === idx
                                            ? 'bg-white/10 border-accent-neon/50 shadow-[0_0_20px_rgba(255,255,0,0.1)]'
                                            : 'bg-transparent border-white/10 hover:bg-white/5'
                                        }`}
                                >
                                    <p className={`text-sm font-medium transition-colors ${activePrompt === idx ? 'text-white' : 'text-white/50'}`}>
                                        "{item.prompt}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Visual Showcase */}
                    <div className="relative">
                        <div className="relative aspect-square rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl">
                            {/* Prompt Bar Effect */}
                            <div className="absolute top-6 left-6 right-6 z-20">
                                <div className="bg-black/60 backdrop-blur-xl rounded-xl p-4 border border-white/10 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent-neon animate-pulse" />
                                    <p className="text-xs text-white/80 truncate font-mono">
                                        Generating: {showcaseItems[activePrompt]!.prompt.substring(0, 40)}...
                                    </p>
                                </div>
                            </div>

                            {/* Main Image Display */}
                            <motion.div
                                key={activePrompt}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                className="absolute inset-0"
                            >
                                {/* Placeholder for actual generated images - using gradients for now if images fail */}
                                <div className={`w-full h-full bg-gradient-to-br ${showcaseItems[activePrompt]!.color} opacity-20`} />
                                <div className="absolute inset-0 flex items-center justify-center text-white/20 font-bold text-4xl uppercase tracking-widest">
                                    [Generated Image {activePrompt + 1}]
                                </div>
                            </motion.div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-accent-neon/20 rounded-full blur-[100px]" />
                    </div>

                </div>
            </div>
        </section>
    )
}
