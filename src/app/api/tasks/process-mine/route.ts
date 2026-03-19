/**
 * POST /api/tasks/process-mine
 *
 * Client-side task processor for active browser sessions. Called by TaskManagerProvider
 * every ~5s while the user has processing RunningHub tasks. Eliminates the 60s cron gap
 * by processing tasks directly from the browser.
 *
 * Auth: client passes its own task IDs (UUIDs). The server processes only those tasks.
 * No session auth needed — knowing a task UUID is sufficient authorisation since the
 * client only watches task IDs it received from our own API responses.
 *
 * Only handles RunningHub image tasks. Video tasks (Evolink/Synvow) are left to the cron.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { AIProviderFactory } from '@/services/ai-providers/provider-factory'
import { ProviderType } from '@/services/ai-providers/common/types'
import { RunningHubProvider } from '@/services/ai-providers/runninghub/runninghub-provider'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import {
  uploadFromUrlWithBuffer,
  generateAndUploadThumbnailFromBuffer,
  getOutputPath,
  extFromUrl,
  mimeFromExt,
} from '@/lib/bunny'
import { generateMediaFilename } from '@/lib/media-filename'

type OutputItem = { type: 'image' | 'video'; url: string }

function normalizeOutputs(value: unknown): OutputItem[] {
  const isVideo = (url: string) =>
    /\.(mp4|webm|mov|m4v|3gp|flv)(\?.*)?$/i.test(url) ||
    /\/video\//i.test(new URL(url, 'https://x').pathname)
  const asItem = (url: string): OutputItem => ({ type: isVideo(url) ? 'video' : 'image', url })
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
      .filter((item): item is OutputItem => !!item)
  }
  if (typeof value === 'string') return [asItem(value)]
  return []
}

export async function POST(request: NextRequest) {
  // Client passes the task IDs it's currently watching — process only those.
  // No session auth: the client only knows IDs it received from our own API.
  let taskIds: string[] = []
  try {
    const body = await request.json().catch(() => ({}))
    if (Array.isArray(body?.taskIds)) {
      taskIds = body.taskIds.filter((id: unknown) => typeof id === 'string' && id.length > 0).slice(0, 10)
    }
  } catch {}

  if (taskIds.length === 0) return NextResponse.json({ processed: 0 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey)

  // Fetch only the requested tasks that are still processing
  const { data: tasks, error } = await supabase
    .from('history_items')
    .select('id, user_id, settings, created_at')
    .in('id', taskIds)
    .eq('status', 'processing')

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
  if (!tasks || tasks.length === 0) return NextResponse.json({ processed: 0 })

  // Only process RunningHub tasks (not video tasks or sync generation tasks)
  const runningHubTasks = tasks.filter((t: { settings: any }) => {
    const s = t.settings || {}
    return s._provider !== 'evolink' && s._provider !== 'synvow'
      && s._type !== 'image-generation' && s._type !== 'edit-generation'
      && !!s._runningHubTaskId
  })

  if (runningHubTasks.length === 0) return NextResponse.json({ processed: 0 })

  AIProviderFactory.clearCache()
  const provider = AIProviderFactory.getProvider(ProviderType.RUNNINGHUB) as RunningHubProvider

  const results = await Promise.all(
    runningHubTasks.map(async (task: { id: string; user_id: string; settings: any; created_at: string }) => {
      const settings = task.settings || {}
      const runningHubTaskId: string = settings._runningHubTaskId
      const expectedNodeIds: string[] | undefined = settings._expectedNodeIds
      const creditsToDeduct: number = settings._creditsToDeduct || 0

      try {
        const check = await provider.checkTaskOnce(runningHubTaskId, expectedNodeIds)

        if (check.status === 'success') {
          const rawUrls = check.outputUrls?.length
            ? check.outputUrls
            : check.outputUrl ? [check.outputUrl] : []
          const outputs = normalizeOutputs(rawUrls)
          const generationTimeMs = Date.now() - new Date(task.created_at).getTime()

          const outputsWithBunny = await Promise.all(
            outputs.map(async (item) => {
              try {
                const ext = extFromUrl(item.url) || (item.type === 'video' ? 'mp4' : 'jpg')
                const taskPrompt = (settings.prompt as string | undefined) || undefined
                const outputPath = getOutputPath(task.user_id, ext, generateMediaFilename(ext, taskPrompt))
                const { url: bunnyUrl, buffer: imgBuffer } = await uploadFromUrlWithBuffer(outputPath, item.url, mimeFromExt(ext))
                console.log(`✅ Bunny (process-mine): uploaded — ${bunnyUrl}`)
                const thumbnailUrl = item.type === 'image'
                  ? await generateAndUploadThumbnailFromBuffer(outputPath, imgBuffer)
                  : null
                if (thumbnailUrl) console.log(`✅ Thumbnail (process-mine): generated — ${thumbnailUrl}`)
                return { ...item, url: bunnyUrl, original_url: item.url, ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}) }
              } catch (err) {
                console.error(`❌ Bunny (process-mine): upload failed for ${item.url}:`, err)
                return item
              }
            })
          )

          const { data: won } = await supabase
            .from('history_items')
            .update({
              status: 'completed',
              output_urls: outputsWithBunny,
              generation_time_ms: generationTimeMs,
              updated_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              credits_used: creditsToDeduct,
            })
            .eq('id', task.id)
            .eq('status', 'processing')
            .select('id')
            .maybeSingle()

          if (won && creditsToDeduct > 0 && !settings._creditsAlreadyDeducted) {
            const deductResult = await UnifiedCreditsService.deductCredits(
              task.user_id, creditsToDeduct, task.id, 'Image enhancement'
            )
            if (!deductResult.success) {
              console.error(
                `🚨 CRITICAL process-mine: credit deduction FAILED for user=${task.user_id} task=${task.id} amount=${creditsToDeduct} — ${deductResult.error}`
              )
            }
          }

          return { id: task.id, status: 'completed' }
        }

        if (check.status === 'failed') {
          const { data: won } = await supabase
            .from('history_items')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              error_message: check.error || 'Task failed on RunningHub',
              settings: { ...settings, _failureReason: check.error || 'Task failed on RunningHub' },
            })
            .eq('id', task.id)
            .eq('status', 'processing')
            .select('id')
            .maybeSingle()

          if (won && creditsToDeduct > 0 && settings._creditsAlreadyDeducted) {
            await UnifiedCreditsService.allocatePermanentCredits(
              task.user_id, creditsToDeduct, `refund_${task.id}`, 'Refund: enhancement task failed'
            )
          }

          return { id: task.id, status: 'failed' }
        }

        return { id: task.id, status: 'running' }
      } catch (err) {
        console.error(`process-mine: error checking task ${task.id}:`, err)
        return { id: task.id, status: 'running' }
      }
    })
  )

  return NextResponse.json({ processed: results.length, results })
}
