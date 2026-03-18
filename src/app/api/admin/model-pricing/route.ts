import { NextRequest, NextResponse } from 'next/server'
import {
  MODEL_PRICING_CONFIGS,
  ModelPricingConfiguration,
} from '@/lib/model-pricing-config'
import { MODEL_REGISTRY } from '@/services/models'

function checkAdminAuth(request: NextRequest): boolean {
  const adminEmail = request.headers.get('x-admin-email')
  return !!(adminEmail && adminEmail.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase())
}

export interface UnifiedModelEntry {
  modelId: string
  modelName: string
  type: 'image' | 'video'
  provider: 'runninghub' | 'synvow' | 'unknown'
  enabled: boolean
  pricingType: 'tiered' | 'flat'
  // For flat pricing (Synvow/video)
  flatCredits?: number
  costUsd?: number
  tag?: string
  description?: string
  // For tiered pricing (RunningHub)
  config?: ModelPricingConfiguration
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const unified: UnifiedModelEntry[] = []

    // 1. RunningHub models with tiered pricing from model-pricing-config.ts
    const rhProviders = new Set(['synvow', 'runninghub', 'evolink'])
    for (const [modelId, config] of Object.entries(MODEL_PRICING_CONFIGS)) {
      unified.push({
        modelId,
        modelName: config.modelName,
        type: 'image',
        provider: 'runninghub',
        enabled: config.enabled,
        pricingType: 'tiered',
        description: config.description,
        config,
      })
    }

    // Track which model IDs are already covered by RunningHub tiered configs
    const coveredIds = new Set(Object.keys(MODEL_PRICING_CONFIGS))

    // 2. Synvow/video models with flat pricing from MODEL_REGISTRY
    for (const [modelId, mc] of Object.entries(MODEL_REGISTRY)) {
      if (coveredIds.has(modelId)) continue
      unified.push({
        modelId,
        modelName: mc.label,
        type: mc.type,
        provider: mc.providers.includes('synvow') ? 'synvow' : 'unknown',
        enabled: true,
        pricingType: 'flat',
        flatCredits: mc.credits,
        costUsd: mc.costUsd,
        tag: mc.tag,
        description: mc.description,
      })
    }

    // Sort: tiered first, then by type (image, video), then by credits desc
    unified.sort((a, b) => {
      if (a.pricingType !== b.pricingType) return a.pricingType === 'tiered' ? -1 : 1
      if (a.type !== b.type) return a.type === 'image' ? -1 : 1
      const aCredits = a.flatCredits ?? a.config?.resolutionPricing?.[0]?.baseCredits ?? 0
      const bCredits = b.flatCredits ?? b.config?.resolutionPricing?.[0]?.baseCredits ?? 0
      return bCredits - aCredits
    })

    // Summary stats
    const totalModels = unified.length
    const imageModels = unified.filter((m) => m.type === 'image').length
    const videoModels = unified.filter((m) => m.type === 'video').length
    const tieredModels = unified.filter((m) => m.pricingType === 'tiered').length

    return NextResponse.json({
      models: unified,
      stats: { totalModels, imageModels, videoModels, tieredModels },
    })
  } catch (error) {
    console.error('Error fetching model pricing:', error)
    return NextResponse.json({ error: 'Failed to fetch model pricing' }, { status: 500 })
  }
}
