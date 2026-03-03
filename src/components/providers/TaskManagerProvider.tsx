"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import MyLoadingProcessIndicator from '@/components/ui/MyLoadingProcessIndicator'

// ─── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = 'processing' | 'completed' | 'failed'

interface WatchedTask {
  historyId: string
  label?: string
  addedAt: number
  status: TaskStatus
  notified: boolean
}

interface TaskManagerContextValue {
  addWatchedTask: (historyId: string, label?: string) => void
  resolveTask: (historyId: string) => void   // immediately mark as completed (API returned)
  failTask: (historyId: string) => void       // immediately mark as failed
  dismissTask: (historyId: string) => void
}

// ─── Context ───────────────────────────────────────────────────────────────────

const TaskManagerContext = createContext<TaskManagerContextValue>({
  addWatchedTask: () => {},
  resolveTask: () => {},
  failTask: () => {},
  dismissTask: () => {},
})

export function useTaskManager() {
  return useContext(TaskManagerContext)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5000

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
    gain.gain.exponentialRampToValueAtTime(0.002, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
  } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TaskManagerProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Map<string, WatchedTask>>(new Map())
  // Ref always holds the latest tasks — prevents stale closures in the poll interval
  const tasksRef = useRef<Map<string, WatchedTask>>(new Map())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // One-time cleanup: remove any stale task state left in localStorage by the old system
  useEffect(() => {
    try { localStorage.removeItem('tm:tasks') } catch {}
  }, [])

  // Keep tasksRef in sync with state
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  // ── Poll — reads from tasksRef so it is NEVER stale ───────────────────────
  // No deps on tasks/state — always up-to-date via tasksRef.current
  const poll = useCallback(async () => {
    const processing = Array.from(tasksRef.current.values()).filter(t => t.status === 'processing')
    if (processing.length === 0) return

    const ids = processing.map(t => t.historyId).join(',')
    try {
      const res = await fetch(`/api/history/list?ids=${ids}`)
      if (!res.ok) return
      const data = await res.json() as { items: Array<{ id: string; status: string }> }

      setTasks(prev => {
        const next = new Map(prev)
        let changed = false
        for (const item of data.items) {
          const task = next.get(item.id)
          if (!task || task.status !== 'processing') continue
          // Only accept known terminal statuses
          if (item.status !== 'completed' && item.status !== 'failed') continue

          const newStatus = item.status as TaskStatus
          changed = true

          if (item.status === 'completed' && !task.notified) {
            next.set(item.id, { ...task, status: 'completed', notified: true })
            playSuccessSound()
            // auto-dismiss after 2s
            const timer = setTimeout(() => {
              setTasks(p => { const m = new Map(p); m.delete(item.id); return m })
            }, 2000)
            dismissTimers.current.set(item.id, timer)
          } else {
            next.set(item.id, { ...task, status: newStatus })
          }
        }
        return changed ? next : prev
      })
    } catch {}
  }, []) // stable — reads from tasksRef.current, never captures stale state

  // Start / stop the poll interval whenever processing task count changes
  useEffect(() => {
    const hasProcessing = Array.from(tasks.values()).some(t => t.status === 'processing')
    if (hasProcessing) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => { void poll() }, POLL_INTERVAL_MS)
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // poll is stable (no deps), so this effect only re-runs when `tasks` changes
  }, [tasks, poll])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      dismissTimers.current.forEach(t => clearTimeout(t))
    }
  }, [])

  // ── Public API ────────────────────────────────────────────────────────────

  const addWatchedTask = useCallback((historyId: string, label?: string) => {
    setTasks(prev => {
      const next = new Map(prev)
      next.set(historyId, { historyId, label, addedAt: Date.now(), status: 'processing', notified: false })
      return next
    })
    // Trigger an immediate poll after tasksRef has been updated (next render cycle)
    setTimeout(() => { void poll() }, 300)
  }, [poll])

  // Immediately mark a task as completed (called when the API returns success directly)
  const resolveTask = useCallback((historyId: string) => {
    setTasks(prev => {
      const task = prev.get(historyId)
      if (!task || task.status !== 'processing') return prev
      const next = new Map(prev)
      next.set(historyId, { ...task, status: 'completed', notified: true })
      playSuccessSound()
      const timer = setTimeout(() => {
        setTasks(p => { const m = new Map(p); m.delete(historyId); return m })
      }, 2000)
      dismissTimers.current.set(historyId, timer)
      return next
    })
  }, [])

  // Immediately mark a task as failed
  const failTask = useCallback((historyId: string) => {
    setTasks(prev => {
      const task = prev.get(historyId)
      if (!task || task.status !== 'processing') return prev
      const next = new Map(prev)
      next.set(historyId, { ...task, status: 'failed' })
      return next
    })
  }, [])

  const dismissTask = useCallback((historyId: string) => {
    const timer = dismissTimers.current.get(historyId)
    if (timer) { clearTimeout(timer); dismissTimers.current.delete(historyId) }
    setTasks(prev => { const next = new Map(prev); next.delete(historyId); return next })
  }, [])

  // ── Indicator tasks ───────────────────────────────────────────────────────

  const indicatorTasks = Array.from(tasks.values()).map(t => ({
    id: t.historyId,
    progress: t.status === 'completed' ? 100 : t.status === 'failed' ? 0 : 60,
    status: t.status === 'completed' ? 'success' as const
          : t.status === 'failed'    ? 'error' as const
          :                            'loading' as const,
    message: t.label,
  }))

  return (
    <TaskManagerContext.Provider value={{ addWatchedTask, resolveTask, failTask, dismissTask }}>
      {children}
      <MyLoadingProcessIndicator
        isVisible={indicatorTasks.length > 0}
        tasks={indicatorTasks}
        mode="bottom-right"
        onCloseTask={dismissTask}
      />
    </TaskManagerContext.Provider>
  )
}
