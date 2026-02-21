"use client"

import { motion } from "framer-motion"
import { Video, ArrowRight, Move, Play } from "lucide-react"

export default function AIMotionTransferSection() {
    return (
        <section className="relative py-24 bg-black overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">

                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-6">
                        <Move className="w-4 h-4 text-accent-blue" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Video to Video</span>
                    </div>
                    <h2 className="font-heading text-4xl md:text-6xl font-bold mb-6">
                        AI Motion <span className="text-accent-blue">Transfer</span>
                    </h2>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        Transfer the motion from a source video to any target character. Create animations without mocap suits.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">

                    {/* Source */}
                    <div className="space-y-4">
                        <div className="aspect-[9/16] rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Video className="w-12 h-12 text-white/20" />
                            </div>
                            <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 rounded-lg text-xs font-bold text-white">Source Motion</div>
                        </div>
                        <p className="text-center text-white/40 text-sm">Original Video</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center justify-center text-accent-blue space-y-2">
                        <ArrowRight className="w-8 h-8 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest">Processing</span>
                    </div>

                    {/* Target */}
                    <div className="space-y-4">
                        <div className="aspect-[9/16] rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 border border-accent-blue/30 relative overflow-hidden group shadow-[0_0_30px_rgba(0,100,255,0.2)]">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="w-12 h-12 text-white fill-white" />
                            </div>
                            <div className="absolute top-4 left-4 px-3 py-1 bg-accent-blue/20 rounded-lg text-xs font-bold text-accent-blue border border-accent-blue/30">
                                AI Output
                            </div>
                        </div>
                        <p className="text-center text-white/40 text-sm">Transferred Motion</p>
                    </div>

                </div>

            </div>
        </section>
    )
}
