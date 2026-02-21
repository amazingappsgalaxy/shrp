import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EnhancementService } from '../../../services/ai-providers';
import type { EnhancementRequest } from '../../../services/ai-providers';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../../lib/config';
import { AIProviderFactory } from '../../../services/ai-providers/provider-factory';
import { ProviderType } from '../../../services/ai-providers/common/types';
import { RunningHubProvider } from '../../../services/ai-providers/runninghub/runninghub-provider';
import { getSession } from '@/lib/auth-simple';
import { getImageMetadata, calculateCreditsConsumed, getModelDisplayName } from '@/lib/image-metadata'
import { PricingEngine } from '@/lib/pricing-engine';
import { ModelPricingEngine } from '@/lib/model-pricing-config';
import { CreditManager } from '@/lib/credits';
import { UnifiedCreditsService } from '@/lib/unified-credits';
import { v4 as uuidv4 } from 'uuid';

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

  if (typeof value === 'string') {
    return [asItem(value)]
  }

  return []
}

export async function POST(request: NextRequest) {
  let taskId: string | null = null;
  let historySettings: any = null;

  // Initialize Supabase client
  const supabase = createClient(
    config.database.supabaseUrl,
    config.database.supabaseServiceKey
  );

  try {
    console.log('🚀 API: Enhancement request received')

    // Clear provider cache to force reload of RunningHubProvider (hot fix for dev)
    AIProviderFactory.clearCache()

    // Authenticate via session cookie
    const cookieStore = await cookies()
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || cookieStore.get('session')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await getSession(token)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const body = await request.json()
    const { imageUrl, settings, imageId = `img-${Date.now()}`, modelId } = body

    console.log('📋 API: Request details:', {
      imageUrl: imageUrl.substring(0, 50) + '...',
      userId,
      imageId,
      modelId,
      settings: {
        ...settings,
        prompt: settings.prompt ? settings.prompt.substring(0, 50) + '...' : 'No prompt provided'
      }
    })

    // Validate request
    if (!imageUrl || !settings || !modelId) {
      console.error('❌ API: Missing required fields:', {
        imageUrl: !!imageUrl,
        settings: !!settings,
        modelId: !!modelId
      })
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, settings, and modelId are required' },
        { status: 400 }
      )
    }

    console.log('✅ API: Validation passed, using EnhancementService')

    // Generate unique task ID using UUID
    taskId = uuidv4()
    const now = Date.now()

    historySettings = {
      style: settings.styleName || settings.style || null,
      mode: settings.mode || null,
      transformationStrength: settings.denoise ?? null,
      skinTextureSize: settings.megapixels ?? null,
      detailLevel: settings.maxshift ?? null
    }

    const historyPageName = settings.pageName || 'app/editor'

    // Pre-calculate credits needed for this enhancement BEFORE creating any DB record
    let estimatedCredits = 0

    if (settings?.imageWidth && settings?.imageHeight) {
      try {
        const pricingBreakdown = ModelPricingEngine.calculateCredits(
          settings.imageWidth,
          settings.imageHeight,
          modelId,
          settings
        )
        estimatedCredits = pricingBreakdown.totalCredits
        console.log('💰 API: Credit estimation from request dimensions:', {
          dimensions: { width: settings.imageWidth, height: settings.imageHeight },
          estimatedCredits,
          taskId
        })
      } catch (error) {
        console.warn('⚠️ API: Model pricing engine failed, trying fallback:', error)
        try {
          const pricingBreakdown = PricingEngine.calculateCredits(
            settings.imageWidth,
            settings.imageHeight,
            modelId,
            settings
          )
          estimatedCredits = pricingBreakdown.totalCredits
        } catch {
          estimatedCredits = calculateCreditsConsumed(settings.imageWidth, settings.imageHeight)
        }
      }
    } else {
      try {
        const imageMetadata = await getImageMetadata(imageUrl)
        estimatedCredits = calculateCreditsConsumed(imageMetadata.width, imageMetadata.height)
      } catch {
        estimatedCredits = 150
        console.warn('⚠️ API: Using default credit estimation - no dimensions available')
      }
    }

    // Check user credit balance BEFORE creating history item — no DB record if credits insufficient
    const creditBalance = await UnifiedCreditsService.getUserCredits(userId)
    const userCreditBalance = creditBalance.total

    if (userCreditBalance < estimatedCredits && estimatedCredits > 0) {
      console.log('❌ API: Insufficient credits — rejecting without creating history record:', {
        userId,
        required: estimatedCredits,
        available: userCreditBalance,
        taskId
      })
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: estimatedCredits,
          available: userCreditBalance,
          taskId
        },
        { status: 402 }
      )
    }

    // Create history item in Supabase — only reached when credits are sufficient
    try {
      console.log('📝 API: Creating history item in database...', {
        taskId,
        userId,
        imageId,
        timestamp: now
      })

      const { error: insertError } = await supabase
        .from('history_items')
        .insert({
          id: taskId,
          user_id: userId,
          task_id: taskId,
          output_urls: [],
          model_name: getModelDisplayName(modelId),
          page_name: historyPageName,
          status: 'processing',
          settings: historySettings,
          created_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString()
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create task: ${insertError.message}`)
      }

      console.log('✅ API: History item created successfully in Supabase:', {
        taskId,
        userId,
        status: 'processing',
        timestamp: new Date(now).toISOString()
      })

      // Verify task was created by querying it back
      const { data: verifyTask, error: verifyError } = await supabase
        .from('history_items')
        .select('id, status, user_id')
        .eq('id', taskId)
        .single()

      if (verifyError || !verifyTask) {
        throw new Error('Task creation verification failed - task not found in database')
      }

      console.log('✅ API: History creation verified:', {
        taskId: verifyTask.id,
        status: verifyTask.status,
        userId: verifyTask.user_id
      })

    } catch (error) {
      console.error('❌ API: Failed to create task in Supabase:', error)
      return NextResponse.json(
        {
          error: 'Database operation failed',
          details: error instanceof Error ? error.message : 'Unknown database error',
          taskId
        },
        { status: 500 }
      )
    }

    // Start the RunningHub task asynchronously (non-blocking)
    const provider = AIProviderFactory.getProvider(ProviderType.RUNNINGHUB) as RunningHubProvider
    const enhancementRequest: EnhancementRequest = { imageUrl, settings, userId, imageId }

    console.log('🚀 API: Starting async RunningHub task for model:', modelId)
    const taskStart = await provider.startTaskForModel(enhancementRequest, modelId)

    if (!taskStart.success) {
      console.error('❌ API: Failed to start RunningHub task:', taskStart.error)
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          settings: { ...historySettings, failure_reason: taskStart.error || 'Failed to start task' }
        })
        .eq('id', taskId)
      return NextResponse.json(
        { error: taskStart.error || 'Failed to start enhancement task' },
        { status: 500 }
      )
    }

    // Store RunningHub task metadata in DB settings for the poll endpoint to use
    await supabase
      .from('history_items')
      .update({
        settings: {
          ...historySettings,
          _runningHubTaskId: taskStart.runningHubTaskId,
          _expectedNodeIds: taskStart.expectedNodeIds,
          _creditsToDeduct: estimatedCredits
        }
      })
      .eq('id', taskId)

    console.log('✅ API: Task started, returning immediately to client', {
      taskId,
      runningHubTaskId: taskStart.runningHubTaskId
    })

    // Return immediately — client will poll /api/enhance-image/poll?taskId=<taskId>
    return NextResponse.json({ success: true, taskId, status: 'processing' })

  } catch (error) {
    console.error('❌ API: Image enhancement failed:', error)

    // Update history item to failed status if an exception occurred
    try {
      if (taskId) {
        await supabase
          .from('history_items')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
            generation_time_ms: 0,
            settings: {
              ...historySettings,
              failure_reason: error instanceof Error ? error.message : 'Unknown system error'
            }
          })
          .eq('id', taskId)
        console.log('✅ API: History item updated to failed state after exception')
      }
    } catch (dbError) {
      console.error('❌ API: Failed to update history item after exception:', dbError)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Image enhancement failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check enhancement status or get available models
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const jobId = searchParams.get('jobId')

    const enhancementService = EnhancementService.getInstance()

    if (action === 'models') {
      // Return available models
      const models = enhancementService.getAvailableModels()
      return NextResponse.json({ models })
    }

    if (action === 'status' && jobId) {
      // Return job status
      const job = enhancementService.getJobStatus(jobId)
      if (job) {
        return NextResponse.json({ job })
      } else {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
    }

    if (action === 'providers') {
      // Return provider status
      const status = enhancementService.getProviderStatus()
      return NextResponse.json({ providers: status })
    }

    return NextResponse.json(
      {
        message: 'Supported actions: models, status (with jobId), providers',
        examples: [
          '?action=models',
          '?action=status&jobId=job_123',
          '?action=providers'
        ]
      }
    )
  } catch (error) {
    console.error('❌ API: GET request failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
