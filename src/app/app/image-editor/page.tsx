'use client'

import React from 'react'
import { Wand2 } from 'lucide-react'

export default function ImageEditorPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#FFFF00] selection:text-black">
            <main className="pt-32 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                        <div className="w-24 h-24 rounded-3xl bg-[#FFFF00]/10 flex items-center justify-center border border-[#FFFF00]/20 shadow-[0_0_50px_rgba(255,255,0,0.1)]">
                            <Wand2 className="w-12 h-12 text-[#FFFF00]" />
                        </div>

                        <div className="space-y-4 max-w-lg">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                                Image Editor
                            </h1>
                            <p className="text-lg text-white/60 leading-relaxed">
                                Our advanced AI-powered image editing suite is coming soon. Get ready to transform your visuals with professional precision.
                            </p>
                        </div>

                        <div className="px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-white/40">
                            Coming Soon
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
