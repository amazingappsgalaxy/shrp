/**
 * Comprehensive Per-Model Pricing Configuration System
 * Allows granular control over base pricing by input resolution
 * and percentage increments for each model setting
 */

export interface ResolutionBasePricing {
  /** Resolution identifier (e.g., "1000x1000", "1500x1500") */
  resolution: string
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Megapixels (calculated) */
  megapixels: number
  /** Base price in credits for this resolution */
  baseCredits: number
  /** Human-readable description */
  description: string
}

export interface SettingPriceIncrement {
  /** Setting key (must match the model parameter) */
  settingKey: string
  /** Human-readable setting name */
  settingName: string
  /** Increment type */
  incrementType: 'percentage' | 'flat_credits' | 'conditional'
  /** Default increment value (0% for new settings) */
  defaultIncrement: number
  /** Whether this setting increment is enabled */
  enabled: boolean
  /** Default/minimum value for this setting */
  defaultValue: number
  /** Conditions for conditional pricing */
  conditions?: Array<{
    /** Condition function or value to match */
    when: any
    /** Increment value when condition is met */
    increment: number
    /** Description of the condition */
    description: string
  }>
  /** Description of what this setting does */
  description: string
}

export interface ModelPricingConfiguration {
  /** Model identifier */
  modelId: string
  /** Model display name */
  modelName: string
  /** Whether this model is enabled for pricing */
  enabled: boolean
  /** Base pricing by input resolution */
  resolutionPricing: ResolutionBasePricing[]
  /** Price increments for each setting */
  settingIncrements: SettingPriceIncrement[]
  /** Model-wide multiplier (applied after all calculations) */
  globalMultiplier: number
  /** Flat fee added to final calculation */
  flatFee: number
  /** Pricing notes/description */
  description?: string
  /** Last updated timestamp */
  lastUpdated: number
}

export interface PricingCalculationResult {
  /** Input image resolution */
  inputResolution: {
    width: number
    height: number
    megapixels: number
  }
  /** Matched resolution tier */
  resolutionTier: ResolutionBasePricing
  /** Base credits from resolution */
  baseCredits: number
  /** Applied setting increments */
  appliedIncrements: Array<{
    settingKey: string
    settingName: string
    settingValue: any
    incrementType: string
    incrementValue: number
    addedCredits: number
    description: string
  }>
  /** Global multiplier applied */
  globalMultiplier: number
  /** Flat fee added */
  flatFee: number
  /** Final total credits */
  totalCredits: number
  /** Detailed breakdown for display */
  breakdown: string[]
  /** Model used */
  modelId: string
  /** Calculation timestamp */
  calculatedAt: number
}

// Default pricing configurations for each model
export const MODEL_PRICING_CONFIGS: Record<string, ModelPricingConfiguration> = {
  // Skin Editor Model Pricing
  'skin-editor': {
    modelId: 'skin-editor',
    modelName: 'Skin Editor',
    enabled: true,
    globalMultiplier: 1.0,
    flatFee: 0,
    resolutionPricing: [
      {
        resolution: '1024x1024',
        width: 1024,
        height: 1024,
        megapixels: 1,
        baseCredits: 40,
        description: 'Standard HD (1MP)'
      },
      {
        resolution: '2048x2048',
        width: 2048,
        height: 2048,
        megapixels: 4,
        baseCredits: 80,
        description: '4K Ultra HD (4MP)'
      },
      {
        resolution: '4096x4096',
        width: 4096,
        height: 4096,
        megapixels: 16,
        baseCredits: 160,
        description: '8K Master (16MP)'
      }
    ],
    settingIncrements: [
      {
        settingKey: 'megapixels',
        settingName: 'Detail Level',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 4,
        conditions: [
          { when: (val: number) => val <= 4, increment: 0, description: 'Standard Detail' },
          { when: (val: number) => val > 4 && val <= 8, increment: 50, description: '+50% for High Detail' },
          { when: (val: number) => val > 8, increment: 100, description: '+100% for Max Detail' }
        ],
        description: 'Higher detail levels require more processing power'
      },
      {
        settingKey: 'smartUpscale',
        settingName: 'Smart Upscale',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 0,
        conditions: [
          { when: (val: boolean) => val === true, increment: 20, description: '+20% for Smart Upscale' },
          { when: (val: boolean) => val === false, increment: 0, description: 'Standard Upscale' }
        ],
        description: 'Smart Upscale provides better quality but costs more'
      }
    ],
    lastUpdated: Date.now()
  },

  // Smart Upscaler Model Pricing (flat pricing based on output resolution)
  'smart-upscaler': {
    modelId: 'smart-upscaler',
    modelName: 'Smart Upscaler',
    enabled: true,
    globalMultiplier: 1.0,
    flatFee: 0,
    resolutionPricing: [
      {
        resolution: 'Any Input',
        width: 99999,
        height: 99999,
        megapixels: 9999,
        baseCredits: 80,
        description: '4K Output Base (80 credits)'
      }
    ],
    settingIncrements: [
      {
        settingKey: 'resolution',
        settingName: 'Output Resolution',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 0,
        conditions: [
          { when: (val: string) => val === '4k' || !val, increment: 0, description: '4K Output (80 credits)' },
          { when: (val: string) => val === '8k', increment: 40, description: '+40 credits for 8K Output (120 total)' }
        ],
        description: 'Output resolution: 4K (80 credits) or 8K (120 credits)'
      }
    ],
    lastUpdated: Date.now(),
    description: 'Flat pricing based on output resolution. 4K = 80 credits, 8K = 120 credits.'
  }
};

