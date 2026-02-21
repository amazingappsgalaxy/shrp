import React from 'react'

interface DialogProps {
  children: React.ReactNode
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
}

interface DialogFooterProps {
  children: React.ReactNode
}

interface DialogTitleProps {
  children: React.ReactNode
}

interface DialogDescriptionProps {
  children: React.ReactNode
}

interface DialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function Dialog({ children }: DialogProps) {
  return <div>{children}</div>
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

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="mb-4">{children}</div>
}

export function DialogFooter({ children }: DialogFooterProps) {
  return <div className="mt-4 flex justify-end space-x-2">{children}</div>
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <h2 className="text-lg font-semibold">{children}</h2>
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return <p className="text-sm text-gray-600 mt-2">{children}</p>
}

export function DialogTrigger({ children }: DialogTriggerProps) {
  return <div>{children}</div>
}