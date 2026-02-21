/**
 * Advanced Pricing Engine for Dynamic Credit Calculation
 * Supports model-specific pricing, resolution tiers, and option-based modifiers
 */

export interface ResolutionTier {
  id: string
  name: string
  maxMegapixels: number
  baseCredits: number
  description: string
}

export interface ModelPricingConfig {
  modelId: string
  name: string
  creditMultiplier: number
  flatFee: number
  enabled: boolean
  description?: string
  options?: OptionPricingModifier[]
}

export interface OptionPricingModifier {
  optionKey: string
  optionName: string
  modifierType: 'multiplier' | 'flat' | 'conditional'
  conditions?: OptionCondition[]
  value: number
  description: string
}

export interface OptionCondition {
  when: any // The option value that triggers this modifier
  modifier: number // The pricing modifier when condition is met
}

export interface PricingBreakdown {
  baseCredits: number
  resolutionTier: string
  modelMultiplier: number
  modelFlatFee: number
  optionModifiers: Array<{
    name: string
    type: string
    value: number
    credits: number
  }>
  totalCredits: number
  breakdown: string[]
  megapixels: number
}

// Centralized pricing configuration
export const PRICING_CONFIG = {
  resolutionTiers: [
    {
      id: 'sd',
      name: 'Standard Definition',
      maxMegapixels: 1.0,
      baseCredits: 60,
      description: '≤ 1000×1000 pixels (≤ 1MP)'
    },
    {
      id: 'hd',
      name: 'High Definition',
      maxMegapixels: 2.25,
      baseCredits: 120,
      description: '≤ 1500×1500 pixels (≤ 2.25MP)'
    },
    {
      id: '4k',
      name: '4K Resolution',
      maxMegapixels: 4.66,
      baseCredits: 360,
      description: '≤ 2160×2160 pixels (≤ 4.66MP)'
    },
    {
      id: 'ultra',
      name: 'Ultra High Definition',
      maxMegapixels: Infinity,
      baseCredits: 500,
      description: '> 2160×2160 pixels (> 4.66MP)'
    }
  ] as ResolutionTier[],

  modelConfigs: [
    {
      modelId: 'fermatresearch/magic-image-refiner',
      name: 'Magic Image Refiner',
      creditMultiplier: 1.0,
      flatFee: 0,
      enabled: true,
      description: 'Balanced enhancement with good quality',
      options: [
        {
          optionKey: 'creativity',
          optionName: 'Creativity Level',
          modifierType: 'conditional' as const,
          conditions: [
            { when: (val: number) => val > 0.5, modifier: 1.2 },
            { when: (val: number) => val > 0.8, modifier: 1.5 }
          ],
          value: 0,
          description: 'Higher creativity increases processing cost'
        },
        {
          optionKey: 'hdr',
          optionName: 'HDR Enhancement',
          modifierType: 'conditional' as const,
          conditions: [
            { when: (val: number) => val > 0, modifier: 1.1 }
          ],
          value: 0,
          description: 'HDR processing adds 10% to cost'
        },
        {
          optionKey: 'steps',
          optionName: 'Processing Steps',
          modifierType: 'conditional' as const,
          conditions: [
            { when: (val: number) => val > 20, modifier: 1.1 },
            { when: (val: number) => val > 50, modifier: 1.3 },
            { when: (val: number) => val > 80, modifier: 1.5 }
          ],
          value: 0,
          description: 'More steps = higher quality but more cost'
        }
      ]
    },
    {
      modelId: 'nightmareai/real-esrgan',
      name: 'Real-ESRGAN Upscaler',
      creditMultiplier: 0.8,
      flatFee: 10,
      enabled: true,
      description: 'Efficient upscaling model',
      options: [
        {
          optionKey: 'scale',
          optionName: 'Scale Factor',
          modifierType: 'conditional' as const,
          conditions: [
            { when: (val: number) => val >= 2, modifier: 1.0 },
            { when: (val: number) => val >= 4, modifier: 1.3 },
            { when: (val: number) => val >= 6, modifier: 1.6 },
            { when: (val: number) => val >= 8, modifier: 2.0 }
          ],
          value: 0,
          description: 'Higher scale factors cost more'
        },
        {
          optionKey: 'face_enhance',
          optionName: 'Face Enhancement',
          modifierType: 'flat' as const,
          value: 15,
          description: 'Face enhancement adds 15 credits'
        }
      ]
    },
    {
      modelId: 'tencentarc/gfpgan',
      name: 'GFPGAN Face Restoration',
      creditMultiplier: 0.9,
      flatFee: 5,
      enabled: true,
      description: 'Specialized face restoration',
      options: [
        {
          optionKey: 'version',
          optionName: 'GFPGAN Version',
          modifierType: 'conditional' as const,
          conditions: [
            { when: (val: string) => val === 'v1.4', modifier: 1.1 }
          ],
          value: 0,
          description: 'v1.4 costs 10% more than v1.3'
        },
        {
          optionKey: 'scale',
          optionName: 'Rescaling Factor',
          modifierType: 'conditional' as const,
          conditions: [
            { when: (val: number) => val >= 2, modifier: 1.0 },
            { when: (val: number) => val >= 3, modifier: 1.2 },
            { when: (val: number) => val >= 4, modifier: 1.4 }
          ],
          value: 0,
          description: 'Higher rescaling costs more'
        }
      ]
    },
    {
      modelId: 'runninghub-flux-upscaling',
      name: 'FLUX Advanced Upscaling',
      creditMultiplier: 1.4,
      flatFee: 25,
      enabled: true,
      description: 'Premium model with advanced features',
      options: [
        {
          optionKey: 'megapixels',
          optionName: 'Target Megapixels',
          modifierType: 'conditional' as const,
          conditions: [
            { when: (val: number) => val > 5, modifier: 1.1 },
            { when: (val: number) => val > 10, modifier: 1.3 },
            { when: (val: number) => val > 15, modifier: 1.6 }
          ],
          value: 0,
          description: 'Higher target resolution costs more'
        },
        {
          optionKey: 'steps',
          optionName: 'Processing Steps',
          modifierType: 'conditional' as const,
          conditions: [
            { when: (val: number) => val > 10, modifier: 1.0 },
            { when: (val: number) => val > 25, modifier: 1.2 },
            { when: (val: number) => val > 40, modifier: 1.4 }
          ],
          value: 0,
          description: 'More processing steps cost more'
        },
        {
          optionKey: 'enable_upscale',
          optionName: 'Enable Upscaling',
          modifierType: 'conditional' as const,
          conditions: [
            { when: (val: boolean) => val === true, modifier: 1.0 },
            { when: (val: boolean) => val === false, modifier: 0.7 }
          ],
          value: 0,
          description: 'Disabling upscale reduces cost by 30%'
        },
        {
          optionKey: 'enable_myupscaler',
          optionName: 'MyUpscaler Node',
          modifierType: 'flat' as const,
          value: 20,
          description: 'MyUpscaler processing adds 20 credits'
        }
      ]
    }
  ] as ModelPricingConfig[]
}

