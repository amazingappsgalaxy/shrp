'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

interface ModernSliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

const ModernSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  ModernSliderProps
>(({ className, trackClassName, rangeClassName, thumbClassName, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        'relative h-2 w-full grow overflow-hidden rounded-full bg-zinc-700 border border-zinc-600',
        trackClassName
      )}
    >
      <SliderPrimitive.Range
        className={cn(
          'absolute h-full bg-gradient-to-r from-blue-500 to-purple-500',
          rangeClassName
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        'block h-5 w-5 rounded-full border-2 border-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 cursor-pointer',
        thumbClassName
      )}
    />
  </SliderPrimitive.Root>
));

ModernSlider.displayName = SliderPrimitive.Root.displayName;

export { ModernSlider };