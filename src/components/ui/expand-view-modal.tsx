"use client"

import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download } from "lucide-react"

interface ExpandViewModalProps {
    isOpen: boolean
    onClose: () => void
    originalImage: string
    enhancedImage: string
    onDownload?: () => void
}

export function ExpandViewModal({
    isOpen,
    onClose,
    originalImage,
    enhancedImage,
    onDownload
}: ExpandViewModalProps) {
    // Handle escape key and prevent body scroll
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
            }
        }

        // Prevent body scroll
        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = "hidden"
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.body.style.overflow = originalStyle
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />

                {/* Modal Content - Full Screen Comparison */}
                <motion.div
                    className="relative w-[95vw] h-[90vh] flex items-center justify-center bg-black/40 border border-white/10 p-2 rounded-[10px] overflow-hidden shadow-2xl"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-black/50 backdrop-blur text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Comparison Slider - Reusing the same pattern from ComparisonView */}
                    <ComparisonSlider
                        original={originalImage}
                        enhanced={enhancedImage}
                        onDownload={onDownload}
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// Internal Comparison Slider Component
function ComparisonSlider({
    original,
    enhanced,
    onDownload
}: {
    original: string
    enhanced: string
    onDownload?: () => void
}) {
    const [sliderPos, setSliderPos] = React.useState(50)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const handleMove = React.useCallback((clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
        setSliderPos((x / rect.width) * 100)
    }, [])

    return (
        <div
            className="relative w-full h-full bg-[#050505] overflow-hidden select-none"
            ref={containerRef}
            onMouseMove={(e) => handleMove(e.clientX)}
            onTouchMove={(e) => e.touches[0] && handleMove(e.touches[0].clientX)}
        >
            {/* Images */}
            <img src={original} className="absolute inset-0 w-full h-full object-contain" alt="Original" draggable={false} />

            <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
            >
                <img src={enhanced} className="absolute inset-0 w-full h-full object-contain" alt="Enhanced" draggable={false} />
            </div>

            {/* Slider Line */}
            <div
                className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 cursor-ew-resize"
                style={{ left: `${sliderPos}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold text-white/80 border border-white/10 uppercase tracking-wider">
                Original
            </div>
            <div className="absolute top-4 right-16 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/20 uppercase tracking-wider shadow-lg">
                Enhanced
            </div>

            {/* Download Button */}
            {onDownload && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDownload(); }}
                    className="absolute bottom-6 right-6 p-3 bg-white text-black rounded-full shadow-xl hover:scale-105 transition-transform z-30"
                >
                    <Download className="w-5 h-5" />
                </button>
            )}
        </div>
    )
}
