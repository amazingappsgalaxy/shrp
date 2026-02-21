/**
 * Examples of how to use the new dynamic pricing system
 */

import { PricingEngine } from '@/lib/pricing-engine'

export function demonstratePricingSystem() {
  console.log('=== Dynamic Pricing System Examples ===\n')

  // Example 1: Basic pricing calculation
  console.log('1. Basic Pricing Calculation:')
  const basicPricing = PricingEngine.calculateCredits(
    1920, 1080, // HD image
    'fermatresearch/magic-image-refiner',
    {} // No special options
  )
  console.log(`HD Image with Magic Refiner: ${basicPricing.totalCredits} credits`)
  console.log('Breakdown:', basicPricing.breakdown)
  console.log('')

  // Example 2: Option-based pricing
  console.log('2. Option-Based Pricing:')
  const expensiveOptions = {
    creativity: 0.9, // High creativity (expensive)
    hdr: 1.0,       // Enable HDR
    steps: 100      // High quality (many steps)
  }

  const expensivePricing = PricingEngine.calculateCredits(
    1920, 1080,
    'fermatresearch/magic-image-refiner',
    expensiveOptions
  )
  console.log(`Same image with expensive options: ${expensivePricing.totalCredits} credits`)
  console.log('Option modifiers applied:')
  expensivePricing.optionModifiers.forEach(mod => {
    console.log(`  - ${mod.name}: +${mod.credits} credits (${mod.type})`)
  })
  console.log('')

  // Example 3: Different models comparison
  console.log('3. Model Comparison:')
  const models = ['fermatresearch/magic-image-refiner', 'nightmareai/real-esrgan', 'runninghub-flux-upscaling']

  models.forEach(modelId => {
    try {
      const pricing = PricingEngine.calculateCredits(2160, 2160, modelId, { scale: 4 })
      console.log(`4K image with ${modelId}: ${pricing.totalCredits} credits`)
    } catch (error) {
      console.log(`${modelId}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
  console.log('')

  // Example 4: Resolution tier comparison
  console.log('4. Resolution Impact:')
  const resolutions = [
    { name: 'SD', width: 800, height: 600 },
    { name: 'HD', width: 1920, height: 1080 },
    { name: '4K', width: 3840, height: 2160 },
    { name: 'Ultra', width: 5000, height: 5000 }
  ]

  resolutions.forEach(res => {
    const pricing = PricingEngine.calculateCredits(res.width, res.height, 'fermatresearch/magic-image-refiner', {})
    console.log(`${res.name} (${res.width}x${res.height}): ${pricing.totalCredits} credits (${pricing.resolutionTier})`)
  })
  console.log('')

  // Example 5: Pricing preview for different scenarios
  console.log('5. Pricing Preview:')
  const scenarios = PricingEngine.getPricingPreview('runninghub-flux-upscaling', [
    {
      name: 'Basic Settings',
      width: 1920,
      height: 1080,
      options: {}
    },
    {
      name: 'High Quality',
      width: 1920,
      height: 1080,
      options: { steps: 50, megapixels: 15, enable_myupscaler: true }
    },
    {
      name: 'Ultra High Quality',
      width: 3840,
      height: 2160,
      options: { steps: 50, megapixels: 20, enable_myupscaler: true, enable_upscale: true }
    }
  ])

  scenarios.forEach(scenario => {
    console.log(`${scenario.name}: ${scenario.pricing.totalCredits} credits`)
    console.log(`  Resolution: ${scenario.pricing.resolutionTier} (${scenario.pricing.megapixels.toFixed(2)}MP)`)
    if (scenario.pricing.optionModifiers.length > 0) {
      console.log('  Modifiers:', scenario.pricing.optionModifiers.map(m => `${m.name}: +${m.credits}`).join(', '))
    }
  })
}

// Example of how to customize pricing programmatically
export function customizePricing() {
  console.log('\n=== Customizing Pricing Configuration ===\n')

  // Example 1: Update model multiplier
  console.log('1. Before updating Real-ESRGAN multiplier:')
  const beforePricing = PricingEngine.calculateCredits(1920, 1080, 'nightmareai/real-esrgan', {})
  console.log(`Cost: ${beforePricing.totalCredits} credits`)

  // Update the multiplier to make it more expensive
  PricingEngine.updateModelPricing('nightmareai/real-esrgan', {
    creditMultiplier: 1.5,
    flatFee: 30
  })

  console.log('\n2. After updating Real-ESRGAN multiplier (1.5x + 30 flat fee):')
  const afterPricing = PricingEngine.calculateCredits(1920, 1080, 'nightmareai/real-esrgan', {})
  console.log(`Cost: ${afterPricing.totalCredits} credits`)

  // Example 2: Add new option modifier
  console.log('\n3. Adding new option modifier:')
  PricingEngine.addOptionModifier('fermatresearch/magic-image-refiner', {
    optionKey: 'quality_boost',
    optionName: 'Quality Boost',
    modifierType: 'flat',
    value: 50,
    description: 'Premium quality enhancement adds 50 credits'
  })

  const withNewOption = PricingEngine.calculateCredits(1920, 1080, 'fermatresearch/magic-image-refiner', {
    quality_boost: true
  })
  console.log(`With Quality Boost: ${withNewOption.totalCredits} credits`)
  console.log('Breakdown:', withNewOption.breakdown)

  // Example 3: Update resolution tier
  console.log('\n4. Updating resolution tier:')
  PricingEngine.updateResolutionTier('hd', {
    baseCredits: 150 // Increase HD base cost
  })

  const updatedHDPricing = PricingEngine.calculateCredits(1920, 1080, 'fermatresearch/magic-image-refiner', {})
  console.log(`Updated HD pricing: ${updatedHDPricing.totalCredits} credits`)
}

// Usage examples for the admin interface
export function adminExamples() {
  console.log('\n=== Admin Interface Examples ===\n')

  // Get all available models
  const models = PricingEngine.getAvailableModels()
  console.log('Available Models:')
  models.forEach(model => {
    console.log(`- ${model.name} (${model.modelId})`)
    console.log(`  Multiplier: ${model.creditMultiplier}x, Flat Fee: ${model.flatFee} credits`)
    console.log(`  Options: ${model.options?.length || 0} modifiers`)
  })

  // Get resolution tiers
  const tiers = PricingEngine.getResolutionTiers()
  console.log('\nResolution Tiers:')
  tiers.forEach(tier => {
    console.log(`- ${tier.name}: ${tier.baseCredits} credits (${tier.description})`)
  })

  // Example of testing multiple pricing scenarios
  console.log('\nTesting Scenarios:')
  const testImage = { width: 2000, height: 2000 }
  models.slice(0, 2).forEach(model => {
    try {
      const pricing = PricingEngine.calculateCredits(testImage.width, testImage.height, model.modelId, {})
      console.log(`${model.name}: ${pricing.totalCredits} credits`)
    } catch (error) {
      console.log(`${model.name}: Failed - ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
}

// Run examples if this file is executed directly
if (require.main === module) {
  demonstratePricingSystem()
  customizePricing()
  adminExamples()
}