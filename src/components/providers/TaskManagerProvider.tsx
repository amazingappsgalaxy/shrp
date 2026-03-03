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
  dismissTask: (historyId: string) => void
}

// ─── Context ───────────────────────────────────────────────────────────────────

const TaskManagerContext = createContext<TaskManagerContextValue>({
  addWatchedTask: () => {},
  dismissTask: () => {},
})

export function useTaskManager() {
  return useContext(TaskManagerContext)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tm:tasks'
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 h
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

function loadFromStorage(): Map<string, WatchedTask> {
  if (typeof window === 'undefined') return new Map()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Map()
    const arr = JSON.parse(raw) as WatchedTask[]
    const now = Date.now()
    const map = new Map<string, WatchedTask>()
    for (const t of arr) {
      if (t.status === 'processing' && now - t.addedAt < MAX_AGE_MS) {
        map.set(t.historyId, t)
      }
    }
    return map
  } catch {
    return new Map()
  }
}

function saveToStorage(tasks: Map<string, WatchedTask>) {
  if (typeof window === 'undefined') return
  try {
    const arr = Array.from(tasks.values()).filter(t => t.status === 'processing')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TaskManagerProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Map<string, WatchedTask>>(new Map())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Load persisted tasks on mount
  useEffect(() => {
    const restored = loadFromStorage()
    if (restored.size > 0) setTasks(restored)
  }, [])

  // Persist on every change
  useEffect(() => {
    saveToStorage(tasks)
  }, [tasks])

  // ── Poll ──────────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    setTasks(current => {
      const processing = Array.from(current.values()).filter(t => t.status === 'processing')
      if (processing.length === 0) return current
      return current // actual fetch happens outside setState
    })

    // Capture current processing tasks
    const snapshot = new Map(tasks)
    const processing = Array.from(snapshot.values()).filter(t => t.status === 'processing')
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
          if (item.status === 'completed' || item.status === 'failed') {
            next.set(item.id, { ...task, status: item.status as TaskStatus })
            changed = true
            if (item.status === 'completed' && !task.notified) {
              next.set(item.id, { ...task, status: 'completed', notified: true })
              playSuccessSound()
              // auto-dismiss after 6s
              const timer = setTimeout(() => {
                setTasks(p => { const m = new Map(p); m.delete(item.id); return m })
              }, 6000)
              dismissTimers.current.set(item.id, timer)
            }
          }
        }
        return changed ? next : prev
      })
    } catch {}
  }, [tasks])

  // Start/stop poll interval based on whether any tasks are processing
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
    return () => {}
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
    // Immediate poll after a short delay
    setTimeout(() => { void poll() }, 300)
  }, [poll])

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
    <TaskManagerContext.Provider value={{ addWatchedTask, dismissTask }}>
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
