import { NextRequest, NextResponse, after } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/auth-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { config } from '@/lib/config'
import { getModel } from '@/services/models'
import { getSynvowProvider } from '@/services/ai-providers/synvow'
import type { SynvowGenerateRequest } from '@/services/ai-providers/synvow'
import { uploadFromUrl, uploadBuffer, getInputPath, getOutputPath, extFromUrl, mimeFromExt, generateAndUploadThumbnail, generateAndUploadThumbnailFromBuffer } from '@/lib/bunny'
import { generateMediaFilename } from '@/lib/media-filename'
import { AIProviderFactory } from '@/services/ai-providers/provider-factory'
import { ProviderType } from '@/services/ai-providers/common/types'
import { RunningHubProvider } from '@/services/ai-providers/runninghub/runninghub-provider'

/**
 * POST /api/generate-image
 *
 * Asynchronous image generation via the Synvow provider.
 * Flow:
 *   auth → credit check → ensure all refs on Bunny CDN → create history_items →
 *   return { taskId, status: 'processing' } immediately →
 *   [after()] call provider → update history (completed/failed) → deduct credits →
 *   upload outputs to Bunny CDN
 *
 * Request body:
 *   model          string    required   Model ID (must be an image model)
 *   prompt         string    required
 *   aspect_ratio   string    optional   e.g. "1:1", "16:9"
 *   referenceUrls  string[]  optional   Any public image URLs — re-uploaded to Bunny CDN if not already there
 *   count          number    optional   Number of images to generate (1–4, default 1)
 */

/** Returns true if the URL is already on our Bunny CDN (*.b-cdn.net) */
function isOurCdn(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('.b-cdn.net')
  } catch {
    return false
  }
}

