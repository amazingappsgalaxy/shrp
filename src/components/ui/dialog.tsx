import React from 'react'

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface DialogFooterProps {
  children: React.ReactNode
  className?: string
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

interface DialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

interface DialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function Dialog({ children, open, onOpenChange }: DialogProps) {
  // If open is controlled and false, render nothing
  if (open === false) return null
  return (
    <div onClick={(e) => {
      if (e.target === e.currentTarget && onOpenChange) onOpenChange(false)
    }}>
      {children}
    </div>
  )
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div className={`fixed inset-0 z-50 bg-black/50 flex items-center justify-center ${className}`}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return <div className={`mt-4 flex justify-end space-x-2 ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>
}

export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
  return <p className={`text-sm text-gray-600 mt-2 ${className}`}>{children}</p>
}

export function DialogTrigger({ children }: DialogTriggerProps) {
  return <div>{children}</div>
}
