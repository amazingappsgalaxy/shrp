"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DropdownOption {
    value: string
    label: string
    description?: string
    icon?: React.ComponentType<{ className?: string }>
}

interface CustomDropdownProps {
    options: DropdownOption[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function CustomDropdown({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    className,
    disabled = false
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false)
            } else if (e.key === "ArrowDown") {
                e.preventDefault()
                const currentIndex = options.findIndex(opt => opt.value === value)
                const nextIndex = (currentIndex + 1) % options.length
                onChange(options[nextIndex].value)
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                const currentIndex = options.findIndex(opt => opt.value === value)
                const prevIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1
                onChange(options[prevIndex].value)
            } else if (e.key === "Enter") {
                setIsOpen(false)
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, value, options, onChange])

    return (
        <div ref={dropdownRef} className={cn("relative", className)}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-3 pr-10 text-sm font-medium",
                    "focus:ring-1 focus:ring-white/20 focus:border-white/30 outline-none cursor-pointer",
                    "hover:bg-[#202024] transition-colors text-left",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isOpen && "ring-1 ring-white/20 border-white/30"
                )}
            >
                <div className="flex items-center gap-2">
                    {selectedOption?.icon && <selectedOption.icon className="w-4 h-4 text-gray-400" />}
                    <span className="truncate">{selectedOption?.label || placeholder}</span>
                </div>

                {/* Chevron Icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-[#18181b] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
                    >
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {options.map((option) => {
                                const isSelected = option.value === value
                                const Icon = option.icon

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value)
                                            setIsOpen(false)
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2.5 text-left transition-colors",
                                            "hover:bg-white/5 focus:bg-white/5 outline-none",
                                            isSelected && "bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={cn(
                                                        "text-sm font-medium truncate",
                                                        isSelected ? "text-white" : "text-gray-300"
                                                    )}>
                                                        {option.label}
                                                    </span>
                                                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                                                </div>
                                                {option.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                        {option.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
