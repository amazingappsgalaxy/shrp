import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { config } from '../../../../lib/config'
import { AIProviderFactory } from '../../../../services/ai-providers/provider-factory'
import { ProviderType } from '../../../../services/ai-providers/common/types'
import { RunningHubProvider } from '../../../../services/ai-providers/runninghub/runninghub-provider'
import { getSession } from '@/lib/auth-simple'
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

/**
 * GET /api/enhance-image/poll?taskId=<uuid>
 *
 * Client-side status poller for in-progress enhancements.
 * Uses atomic DB update (WHERE status='processing') to prevent double credit deduction
 * in case both this endpoint and the server-side scheduled function complete a task simultaneously.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient(
    config.database.supabaseUrl,
    config.database.supabaseServiceKey
  )

  // --- Auth ---
  const cookieStore = await cookies()
  const token =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    cookieStore.get('session')?.value

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await getSession(token)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 })

  // --- Fetch DB record ---
  const { data: item, error: fetchError } = await supabase
    .from('history_items')
    .select('id, user_id, status, output_urls, settings, created_at')
    .eq('id', taskId)
    .maybeSingle()

  if (fetchError || !item) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (item.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Already done — return current state immediately
  if (item.status === 'completed') {
    return NextResponse.json({ status: 'success', outputs: item.output_urls || [] })
  }
  if (item.status === 'failed') {
    const reason = (item.settings as any)?._failureReason || 'Enhancement failed'
    return NextResponse.json({ status: 'failed', error: reason })
  }

  // Still processing — check RunningHub
  const settings = (item.settings as any) || {}
  const runningHubTaskId: string | undefined = settings._runningHubTaskId
  const expectedNodeIds: string[] | undefined = settings._expectedNodeIds
  const creditsToDeduct: number = settings._creditsToDeduct || 0

  if (!runningHubTaskId) return NextResponse.json({ status: 'running' })

  try {
    AIProviderFactory.clearCache()
    const provider = AIProviderFactory.getProvider(ProviderType.RUNNINGHUB) as RunningHubProvider
    const check = await provider.checkTaskOnce(runningHubTaskId, expectedNodeIds)

    if (check.status === 'success') {
      const rawUrls = check.outputUrls?.length ? check.outputUrls : (check.outputUrl ? [check.outputUrl] : [])
      const outputs = normalizeOutputs(rawUrls)
      const generationTimeMs = Date.now() - new Date(item.created_at).getTime()

      // Atomic update: only succeeds if status is still 'processing'
      // This prevents double credit deduction if the scheduled function also completes this task
      const { data: won } = await supabase
        .from('history_items')
        .update({
          status: 'completed',
          output_urls: outputs,
          generation_time_ms: generationTimeMs,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('status', 'processing')
        .select('id')
        .maybeSingle()

      if (won) {
        // We won the race — deduct credits
        if (creditsToDeduct > 0) {
          try {
            await UnifiedCreditsService.deductCredits(userId, creditsToDeduct, taskId, 'Image enhancement')
          } catch (e) {
            console.error('Poll: credit deduction failed (non-fatal):', e)
          }
        }
      }

      return NextResponse.json({ status: 'success', outputs })
    }

    if (check.status === 'failed') {
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          settings: { ...settings, _failureReason: check.error || 'Task failed on RunningHub' }
        })
        .eq('id', taskId)
        .eq('status', 'processing')

      return NextResponse.json({ status: 'failed', error: check.error || 'Enhancement failed' })
    }

    return NextResponse.json({ status: 'running' })

  } catch (error) {
    console.error('Poll: error checking task status:', error)
    return NextResponse.json({ status: 'running' })
  }
}
