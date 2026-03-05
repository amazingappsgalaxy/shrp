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
    end_frame_url?: string
    video_url?: string
    target_url?: string
    tab?: string
    quality?: '720p' | '1080p'
    /** Extra model-specific params (e.g. mode, cfg_scale for Kling) */
    model_params?: Record<string, unknown>
    camera_fixed?: boolean
    seed?: number
    /** Kling multi-shot: enable flag (goes into model_params) */
    multi_shot?: boolean
    /** Kling multi-shot: shot planning mode */
    shot_type?: 'customize' | 'intelligence'
    /** Kling multi-shot: per-shot prompts (duration as number from client, converted to string for API) */
    multi_prompt?: { index: number; prompt: string; duration: number }[]
    /** Kling element library IDs (max 3) */
    element_list?: number[]
    enhance_prompt?: boolean
    enable_upsample?: boolean
    keep_original_sound?: boolean
    /** Reference image URLs for kling-o3-video-edit / kling-o3-reference-to-video (up to 4) */
    image_urls?: string[]
    /** Sora 2 Pro: high-definition output */
    hd?: boolean
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
    multi_shot,
    shot_type,
    multi_prompt,
    element_list,
    enhance_prompt,
    enable_upsample,
    keep_original_sound,
  } = body
  const hd = body.hd
  let clientImageUrls = body.image_urls?.filter(u => typeof u === 'string' && u.length > 0)

  if (!modelId) {
    return NextResponse.json({ error: 'model is required' }, { status: 400 })
  }
  // Prompt is optional for motion and edit tabs (video input defines the content)
  if (tab === 'generate' && !prompt?.trim()) {
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
  let endFrameUrl = body.end_frame_url
  let videoUrl = body.video_url
  let targetUrl = body.target_url

  try {
    if (firstFrameUrl && !firstFrameUrl.startsWith('data:')) {
      firstFrameUrl = await ensureOnCdn(firstFrameUrl, userId)
    }
    if (endFrameUrl && !endFrameUrl.startsWith('data:')) {
      endFrameUrl = await ensureOnCdn(endFrameUrl, userId)
    }
    if (videoUrl) videoUrl = await ensureOnCdn(videoUrl, userId)
    if (targetUrl) targetUrl = await ensureOnCdn(targetUrl, userId)
    // Ensure reference image URLs are on our CDN (they may be external/temporary)
    if (clientImageUrls?.length) {
      clientImageUrls = await Promise.all(clientImageUrls.map(u => ensureOnCdn(u, userId)))
    }
  } catch (err) {
    console.error('❌ generate-video: CDN upload failed for input:', err)
    return NextResponse.json({ error: 'Failed to upload input media. Please try again.' }, { status: 500 })
  }

  // ── Create history record ─────────────────────────────────────────────────
  const taskId = uuidv4()
  const now = new Date().toISOString()

  // Build complete settings object — includes all params for audit trail + cron reconstruction
  const baseSettings: Record<string, unknown> = {
    prompt: normalizedPrompt,
    aspect_ratio: aspect_ratio ?? null,
    duration: duration ?? null,
    audio_sync: audio_sync ?? null,
    negative_prompt: negative_prompt ?? null,
    quality: quality ?? null,
    creditsToDeduct: creditCost,
    _provider: primaryProvider,
    // CDN-ensured input URLs (stored after CDN upload so they're permanent)
    ...(firstFrameUrl ? { first_frame_url: firstFrameUrl } : {}),
    ...(endFrameUrl ? { end_frame_url: endFrameUrl } : {}),
    ...(videoUrl ? { video_url: videoUrl } : {}),
    ...(targetUrl ? { target_url: targetUrl } : {}),
    ...(clientImageUrls?.length ? { image_urls: clientImageUrls } : {}),
    // Kling-specific
    ...(keep_original_sound !== undefined ? { keep_original_sound } : {}),
    ...(model_params ? { model_params } : {}),
    ...(element_list?.length ? { element_list } : {}),
    ...(multi_shot !== undefined ? { multi_shot } : {}),
    ...(shot_type ? { shot_type } : {}),
    ...(multi_prompt?.length ? { multi_prompt } : {}),
    // Veo-specific
    ...(enhance_prompt !== undefined ? { enhance_prompt } : {}),
    ...(enable_upsample !== undefined ? { enable_upsample } : {}),
    // Seedance-specific
    ...(camera_fixed !== undefined ? { camera_fixed } : {}),
    ...(seed !== undefined ? { seed } : {}),
  }

  const { error: insertError } = await supabase.from('history_items').insert({
    id: taskId,
    user_id: userId,
    task_id: taskId,
    output_urls: [],
    model_name: modelConfig.label,
    page_name: `app/video/${tab}`,
    status: 'processing',
    settings: baseSettings,
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
      // kling-o3, kling-o3-video-edit, kling-o3-reference-to-video only support 'customize'
      const O3_MODELS = ['kling-o3', 'kling-o3-video-edit', 'kling-o3-reference-to-video']
      const isO3Model = O3_MODELS.includes(modelId)
      const resolvedShotType = isO3Model ? 'customize' : (shot_type ?? 'customize')
      // kling-o3-video-edit does not support duration or aspect_ratio
      const supportsEditParams = modelId !== 'kling-o3-video-edit'
      // New O3 edit/ref models use keep_original_sound, not sound
      const usesKeepOriginalSound = modelId === 'kling-o3-video-edit' || modelId === 'kling-o3-reference-to-video'

      const evolinkModelParams = {
        ...(model_params || {}),
        watermark_info: { enabled: false },
        ...(multi_shot ? {
          multi_shot: true,
          shot_type: resolvedShotType,
          ...(resolvedShotType === 'customize' && multi_prompt?.length ? {
            multi_prompt: multi_prompt.map(s => ({
              index: s.index,
              prompt: s.prompt,
              duration: String(s.duration), // API requires string
            })),
          } : {}),
        } : {}),
        // element_list supported by Kling models with elementList capability
        ...(element_list?.length && modelConfig.controls.elementList ? { element_list: element_list.map(id => ({ element_id: id })) } : {}),
      }

      const req: EvolinkVideoRequest = {
        model: modelId,
        prompt: normalizedPrompt,
        ...(supportsEditParams && duration !== undefined ? { duration } : {}),
        ...(supportsEditParams && aspect_ratio ? { aspect_ratio } : {}),
        ...(!usesKeepOriginalSound ? { sound: audio_sync ? 'on' : 'off' } : {}),
        ...(negative_prompt ? { negative_prompt } : {}),
        quality: quality,
        // image_start/image_end for I2V models (kling-3, kling-o3)
        ...(firstFrameUrl ? { image_start: firstFrameUrl } : {}),
        ...(endFrameUrl ? { image_end: endFrameUrl } : {}),
        // video_url for edit/reference-to-video models
        ...(videoUrl ? { video_url: videoUrl } : {}),
        // keep_original_sound for edit/reference-to-video models
        ...(keep_original_sound !== undefined ? { keep_original_sound } : {}),
        // image_urls: up to 4 reference images (kling-o3-video-edit, kling-o3-reference-to-video)
        ...(clientImageUrls?.length ? { image_urls: clientImageUrls } : {}),
        ...(Object.keys(evolinkModelParams).length > 0 ? { model_params: evolinkModelParams } : {}),
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
        ...(quality ? { quality } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(audio_sync !== undefined ? { audio_sync } : {}),
        ...(negative_prompt ? { negative_prompt } : {}),
        ...(videoUrl ? { video_url: videoUrl } : {}),
        ...(targetUrl ? { target_url: targetUrl } : {}),
        ...(firstFrameUrl ? { first_frame: firstFrameUrl } : {}),
        ...(endFrameUrl ? { end_frame: endFrameUrl } : {}),
        ...(camera_fixed !== undefined ? { camera_fixed } : {}),
        ...(seed !== undefined ? { seed } : {}),
        ...(enhance_prompt ? { enhance_prompt: true } : {}),
        ...(enable_upsample ? { enable_upsample: true } : {}),
        ...(hd !== undefined ? { hd } : {}),
        // Sora: always suppress watermark
        ...(modelId.startsWith('sora') ? { watermark: false } : {}),
      }
      const result = await provider.submitTask(req)
      providerTaskId = result.taskId
    }

    // Store provider task ID for polling — critical: without this the task can never complete
    const { error: updateError } = await supabase
      .from('history_items')
      .update({
        settings: { ...baseSettings, _providerTaskId: providerTaskId },
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    if (updateError) {
      // Task was submitted to provider but we can't store its ID — mark as failed so
      // user isn't left with a stuck processing record
      console.error(`🚨 generate-video: failed to store _providerTaskId for task=${taskId}:`, updateError)
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          settings: { ...baseSettings, _failureReason: 'Failed to store provider task ID — please retry' },
        })
        .eq('id', taskId)
      return NextResponse.json({ error: 'Failed to store task state — please retry' }, { status: 500 })
    }

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
        settings: { ...baseSettings, _failureReason: errMsg },
      })
      .eq('id', taskId)

    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
