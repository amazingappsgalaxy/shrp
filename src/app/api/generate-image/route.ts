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
import { uploadFromUrl, uploadBuffer, getInputPath, getOutputPath, extFromUrl, mimeFromExt } from '@/lib/bunny'

/**
 * POST /api/generate-image
 *
 * Synchronous image generation via the Synvow provider.
 * Flow:
 *   auth → credit check → ensure all refs on Bunny CDN → create history_items →
 *   call provider → update history (completed) → deduct credits →
 *   [after()] upload outputs to Bunny CDN → return
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
  const count = Math.min(Math.max(Number(body.count ?? 1), 1), 4)
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
  // Selected grid images arrive as Synvow output URLs (webstatic.aiproxy.vip).
  // Re-upload them server-side under the real userId so we own the URL.
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

  // ── Call Synvow provider ──────────────────────────────────────────────────
  const provider = getSynvowProvider()

  const generateReq: SynvowGenerateRequest = {
    model: modelId,
    prompt: prompt.trim(),
    ...(aspect_ratio ? { aspect_ratio } : {}),
    ...(imageSize ? { imageSize: imageSize as '1K' | '2K' | '4K' } : {}),
    ...(referenceUrls.length > 0
      ? { images: referenceUrls.map(u => ({ type: 'url' as const, data: u })) }
      : {}),
  }

  const outputUrls: string[] = []
  const debugItems: Array<{ request?: unknown; response?: unknown }> = []
  let firstError: string | null = null

  // Generate `count` images sequentially (Synvow is synchronous per request)
  for (let i = 0; i < count; i++) {
    try {
      const result = await provider.submitTask(generateReq)
      debugItems.push({ request: result._debugRequest, response: result._debugResponse })

      if (result.immediateOutput) {
        let finalUrl = result.immediateOutput

        // NB Pro (Gemini API) may return a data: URI — upload to Bunny CDN synchronously
        if (finalUrl.startsWith('data:')) {
          const match = finalUrl.match(/^data:([^;]+);base64,(.+)$/)
          if (match) {
            const mime = match[1]!
            const base64 = match[2]!
            const buf = Buffer.from(base64, 'base64')
            const ext = mime.includes('png') ? 'png' : 'jpg'
            finalUrl = await uploadBuffer(getOutputPath(userId, ext), buf, mime)
            console.log(`✅ Bunny (generate-image): base64 output uploaded — ${finalUrl}`)
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
    await supabase
      .from('history_items')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        settings: {
          prompt: prompt.trim(),
          aspect_ratio: aspect_ratio ?? null,
          referenceUrls: referenceUrls.length > 0 ? referenceUrls : null,
          count,
          creditsToDeduct: totalCredits,
          failure_reason: firstError ?? 'No output returned',
        },
      })
      .eq('id', taskId)

    return NextResponse.json(
      { error: firstError ?? 'Generation failed — no output returned' },
      { status: 500 }
    )
  }

  // ── Update history to completed (with raw Synvow URLs for now) ────────────
  const actualCredits = creditsPerImage * outputUrls.length
  const outputItems = outputUrls.map(url => ({ type: 'image' as const, url }))

  await supabase
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
      },
    })
    .eq('id', taskId)

  // ── Deduct credits ────────────────────────────────────────────────────────
  try {
    await UnifiedCreditsService.deductCredits(
      userId,
      actualCredits,
      taskId,
      `Image generation: ${modelConfig.label} ×${outputUrls.length}`
    )
  } catch (err) {
    console.error('⚠️ generate-image: credit deduction failed (non-fatal):', err)
  }

  // ── Background: re-upload outputs to Bunny CDN (same pattern as poll endpoint)
  // The Synvow URLs (webstatic.aiproxy.vip) are temporary; we own the CDN copies.
  // History is updated after the response is already sent so the UI is not blocked.
  after(async () => {
    try {
      const bunnyItems = await Promise.all(
        outputItems.map(async (item) => {
          // Already on our CDN (e.g. data: URI was uploaded synchronously above) — skip re-upload
          if (isOurCdn(item.url)) return item
          try {
            const ext = extFromUrl(item.url) || 'jpg'
            const bunnyUrl = await uploadFromUrl(getOutputPath(userId, ext), item.url, mimeFromExt(ext))
            console.log(`✅ Bunny (generate-image): output uploaded — ${bunnyUrl}`)
            return { ...item, url: bunnyUrl, original_url: item.url }
          } catch (err) {
            console.error(`❌ Bunny (generate-image): failed to upload ${item.url}:`, err)
            return item
          }
        })
      )
      const supabaseAfter = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey)
      await supabaseAfter.from('history_items').update({ output_urls: bunnyItems }).eq('id', taskId)
      console.log(`✅ Bunny (generate-image): history updated for task ${taskId}`)
    } catch (err) {
      console.error('❌ Bunny (generate-image): background upload error:', err)
    }
  })

  return NextResponse.json({
    success: true,
    taskId,
    outputUrls,
    creditsUsed: actualCredits,
    _debug: debugItems,
  })
}
