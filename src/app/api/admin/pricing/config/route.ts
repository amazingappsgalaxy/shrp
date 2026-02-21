import { NextRequest, NextResponse } from 'next/server'

// Mock pricing configuration storage (in production, use database)
let pricingConfig = {
  resolutionTiers: [
    { id: '1', name: 'Low (≤1MP)', maxMegapixels: 1, baseCost: 1, enabled: true },
    { id: '2', name: 'Medium (≤4MP)', maxMegapixels: 4, baseCost: 2, enabled: true },
    { id: '3', name: 'High (≤8MP)', maxMegapixels: 8, baseCost: 4, enabled: true },
    { id: '4', name: 'Ultra (≤16MP)', maxMegapixels: 16, baseCost: 8, enabled: true },
    { id: '5', name: 'Max (>16MP)', maxMegapixels: 999, baseCost: 15, enabled: true }
  ],
  modelConfigs: [
    { id: '1', modelId: 'esrgan', name: 'ESRGAN', multiplier: 1.0, flatFee: 0, enabled: true },
    { id: '2', modelId: 'real-esrgan', name: 'Real-ESRGAN', multiplier: 1.2, flatFee: 1, enabled: true },
    { id: '3', modelId: 'waifu2x', name: 'Waifu2x', multiplier: 0.8, flatFee: 0, enabled: true },
    { id: '4', modelId: 'swinir', name: 'SwinIR', multiplier: 1.5, flatFee: 2, enabled: true },
    { id: '5', modelId: 'topaz', name: 'Topaz Gigapixel', multiplier: 2.0, flatFee: 3, enabled: true }
  ],
  optionModifiers: [
    { id: '1', optionName: 'face_enhance', modifierType: 'flat_fee', value: 2, enabled: true },
    { id: '2', optionName: 'noise_reduction', modifierType: 'multiplier', value: 1.3, enabled: true },
    { id: '3', optionName: 'color_correction', modifierType: 'flat_fee', value: 1, enabled: true },
    { id: '4', optionName: 'hdr_enhancement', modifierType: 'multiplier', value: 1.8, enabled: true },
    { id: '5', optionName: 'skin_smoothing', modifierType: 'flat_fee', value: 3, enabled: true },
    { id: '6', optionName: 'detail_enhancement', modifierType: 'multiplier', value: 1.4, enabled: true }
  ],
  globalSettings: {
    minimumCost: 1,
    maximumCost: 50,
    defaultModel: 'esrgan',
    currency: 'USD'
  }
}

// GET - Retrieve current pricing configuration
export async function GET(request: NextRequest) {
  try {
    // Simple admin authentication check
    const adminEmail = request.headers.get('X-Admin-Email')

    if (!adminEmail || adminEmail !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(pricingConfig)

  } catch (error) {
    console.error('Pricing config GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Save pricing configuration
export async function POST(request: NextRequest) {
  try {
    // Simple admin authentication check
    const adminEmail = request.headers.get('X-Admin-Email')

    if (!adminEmail || adminEmail !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const newConfig = await request.json()

    // Basic validation
    if (!newConfig.resolutionTiers || !newConfig.modelConfigs || !newConfig.globalSettings) {
      return NextResponse.json(
        { error: 'Invalid pricing configuration format' },
        { status: 400 }
      )
    }

    // Validate resolution tiers
    for (const tier of newConfig.resolutionTiers) {
      if (!tier.name || typeof tier.maxMegapixels !== 'number' || typeof tier.baseCost !== 'number') {
        return NextResponse.json(
          { error: 'Invalid resolution tier configuration' },
          { status: 400 }
        )
      }
    }

    // Validate model configs
    for (const model of newConfig.modelConfigs) {
      if (!model.modelId || !model.name || typeof model.multiplier !== 'number') {
        return NextResponse.json(
          { error: 'Invalid model configuration' },
          { status: 400 }
        )
      }
    }

    // Save configuration (in production, save to database)
    pricingConfig = {
      ...newConfig,
      // Add timestamps
      lastUpdated: new Date().toISOString(),
      updatedBy: adminEmail
    }

    console.log('Pricing configuration updated by:', adminEmail)

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration saved successfully',
      timestamp: pricingConfig.lastUpdated
    })

  } catch (error) {
    console.error('Pricing config POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update specific pricing component
export async function PUT(request: NextRequest) {
  try {
    const adminEmail = request.headers.get('X-Admin-Email')

    if (!adminEmail || adminEmail !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { type, id, data } = await request.json()

    if (type === 'tier' && id) {
      const tierIndex = pricingConfig.resolutionTiers.findIndex(t => t.id === id)
      if (tierIndex !== -1) {
        pricingConfig.resolutionTiers[tierIndex] = { ...pricingConfig.resolutionTiers[tierIndex], ...data }
      }
    } else if (type === 'model' && id) {
      const modelIndex = pricingConfig.modelConfigs.findIndex(m => m.id === id)
      if (modelIndex !== -1) {
        pricingConfig.modelConfigs[modelIndex] = { ...pricingConfig.modelConfigs[modelIndex], ...data }
      }
    } else if (type === 'option' && id) {
      const optionIndex = pricingConfig.optionModifiers.findIndex(o => o.id === id)
      if (optionIndex !== -1) {
        pricingConfig.optionModifiers[optionIndex] = { ...pricingConfig.optionModifiers[optionIndex], ...data }
      }
    } else if (type === 'global') {
      pricingConfig.globalSettings = { ...pricingConfig.globalSettings, ...data }
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration updated successfully'
    })

  } catch (error) {
    console.error('Pricing config PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}