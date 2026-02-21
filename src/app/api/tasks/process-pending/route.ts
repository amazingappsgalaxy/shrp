/**
 * POST /api/tasks/process-pending
 *
 * Server-side batch processor for all pending RunningHub tasks.
 * Called by the Netlify scheduled function every minute.
 *
 * Security: requires X-Cron-Secret header matching CRON_SECRET env var.
 *
 * This is the key piece that ensures tasks complete even when the user's
 * browser is closed. Works for all models (skin-editor, smart-upscaler,
 * and any future models added later).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from '../../../../lib/config'
import { AIProviderFactory } from '../../../../services/ai-providers/provider-factory'
import { ProviderType } from '../../../../services/ai-providers/common/types'
import { RunningHubProvider } from '../../../../services/ai-providers/runninghub/runninghub-provider'
import { UnifiedCreditsService } from '@/lib/unified-credits'

type EnhancementOutputItem = { type: 'image' | 'video'; url: string }

const normalizeOutputs = (value: unknown): EnhancementOutputItem[] => {
  const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)
  const asItem = (url: string): EnhancementOutputItem => ({
    type: isVideo(url) ? 'video' : 'image',
    url
  })
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return asItem(item)
        if (item && typeof item === 'object') {
          const url = (item as { url?: string }).url
          const type = (item as { type?: 'image' | 'video' }).type
          if (url && type) return { url, type }
          if (url) return asItem(url)
        }
        return null
      })
      .filter((item): item is EnhancementOutputItem => !!item)
  }
  if (typeof value === 'string') return [asItem(value)]
  return []
}

/** Process a single pending task. Returns 'completed' | 'failed' | 'running' */
async function processPendingTask(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  provider: RunningHubProvider,
  task: { id: string; user_id: string; settings: any; created_at: string }
): Promise<'completed' | 'failed' | 'running'> {
  const settings = task.settings || {}
  const runningHubTaskId: string | undefined = settings._runningHubTaskId
  const expectedNodeIds: string[] | undefined = settings._expectedNodeIds
  const creditsToDeduct: number = settings._creditsToDeduct || 0

  // Stale task with no RunningHub ID — mark as failed after 10 minutes
  if (!runningHubTaskId) {
    const ageMs = Date.now() - new Date(task.created_at).getTime()
    if (ageMs > 10 * 60 * 1000) {
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          settings: { ...settings, _failureReason: 'Task timed out before starting' }
        })
        .eq('id', task.id)
        .eq('status', 'processing')
      return 'failed'
    }
    return 'running'
  }

  try {
    const check = await provider.checkTaskOnce(runningHubTaskId, expectedNodeIds)

    if (check.status === 'success') {
      const rawUrls = check.outputUrls?.length ? check.outputUrls : (check.outputUrl ? [check.outputUrl] : [])
      const outputs = normalizeOutputs(rawUrls)
      const generationTimeMs = Date.now() - new Date(task.created_at).getTime()

      // Atomic update — only wins if status is still 'processing' (prevents race with client poll)
      const { data: won } = await supabase
        .from('history_items')
        .update({
          status: 'completed',
          output_urls: outputs,
          generation_time_ms: generationTimeMs,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .eq('status', 'processing')
        .select('id')
        .maybeSingle()

      if (won && creditsToDeduct > 0) {
        try {
          await UnifiedCreditsService.deductCredits(
            task.user_id,
            creditsToDeduct,
            task.id,
            'Image enhancement'
          )
        } catch (e) {
          console.error(`process-pending: credit deduction failed for task ${task.id}:`, e)
        }
      }

      return 'completed'
    }

    if (check.status === 'failed') {
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          settings: { ...settings, _failureReason: check.error || 'Task failed on RunningHub' }
        })
        .eq('id', task.id)
        .eq('status', 'processing')

      return 'failed'
    }

    // Tasks that have been stuck for > 2 hours are assumed permanently failed
    const ageMs = Date.now() - new Date(task.created_at).getTime()
    if (ageMs > 2 * 60 * 60 * 1000) {
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          settings: { ...settings, _failureReason: 'Task exceeded maximum processing time' }
        })
        .eq('id', task.id)
        .eq('status', 'processing')
      return 'failed'
    }

    return 'running'
  } catch (error) {
    console.error(`process-pending: error checking task ${task.id}:`, error)
    return 'running'
  }
}

export async function POST(request: NextRequest) {
  // --- Security: validate cron secret ---
  const cronSecret = process.env.CRON_SECRET
  const providedSecret = request.headers.get('x-cron-secret')

  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient(
    config.database.supabaseUrl,
    config.database.supabaseServiceKey
  )

  const startTime = Date.now()

  // --- Fetch all processing tasks that have a RunningHub task ID ---
  // Include tasks without _runningHubTaskId so we can detect and expire stale ones
  const { data: pendingTasks, error: fetchError } = await supabase
    .from('history_items')
    .select('id, user_id, settings, created_at')
    .eq('status', 'processing')
    .order('created_at', { ascending: true })
    .limit(50) // Process at most 50 per run to stay within timeout

  if (fetchError) {
    console.error('process-pending: failed to fetch pending tasks:', fetchError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!pendingTasks || pendingTasks.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No pending tasks' })
  }

  console.log(`process-pending: found ${pendingTasks.length} pending task(s)`)

  AIProviderFactory.clearCache()
  const provider = AIProviderFactory.getProvider(ProviderType.RUNNINGHUB) as RunningHubProvider

  // Process with concurrency limit of 10 to avoid overwhelming RunningHub API
  const CONCURRENCY = 10
  const results: Record<'completed' | 'failed' | 'running' | 'errors', number> = {
    completed: 0, failed: 0, running: 0, errors: 0
  }

  for (let i = 0; i < pendingTasks.length; i += CONCURRENCY) {
    const batch = pendingTasks.slice(i, i + CONCURRENCY)
    const outcomes = await Promise.all(
      batch.map((task: { id: string; user_id: string; settings: any; created_at: string }) =>
        processPendingTask(supabase, provider, task).catch(err => {
          console.error(`process-pending: unhandled error for task ${task.id}:`, err)
          results.errors++
          return 'running' as const
        })
      )
    )
    for (const outcome of outcomes) {
      const key = outcome as 'completed' | 'failed' | 'running'
      results[key]++
    }
  }

  const elapsedMs = Date.now() - startTime
  console.log(`process-pending: done in ${elapsedMs}ms`, results)

  return NextResponse.json({
    processed: pendingTasks.length,
    elapsedMs,
    ...results
  })
}
