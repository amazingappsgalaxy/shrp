import React from 'react'
import { cn } from '@/lib/utils'

interface MainLogoProps {
    className?: string
    textClassName?: string
    dotClassName?: string
}

export function MainLogo({ className, textClassName, dotClassName }: MainLogoProps) {
    return (
        <div className={cn("flex items-center gap-3 group", className)}>
            <div className="relative">
                <span
                    className={cn(
                        "relative font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-white group-hover:text-[#FFFF00] transition-colors duration-300 cursor-pointer",
                        textClassName
                    )}
                >
                    Sharpii<span className={cn("text-[#FFFF00]", dotClassName)}>.</span>ai
                </span>
            </div>
        </div>
    )
}
