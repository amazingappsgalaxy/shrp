/**
 * Smart progress simulator for AI task loading indicators.
 *
 * Two-phase animation:
 *   Phase 1 (0 → 40–46%): Rapid random bursts — feels snappy and responsive.
 *   Phase 2 (40–46% → 96%): Slow trickle calibrated to the model's approximate
 *       task duration, using elapsed-time so it's accurate even if the tab throttles.
 *
 * All timing state is managed in the closure — setActiveTasks is only called to
 * push the already-computed value. This avoids issues with React's functional-
 * updater double-invoke (StrictMode) and makes the logic easy to reason about.
 *
 * When the real response arrives the caller sets progress → 100 immediately.
 * The task timer has no bearing on actual completion.
 *
 * Task timer reference (approximate backend durations):
 *   skin-editor  (smart upscale OFF): 70 s
 *   skin-editor  (smart upscale ON): 160 s
 *   smart-upscaler:                  190 s
 */

export type TaskStatus = 'loading' | 'success' | 'error'

export interface TaskEntry {
  id: string
  progress: number
  status: TaskStatus
  message?: string
  createdAt: number
  inputImage: string
}

type SetTasksFn = (
  updater: (prev: Map<string, TaskEntry>) => Map<string, TaskEntry>
) => void

const TICK_MS = 150          // interval polling rate
const PHASE1_EST_SECS = 7   // estimated wall-clock seconds for phase 1

/**
 * Starts the smart progress animation for a task.
 * Returns the interval handle — store it in taskIntervalsRef and clear it on
 * task completion, exactly as before.
 */
export function startSmartProgress(
  taskId: string,
  taskDurationSecs: number,
  setActiveTasks: SetTasksFn
): ReturnType<typeof setInterval> {
  // ── Closure state (all mutations happen here, NOT inside setActiveTasks) ──
  const phase1Target = 40 + Math.random() * 6   // 40–46 %
  let progress = 0
  let phase: 1 | 2 = 1

  // Phase 1 timing
  let lastBurstAt = 0
  // First burst fires quickly (50–150 ms), subsequent ones every 150–400 ms
  let nextBurstDelay = 50 + Math.random() * 100

  // Phase 2 rate — fill (96 - phase1Target)% over remaining time
  const phase2Duration = Math.max(taskDurationSecs - PHASE1_EST_SECS, 10)
  const phase2RatePerSec = (96 - phase1Target) / phase2Duration
  let lastPhase2At = 0   // set when we enter phase 2

  // ─────────────────────────────────────────────────────────────────────────
  return setInterval(() => {
    const now = Date.now()
    let updated = false

    if (phase === 1) {
      const elapsed = now - lastBurstAt
      if (lastBurstAt === 0 || elapsed >= nextBurstDelay) {
        // Fire a burst: 5–14 %
        const burst = 5 + Math.random() * 9
        progress = Math.min(progress + burst, phase1Target)
        lastBurstAt = now

        if (progress >= phase1Target) {
          // Transition to phase 2
          phase = 2
          lastPhase2At = now
        } else {
          // Schedule next burst after a random delay
          nextBurstDelay = 150 + Math.random() * 250
        }
        updated = true
      }
    } else {
      // Phase 2 — use actual elapsed time for accuracy
      const elapsed = (now - lastPhase2At) / 1000   // seconds
      lastPhase2At = now
      const jitter = 0.7 + Math.random() * 0.6
      const next = Math.min(progress + phase2RatePerSec * elapsed * jitter, 96)
      if (next > progress) {
        progress = next
        updated = true
      }
    }

    if (!updated) return

    // Push the value into React state — no closure mutations inside this call
    const snapshot = Math.round(progress * 10) / 10
    setActiveTasks(prev => {
      const task = prev.get(taskId)
      if (!task || task.status !== 'loading') return prev
      const newMap = new Map(prev)
      newMap.set(taskId, { ...task, progress: snapshot })
      return newMap
    })
  }, TICK_MS)
}