/**
 * Ensures a URL is on our Bunny CDN.
 * Already-CDN URLs are returned as-is. External URLs are fetched server-side
 * and re-uploaded under inputs/{today}/{userId}/... using the real user ID.
 */
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
    imageSize?: string
    referenceUrls?: string[]
    count?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { model: modelId, prompt, aspect_ratio, imageSize } = body
  const rawRefs: string[] = Array.isArray(body.referenceUrls) ? body.referenceUrls : []

  if (!modelId || !prompt?.trim()) {
    return NextResponse.json({ error: 'model and prompt are required' }, { status: 400 })
  }

  // ── Validate model ────────────────────────────────────────────────────────
  const modelConfig = getModel(modelId)
  if (!modelConfig) return NextResponse.json({ error: `Unknown model: ${modelId}` }, { status: 400 })
  if (modelConfig.type !== 'image') {
    return NextResponse.json({ error: 'Only image models are supported by this endpoint' }, { status: 400 })
  }

  // RunningHub models always produce 1 image per task (async workflow)
  const isRunningHub = modelConfig.providers[0] === 'runninghub'
  const count = isRunningHub ? 1 : Math.min(Math.max(Number(body.count ?? 1), 1), 4)

  const creditsPerImage = modelConfig.credits
  const totalCredits = creditsPerImage * count

  // ── Credit check ──────────────────────────────────────────────────────────
  const balance = await UnifiedCreditsService.getUserCredits(userId)
  if (balance.total < totalCredits) {
    return NextResponse.json(
      { error: 'Insufficient credits', required: totalCredits, available: balance.total },
      { status: 402 }
    )
  }

  // ── Ensure all reference images are on our Bunny CDN ─────────────────────
  let referenceUrls: string[] = rawRefs
  if (rawRefs.length > 0) {
    const results = await Promise.allSettled(rawRefs.map(u => ensureOnCdn(u, userId)))
    referenceUrls = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      console.warn(`⚠️ generate-image: CDN re-upload failed for ref[${i}], using original:`, r.reason)
      return rawRefs[i]!
    })
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
    page_name: 'app/image',
    status: 'processing',
    settings: {
      prompt: prompt.trim(),
      aspect_ratio: aspect_ratio ?? null,
      referenceUrls: referenceUrls.length > 0 ? referenceUrls : null,
      count,
      creditsToDeduct: totalCredits,
      // Marker so process-pending knows this is a sync-generation task (not RunningHub/video)
      _type: 'image-generation',
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

  // ── Deduct credits upfront (before AI call) ───────────────────────────────
  // This prevents concurrent requests from exploiting the gap between credit
  // check and deduction. The atomic RPC prevents overdraft. If AI fails,
  // credits are refunded inside after().
  const deductResult = await UnifiedCreditsService.deductCredits(
    userId,
    totalCredits,
    taskId,
    `Image generation: ${modelConfig.label} ×${count}`
  )
  if (!deductResult.success) {
    // Roll back the history row and return error
    await supabase.from('history_items').delete().eq('id', taskId)
    return NextResponse.json(
      { error: 'Insufficient credits', required: totalCredits },
      { status: 402 }
    )
  }

  // Mark credits as deducted so process-pending can refund if after() times out
  await supabase.from('history_items').update({
    settings: {
      prompt: prompt.trim(),
      aspect_ratio: aspect_ratio ?? null,
      referenceUrls: referenceUrls.length > 0 ? referenceUrls : null,
      count,
      creditsToDeduct: totalCredits,
      _type: 'image-generation',
      _creditsAlreadyDeducted: true,
    }
  }).eq('id', taskId)

  // ── RunningHub models (async, cron-polled) ────────────────────────────────
  if (modelConfig.providers[0] === 'runninghub') {
    AIProviderFactory.clearCache()
    const provider = AIProviderFactory.getProvider(ProviderType.RUNNINGHUB) as RunningHubProvider

    const taskStart = await provider.startTaskForModel(
      { imageUrl: '', settings: { prompt: prompt.trim(), aspect_ratio: aspect_ratio ?? '1:1' }, userId, imageId: taskId },
      modelId
    )

    if (!taskStart.success) {
      await supabase.from('history_items').update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        settings: { prompt: prompt.trim(), aspect_ratio: aspect_ratio ?? null, creditsToDeduct: 0, _type: 'image-generation', failure_reason: taskStart.error }
      }).eq('id', taskId)
      await UnifiedCreditsService.allocatePermanentCredits(userId, totalCredits, `refund_${taskId}`, `Refund: RunningHub start failed (${modelConfig.label})`)
      return NextResponse.json({ error: taskStart.error || 'Failed to start generation' }, { status: 500 })
    }

    // Store RunningHub task ID so process-pending can poll it
    await supabase.from('history_items').update({
      settings: {
        prompt: prompt.trim(),
        aspect_ratio: aspect_ratio ?? null,
        creditsToDeduct: totalCredits,
        _creditsAlreadyDeducted: true,
        _runningHubTaskId: taskStart.runningHubTaskId,
        _expectedNodeIds: taskStart.expectedNodeIds,
      }
    }).eq('id', taskId)

    console.log(`✅ generate-image: RunningHub task started — taskId=${taskId} rhTaskId=${taskStart.runningHubTaskId}`)
    return NextResponse.json({ taskId, status: 'processing' })
  }

  // ── Build provider request ────────────────────────────────────────────────
  const generateReq: SynvowGenerateRequest = {
    model: modelId,
    prompt: prompt.trim(),
    ...(aspect_ratio ? { aspect_ratio } : {}),
    ...(imageSize ? { imageSize: imageSize as '1K' | '2K' | '3K' | '4K' } : {}),
    ...(referenceUrls.length > 0
      ? { images: referenceUrls.map(u => ({ type: 'url' as const, data: u })) }
      : {}),
  }

  // ── Return immediately — generation runs in background via after() ─────────
  // The client polls via processingDbIds / history list endpoint.
  after(async () => {
    const supabaseBg = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey)
    const provider = getSynvowProvider()

    const outputUrls: string[] = []
    // Pre-generated thumbnail URLs for data URI outputs (avoids CDN re-fetch in the upload pass)
    const preThumbs = new Map<string, string>()
    let firstError: string | null = null

    // Generate `count` images sequentially (Synvow is synchronous per request)
    for (let i = 0; i < count; i++) {
      try {
        const result = await provider.submitTask(generateReq)

        if (result.immediateOutput) {
          let finalUrl = result.immediateOutput

          // NB Pro (Gemini API) may return a data: URI — upload to Bunny CDN synchronously
          if (finalUrl.startsWith('data:')) {
            const match = finalUrl.match(/^data:([^;]+);base64,(.+)$/)
            if (match) {
              const mime = match[1]!
              const base64 = match[2]!
              const buf = Buffer.from(base64, 'base64')
              const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('gif') ? 'gif' : 'jpg'
              const outputPath = getOutputPath(userId, ext, generateMediaFilename(ext, prompt))
              finalUrl = await uploadBuffer(outputPath, buf, mime)
              console.log(`✅ Bunny (generate-image): base64 output uploaded — ${finalUrl}`)
              // Generate thumbnail from buffer (already in memory — no CDN round-trip)
              const thumbUrl = await generateAndUploadThumbnailFromBuffer(outputPath, buf)
              if (thumbUrl) preThumbs.set(finalUrl, thumbUrl)
            }
          }

          outputUrls.push(finalUrl)
        }
      } catch (err) {
        firstError = err instanceof Error ? err.message : 'Generation failed'
        break
      }
    }

    if (outputUrls.length === 0) {
      await supabaseBg
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          settings: {
            prompt: prompt.trim(),
            aspect_ratio: aspect_ratio ?? null,
            referenceUrls: referenceUrls.length > 0 ? referenceUrls : null,
            count,
            creditsToDeduct: 0,
            _type: 'image-generation',
            failure_reason: firstError ?? 'No output returned',
          },
        })
        .eq('id', taskId)
      console.error(`❌ generate-image: task ${taskId} failed — ${firstError ?? 'no output'}`)
      // Refund the upfront deduction since no images were produced
      await UnifiedCreditsService.allocatePermanentCredits(
        userId,
        totalCredits,
        `refund_${taskId}`,
        `Refund: generation failed (${modelConfig.label})`
      )
      return
    }

    // ── Update history to completed (with raw Synvow URLs for now) ──────────
    const actualCredits = creditsPerImage * outputUrls.length
    const outputItems = outputUrls.map(url => ({ type: 'image' as const, url }))

    await supabaseBg
      .from('history_items')
      .update({
        status: 'completed',
        output_urls: outputItems,
        updated_at: new Date().toISOString(),
        settings: {
          prompt: prompt.trim(),
          aspect_ratio: aspect_ratio ?? null,
          referenceUrls: referenceUrls.length > 0 ? referenceUrls : null,
          count,
          creditsToDeduct: actualCredits,
          _type: 'image-generation',
        },
      })
      .eq('id', taskId)

    // ── Refund unused credits if fewer images were produced than requested ───
    // Credits were deducted upfront for `count` images. Refund the difference.
    if (actualCredits < totalCredits) {
      const refundAmount = totalCredits - actualCredits
      await UnifiedCreditsService.allocatePermanentCredits(
        userId,
        refundAmount,
        `refund_partial_${taskId}`,
        `Partial refund: ${count - outputUrls.length} image(s) failed (${modelConfig.label})`
      )
    }

    // ── Upload outputs to Bunny CDN + generate thumbnails ──────────────────
    try {
      const bunnyItems = await Promise.all(
        outputItems.map(async (item) => {
          try {
            let bunnyUrl = item.url
            let thumbnailUrl: string | null = null
            if (!isOurCdn(item.url)) {
              const ext = extFromUrl(item.url) || 'jpg'
              const outputPath = getOutputPath(userId, ext, generateMediaFilename(ext, prompt))
              bunnyUrl = await uploadFromUrl(outputPath, item.url, mimeFromExt(ext))
              console.log(`✅ Bunny (generate-image): output uploaded — ${bunnyUrl}`)
              thumbnailUrl = await generateAndUploadThumbnail(outputPath, bunnyUrl)
            } else {
              // Already on CDN (data URI path) — thumbnail was pre-generated from buffer
              thumbnailUrl = preThumbs.get(bunnyUrl) ?? null
            }
            return { ...item, url: bunnyUrl, ...(item.url !== bunnyUrl ? { original_url: item.url } : {}), ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}) }
          } catch (err) {
            console.error(`❌ Bunny (generate-image): failed to upload ${item.url}:`, err)
            return item
          }
        })
      )
      await supabaseBg.from('history_items').update({ output_urls: bunnyItems }).eq('id', taskId)
      console.log(`✅ Bunny (generate-image): history updated for task ${taskId}`)
    } catch (err) {
      console.error('❌ Bunny (generate-image): CDN upload error:', err)
    }
  })

  return NextResponse.json({ success: true, taskId, status: 'processing' })
}
