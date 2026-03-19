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
import { getEvolinkProvider } from '../../../../services/ai-providers/evolink'
import { getSynvowProvider } from '../../../../services/ai-providers/synvow'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { uploadFromUrl, uploadFromUrlWithBuffer, generateAndUploadThumbnailFromBuffer, getOutputPath, extFromUrl, mimeFromExt } from '@/lib/bunny'
import { generateMediaFilename } from '@/lib/media-filename'

type EnhancementOutputItem = { type: 'image' | 'video'; url: string }

const normalizeOutputs = (value: unknown): EnhancementOutputItem[] => {
  // Match video extensions; also treat Bunny CDN paths with /video/ prefix as video
  const isVideo = (url: string) =>
    /\.(mp4|webm|mov|m4v|3gp|flv)(\?.*)?$/i.test(url) ||
    /\/video\//i.test(new URL(url, 'https://x').pathname)
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

/** Process a video task (Evolink or Synvow provider). */
async function processVideoTask(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  task: { id: string; user_id: string; settings: any; created_at: string }
): Promise<'completed' | 'failed' | 'running'> {
  const settings = task.settings || {}
  const providerName = settings._provider as string
  const providerTaskId = settings._providerTaskId as string | undefined
  const creditsToDeduct: number = typeof settings.creditsToDeduct === 'number' ? settings.creditsToDeduct : 0
  const ageMs = Date.now() - new Date(task.created_at).getTime()

  // Validate provider — unknown provider means settings are corrupt; fail the task
  if (providerName !== 'evolink' && providerName !== 'synvow') {
    console.error(`process-pending video: unknown provider '${providerName}' for task ${task.id} — marking failed`)
    await supabase
      .from('history_items')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_message: `Unknown provider: ${providerName}`,
        settings: { ...settings, _failureReason: `Unknown provider: ${providerName}` },
      })
      .eq('id', task.id)
      .eq('status', 'processing')
    return 'failed'
  }

  // Provider task ID not stored yet — give it 5 minutes to start, then fail
  if (!providerTaskId) {
    if (ageMs > 5 * 60 * 1000) {
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error_message: 'Task timed out before provider accepted it',
          settings: { ...settings, _failureReason: 'Task timed out before provider accepted it' },
        })
        .eq('id', task.id)
        .eq('status', 'processing')
      return 'failed'
    }
    return 'running'
  }

  // Hard timeout: fail any video task stuck for more than 2 hours
  if (ageMs > 2 * 60 * 60 * 1000) {
    await supabase
      .from('history_items')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_message: 'Task exceeded maximum processing time',
        settings: { ...settings, _failureReason: 'Task exceeded maximum processing time' },
      })
      .eq('id', task.id)
      .eq('status', 'processing')
    return 'failed'
  }

  try {
    let pollStatus: 'SUCCESS' | 'IN_PROGRESS' | 'FAILURE'
    let outputUrl: string | null = null

    if (providerName === 'evolink') {
      const provider = getEvolinkProvider()
      const result = await provider.pollTask(providerTaskId)
      pollStatus = result.status === 'SUCCESS' ? 'SUCCESS' : result.status === 'FAILURE' ? 'FAILURE' : 'IN_PROGRESS'
      outputUrl = result.output
    } else {
      // Synvow (Veo, Sora, Seedance, etc.)
      const provider = getSynvowProvider()
      const result = await provider.pollTask(providerTaskId, 'video')
      if (result.status === 'SUCCESS') {
        pollStatus = 'SUCCESS'
        outputUrl = result.output
      } else if (['FAILURE', 'FAILED', 'ERROR'].includes(result.status)) {
        pollStatus = 'FAILURE'
      } else {
        pollStatus = 'IN_PROGRESS'
      }
    }

    if (pollStatus === 'SUCCESS' && !outputUrl) {
      console.error(`❌ process-pending video: provider reported SUCCESS but returned no output URL for task=${task.id}`)
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error_message: 'Video generation completed but returned no output URL',
          settings: { ...settings, _failureReason: 'Video generation completed but returned no output URL' },
        })
        .eq('id', task.id)
        .eq('status', 'processing')
      return 'failed'
    }

    if (pollStatus === 'SUCCESS' && outputUrl) {
      const generationTimeMs = Date.now() - new Date(task.created_at).getTime()

      // Save provider URL immediately so history page shows the video right away.
      // CDN upload runs after the DB update.
      let finalUrl = outputUrl
      try {
        const ext = extFromUrl(outputUrl) || 'mp4'
        const mime = mimeFromExt(ext) || 'video/mp4'
        const videoPrompt = (settings.prompt as string | undefined) || undefined
        finalUrl = await uploadFromUrl(getOutputPath(task.user_id, ext, generateMediaFilename(ext, videoPrompt)), outputUrl, mime)
        console.log(`✅ Bunny (process-pending video): uploaded — ${finalUrl}`)
      } catch (err) {
        console.error('❌ Bunny (process-pending video): upload failed, using provider URL:', err)
        // finalUrl stays as outputUrl (provider URL) — acceptable fallback
      }

      const outputs = [{ type: 'video' as const, url: finalUrl, original_url: outputUrl }]

      // Atomic update — only wins if status is still 'processing' (prevents race with client poll)
      const { data: won } = await supabase
        .from('history_items')
        .update({
          status: 'completed',
          output_urls: outputs,
          generation_time_ms: generationTimeMs,
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          credits_used: creditsToDeduct,
        })
        .eq('id', task.id)
        .eq('status', 'processing')
        .select('id')
        .maybeSingle()

      if (won && creditsToDeduct > 0) {
        const deductResult = await UnifiedCreditsService.deductCredits(
          task.user_id,
          creditsToDeduct,
          task.id,
          'Video generation'
        )
        if (!deductResult.success) {
          console.error(
            `🚨 CRITICAL process-pending video: credit deduction FAILED for user=${task.user_id} task=${task.id} amount=${creditsToDeduct} — ${deductResult.error}`
          )
        }
      }

      return 'completed'
    }

    if (pollStatus === 'FAILURE') {
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error_message: 'Video generation failed on provider',
          settings: { ...settings, _failureReason: 'Video generation failed on provider' },
        })
        .eq('id', task.id)
        .eq('status', 'processing')
      return 'failed'
    }

    return 'running'
  } catch (error) {
    console.error(`process-pending video: error checking task ${task.id}:`, error)
    return 'running'
  }
}

