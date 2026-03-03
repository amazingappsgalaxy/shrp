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

// ─── Square Tile (bottom-right mode) ──────────────────────────────────────────
// 48×48 — clean circular ring spinner, animated checkmark, shake-X for error

function SquareTile({ task, onClose }: { task: TaskItem; onClose: () => void }) {
  const isLoading = task.status === 'loading'
  const isSuccess = task.status === 'success'
  const isError   = task.status === 'error'

  // Spinner ring constants
  const R = 9
  const circ = 2 * Math.PI * R  // ~56.5

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 8 }}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative flex items-center justify-center rounded-2xl overflow-hidden"
      style={{
        width: 48,
        height: 48,
        background: isSuccess
          ? 'radial-gradient(circle at 50% 50%, #0a1a0f 0%, #0c0c0c 100%)'
          : isError
          ? 'radial-gradient(circle at 50% 50%, #1a0505 0%, #0c0c0c 100%)'
          : '#0d0d0d',
        border: `1px solid ${isError ? '#4a1515' : isSuccess ? '#166534' : '#222222'}`,
        boxShadow: isSuccess
          ? '0 0 14px rgba(34,197,94,0.15), 0 4px 24px rgba(0,0,0,0.9)'
          : '0 4px 24px rgba(0,0,0,0.9)',
        cursor: (isError || isSuccess) ? 'pointer' : 'default',
      }}
      onClick={(isError || isSuccess) ? onClose : undefined}
      title={isError ? 'Dismiss' : isSuccess ? 'Dismiss' : undefined}
    >
      {/* Loading ring */}
      {isLoading && (
        <svg width="28" height="28" viewBox="0 0 28 28" style={{ overflow: 'visible' }}>
          {/* Track */}
          <circle cx="14" cy="14" r={R} fill="none" stroke="#1e1e1e" strokeWidth="2" />
          {/* Animated arc */}
          <circle
            cx="14" cy="14" r={R}
            fill="none"
            stroke="#FFFF00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
            style={{
              transformOrigin: '14px 14px',
              animation: 'mlpi-spin 0.9s linear infinite',
              filter: 'drop-shadow(0 0 3px rgba(255,255,0,0.5))',
            }}
          />
        </svg>
      )}

      {/* Success: animated green tick */}
      {isSuccess && (
        <svg width="28" height="28" viewBox="0 0 28 28">
          <motion.path
            d="M7 15l5 5 9-10"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </svg>
      )}

      {/* Error: X with shake */}
      {isError && (
        <motion.svg
          width="24" height="24" viewBox="0 0 24 24"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, x: [0, -3, 3, -2, 2, 0] }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <circle cx="12" cy="12" r="9" fill="none" stroke="#ff4444" strokeWidth="1.5"
            opacity={0.5} />
          <path d="M9 9l6 6M15 9l-6 6" stroke="#ff4444" strokeWidth="2"
            strokeLinecap="round" />
        </motion.svg>
      )}
    </motion.div>
  )
}

// ─── Pill Tile (center mode only) ─────────────────────────────────────────────

function PillTile({ task, onClose }: { task: TaskItem; onClose: () => void }) {
  const isLoading = task.status === 'loading'
  const isSuccess = task.status === 'success'
  const isError   = task.status === 'error'

  const R = 9
  const circ = 2 * Math.PI * R

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
          <svg width="20" height="20" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r={R} fill="none" stroke="#1e1e1e" strokeWidth="2.5" />
            <circle cx="14" cy="14" r={R} fill="none" stroke="#FFFF00" strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
              style={{ transformOrigin: '14px 14px', animation: 'mlpi-spin 0.9s linear infinite' }}
            />
          </svg>
        )}
        {isSuccess && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="#FFFF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </svg>
        )}
        {isError && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#ff5555" strokeWidth="2.5" strokeLinecap="round" />
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

function playSuccessSound() {
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
  } catch {}
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MyLoadingProcessIndicator({
  isVisible = false,
  tasks,
  onCloseTask,
  mode = 'bottom-right',
}: MyLoadingProcessIndicatorProps) {
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    tasks.forEach(task => {
      if (task.status === 'success' && !notifiedRef.current.has(task.id)) {
        notifiedRef.current.add(task.id)
        playSuccessSound()
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
      <div className="fixed z-[9990] pointer-events-none" style={positionStyle}>
        <motion.div
          style={{ pointerEvents: 'auto' }}
          className={`flex gap-2 ${mode === 'bottom-right' ? 'flex-col items-end' : 'flex-col items-center'}`}
        >
          <AnimatePresence mode="popLayout">
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
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}
