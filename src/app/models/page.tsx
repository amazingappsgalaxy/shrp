'use client'

import React from 'react'
import Link from 'next/link'
import { NavigationHero4 } from '@/components/ui/navigation-hero4'
import { Footer } from '@/components/ui/footer'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Wand2, Zap } from 'lucide-react'

// Hardcoded model data for MVP
// In a real implementation, this would come from an API endpoint
const models = [
    {
        id: 'runninghub-flux-upscaling',
        name: 'FLUX Upscaling',
        description: 'Advanced ComfyUI-based image upscaling and enhancement using the powerful FLUX architecture. Perfect for enhancing general photography with incredible detail.',
        icon: Zap,
        features: ['4x Upscaling', 'Detail Restoration', 'High Fidelity'],
        color: 'from-blue-500 to-cyan-400',
        link: '/app/editor?model=runninghub-flux-upscaling'
    },
    {
        id: 'skin-editor',
        name: 'Skin Editor',
        description: 'Professional-grade skin retouching and texture enhancement. Maintain natural skin texture while removing blemishes and perfecting complexion.',
        icon: Sparkles,
        features: ['Texture Preservation', 'Blemish Removal', 'Natural Look'],
        color: 'from-pink-500 to-rose-400',
        link: '/app/editor?model=skin-editor'
    }
]

export default function ModelsPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <NavigationHero4 />

            <main className="pt-32 pb-20 px-4 md:px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/50">
                        Available AI Models
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
                        Choose from our specialized AI models designed for professional image enhancement and restoration.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {models.map((model) => (
                        <div
                            key={model.id}
                            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5"
                        >
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${model.color}`} />

                            <div className="p-8 h-full flex flex-col justify-between relative z-10">
                                <div className="space-y-6">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${model.color} p-4 flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-300`}>
                                        <model.icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-colors">
                                            {model.name}
                                        </h2>
                                        <p className="text-white/60 leading-relaxed">
                                            {model.description}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {model.features.map((feature, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/70"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                                    <span className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">
                                        Ready to enhance?
                                    </span>
                                    <Link href={model.link}>
                                        <Button
                                            className="rounded-full px-6 font-bold bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-white/5 group-hover:shadow-white/20"
                                        >
                                            Try Model <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Coming Soon Card */}
                    <div className="group relative overflow-hidden rounded-3xl border border-dashed border-white/10 bg-transparent p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Wand2 className="w-8 h-8 text-white/20" />
                        </div>
                        <h3 className="text-xl font-bold text-white/40">More Models Coming Soon</h3>
                        <p className="text-white/30 max-w-xs">
                            We are constantly updating our model library with the latest AI advancements.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
