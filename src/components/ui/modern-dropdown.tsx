'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface ModernDropdownProps {
  options: DropdownOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base'
}

export function ModernDropdown({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  className,
  disabled = false,
  size = 'md'
}: ModernDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)

  const selectedOption = options.find(option => option.value === value)

  // Update trigger position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect())
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ': {
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(0)
        } else if (focusedIndex >= 0) {
          const option = options[focusedIndex]
          if (!option) break
          if (!option.disabled) {
            onValueChange?.(option.value)
            setIsOpen(false)
            setFocusedIndex(-1)
          }
        }
        break
      }
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          if (options.length === 0) break
          setIsOpen(true)
          setFocusedIndex(0)
        } else {
          setFocusedIndex(prev => {
            if (options.length === 0) return -1
            const nextIndex = prev < options.length - 1 ? prev + 1 : 0
            const nextOption = options[nextIndex]
            if (!nextOption) return prev
            return nextOption.disabled ? (nextIndex < options.length - 1 ? nextIndex + 1 : 0) : nextIndex
          })
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setFocusedIndex(prev => {
            if (options.length === 0) return -1
            const nextIndex = prev > 0 ? prev - 1 : options.length - 1
            const nextOption = options[nextIndex]
            if (!nextOption) return prev
            return nextOption.disabled ? (nextIndex > 0 ? nextIndex - 1 : options.length - 1) : nextIndex
          })
        }
        break
      case 'Escape':
        setIsOpen(false)
        setFocusedIndex(-1)
        triggerRef.current?.focus()
        break
    }
  }

  const handleOptionClick = (option: DropdownOption) => {
    if (option.disabled) return
    onValueChange?.(option.value)
    setIsOpen(false)
    setFocusedIndex(-1)
    triggerRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border transition-all duration-200",
          "bg-white/5 border-white/10 text-white shadow-sm",
          "hover:bg-white/10 hover:border-white/20 focus:outline-none focus:ring-[3px] focus:ring-white/10 focus:border-white/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          isOpen && "bg-white/10 border-white/20 ring-[3px] ring-white/10",
          className
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={cn(
          "truncate text-left",
          !selectedOption && "text-white/60"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div>
          <ChevronDown className={cn(
            "h-4 w-4",
            isOpen ? "text-blue-400 rotate-180" : "text-white/60"
          )} />
        </div>
      </button>

      {/* Dropdown Content */}
        {isOpen && (
          <div
            ref={contentRef}
            className={cn(
              "absolute top-full left-0 right-0 z-50 mt-2",
              "bg-white/5 backdrop-blur-3xl border border-white/10 rounded-lg shadow-lg overflow-hidden",
              "max-h-60 overflow-y-auto"
            )}
            role="listbox"
          >
            <div className="py-1">
              {options.map((option, index) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer rounded-md mx-1 my-0.5",
                    "text-white/90 hover:text-white hover:bg-white/10",
                    focusedIndex === index && "bg-white/10 text-white",
                    option.value === value && "bg-white/10 text-white font-medium border border-white/20",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleOptionClick(option)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  role="option"
                  aria-selected={option.value === value}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-white/60 mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {option.value === value && (
                    <div>
                      <Check className="h-4 w-4 text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  )
}

// Export a simplified version for basic use cases
export function SimpleDropdown({
  options,
  value,
  onValueChange,
  placeholder,
  className
}: {
  options: { value: string; label: string }[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <ModernDropdown
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      className={className}
      size="md"
    />
  )
}