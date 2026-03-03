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
  /** 'center' — horizontal progress bar in center of screen
   *  'bottom-right' — small square tiles in bottom-right corner (default) */
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

// ─── Bottom-Right Tile ────────────────────────────────────────────────────────
// A small square tile showing spinner → checkmark → error

function BottomRightTile({ task, onClose }: { task: TaskItem; onClose: () => void }) {
  const isLoading = task.status === 'loading'
  const isSuccess = task.status === 'success'
  const isError   = task.status === 'error'

  return (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, scale: 0.75, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.75, y: 12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative flex flex-col items-center gap-1.5"
    >
      {/* Main tile */}
      <div
        className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center relative overflow-hidden"
        style={{
          background: isError ? '#1a0505' : '#0e0e0e',
          border: `1px solid ${isError ? '#5a1a1a' : isSuccess ? '#3a3a00' : '#2a2a2a'}`,
          boxShadow: isSuccess
            ? '0 0 16px rgba(255,255,0,0.18), 0 4px 20px rgba(0,0,0,0.7)'
            : isError
            ? '0 0 16px rgba(255,60,60,0.1), 0 4px 20px rgba(0,0,0,0.7)'
            : '0 4px 20px rgba(0,0,0,0.8)',
        }}
      >
        {isLoading && (
          // Circular spinner — SVG arc animated with CSS
          <svg
            className="w-7 h-7"
            viewBox="0 0 28 28"
            style={{ animation: 'mlpi-spin 0.9s linear infinite' }}
          >
            {/* Track */}
            <circle
              cx="14" cy="14" r="10"
              fill="none"
              stroke="#252525"
              strokeWidth="2.5"
            />
            {/* Arc */}
            <circle
              cx="14" cy="14" r="10"
              fill="none"
              stroke="#FFFF00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="22 42"
              strokeDashoffset="0"
            />
          </svg>
        )}

        {isSuccess && (
          <motion.svg
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-7 h-7"
            viewBox="0 0 28 28"
            fill="none"
          >
            <motion.path
              d="M6 14.5l5.5 5.5L22 9"
              stroke="#FFFF00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </motion.svg>
        )}

        {isError && (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#ff5555" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Label below tile */}
      <span
        className="text-[9px] font-black uppercase tracking-widest"
        style={{
          color: isError ? '#ff5555' : isSuccess ? '#FFFF00' : '#606060',
          letterSpacing: '0.08em',
        }}
      >
        {isLoading ? 'Working' : isSuccess ? 'Done' : 'Failed'}
      </span>

      {/* Error dismiss */}
      {isError && (
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-1 -right-1 w-4 h-4 bg-[#1a1a1a] border border-[#3a3a3a] rounded-full flex items-center justify-center hover:bg-[#2a2a2a] transition-colors"
        >
          <svg width="6" height="6" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 3L3 9M3 3l6 6" />
          </svg>
        </button>
      )}

      {/* Error message tooltip */}
      {isError && task.message && (
        <div
          className="absolute bottom-full mb-2 right-0 text-[10px] text-white/70 bg-[#111] border border-[#3a1a1a] rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap max-w-[220px] leading-tight"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.7)', wordBreak: 'break-word', whiteSpace: 'normal' }}
        >
          {task.message}
        </div>
      )}
    </motion.div>
  )
}

// ─── Center Mode Tile ─────────────────────────────────────────────────────────
// Horizontal pill with progress bar — transforms to Done

function CenterTile({ task, onClose }: { task: TaskItem; onClose: () => void }) {
  const isLoading = task.status === 'loading'
  const isSuccess = task.status === 'success'
  const isError   = task.status === 'error'

  return (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border"
      style={{
        background: '#0e0e0e',
        borderColor: isError ? '#5a1a1a' : isSuccess ? '#3a3a00' : '#2a2a2a',
        minWidth: 220,
        boxShadow: '0 4px 24px rgba(0,0,0,0.8)',
      }}
    >
      {/* Icon */}
      {isLoading && (
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 28 28"
          style={{ animation: 'mlpi-spin 0.9s linear infinite' }}>
          <circle cx="14" cy="14" r="10" fill="none" stroke="#252525" strokeWidth="2.5" />
          <circle cx="14" cy="14" r="10" fill="none" stroke="#FFFF00" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="22 42" />
        </svg>
      )}
      {isSuccess && (
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#FFFF00" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
      {isError && (
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#ff5555" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      )}

      <div className="flex-1 min-w-0">
        {/* Label */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isError ? '#ff5555' : isSuccess ? '#FFFF00' : '#888888' }}>
            {isLoading ? 'Generating…' : isSuccess ? 'Done' : 'Failed'}
          </span>
          {task.message && isError && (
            <span className="text-[9px] text-red-400/70 truncate ml-2">{task.message}</span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-[3px] rounded-full bg-[#1e1e1e] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: isError ? '#ff5555' : '#FFFF00' }}
            initial={{ width: '0%' }}
            animate={{ width: `${task.progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Dismiss (errors + success) */}
      {(isError || isSuccess) && (
        <button type="button" onClick={onClose}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-white/30 hover:text-white hover:bg-white/[0.07] transition-all">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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

  const activeTasks = tasks.filter(t => t.status !== 'success' || true) // show all states

  if (mode === 'bottom-right') {
    return (
      <>
        {/* Inject keyframes */}
        <style>{`@keyframes mlpi-spin { to { transform: rotate(360deg); } }`}</style>
        <AnimatePresence>
          {activeTasks.length > 0 && (
            <div
              className="fixed z-[9990] pointer-events-none"
              style={{ bottom: 160, right: 20 }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ pointerEvents: 'auto' }}
                className="flex flex-col items-end gap-3"
              >
                {activeTasks.map(task => (
                  <BottomRightTile
                    key={task.id}
                    task={task}
                    onClose={() => onCloseTask?.(task.id)}
                  />
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Center mode
  return (
    <>
      <style>{`@keyframes mlpi-spin { to { transform: rotate(360deg); } }`}</style>
      <AnimatePresence>
        {activeTasks.length > 0 && (
          <div
            className="fixed z-[9990] pointer-events-none"
            style={{ top: 80, left: '50%', transform: 'translateX(-50%)' }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ pointerEvents: 'auto' }}
              className="flex flex-col items-center gap-2"
            >
              {activeTasks.map(task => (
                <CenterTile
                  key={task.id}
                  task={task}
                  onClose={() => onCloseTask?.(task.id)}
                />
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
