"use client"

import { motion } from "framer-motion"
import { TrendingDown, Zap, DollarSign } from "lucide-react"

export function CostOptimizationSection() {
    return (
        <section className="py-24 bg-black border-t border-white/5 overflow-hidden relative">
            <div className="container mx-auto px-4 relative z-10">

                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFF00]/10 border border-[#FFFF00]/20 text-[#FFFF00] text-xs font-bold uppercase tracking-widest">
                            <DollarSign className="w-3 h-3" />
                            Cost Efficiency
                        </div>

                        <h2 className="text-4xl md:text-6xl font-bold font-heading text-white leading-tight">
                            Save up to <br />
                            <span className="text-[#FFFF00]">95% on Costs.</span>
                        </h2>

                        <p className="text-lg text-white/60 leading-relaxed max-w-lg">
                            Stop overpaying for traditional retouching. Sharpii delivers agency-quality results at a fraction of the time and price.
                        </p>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <div className="text-sm text-white/50 font-medium">Traditional Agency</div>
                                    <div className="text-2xl font-bold text-white">$1,000+ <span className="text-sm font-normal text-white/30">/ batch</span></div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFFF00]/5 border border-[#FFFF00]/20 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[#FFFF00]/5 animate-pulse" />
                                <div className="w-12 h-12 rounded-full bg-[#FFFF00]/20 flex items-center justify-center relative z-10">
                                    <Zap className="w-6 h-6 text-[#FFFF00]" />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-sm text-[#FFFF00]/80 font-bold">Sharpii AI</div>
                                    <div className="text-2xl font-bold text-[#FFFF00]">$50 <span className="text-sm font-normal text-[#FFFF00]/50">/ batch</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Visual - Comparison Graph Style */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FFFF00]/10 to-transparent blur-[80px] opacity-30" />

                        <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-8">Cost Per 100 Images</h3>

                            {/* Bar 1 */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-white/50 mb-2 font-medium">
                                    <span>Traditional Manual Reading</span>
                                    <span>$1,000</span>
                                </div>
                                <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "100%" }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-white/20"
                                    />
                                </div>
                            </div>

                            {/* Bar 2 */}
                            <div>
                                <div className="flex justify-between text-sm text-[#FFFF00] mb-2 font-bold">
                                    <span>Sharpii AI Automation</span>
                                    <span>$50</span>
                                </div>
                                <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "5%" }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                        className="h-full bg-[#FFFF00]"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-white mb-1">20x</div>
                                    <div className="text-xs text-white/40 uppercase tracking-widest">Cheaper</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-[#FFFF00] mb-1">100x</div>
                                    <div className="text-xs text-[#FFFF00]/60 uppercase tracking-widest">Faster</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
