import { NextRequest, NextResponse } from 'next/server'
import {
  ModelPricingEngine,
  ModelPricingConfiguration,
  ResolutionBasePricing,
  SettingPriceIncrement
} from '@/lib/model-pricing-config'

export async function GET(request: NextRequest) {
  try {
    const models = ModelPricingEngine.getAvailableModels()
    return NextResponse.json({ models })
  } catch (error) {
    console.error('Error fetching model pricing configurations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model pricing configurations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, modelId, data } = body

    switch (action) {
      case 'update_model_config':
        if (!modelId || !data) {
          return NextResponse.json(
            { error: 'Missing modelId or data for model config update' },
            { status: 400 }
          )
        }

        const success = ModelPricingEngine.updateModelConfig(modelId, data)
        if (!success) {
          return NextResponse.json(
            { error: 'Model not found or update failed' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Model configuration updated successfully',
          updatedConfig: ModelPricingEngine.getModelConfig(modelId)
        })

      case 'add_resolution_tier':
        if (!modelId || !data) {
          return NextResponse.json(
            { error: 'Missing modelId or data for resolution tier' },
            { status: 400 }
          )
        }

        const addResolutionSuccess = ModelPricingEngine.addResolutionTier(modelId, data)
        if (!addResolutionSuccess) {
          return NextResponse.json(
            { error: 'Model not found or failed to add resolution tier' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Resolution tier added successfully',
          updatedConfig: ModelPricingEngine.getModelConfig(modelId)
        })

      case 'add_setting_increment':
        if (!modelId || !data) {
          return NextResponse.json(
            { error: 'Missing modelId or data for setting increment' },
            { status: 400 }
          )
        }

        const addSettingSuccess = ModelPricingEngine.addSettingIncrement(modelId, data)
        if (!addSettingSuccess) {
          return NextResponse.json(
            { error: 'Model not found or failed to add setting increment' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Setting increment added successfully',
          updatedConfig: ModelPricingEngine.getModelConfig(modelId)
        })

      case 'update_setting_increment':
        if (!modelId || !data?.settingKey || !data?.updates) {
          return NextResponse.json(
            { error: 'Missing modelId, settingKey, or updates for setting increment update' },
            { status: 400 }
          )
        }

        const updateSettingSuccess = ModelPricingEngine.updateSettingIncrement(
          modelId,
          data.settingKey,
          data.updates
        )
        if (!updateSettingSuccess) {
          return NextResponse.json(
            { error: 'Model or setting not found, or update failed' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Setting increment updated successfully',
          updatedConfig: ModelPricingEngine.getModelConfig(modelId)
        })

      case 'calculate_preview':
        if (!modelId || !data?.width || !data?.height) {
          return NextResponse.json(
            { error: 'Missing modelId, width, or height for pricing preview' },
            { status: 400 }
          )
        }

        try {
          const pricingResult = ModelPricingEngine.calculateCredits(
            data.width,
            data.height,
            modelId,
            data.settings || {}
          )

          return NextResponse.json({
            success: true,
            pricing: pricingResult
          })
        } catch (error) {
          return NextResponse.json(
            { error: `Failed to calculate pricing: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 400 }
          )
        }

      case 'get_pricing_preview':
        if (!modelId || !data?.scenarios) {
          return NextResponse.json(
            { error: 'Missing modelId or scenarios for pricing preview' },
            { status: 400 }
          )
        }

        try {
          const preview = ModelPricingEngine.getPricingPreview(modelId, data.scenarios)
          return NextResponse.json({
            success: true,
            preview
          })
        } catch (error) {
          return NextResponse.json(
            { error: `Failed to generate pricing preview: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 400 }
          )
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in model pricing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { modelId, config } = body

    if (!modelId || !config) {
      return NextResponse.json(
        { error: 'Missing modelId or config' },
        { status: 400 }
      )
    }

    const success = ModelPricingEngine.updateModelConfig(modelId, config)
    if (!success) {
      return NextResponse.json(
        { error: 'Model not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Model configuration updated successfully',
      updatedConfig: ModelPricingEngine.getModelConfig(modelId)
    })
  } catch (error) {
    console.error('Error updating model pricing configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update model pricing configuration' },
      { status: 500 }
    )
  }
}