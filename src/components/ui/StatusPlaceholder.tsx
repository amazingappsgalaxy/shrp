import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusPlaceholderProps {
  icon: LucideIcon
  text?: string
  className?: string
  iconClassName?: string
  textClassName?: string
  showSpinner?: boolean
}

export function StatusPlaceholder({
  icon: Icon,
  text,
  className,
  iconClassName,
  textClassName,
  showSpinner = false
}: StatusPlaceholderProps) {
  return (
    <div className={cn(
      "w-full h-full bg-white/10 flex flex-col items-center justify-center",
      className
    )}>
      {showSpinner ? (
        <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin mb-2" />
      ) : (
        <Icon className={cn("w-8 h-8 text-white/40 mb-2", iconClassName)} />
      )}
      {text && (
        <p className={cn("text-white/60 text-xs text-center", textClassName)}>
          {text}
        </p>
      )}
    </div>
  )
}

export default StatusPlaceholder