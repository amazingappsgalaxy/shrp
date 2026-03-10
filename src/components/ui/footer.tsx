"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-black border-t border-white/5 pt-24 pb-12 relative overflow-hidden">

            {/* CTA Section — minimal */}
            <div className="container mx-auto px-4 mb-24 text-center">
                <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.25em] mb-8">20+ AI Models · 8K Output · No Subscription Lock-in</p>
                <h2 className="text-5xl md:text-7xl font-black font-heading text-white tracking-tight leading-[0.88] mb-10">
                    EXPLORE<br />
                    <span className="text-[#FFFF00]">AI TOOLS.</span>
                </h2>
                <Link href="/app/dashboard">
                    <button className="group bg-[#FFFF00] text-black px-12 py-5 rounded-xl font-black text-base inline-flex items-center gap-3 hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,0,0.25)] transition-all duration-300">
                        Enter App
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </Link>
            </div>

            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-12 mb-16 border-b border-white/5 pb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="text-2xl font-bold text-white mb-4 tracking-tighter">Sharpii.ai</div>
                        <p className="text-white/40 text-sm leading-relaxed">
                            The AI creative studio for photographers and content creators. Real skin, 8K detail, video generation — no plastic look.
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
                            <li className="hover:text-[#FFFF00] transition-colors"><Link href="/privacy">Privacy Policy</Link></li>
                            <li className="hover:text-[#FFFF00] transition-colors"><Link href="/terms">Terms of Service</Link></li>
                            <li className="hover:text-[#FFFF00] cursor-pointer transition-colors">Security</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
                    <div>© 2025 Sharpii.ai · All rights reserved.</div>
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
