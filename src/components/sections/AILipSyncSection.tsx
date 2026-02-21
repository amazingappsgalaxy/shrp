"use client"

import { motion } from "framer-motion"
import { Mic, Music, Radio } from "lucide-react"

export default function AILipSyncSection() {
    return (
        <section className="relative py-24 bg-black/50 overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">

                <div className="grid lg:grid-cols-12 gap-12 items-center">

                    {/* Visual */}
                    <div className="lg:col-span-7 relative">
                        <div className="relative aspect-video rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center">
                                <div className="text-white/20 text-6xl font-heading font-bold">Talking Head Demo</div>
                            </div>

                            {/* Audio Waveform Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent flex items-end justify-center pb-8 gap-1">
                                {[...Array(20)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [10, 40 + Math.random() * 40, 10] }}
                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                                        className="w-2 bg-accent-neon rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10">
                            <Mic className="w-4 h-4 text-accent-pink" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Audio to Video</span>
                        </div>

                        <h2 className="font-heading text-4xl md:text-5xl font-bold leading-tight">
                            <span className="text-white">Perfect</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-pink to-accent-purple">Lip Sync</span>
                        </h2>

                        <p className="text-white/60 text-lg leading-relaxed">
                            Make any static portrait speak. Simply upload audio and an image, and our AI animates the lips and facial expressions in perfect synchronization.
                        </p>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="p-2 bg-white/10 rounded-full text-white"><Music className="w-5 h-5" /></div>
                                <div className="text-white/80 text-sm font-medium">Supports multiple languages</div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="p-2 bg-white/10 rounded-full text-white"><Radio className="w-5 h-5" /></div>
                                <div className="text-white/80 text-sm font-medium">Auto-generated facial expressions</div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    )
}
