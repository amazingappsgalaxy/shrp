
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
// Web Audio API Context (lazy initialized)
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  // @ts-ignore
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return new AudioContext();
}

const MechanicalSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    label?: string
    visualTicks?: boolean
    leftLabel?: string
    rightLabel?: string
  }
>(({ className, label, visualTicks = true, leftLabel, rightLabel, onValueChange, ...props }, ref) => {
  const lastValueRef = React.useRef<number>(props.value?.[0] ?? props.defaultValue?.[0] ?? 0)
  const [internalValue, setInternalValue] = React.useState<number>(props.value?.[0] ?? props.defaultValue?.[0] ?? 0)
  const audioContextRef = React.useRef<AudioContext | null>(null);

  // Track hover to animate ticks
  const [isHovering, setIsHovering] = React.useState(false)

  // Update internal value when props change
  React.useEffect(() => {
    if (props.value?.[0] !== undefined) {
      setInternalValue(props.value[0])
    }
  }, [props.value])

  const lastPlayedValueRef = React.useRef<number>(props.value?.[0] ?? props.defaultValue?.[0] ?? 0)

  const playTick = React.useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = getAudioContext();
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime); // Lower frequency for subtler sound
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.03);

      // Even shorter and quieter envelope
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.009, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, []);

  const handleValueChange = (values: number[]) => {
    const newValue = values[0]
    if (newValue === undefined) return
    setInternalValue(newValue)

    // Calculate movement distance
    const dist = Math.abs(newValue - lastPlayedValueRef.current)
    const minStep = (props.max ?? 100 - (props.min ?? 0)) / 40; // Aim for matching 41 ticks

    // Play sound only if we moved enough (at least one visual tick distance)
    if (dist >= minStep || newValue === props.min || newValue === props.max) {
      playTick();
      lastPlayedValueRef.current = newValue;
    }

    onValueChange?.(values)
  }

  // Calculate scaling for mac-dock effect
  // We need to know the percentage of the current value to determine which ticks are "close"
  const min = props.min ?? 0
  const max = props.max ?? 100
  const range = max - min
  const currentPercent = ((internalValue - min) / range) * 100

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div className="flex items-center gap-4">
        {leftLabel && (
          <span className="text-[10px] font-bold text-gray-500 select-none w-12 text-right shrink-0">
            {leftLabel}
          </span>
        )}

        <SliderPrimitive.Root
          ref={ref}
          className="relative flex w-full touch-none select-none items-center group py-4" // Increased py for hit area
          onValueChange={handleValueChange}
          onPointerEnter={() => setIsHovering(true)}
          onPointerLeave={() => setIsHovering(false)}
          {...props}
        >
          {/* Ticks Background - The "Track" */}
          {visualTicks && (
            <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none">
              {Array.from({ length: 41 }).map((_, i) => {
                const tickPercent = (i / 40) * 100
                const distance = Math.abs(currentPercent - tickPercent)

                // Mac Dock Effect Math
                // Distance 0 -> Scale 2.5 (or max)
                // Distance > threshold -> Scale 1 (base)

                let scale = 1
                let opacity = 0.4
                let activeColor = false

                // If close to thumb
                if (distance < 15) { // 15% range influence
                  // Gaussian-ish or linear falloff
                  // 1 + (1.5 * (1 - distance/radius))
                  scale = 1 + (1.2 * (1 - distance / 15))
                  opacity = 0.4 + (0.6 * (1 - distance / 15))

                  if (distance < 3) activeColor = true
                }

                // If active (hovering or dragging), accentuate logic could go here
                // For now we just use the value proximity always, or maybe only when hovering? 
                // Requests said "As I select the indicator" implying interaction, but Mac dock works on hover. 
                // Usually sliders show value on drag. Let's make it responsive to value always for smoothness.

                return (
                  <div
                    key={i}
                    className={cn(
                      "w-[1px] bg-white transition-all duration-75 ease-out origin-center rounded-full", // Fast duration for fluid feel
                      i % 5 === 0 ? "h-2" : "h-1"
                    )}
                    style={{
                      height: i % 5 === 0 ? `${8 * scale}px` : `${4 * scale}px`,
                      opacity: opacity,
                      backgroundColor: activeColor ? '#FFFF00' : undefined, // Highlight extremely close ticks
                      transform: `scaleY(${scale})`, // Additional scale transform for smoothness
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* Invisible Track for hit area */}
          <SliderPrimitive.Track className="relative h-4 w-full grow overflow-visible bg-transparent">
            {/* We hide the Range (fill) as per the reference style which is just ticks + thumb */}
          </SliderPrimitive.Track>

          {/* Thumb - The Pill */}
          <SliderPrimitive.Thumb
            className="block h-5 w-1.5 rounded-full border-none bg-[#FFFF00] shadow-[0_0_15px_rgba(255,255,0,0.5)] ring-0 transition-opacity duration-300 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing hover:scale-110"
          >
          </SliderPrimitive.Thumb>
        </SliderPrimitive.Root>

        {rightLabel && (
          <span className="text-[10px] font-bold text-gray-500 select-none w-12 text-left shrink-0">
            {rightLabel}
          </span>
        )}
      </div>
    </div>
  )
})
MechanicalSlider.displayName = SliderPrimitive.Root.displayName

export { MechanicalSlider }
