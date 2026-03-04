import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/auth-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { config } from '@/lib/config'
import { getModel } from '@/services/models'
import { getSynvowProvider } from '@/services/ai-providers/synvow'
import type { SynvowGenerateRequest } from '@/services/ai-providers/synvow'
import { getEvolinkProvider } from '@/services/ai-providers/evolink'
import type { EvolinkVideoRequest } from '@/services/ai-providers/evolink'
import { uploadFromUrl, getInputPath, extFromUrl } from '@/lib/bunny'

/**
 * POST /api/generate-video
 *
 * Async video generation via Synvow or Evolink provider.
 * Flow:
 *   auth → credit check → ensure refs on CDN → create history_item (processing) →
 *   submit to provider → store provider_task_id → return { taskId, status: 'processing' }
 *
 * Client must poll GET /api/generate-video/poll?taskId=<uuid> to get results.
 *
 * Request body:
 *   model           string    required
 *   prompt          string    required
 *   aspect_ratio    string    optional  e.g. "16:9"
 *   duration        number    optional  seconds (5, 10, etc.)
 *   audio_sync      boolean   optional
 *   negative_prompt string    optional
 *   first_frame_url string    optional  CDN URL for first-frame seeding
 *   video_url       string    optional  CDN URL for edit/motion-control
 *   target_url      string    optional  CDN URL for motion-control target
 *   tab             string    optional  'generate' | 'edit' | 'motion'  (for history page_name)
 */

function isOurCdn(url: string): boolean {
  try { return new URL(url).hostname.endsWith('.b-cdn.net') } catch { return false }
}

async function ensureOnCdn(url: string, userId: string): Promise<string> {
  if (isOurCdn(url)) return url
  const ext = extFromUrl(url) || 'jpg'
  return uploadFromUrl(getInputPath(userId, ext), url)
}

export async function POST(request: NextRequest) {
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

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: {
    model?: string
    prompt?: string
    aspect_ratio?: string
    duration?: number
    audio_sync?: boolean
    negative_prompt?: string
    first_frame_url?: string
    video_url?: string
    target_url?: string
    tab?: string
    quality?: '720p' | '1080p'
    model_params?: Record<string, unknown>
    camera_fixed?: boolean
    seed?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    model: modelId,
    prompt,
    aspect_ratio,
    duration,
    audio_sync,
    negative_prompt,
    tab = 'generate',
    quality,
    model_params,
    camera_fixed,
    seed,
  } = body

  if (!modelId) {
    return NextResponse.json({ error: 'model is required' }, { status: 400 })
  }
  // For motion tab, prompt is optional (motion patterns come from source/target videos)
  if (tab !== 'motion' && !prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }
  // Normalize prompt to string (may be undefined for motion tab)
  const normalizedPrompt = prompt?.trim() ?? ''

  // ── Validate model ────────────────────────────────────────────────────────
  const modelConfig = getModel(modelId)
  if (!modelConfig) return NextResponse.json({ error: `Unknown model: ${modelId}` }, { status: 400 })
  if (modelConfig.type !== 'video') {
    return NextResponse.json({ error: 'Only video models are supported by this endpoint' }, { status: 400 })
  }

  const creditCost = modelConfig.credits
  const primaryProvider = modelConfig.providers[0]

  // ── Credit check ──────────────────────────────────────────────────────────
  const balance = await UnifiedCreditsService.getUserCredits(userId)
  if (balance.total < creditCost) {
    return NextResponse.json(
      { error: 'Insufficient credits', required: creditCost, available: balance.total },
      { status: 402 }
    )
  }

  // ── Ensure CDN URLs for inputs ────────────────────────────────────────────
  let firstFrameUrl = body.first_frame_url
  let videoUrl = body.video_url
  let targetUrl = body.target_url

  try {
    if (firstFrameUrl && !firstFrameUrl.startsWith('data:')) {
      firstFrameUrl = await ensureOnCdn(firstFrameUrl, userId)
    }
    if (videoUrl) videoUrl = await ensureOnCdn(videoUrl, userId)
    if (targetUrl) targetUrl = await ensureOnCdn(targetUrl, userId)
  } catch (err) {
    console.warn('⚠️ generate-video: CDN upload failed for input, using original:', err)
  }

  // ── Create history record ─────────────────────────────────────────────────
  const taskId = uuidv4()
  const now = new Date().toISOString()

  const { error: insertError } = await supabase.from('history_items').insert({
    id: taskId,
    user_id: userId,
    task_id: taskId,
    output_urls: [],
    model_name: modelConfig.label,
    page_name: `app/video/${tab}`,
    status: 'processing',
    settings: {
      prompt: normalizedPrompt,
      aspect_ratio: aspect_ratio ?? null,
      duration: duration ?? null,
      audio_sync: audio_sync ?? null,
      negative_prompt: negative_prompt ?? null,
      creditsToDeduct: creditCost,
      // Provider info for poll route
      _provider: primaryProvider,
    },
    created_at: now,
    updated_at: now,
  })

  if (insertError) {
    return NextResponse.json(
      { error: `Failed to create task: ${insertError.message}` },
      { status: 500 }
    )
  }

  // ── Submit to provider ────────────────────────────────────────────────────
  try {
    let providerTaskId: string

    if (primaryProvider === 'evolink') {
      const provider = getEvolinkProvider()
      const req: EvolinkVideoRequest = {
        model: modelId,
        prompt: normalizedPrompt,
        duration: duration,
        aspect_ratio: aspect_ratio,
        sound: audio_sync ? 'on' : 'off',
        negative_prompt: negative_prompt,
        quality: quality,
        model_params: model_params,
      }
      const result = await provider.submitTask(req)
      providerTaskId = result.taskId
    } else {
      // Default: Synvow
      const provider = getSynvowProvider()
      const req: SynvowGenerateRequest = {
        model: modelId,
        prompt: normalizedPrompt,
        ...(aspect_ratio ? { aspect_ratio } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(audio_sync !== undefined ? { audio_sync } : {}),
        ...(negative_prompt ? { negative_prompt } : {}),
        ...(videoUrl ? { video_url: videoUrl } : {}),
        ...(targetUrl ? { target_url: targetUrl } : {}),
        ...(firstFrameUrl
          ? firstFrameUrl.startsWith('data:')
            ? { first_frame: firstFrameUrl }
            : { first_frame: firstFrameUrl }
          : {}),
        ...(camera_fixed !== undefined ? { camera_fixed } : {}),
        ...(seed !== undefined ? { seed } : {}),
      }
      const result = await provider.submitTask(req)
      providerTaskId = result.taskId
    }

    // Store provider task ID for polling
    await supabase
      .from('history_items')
      .update({
        settings: {
          prompt: normalizedPrompt,
          aspect_ratio: aspect_ratio ?? null,
          duration: duration ?? null,
          audio_sync: audio_sync ?? null,
          negative_prompt: negative_prompt ?? null,
          creditsToDeduct: creditCost,
          _provider: primaryProvider,
          _providerTaskId: providerTaskId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    return NextResponse.json({
      success: true,
      taskId,
      status: 'processing',
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Video generation failed'

    await supabase
      .from('history_items')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        settings: {
          prompt: normalizedPrompt,
          creditsToDeduct: creditCost,
          _provider: primaryProvider,
          _failureReason: errMsg,
        },
      })
      .eq('id', taskId)

    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
