"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const ProcessingGradient = ({ className }: { className?: string }) => {
    const [randomParams, setRandomParams] = useState({
        seed: 0,
        delay1: 0,
        delay2: 0,
        noisePos: '0px 0px',
        scale: 1
    });

    useEffect(() => {
        // Generate random parameters on client-side only to ensure unique look per instance
        setRandomParams({
            seed: Math.floor(Math.random() * 1000),
            delay1: Math.random() * -20, // Negative delay offsets the start of the spin
            delay2: Math.random() * -20,
            noisePos: `${Math.floor(Math.random() * 200)}px ${Math.floor(Math.random() * 200)}px`,
            scale: 1 + Math.random() * 0.2 // Subtle scale variance
        });
    }, []);

    // Construct SVG with dynamic seed
    // Note: we can't easily inject dynamic seed into encoded SVG string without re-encoding or constructing carefully.
    // The simplest way is to update the seed attribute directly in the string.
    // Original: ... stitchTiles='stitch'/%3E ...
    // New:      ... stitchTiles='stitch' seed='VAL'/%3E ...

    const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.25' numOctaves='2' stitchTiles='stitch' seed='${randomParams.seed}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

    return (
        <div className={cn("absolute inset-0 overflow-hidden bg-[#1a1a1c]", className)}>
            {/* Animated Gradient Background - Enhanced Intensity & Randomized Phase */}
            <div className="absolute inset-0 opacity-100">
                <div
                    className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,#ffffff_45deg,transparent_90deg)] opacity-60 blur-[40px]"
                    style={{ animationDelay: `${randomParams.delay1}s` }}
                />
                <div
                    className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_10s_linear_infinite_reverse] bg-[conic-gradient(from_180deg,transparent_0deg,#d4d4d8_60deg,transparent_120deg)] opacity-40 blur-[50px]"
                    style={{ animationDelay: `${randomParams.delay2}s` }}
                />
            </div>

            {/* Noise Overlay - Stronger & Bigger Dots (Lower Frequency) with Randomized Seed/Position */}
            <div
                className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: noiseSvg,
                    backgroundSize: '150px 150px',
                    backgroundPosition: randomParams.noisePos,
                    transform: `scale(${randomParams.scale})`,
                    transition: 'opacity 0.5s ease-in'
                }}
            />

            {/* Subtle Pulse */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent mix-blend-multiply" />

            {/* Text */}
            <div className="absolute bottom-3 left-3 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    <span className="text-[10px] font-medium text-white/90 tracking-widest uppercase shadow-black/50 drop-shadow-md">Generating</span>
                </div>
            </div>
        </div>
    );
};
