"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useSpring, useMotionValue, useVelocity, useAnimationFrame } from "framer-motion"

// Utility to wrap a number between min and max
const wrap = (min: number, max: number, v: number) => {
    const rangeSize = max - min
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

interface ParallaxProps {
    children: string
    baseVelocity: number
}

function ParallaxText({ children, baseVelocity = 100 }: ParallaxProps) {
    const baseX = useMotionValue(0)
    const { scrollY } = useScroll()
    const scrollVelocity = useVelocity(scrollY)
    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 400
    })
    const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
        clamp: false
    })

    // Magic wrapping logic
    const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`)

    const directionFactor = useRef<number>(1)
    useAnimationFrame((t, delta) => {
        let moveBy = directionFactor.current * baseVelocity * (delta / 1000)

        // Change direction based on scroll velocity
        if (velocityFactor.get() < 0) {
            directionFactor.current = -1
        } else if (velocityFactor.get() > 0) {
            directionFactor.current = 1
        }

        moveBy += directionFactor.current * moveBy * velocityFactor.get()
        baseX.set(baseX.get() + moveBy)
    })

    return (
        <div className="parallax overflow-hidden m-0 whitespace-nowrap flex flex-nowrap">
            <motion.div className="scroller font-heading font-black text-6xl md:text-9xl uppercase leading-[0.85] flex whitespace-nowrap flex-nowrap" style={{ x }}>
                <span className="block mr-12">{children} </span>
                <span className="block mr-12">{children} </span>
                <span className="block mr-12">{children} </span>
                <span className="block mr-12">{children} </span>
            </motion.div>
        </div>
    )
}

export function VelocityScrollSection() {
    return (
        <section className="py-24 bg-[#FFFF00] text-black overflow-hidden relative z-10">
            <div className="rotate-[-2deg] scale-110">
                <ParallaxText baseVelocity={-2}>Sharpii AI - Enhance - Create -</ParallaxText>
                <ParallaxText baseVelocity={2}>Realism - 8K Quality - Speed -</ParallaxText>
            </div>

            <div className="container mx-auto px-6 mt-16 text-center">
                <p className="font-bold text-xl md:text-2xl opacity-80 max-w-2xl mx-auto">
                    Join 50,000+ creators pushing the boundaries of what's possible with AI image generation.
                </p>
            </div>
        </section>
    )
}