/**
 * Pricing Engine for calculating credits based on per-model configuration
 */
export class ModelPricingEngine {
  // Registry of model configurations
  private static configs: Record<string, ModelPricingConfiguration> = MODEL_PRICING_CONFIGS;
  // Storage key for persisting configurations
  private static STORAGE_KEY = 'model-pricing-configs'

  /**
   * Load configurations from localStorage or use defaults
   */
  private static loadConfigurations(): Record<string, ModelPricingConfiguration> {
    if (typeof window === 'undefined') return MODEL_PRICING_CONFIGS // SSR fallback

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsedConfigs = JSON.parse(stored)
        // Merge with defaults to ensure new fields are present
        const merged = { ...MODEL_PRICING_CONFIGS }
        Object.keys(parsedConfigs).forEach(modelId => {
          if (merged[modelId]) {
            merged[modelId] = { ...merged[modelId], ...parsedConfigs[modelId] }
          }
        })
        return merged
      }
    } catch (error) {
      console.warn('Failed to load stored pricing configurations:', error)
    }

    return MODEL_PRICING_CONFIGS
  }

  /**
   * Save configurations to localStorage
   */
  private static saveConfigurations(configs: Record<string, ModelPricingConfiguration>): void {
    if (typeof window === 'undefined') return // SSR fallback

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs))
    } catch (error) {
      console.warn('Failed to save pricing configurations:', error)
    }
  }

  /**
   * Get current configurations (from storage if available)
   */
  private static getCurrentConfigs(): Record<string, ModelPricingConfiguration> {
    return this.loadConfigurations()
  }

  /**
   * Calculate credits for an image enhancement task
   */
  static calculateCredits(
    width: number,
    height: number,
    modelId: string,
    settings: Record<string, any> = {}
  ): PricingCalculationResult {
    const megapixels = (width * height) / 1000000

    // Get model configuration
    const configs = this.getCurrentConfigs()
    const modelConfig = configs[modelId]
    if (!modelConfig || !modelConfig.enabled) {
      throw new Error(`Model ${modelId} not found or disabled`)
    }

    // Find the appropriate resolution tier
    const resolutionTier = this.findResolutionTier(width, height, modelConfig.resolutionPricing)

    // Start with base credits
    let totalCredits = resolutionTier.baseCredits
    const appliedIncrements: PricingCalculationResult['appliedIncrements'] = []
    const breakdown: string[] = [`Base (${resolutionTier.description}): ${resolutionTier.baseCredits} credits`]

    // Apply setting increments
    for (const settingIncrement of modelConfig.settingIncrements) {
      // Skip if this setting increment is disabled
      if (settingIncrement.enabled === false) {
        continue
      }

      const settingValue = settings[settingIncrement.settingKey]

      if (settingValue === undefined || settingValue === null) {
        continue
      }

      const incrementResult = this.calculateSettingIncrement(
        settingIncrement,
        settingValue,
        totalCredits,
        megapixels
      )

      if (incrementResult.addedCredits !== 0) {
        appliedIncrements.push(incrementResult)
        totalCredits += incrementResult.addedCredits

        const sign = incrementResult.addedCredits > 0 ? '+' : ''
        breakdown.push(
          `${incrementResult.settingName}: ${sign}${incrementResult.addedCredits} credits (${incrementResult.description})`
        )
      }
    }

    // Apply global multiplier
    if (modelConfig.globalMultiplier !== 1.0) {
      const multipliedCredits = Math.round(totalCredits * modelConfig.globalMultiplier)
      const difference = multipliedCredits - totalCredits
      totalCredits = multipliedCredits
      breakdown.push(`Model multiplier (${modelConfig.globalMultiplier}x): ${difference > 0 ? '+' : ''}${difference} credits`)
    }

    // Apply flat fee
    if (modelConfig.flatFee > 0) {
      totalCredits += modelConfig.flatFee
      breakdown.push(`Model flat fee: +${modelConfig.flatFee} credits`)
    }

    breakdown.push(`Total: ${totalCredits} credits`)

    return {
      inputResolution: {
        width,
        height,
        megapixels
      },
      resolutionTier,
      baseCredits: resolutionTier.baseCredits,
      appliedIncrements,
      globalMultiplier: modelConfig.globalMultiplier,
      flatFee: modelConfig.flatFee,
      totalCredits,
      breakdown,
      modelId,
      calculatedAt: Date.now()
    }
  }

  /**
   * Find the appropriate resolution tier for given dimensions
   */
  private static findResolutionTier(
    width: number,
    height: number,
    resolutionPricing: ResolutionBasePricing[]
  ): ResolutionBasePricing {
    const inputMegapixels = (width * height) / 1000000

    // Sort by megapixels ascending
    const sortedTiers = [...resolutionPricing].sort((a, b) => a.megapixels - b.megapixels)

    // Find the first tier that can handle this resolution
    for (const tier of sortedTiers) {
      if (inputMegapixels <= tier.megapixels) {
        return tier
      }
    }

    // If no tier found, use the highest one
    const fallbackTier = sortedTiers[sortedTiers.length - 1]
    if (!fallbackTier) {
      throw new Error('No resolution tiers defined for this model')
    }
    return fallbackTier
  }

  /**
   * Calculate the increment for a specific setting
   */
  private static calculateSettingIncrement(
    settingIncrement: SettingPriceIncrement,
    settingValue: any,
    currentCredits: number,
    megapixels: number
  ): PricingCalculationResult['appliedIncrements'][0] {
    let addedCredits = 0
    let description = settingIncrement.description

    if (settingIncrement.incrementType === 'percentage') {
      // Percentage increment with default value logic
      if (typeof settingValue === 'boolean') {
        // For boolean settings: true above default (false)
        if (settingValue && settingIncrement.defaultValue === 0) {
          addedCredits = Math.round((currentCredits * settingIncrement.defaultIncrement) / 100)
          description = `${settingIncrement.defaultIncrement}% increment (enabled)`
        }
      } else if (typeof settingValue === 'number') {
        // For numeric settings: apply percentage if value > defaultValue
        const stepsAboveDefault = settingValue - settingIncrement.defaultValue
        if (stepsAboveDefault > 0) {
          // For percentage, we can either apply once if above default, or proportionally
          // For now, applying percentage once if above default
          addedCredits = Math.round((currentCredits * settingIncrement.defaultIncrement) / 100)
          description = `${settingIncrement.defaultIncrement}% increment (${settingValue} vs default ${settingIncrement.defaultValue})`
        }
      }
    } else if (settingIncrement.incrementType === 'flat_credits') {
      // Flat credit addition with default value logic
      if (typeof settingValue === 'boolean') {
        // For boolean settings: true above default (false)
        if (settingValue && settingIncrement.defaultValue === 0) {
          addedCredits = settingIncrement.defaultIncrement
          description = `${settingIncrement.defaultIncrement} flat credits (enabled)`
        }
      } else if (typeof settingValue === 'number') {
        // For numeric settings: multiply by steps above defaultValue
        const stepsAboveDefault = settingValue - settingIncrement.defaultValue
        if (stepsAboveDefault > 0) {
          addedCredits = stepsAboveDefault * settingIncrement.defaultIncrement
          description = `${stepsAboveDefault} × ${settingIncrement.defaultIncrement} = ${addedCredits} flat credits (${settingValue} vs default ${settingIncrement.defaultValue})`
        }
      }
    } else if (settingIncrement.incrementType === 'conditional' && settingIncrement.conditions) {
      // Conditional pricing
      for (const condition of settingIncrement.conditions) {
        let matches = false

        if (typeof condition.when === 'function') {
          try {
            matches = condition.when(settingValue, megapixels)
          } catch (error) {
            console.warn(`Error evaluating condition for ${settingIncrement.settingKey}:`, error)
            continue
          }
        } else {
          matches = condition.when === settingValue
        }

        if (matches) {
          addedCredits = Math.round((currentCredits * condition.increment) / 100)
          description = condition.description
          break // Only apply the first matching condition
        }
      }
    }

    return {
      settingKey: settingIncrement.settingKey,
      settingName: settingIncrement.settingName,
      settingValue,
      incrementType: settingIncrement.incrementType,
      incrementValue: settingIncrement.incrementType === 'percentage' ? settingIncrement.defaultIncrement : addedCredits,
      addedCredits,
      description
    }
  }

  /**
   * Get all available models with their pricing info
   */
  static getAvailableModels(): ModelPricingConfiguration[] {
    const configs = this.getCurrentConfigs()
    return Object.values(configs).filter(config => config.enabled)
  }

  /**
   * Get model configuration
   */
  static getModelConfig(modelId: string): ModelPricingConfiguration | undefined {
    const configs = this.getCurrentConfigs()
    return configs[modelId]
  }

  /**
   * Update model pricing configuration
   */
  static updateModelConfig(modelId: string, updates: Partial<ModelPricingConfiguration>): boolean {
    const configs = this.getCurrentConfigs()
    if (configs[modelId]) {
      configs[modelId] = {
        ...configs[modelId],
        ...updates,
        lastUpdated: Date.now()
      }
      this.saveConfigurations(configs)
      return true
    }
    return false
  }

  /**
   * Add new resolution tier to a model
   */
  static addResolutionTier(modelId: string, resolutionTier: ResolutionBasePricing): boolean {
    const configs = this.getCurrentConfigs()
    const config = configs[modelId]
    if (config) {
      config.resolutionPricing.push(resolutionTier)
      config.lastUpdated = Date.now()
      this.saveConfigurations(configs)
      return true
    }
    return false
  }

  /**
   * Update setting increment for a model
   */
  static updateSettingIncrement(
    modelId: string,
    settingKey: string,
    updates: Partial<SettingPriceIncrement>
  ): boolean {
    const configs = this.getCurrentConfigs()
    const config = configs[modelId]
    if (config) {
      const incrementIndex = config.settingIncrements.findIndex(inc => inc.settingKey === settingKey)
      if (incrementIndex >= 0) {
        const currentIncrement = config.settingIncrements[incrementIndex]
        if (!currentIncrement) return false

        config.settingIncrements[incrementIndex] = {
          settingKey: currentIncrement.settingKey,
          settingName: currentIncrement.settingName,
          incrementType: currentIncrement.incrementType,
          defaultIncrement: currentIncrement.defaultIncrement,
          enabled: currentIncrement.enabled ?? true,
          defaultValue: currentIncrement.defaultValue ?? 0,
          description: currentIncrement.description,
          ...updates
        }
        config.lastUpdated = Date.now()
        this.saveConfigurations(configs)
        return true
      }
    }
    return false
  }

  /**
   * Add new setting increment to a model
   */
  static addSettingIncrement(modelId: string, settingIncrement: SettingPriceIncrement): boolean {
    const configs = this.getCurrentConfigs()
    const config = configs[modelId]
    if (config) {
      config.settingIncrements.push(settingIncrement)
      config.lastUpdated = Date.now()
      this.saveConfigurations(configs)
      return true
    }
    return false
  }

  /**
   * Get pricing preview for different scenarios
   */
  static getPricingPreview(
    modelId: string,
    scenarios: Array<{
      name: string
      width: number
      height: number
      settings: Record<string, any>
    }>
  ) {
    return scenarios.map(scenario => ({
      ...scenario,
      pricing: this.calculateCredits(scenario.width, scenario.height, modelId, scenario.settings)
    }))
  }
}

// Helper function for backward compatibility
export function calculateModelCredits(
  width: number,
  height: number,
  modelId: string,
  settings: Record<string, any> = {}
): number {
  try {
    const result = ModelPricingEngine.calculateCredits(width, height, modelId, settings)
    return result.totalCredits
  } catch (error) {
    console.error('Error calculating model credits:', error)
    // Fallback to basic calculation
    const megapixels = (width * height) / 1000000
    if (megapixels <= 1) return 60
    if (megapixels <= 2.25) return 120
    if (megapixels <= 4.66) return 360
    return 500
  }
}
