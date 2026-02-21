'use client'

import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
  icon?: React.ReactNode
}

interface SimpleSegmentedControlProps {
  options: Option[]
  value?: string
  onChange: (value: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SimpleSegmentedControl({
  options,
  value,
  onChange,
  className,
  size = 'md'
}: SimpleSegmentedControlProps) {
  // Default to first option if no value provided
  const currentValue = value || options[0]?.value

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
        'relative inline-flex items-center rounded-lg bg-white/5 border border-white/10',
        paddingClasses[size],
        className
      )}
    >
      {/* Background slider with minimal animation */}
      <div
        className="absolute top-1 bottom-1 bg-white/20 rounded-md transition-all duration-200 ease-out"
        style={{
          left: `${(options.findIndex(opt => opt.value === currentValue) * 100) / options.length + 0.25}%`,
          width: `${100 / options.length - 0.5}%`,
        }}
      />

      {/* Options */}
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors',
            sizeClasses[size],
            currentValue === option.value
              ? 'text-white'
              : 'text-white/60 hover:text-white/80'
          )}
        >
          {option.icon && (
            <span>
              {option.icon}
            </span>
          )}
          <span className="font-light">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

export default SimpleSegmentedControl