/** Process a single pending task. Returns 'completed' | 'failed' | 'running' */
async function processPendingTask(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  provider: RunningHubProvider,
  task: { id: string; user_id: string; settings: any; created_at: string; page_name?: string }
): Promise<'completed' | 'failed' | 'running'> {
  const settings = task.settings || {}

  // Route video tasks (Evolink / Synvow) to their own handler
  if (settings._provider === 'evolink' || settings._provider === 'synvow') {
    return processVideoTask(supabase, task)
  }

  // Sync generation tasks (image/edit): these complete via after() in their API routes.
  // If still processing after 15 min they likely failed silently — mark them as such.
  if (settings._type === 'image-generation' || settings._type === 'edit-generation') {
    const ageMs = Date.now() - new Date(task.created_at).getTime()
    if (ageMs > 15 * 60 * 1000) {
      const { data: won } = await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error_message: 'Task timed out — generation did not complete in time',
          settings: { ...settings, _failureReason: 'Task timed out — generation did not complete in time' },
        })
        .eq('id', task.id)
        .eq('status', 'processing')
        .select('id')
        .maybeSingle()

      // Refund credits that were deducted upfront if after() never ran
      if (won && settings._creditsAlreadyDeducted) {
        const credits = (settings.creditsToDeduct || settings.creditCost || 0) as number
        if (credits > 0) {
          await UnifiedCreditsService.allocatePermanentCredits(
            task.user_id,
            credits,
            `refund_${task.id}`,
            `Refund: ${settings._type} timed out`
          )
        }
      }

      console.warn(`process-pending: timed out ${settings._type} task ${task.id} (age=${Math.round(ageMs / 60000)}min)`)
      return 'failed'
    }
    // Still within timeout window — wait for the after() handler to complete it
    return 'running'
  }

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
          completed_at: new Date().toISOString(),
          error_message: 'Task timed out before starting',
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

      // Upload outputs to Bunny CDN — replace url with Bunny CDN URL so UI uses it directly
      const outputsWithBunny = await Promise.all(
        outputs.map(async (item) => {
          try {
            const ext = extFromUrl(item.url) || (item.type === 'video' ? 'mp4' : 'jpg')
            const taskPrompt = (settings.prompt as string | undefined) || undefined
            const outputPath = getOutputPath(task.user_id, ext, generateMediaFilename(ext, taskPrompt))
            const { url: bunnyUrl, buffer: imgBuffer } = await uploadFromUrlWithBuffer(outputPath, item.url, mimeFromExt(ext))
            console.log(`✅ Bunny: output uploaded — ${bunnyUrl}`)
            const thumbnailUrl = item.type === 'image' ? await generateAndUploadThumbnailFromBuffer(outputPath, imgBuffer) : null
            return { ...item, url: bunnyUrl, original_url: item.url, ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}) }
          } catch (err) {
            console.error(`❌ Bunny: failed to upload output ${item.url}:`, err)
            return item // keep original RunningHub url on failure
          }
        })
      )

      // Atomic update — only wins if status is still 'processing' (prevents race with client poll)
      const { data: won } = await supabase
        .from('history_items')
        .update({
          status: 'completed',
          output_urls: outputsWithBunny,
          generation_time_ms: generationTimeMs,
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          credits_used: creditsToDeduct
        })
        .eq('id', task.id)
        .eq('status', 'processing')
        .select('id')
        .maybeSingle()

      // Only deduct if not already deducted upfront (new flow: credits deducted before RunningHub call)
      if (won && creditsToDeduct > 0 && !settings._creditsAlreadyDeducted) {
        const deductResult = await UnifiedCreditsService.deductCredits(
          task.user_id,
          creditsToDeduct,
          task.id,
          'Image enhancement'
        )
        if (!deductResult.success) {
          console.error(
            `🚨 CRITICAL process-pending: credit deduction FAILED for user=${task.user_id} task=${task.id} amount=${creditsToDeduct} — ${deductResult.error}`
          )
        }
      }

      return 'completed'
    }

    if (check.status === 'failed') {
      const { data: won } = await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error_message: check.error || 'Task failed on RunningHub',
          settings: { ...settings, _failureReason: check.error || 'Task failed on RunningHub' }
        })
        .eq('id', task.id)
        .eq('status', 'processing')
        .select('id')
        .maybeSingle()

      // Refund credits if they were deducted upfront
      if (won && creditsToDeduct > 0 && settings._creditsAlreadyDeducted) {
        await UnifiedCreditsService.allocatePermanentCredits(
          task.user_id,
          creditsToDeduct,
          `refund_${task.id}`,
          'Refund: enhancement task failed'
        )
      }

      return 'failed'
    }

    // Tasks that have been stuck for > 2 hours are assumed permanently failed
    const ageMs = Date.now() - new Date(task.created_at).getTime()
    if (ageMs > 2 * 60 * 60 * 1000) {
      const { data: won } = await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error_message: 'Task exceeded maximum processing time',
          settings: { ...settings, _failureReason: 'Task exceeded maximum processing time' }
        })
        .eq('id', task.id)
        .eq('status', 'processing')
        .select('id')
        .maybeSingle()

      // Refund credits if they were deducted upfront
      if (won && creditsToDeduct > 0 && settings._creditsAlreadyDeducted) {
        await UnifiedCreditsService.allocatePermanentCredits(
          task.user_id,
          creditsToDeduct,
          `refund_${task.id}`,
          'Refund: enhancement task timed out'
        )
      }

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
    .select('id, user_id, settings, created_at, page_name')
    .eq('status', 'processing')
    .order('created_at', { ascending: true })
    .limit(50) // Process at most 50 per run to stay within timeout

  if (fetchError) {
    console.error('process-pending: failed to fetch pending tasks:', fetchError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // Always expire stale credits AND sync subscription_status — even if no tasks pending
  try {
    await supabase.rpc('expire_and_sync')
  } catch (expireErr) {
    console.error('process-pending: failed to expire_and_sync:', expireErr)
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
