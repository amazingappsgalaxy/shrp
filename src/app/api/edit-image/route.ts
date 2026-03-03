import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { uploadBuffer, getInputPath, getCdnUrl, getOutputPath } from '@/lib/bunny'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { MODEL_REGISTRY } from '@/services/models'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { getSynvowProvider } from '@/services/ai-providers/synvow/synvow-provider'
import { v4 as uuidv4 } from 'uuid'

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
    const { compositeDataUrl, originalImageUrl, masks, model, combinedPrompt } = body as {
      compositeDataUrl: string
      originalImageUrl: string
      masks: Array<{ color: string; colorName: string; prompt: string }>
      model: string
      combinedPrompt: string
    }

    if (!compositeDataUrl || !originalImageUrl || !masks?.length || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // Upload composite image to Bunny CDN (the overlay canvas image as reference)
    const base64Data = compositeDataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const compositePath = getInputPath(userId, 'png')
    const compositeUrl = await uploadBuffer(compositePath, buffer, 'image/png')

    // Build combined prompt
    const activeMasks = masks.filter(m => m.prompt.trim())
    const prompt = combinedPrompt?.trim() ||
      activeMasks
        .map(m => `In the ${m.colorName} highlighted region: ${m.prompt.trim()}`)
        .join('. ') +
      '. Keep all non-highlighted areas completely unchanged.'

    // Single Synvow call with the composite as reference
    const synvow = getSynvowProvider()
    const result = await synvow.submitTask({
      model,
      prompt,
      images: [{ type: 'url', data: compositeUrl }],
    })

    if (!result.immediateOutput) {
      return NextResponse.json({ error: 'Generation returned no output' }, { status: 500 })
    }

    const outputUrl = result.immediateOutput
    const generationMs = Date.now() - startTime

    // Deduct credits ONCE for the entire edit (all masks combined)
    await UnifiedCreditsService.deductCredits(
      userId,
      creditCost,
      taskId,
      `Image edit (${activeMasks.length} mask${activeMasks.length !== 1 ? 's' : ''}) - ${modelConfig.label}`
    )

    // Save to history
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
        compositeUrl,
        masks: activeMasks,
        prompt,
        model,
        creditCost,
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
