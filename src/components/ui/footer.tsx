"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-black border-t border-white/5 pt-24 pb-12 relative overflow-hidden">

            {/* New CTA Section */}
            <div className="container mx-auto px-4 mb-24">
                <div className="relative rounded-[3rem] bg-white/5 border border-white/10 overflow-hidden p-12 md:p-24 text-center">
                    <div className="absolute inset-0 bg-[#FFFF00]/5 blur-[100px] pointer-events-none" />

                    <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                        <h2 className="text-5xl md:text-8xl font-black font-heading text-white tracking-tight leading-[0.9]">
                            CREATE <br />
                            <span className="text-[#FFFF00]">IMPACT.</span>
                        </h2>

                        <p className="text-xl text-white/60 max-w-2xl mx-auto">
                            Elevate your visual storytelling with the world's most advanced AI enhancement engine.
                        </p>

                        <div className="flex justify-center pt-8">
                            <Link href="/app/dashboard">
                                <button className="group relative bg-[#FFFF00] text-black px-10 py-5 rounded-2xl font-bold text-xl inline-flex items-center gap-3 hover:scale-105 transition-transform duration-300">
                                    <span>Enter App</span>
                                    <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-12 mb-16 border-b border-white/5 pb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="text-2xl font-bold text-white mb-4 tracking-tighter">Sharpii.ai</div>
                        <p className="text-white/40 text-sm leading-relaxed">
                            Pioneering the future of digital aesthetic enhancement through generative AI.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-white/50">
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Enhancement</li>
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Generation</li>
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Video</li>
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Pricing</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Resources</h4>
                        <ul className="space-y-4 text-sm text-white/50">
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Documentation</li>
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">API Reference</li>
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Community</li>
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Blog</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-white/50">
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Privacy Policy</li>
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Terms of Service</li>
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Security</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
                    <div>© 2024 Sharpii Inc. All rights reserved.</div>
                    <div className="flex gap-6">
                        <span>Twitter</span>
                        <span>GitHub</span>
                        <span>Discord</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
