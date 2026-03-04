import { NextRequest, NextResponse, after } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { getSession } from '@/lib/auth-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { getSynvowProvider } from '@/services/ai-providers/synvow'
import { getEvolinkProvider } from '@/services/ai-providers/evolink'
import { uploadFromUrl, getOutputPath, extFromUrl, mimeFromExt } from '@/lib/bunny'

/**
 * GET /api/generate-video/poll?taskId=<uuid>
 *
 * Client-side status poller for in-progress video generations.
 * Checks the DB task status, then polls the upstream provider if still processing.
 * On completion: deducts credits, uploads output to Bunny CDN (background).
 *
 * Race-condition safe: uses .eq('status', 'processing') on the DB update
 * to prevent double credit deduction.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient(
    config.database.supabaseUrl,
    config.database.supabaseServiceKey
  )

  // ── Auth ──────────────────────────────────────────────────────────────────
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

  // ── Fetch DB record ───────────────────────────────────────────────────────
  const { data: item, error: fetchError } = await supabase
    .from('history_items')
    .select('id, user_id, status, output_urls, settings, created_at')
    .eq('id', taskId)
    .maybeSingle()

  if (fetchError || !item) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (item.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Already done — return immediately
  if (item.status === 'completed') {
    return NextResponse.json({ status: 'success', outputs: item.output_urls || [] })
  }
  if (item.status === 'failed') {
    const reason = (item.settings as Record<string, unknown>)?._failureReason || 'Video generation failed'
    return NextResponse.json({ status: 'failed', error: reason })
  }

  // ── Still processing — poll the upstream provider ─────────────────────────
  const settings = (item.settings as Record<string, unknown>) || {}
  const providerName = (settings._provider as string) || 'synvow'
  const providerTaskId = settings._providerTaskId as string | undefined
  const creditsToDeduct = (settings.creditsToDeduct as number) || 0

  if (!providerTaskId) {
    // Task submitted but provider task ID not stored yet — still starting
    return NextResponse.json({ status: 'running' })
  }

  try {
    let pollStatus: 'SUCCESS' | 'IN_PROGRESS' | 'FAILURE' | 'ERROR'
    let outputUrl: string | null = null

    if (providerName === 'evolink') {
      const provider = getEvolinkProvider()
      const result = await provider.pollTask(providerTaskId)
      pollStatus = result.status
      outputUrl = result.output
    } else {
      // Synvow
      const provider = getSynvowProvider()
      const result = await provider.pollTask(providerTaskId, 'video')
      // Normalize to our status set
      if (result.status === 'SUCCESS') {
        pollStatus = 'SUCCESS'
        outputUrl = result.output
      } else if (['FAILURE', 'FAILED', 'ERROR'].includes(result.status)) {
        pollStatus = 'FAILURE'
      } else {
        pollStatus = 'IN_PROGRESS'
      }
    }

    if (pollStatus === 'SUCCESS' && outputUrl) {
      const generationTimeMs = Date.now() - new Date(item.created_at).getTime()
      const outputs = [{ type: 'video' as const, url: outputUrl }]

      // Atomic update: only proceeds if status is still 'processing'
      const { data: won } = await supabase
        .from('history_items')
        .update({
          status: 'completed',
          output_urls: outputs,
          generation_time_ms: generationTimeMs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('status', 'processing')
        .select('id')
        .maybeSingle()

      if (won) {
        // We won the race — deduct credits
        if (creditsToDeduct > 0) {
          const deductResult = await UnifiedCreditsService.deductCredits(
            userId,
            creditsToDeduct,
            taskId,
            `Video generation`
          )
          if (!deductResult.success) {
            console.error(
              `🚨 CRITICAL video-poll: credit deduction FAILED user=${userId} task=${taskId} amount=${creditsToDeduct} — ${deductResult.error}`
            )
          }
        }

        // Background: upload output video to Bunny CDN
        after(async () => {
          try {
            const ext = extFromUrl(outputUrl!) || 'mp4'
            const mime = mimeFromExt(ext) || 'video/mp4'
            const bunnyUrl = await uploadFromUrl(getOutputPath(userId, ext), outputUrl!, mime)
            console.log(`✅ Bunny (video-poll): uploaded — ${bunnyUrl}`)
            const supabaseAfter = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey)
            await supabaseAfter
              .from('history_items')
              .update({ output_urls: [{ type: 'video', url: bunnyUrl, original_url: outputUrl }] })
              .eq('id', taskId)
          } catch (err) {
            console.error('❌ Bunny (video-poll): upload failed:', err)
          }
        })
      }

      return NextResponse.json({ status: 'success', outputs })
    }

    if (pollStatus === 'FAILURE' || pollStatus === 'ERROR') {
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          settings: { ...settings, _failureReason: 'Video generation failed on provider' },
        })
        .eq('id', taskId)
        .eq('status', 'processing')

      return NextResponse.json({ status: 'failed', error: 'Video generation failed' })
    }

    return NextResponse.json({ status: 'running' })
  } catch (error) {
    console.error('Video poll: error checking task status:', error)
    return NextResponse.json({ status: 'running' })
  }
}