export class PricingEngine {
  /**
   * Calculate credits for an image enhancement task
   */
  static calculateCredits(
    width: number,
    height: number,
    modelId: string,
    options: Record<string, any> = {}
  ): PricingBreakdown {
    const megapixels = (width * height) / 1000000

    // Find resolution tier
    const resolutionTier = PRICING_CONFIG.resolutionTiers.find(
      tier => megapixels <= tier.maxMegapixels
    ) || PRICING_CONFIG.resolutionTiers[PRICING_CONFIG.resolutionTiers.length - 1]

    // Find model configuration
    const modelConfig = PRICING_CONFIG.modelConfigs.find(
      config => config.modelId === modelId && config.enabled
    )

    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found or disabled`)
    }

    // Base calculation
    const baseCredits = resolutionTier.baseCredits
    const modelAdjustedCredits = Math.round(baseCredits * modelConfig.creditMultiplier)
    const modelFlatFee = modelConfig.flatFee

    // Calculate option-based modifiers
    const optionModifiers: Array<{
      name: string
      type: string
      value: number
      credits: number
    }> = []

    let totalOptionMultiplier = 1.0
    let totalOptionFlat = 0

    if (modelConfig.options) {
      for (const option of modelConfig.options) {
        const optionValue = options[option.optionKey]

        if (optionValue === undefined || optionValue === null) continue

        if (option.modifierType === 'flat') {
          // Flat fee addition
          if (optionValue) { // For boolean options, only apply if true
            totalOptionFlat += option.value
            optionModifiers.push({
              name: option.optionName,
              type: 'flat',
              value: option.value,
              credits: option.value
            })
          }
        } else if (option.modifierType === 'conditional' && option.conditions) {
          // Conditional modifiers
          for (const condition of option.conditions) {
            let matches = false

            if (typeof condition.when === 'function') {
              matches = condition.when(optionValue)
            } else {
              matches = condition.when === optionValue
            }

            if (matches) {
              totalOptionMultiplier *= condition.modifier
              const additionalCredits = Math.round((modelAdjustedCredits * condition.modifier) - modelAdjustedCredits)
              optionModifiers.push({
                name: option.optionName,
                type: 'multiplier',
                value: condition.modifier,
                credits: additionalCredits
              })
              break // Only apply the first matching condition
            }
          }
        }
      }
    }

    // Calculate final totals
    const creditsAfterMultipliers = Math.round(modelAdjustedCredits * totalOptionMultiplier)
    const totalCredits = creditsAfterMultipliers + modelFlatFee + totalOptionFlat

    // Build breakdown
    const breakdown = [
      `Base (${resolutionTier.name}): ${baseCredits} credits`,
      `Model multiplier (${modelConfig.creditMultiplier}x): ${modelAdjustedCredits} credits`,
      ...(modelFlatFee > 0 ? [`Model flat fee: +${modelFlatFee} credits`] : []),
      ...optionModifiers.map(mod =>
        mod.type === 'flat'
          ? `${mod.name}: +${mod.credits} credits`
          : `${mod.name} (${mod.value}x): +${mod.credits} credits`
      ),
      `Total: ${totalCredits} credits`
    ]

    return {
      baseCredits,
      resolutionTier: resolutionTier.name,
      modelMultiplier: modelConfig.creditMultiplier,
      modelFlatFee,
      optionModifiers,
      totalCredits,
      breakdown,
      megapixels
    }
  }

  /**
   * Get available models with their pricing info
   */
  static getAvailableModels() {
    return PRICING_CONFIG.modelConfigs.filter(config => config.enabled)
  }

  /**
   * Get model configuration
   */
  static getModelConfig(modelId: string) {
    return PRICING_CONFIG.modelConfigs.find(config => config.modelId === modelId)
  }

  /**
   * Get resolution tiers
   */
  static getResolutionTiers() {
    return PRICING_CONFIG.resolutionTiers
  }

  /**
   * Update model pricing configuration
   */
  static updateModelPricing(modelId: string, updates: Partial<ModelPricingConfig>) {
    const index = PRICING_CONFIG.modelConfigs.findIndex(config => config.modelId === modelId)
    if (index >= 0) {
      PRICING_CONFIG.modelConfigs[index] = {
        ...PRICING_CONFIG.modelConfigs[index],
        ...updates
      }
      return true
    }
    return false
  }

  /**
   * Update resolution tier
   */
  static updateResolutionTier(tierId: string, updates: Partial<ResolutionTier>) {
    const index = PRICING_CONFIG.resolutionTiers.findIndex(tier => tier.id === tierId)
    if (index >= 0) {
      PRICING_CONFIG.resolutionTiers[index] = {
        ...PRICING_CONFIG.resolutionTiers[index],
        ...updates
      }
      return true
    }
    return false
  }

  /**
   * Add new option modifier to a model
   */
  static addOptionModifier(modelId: string, modifier: OptionPricingModifier) {
    const modelConfig = PRICING_CONFIG.modelConfigs.find(config => config.modelId === modelId)
    if (modelConfig) {
      if (!modelConfig.options) {
        modelConfig.options = []
      }
      modelConfig.options.push(modifier)
      return true
    }
    return false
  }

  /**
   * Remove option modifier from a model
   */
  static removeOptionModifier(modelId: string, optionKey: string) {
    const modelConfig = PRICING_CONFIG.modelConfigs.find(config => config.modelId === modelId)
    if (modelConfig && modelConfig.options) {
      modelConfig.options = modelConfig.options.filter(opt => opt.optionKey !== optionKey)
      return true
    }
    return false
  }

  /**
   * Get pricing preview for different scenarios
   */
  static getPricingPreview(modelId: string, scenarios: Array<{
    name: string
    width: number
    height: number
    options: Record<string, any>
  }>) {
    return scenarios.map(scenario => ({
      ...scenario,
      pricing: this.calculateCredits(scenario.width, scenario.height, modelId, scenario.options)
    }))
  }
}

// Helper function for backward compatibility with existing code
export function calculateCreditsConsumed(width: number, height: number, modelId?: string, options?: Record<string, any>): number {
  if (!modelId) {
    // Fallback to old calculation for backward compatibility
    const megapixels = (width * height) / 1000000
    if (megapixels <= 1) return 60
    if (megapixels <= 2.25) return 120
    if (megapixels <= 4.66) return 360
    return 360
  }

  try {
    const pricing = PricingEngine.calculateCredits(width, height, modelId, options || {})
    return pricing.totalCredits
  } catch (error) {
    console.error('Error calculating credits with pricing engine:', error)
    // Fallback to old calculation
    const megapixels = (width * height) / 1000000
    if (megapixels <= 1) return 60
    if (megapixels <= 2.25) return 120
    if (megapixels <= 4.66) return 360
    return 360
  }
}