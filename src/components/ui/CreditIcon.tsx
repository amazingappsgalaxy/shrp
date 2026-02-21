import React from 'react'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreditIconProps {
  className?: string
  iconClassName?: string
}

export function CreditIcon({ className, iconClassName }: CreditIconProps) {
  return (
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#FFFF00]/10 text-[#FFFF00]", className)}>
      <Zap className={cn("w-4 h-4 fill-current", iconClassName)} />
    </div>
  )
}
