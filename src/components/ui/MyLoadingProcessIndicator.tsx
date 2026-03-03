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
  /** 'center' — horizontal progress bar anchored top-center
   *  'bottom-right' — same pill design but anchored bottom-right (default) */
  mode?: 'center' | 'bottom-right'
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

// ─── Square Tile (bottom-right mode only) ─────────────────────────────────────
// Minimal 48×48 square — spinner only, no text.

function SquareTile({ task, onClose }: { task: TaskItem; onClose: () => void }) {
  const isLoading = task.status === 'loading'
  const isSuccess = task.status === 'success'
  const isError   = task.status === 'error'

  return (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="flex items-center justify-center rounded-xl border"
      style={{
        width: 48,
        height: 48,
        background: '#0e0e0e',
        borderColor: isError ? '#5a1a1a' : isSuccess ? '#3a3a00' : '#2a2a2a',
        boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        cursor: (isError || isSuccess) ? 'pointer' : 'default',
      }}
      onClick={(isError || isSuccess) ? onClose : undefined}
    >
      {isLoading && (
        <svg className="w-6 h-6" viewBox="0 0 28 28"
          style={{ animation: 'mlpi-spin 0.85s linear infinite' }}>
          <circle cx="14" cy="14" r="10" fill="none" stroke="#252525" strokeWidth="2.5" />
          <circle cx="14" cy="14" r="10" fill="none" stroke="#FFFF00" strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray="22 42" />
        </svg>
      )}
      {isSuccess && (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"
          stroke="#FFFF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
      {isError && (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"
          stroke="#ff5555" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      )}
    </motion.div>
  )
}

// ─── Pill Tile (center mode only) ─────────────────────────────────────────────

function PillTile({ task, onClose }: { task: TaskItem; onClose: () => void }) {
  const isLoading = task.status === 'loading'
  const isSuccess = task.status === 'success'
  const isError   = task.status === 'error'

  return (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border"
      style={{
        background: '#0e0e0e',
        borderColor: isError ? '#5a1a1a' : isSuccess ? '#3a3a00' : '#2a2a2a',
        minWidth: 200,
        maxWidth: 320,
        boxShadow: isSuccess
          ? '0 0 14px rgba(255,255,0,0.12), 0 4px 20px rgba(0,0,0,0.75)'
          : isError
          ? '0 4px 20px rgba(0,0,0,0.75)'
          : '0 4px 20px rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Status icon */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {isLoading && (
          <svg className="w-5 h-5" viewBox="0 0 28 28"
            style={{ animation: 'mlpi-spin 0.85s linear infinite' }}>
            <circle cx="14" cy="14" r="10" fill="none" stroke="#252525" strokeWidth="2.5" />
            <circle cx="14" cy="14" r="10" fill="none" stroke="#FFFF00" strokeWidth="2.5"
              strokeLinecap="round" strokeDasharray="22 42" />
          </svg>
        )}
        {isSuccess && (
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none"
            stroke="#FFFF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
        {isError && (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
            stroke="#ff5555" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Label + progress bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isError ? '#ff5555' : isSuccess ? '#FFFF00' : '#888888' }}>
            {isLoading ? 'Generating…' : isSuccess ? 'Done' : 'Failed'}
          </span>
          {isError && task.message && (
            <span className="text-[9px] text-red-400/60 truncate ml-2 max-w-[120px]">{task.message}</span>
          )}
        </div>
        <div className="h-[2px] rounded-full bg-[#1e1e1e] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: isError ? '#ff5555' : '#FFFF00' }}
            initial={{ width: '0%' }}
            animate={{ width: isLoading ? `${task.progress}%` : isSuccess ? '100%' : '30%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Dismiss button (errors + success) */}
      {(isError || isSuccess) && (
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-white/25 hover:text-white hover:bg-white/[0.07] transition-all"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MyLoadingProcessIndicator({
  isVisible = false,
  tasks,
  onCloseTask,
  mode = 'bottom-right',
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

  const activeTasks = tasks

  const positionStyle = mode === 'bottom-right'
    ? { bottom: 20, right: 20 }
    : { top: 84, left: '50%', transform: 'translateX(-50%)' }

  return (
    <>
      <style>{`@keyframes mlpi-spin { to { transform: rotate(360deg); } }`}</style>
      <AnimatePresence>
        {activeTasks.length > 0 && (
          <div className="fixed z-[9990] pointer-events-none" style={positionStyle}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ pointerEvents: 'auto' }}
              className={`flex gap-2 ${mode === 'bottom-right' ? 'flex-col items-end' : 'flex-col items-center'}`}
            >
              {activeTasks.map(task =>
                mode === 'bottom-right' ? (
                  <SquareTile
                    key={task.id}
                    task={task}
                    onClose={() => onCloseTask?.(task.id)}
                  />
                ) : (
                  <PillTile
                    key={task.id}
                    task={task}
                    onClose={() => onCloseTask?.(task.id)}
                  />
                )
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
