import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10 backdrop-blur-xl border border-transparent shadow-inner">
      <SliderPrimitive.Range className="absolute h-full bg-[#FFFF00] rounded-full shadow-[0_0_10px_0px_rgba(255,255,0,0.5)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] ring-0 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFF00] hover:scale-110 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
