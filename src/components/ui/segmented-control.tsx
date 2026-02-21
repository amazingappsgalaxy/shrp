'use client'

import { cn } from '@/lib/utils'

interface SegmentedControlOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
}

interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  size = 'md'
}: SegmentedControlProps) {

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  }

  const paddingClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  }

  return (
    <div
      className={cn(
        'relative inline-flex items-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg',
        paddingClasses[size],
        className
      )}
    >
      {/* Background slider */}
      <div
        className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-accent-blue/80 to-accent-purple/80 rounded-xl shadow-lg backdrop-blur-xl border border-white/20"
        style={{
          left: `${(options.findIndex(opt => opt.value === value) * 100) / options.length + 1.5}%`,
          width: `${100 / options.length - 3}%`,
        }}
      />
      
      {/* Options */}
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium',
            sizeClasses[size],
            value === option.value
              ? 'text-white shadow-sm'
              : 'text-white/70 hover:text-white/90 hover:bg-white/5'
          )}
        >
          {option.icon && (
            <span>
              {option.icon}
            </span>
          )}
          <span className="font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

export default SegmentedControl