import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { uploadBuffer, getInputPath } from '@/lib/bunny'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { MODEL_REGISTRY } from '@/services/models'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { getSynvowProvider } from '@/services/ai-providers/synvow/synvow-provider'
import { v4 as uuidv4 } from 'uuid'
import type { SynvowImageInput } from '@/services/ai-providers/synvow/types'

export async function POST(request: NextRequest) {
  const supabase = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey)

  try {
    // Auth
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = await getSession(token)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id

    const body = await request.json()
    const {
      compositeDataUrl,       // base64 data URL of composited canvas with mask overlays
      cleanOriginalDataUrl,   // base64 data URL of the clean original (no masks) — primary for edit/relight
      originalImageUrl,       // original uploaded image CDN URL (fallback)
      masks = [],             // mask layers with prompts (legacy, unused now)
      model,
      combinedPrompt,         // pre-built prompt (all modes)
      referenceImages = [],   // extra reference images
      mode = 'edit',
    } = body as {
      compositeDataUrl?: string
      cleanOriginalDataUrl?: string
      originalImageUrl: string
      masks: Array<{ color: string; colorName: string; prompt: string; referenceImageUrl?: string }>
      model: string
      combinedPrompt: string
      referenceImages?: string[]
      mode?: 'edit' | 'relight' | 'prompt'
    }

    if (!model || !combinedPrompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!cleanOriginalDataUrl && !compositeDataUrl && !originalImageUrl) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Look up model and credits
    const modelConfig = MODEL_REGISTRY[model]
    if (!modelConfig) {
      return NextResponse.json({ error: `Unknown model: ${model}` }, { status: 400 })
    }
    const creditCost = modelConfig.credits

    // Check user credits
    const creditBalance = await UnifiedCreditsService.getUserCredits(userId)
    const total = (creditBalance.subscription_credits ?? 0) + (creditBalance.permanent_credits ?? 0)
    if (total < creditCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    const taskId = uuidv4()
    const startTime = Date.now()

    // ── Build reference images array ──────────────────────────────────────────
    const images: SynvowImageInput[] = []

    if (mode === 'edit' || mode === 'relight') {
      // Primary: clean original image (no mask overlays) — the AI edits THIS
      if (cleanOriginalDataUrl) {
        const base64Data = cleanOriginalDataUrl.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const cleanPath = getInputPath(userId, 'png')
        const cleanUrl = await uploadBuffer(cleanPath, buffer, 'image/png')
        images.push({ type: 'url', data: cleanUrl })
      } else if (originalImageUrl && originalImageUrl.startsWith('http')) {
        images.push({ type: 'url', data: originalImageUrl })
      }

      // Secondary (edit only): composite with mask overlays as a spatial guide
      if (mode === 'edit' && compositeDataUrl && images.length < 4) {
        const base64Data = compositeDataUrl.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const compositePath = getInputPath(userId, 'png')
        const compositeUrl = await uploadBuffer(compositePath, buffer, 'image/png')
        images.push({ type: 'url', data: compositeUrl })
      }
    } else {
      // Prompt mode: just use the composite (may have text annotations drawn on)
      if (compositeDataUrl) {
        const base64Data = compositeDataUrl.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const compositePath = getInputPath(userId, 'png')
        const compositeUrl = await uploadBuffer(compositePath, buffer, 'image/png')
        images.push({ type: 'url', data: compositeUrl })
      } else if (originalImageUrl && originalImageUrl.startsWith('http')) {
        images.push({ type: 'url', data: originalImageUrl })
      }
    }

    if (images.length === 0) {
      return NextResponse.json({ error: 'No valid image could be prepared' }, { status: 400 })
    }

    // Add any extra per-layer reference images or prompt reference images
    for (const refUrl of referenceImages) {
      if (refUrl && images.length < 5) {
        images.push({ type: 'url', data: refUrl })
      }
    }

    // ── Single Synvow call with ALL images and ONE combined prompt ─────────────
    const synvow = getSynvowProvider()
    const result = await synvow.submitTask({
      model,
      prompt: combinedPrompt,
      images,
    })

    if (!result.immediateOutput) {
      return NextResponse.json({ error: 'Generation returned no output' }, { status: 500 })
    }

    const outputUrl = result.immediateOutput
    const generationMs = Date.now() - startTime

    // ── Deduct credits ONCE — covers all masks in a single generation ──────────
    const activeMaskCount = masks.filter(m => m.prompt.trim()).length
    const description = mode === 'edit'
      ? `Image edit (${activeMaskCount} mask${activeMaskCount !== 1 ? 's' : ''} combined) — ${modelConfig.label}`
      : mode === 'relight'
      ? `Image relight — ${modelConfig.label}`
      : `Prompt edit — ${modelConfig.label}`

    await UnifiedCreditsService.deductCredits(userId, creditCost, taskId, description)

    // ── Save to history ────────────────────────────────────────────────────────
    await supabase.from('history_items').insert({
      id: uuidv4(),
      user_id: userId,
      task_id: taskId,
      output_urls: [{ type: 'image', url: outputUrl }],
      model_name: model,
      page_name: 'app/edit',
      status: 'success',
      generation_time_ms: generationMs,
      settings: {
        originalImageUrl,
        masks,
        prompt: combinedPrompt,
        model,
        creditCost,
        mode,
      },
    })

    return NextResponse.json({
      success: true,
      outputUrl,
      taskId,
      creditCost,
      generationMs,
    })
  } catch (err) {
    console.error('❌ edit-image error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
