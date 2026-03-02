"use client"

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type TaskStatus = 'loading' | 'success' | 'error'

type TaskItem = {
  id: string
  progress: number
  status: TaskStatus
  message?: string
}

interface MyLoadingProcessIndicatorProps {
  isVisible: boolean
  tasks: TaskItem[]
  onCloseTask?: (taskId: string) => void
}

const playSuccessSound = () => {
  if (typeof window === 'undefined') return
  try {
    // @ts-ignore
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(700, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.002, ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch (e) {}
}

export default function MyLoadingProcessIndicator({
  isVisible = false,
  tasks,
  onCloseTask,
}: MyLoadingProcessIndicatorProps) {
  const processedTaskIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    ;(tasks || []).forEach(task => {
      if (task.status === 'success' && !processedTaskIds.current.has(task.id)) {
        playSuccessSound()
        processedTaskIds.current.add(task.id)
      }
    })
  }, [tasks])

  return (
    <AnimatePresence>
      {isVisible && (
        // Fixed bottom-right, with enough clearance to sit above the dock (~220px) + breathing room
        <div
          className="fixed z-[9990] pointer-events-none"
          style={{ bottom: 240, right: 24 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={{ pointerEvents: 'auto' }}
            className="flex flex-col gap-1.5"
          >
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-xl border border-white/10 bg-[#111111]"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', minWidth: 220, maxWidth: 300 }}
              >
                {/* Status dot */}
                <div className="shrink-0">
                  {task.status === 'loading' && (
                    <div className="w-4 h-4 border-[1.5px] border-white/20 border-t-white rounded-full animate-spin" />
                  )}
                  {task.status === 'success' && (
                    <div className="w-4 h-4 bg-[#FFFF00] rounded-full flex items-center justify-center">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {task.status === 'error' && (
                    <div className="w-4 h-4 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Message */}
                <span className="flex-1 text-[11px] font-medium text-white/75 truncate leading-none">
                  {task.message ?? (task.status === 'loading' ? 'Generating…' : task.status === 'success' ? 'Done' : 'Failed')}
                </span>

                {/* Dismiss */}
                <button
                  type="button"
                  onClick={() => onCloseTask?.(task.id)}
                  className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-white/30 hover:text-white hover:bg-white/[0.07] transition-all"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
