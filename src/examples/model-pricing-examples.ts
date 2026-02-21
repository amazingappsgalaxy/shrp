/**
 * Examples demonstrating the new Model Pricing Configuration System
 * Shows how to calculate credits for different scenarios with RunningHub FLUX Upscaling
 */

import { ModelPricingEngine } from '@/lib/model-pricing-config'

// Example 1: Basic 1000x1000 image with minimal settings
console.log('=== Example 1: Basic 1000x1000 Image ===')
const basicExample = ModelPricingEngine.calculateCredits(
  1000, 1000,
  'runninghub-flux-upscaling',
  {
    steps: 10,
    enable_upscale: true,
    enable_myupscaler: false
  }
)
console.log('Basic calculation:', basicExample.totalCredits, 'credits')
console.log('Breakdown:', basicExample.breakdown)

// Example 2: Same image but with MyUpscaler enabled (+35%)
console.log('\n=== Example 2: With MyUpscaler Enabled (+35%) ===')
const myUpscalerExample = ModelPricingEngine.calculateCredits(
  1000, 1000,
  'runninghub-flux-upscaling',
  {
    steps: 10,
    enable_upscale: true,
    enable_myupscaler: true  // This should add 35%
  }
)
console.log('With MyUpscaler:', myUpscalerExample.totalCredits, 'credits')
console.log('Breakdown:', myUpscalerExample.breakdown)

// Example 3: Higher target megapixels (+10% per increment)
console.log('\n=== Example 3: Higher Target Megapixels ===')
const megapixelsExample = ModelPricingEngine.calculateCredits(
  1000, 1000,
  'runninghub-flux-upscaling',
  {
    steps: 10,
    enable_upscale: true,
    enable_myupscaler: false,
    megapixels: 8.0  // Higher than base, should trigger +10%
  }
)
console.log('Higher megapixels:', megapixelsExample.totalCredits, 'credits')
console.log('Breakdown:', megapixelsExample.breakdown)

// Example 4: More steps (+2% increase)
console.log('\n=== Example 4: More Processing Steps ===')
const stepsExample = ModelPricingEngine.calculateCredits(
  1000, 1000,
  'runninghub-flux-upscaling',
  {
    steps: 25,  // Higher than 20, should trigger +5%
    enable_upscale: true,
    enable_myupscaler: false
  }
)
console.log('More steps:', stepsExample.totalCredits, 'credits')
console.log('Breakdown:', stepsExample.breakdown)

// Example 5: All modifiers combined
console.log('\n=== Example 5: All Modifiers Combined ===')
const combinedExample = ModelPricingEngine.calculateCredits(
  1000, 1000,
  'runninghub-flux-upscaling',
  {
    steps: 35,              // +10% for steps > 30
    enable_upscale: true,
    enable_myupscaler: true, // +35%
    megapixels: 12.0,       // +30% for megapixels > base + 5
    guidance_scale: 12.0,   // +15% for guidance > 10
    denoise: 0.9           // +20% for denoise > 0.8
  }
)
console.log('All modifiers:', combinedExample.totalCredits, 'credits')
console.log('Breakdown:', combinedExample.breakdown)

// Example 6: Higher resolution base pricing (2000x2000 = 4MP)
console.log('\n=== Example 6: Higher Resolution (2000x2000) ===')
const highResExample = ModelPricingEngine.calculateCredits(
  2000, 2000,
  'runninghub-flux-upscaling',
  {
    steps: 10,
    enable_upscale: true,
    enable_myupscaler: false
  }
)
console.log('High resolution:', highResExample.totalCredits, 'credits')
console.log('Resolution tier:', highResExample.resolutionTier.description)
console.log('Breakdown:', highResExample.breakdown)

// Example 7: Disabled upscaling (-30% discount)
console.log('\n=== Example 7: Upscaling Disabled (-30%) ===')
const noUpscaleExample = ModelPricingEngine.calculateCredits(
  1000, 1000,
  'runninghub-flux-upscaling',
  {
    steps: 10,
    enable_upscale: false,  // Should provide 30% discount
    enable_myupscaler: false
  }
)
console.log('No upscaling:', noUpscaleExample.totalCredits, 'credits')
console.log('Breakdown:', noUpscaleExample.breakdown)

// Example 8: Pricing preview for different scenarios
console.log('\n=== Example 8: Pricing Preview for Multiple Scenarios ===')
const scenarios = [
  {
    name: 'Small Image - Basic',
    width: 500,
    height: 500,
    settings: { steps: 10, enable_upscale: true, enable_myupscaler: false }
  },
  {
    name: 'Standard Image - With MyUpscaler',
    width: 1000,
    height: 1000,
    settings: { steps: 10, enable_upscale: true, enable_myupscaler: true }
  },
  {
    name: 'Large Image - All Features',
    width: 2000,
    height: 2000,
    settings: {
      steps: 30,
      enable_upscale: true,
      enable_myupscaler: true,
      megapixels: 10.0,
      guidance_scale: 8.0,
      denoise: 0.6
    }
  },
  {
    name: 'Ultra High Res - Conservative Settings',
    width: 3000,
    height: 3000,
    settings: { steps: 15, enable_upscale: true, enable_myupscaler: false }
  }
]

const preview = ModelPricingEngine.getPricingPreview('runninghub-flux-upscaling', scenarios)
preview.forEach(scenario => {
  console.log(`${scenario.name}: ${scenario.pricing.totalCredits} credits`)
  console.log(`  Resolution: ${scenario.pricing.resolutionTier.description}`)
  console.log(`  Applied increments: ${scenario.pricing.appliedIncrements.length}`)
})

// Export examples for use in tests
export const pricingExamples = {
  basicExample,
  myUpscalerExample,
  megapixelsExample,
  stepsExample,
  combinedExample,
  highResExample,
  noUpscaleExample,
  scenarios,
  preview
}

export function runPricingExamples() {
  console.log('Running all pricing examples...')

  // This can be called from the browser console or in tests
  return {
    basic: basicExample.totalCredits,
    withMyUpscaler: myUpscalerExample.totalCredits,
    withHigherMegapixels: megapixelsExample.totalCredits,
    withMoreSteps: stepsExample.totalCredits,
    allModifiers: combinedExample.totalCredits,
    highResolution: highResExample.totalCredits,
    noUpscaling: noUpscaleExample.totalCredits
  }
}

// Comparison with old pricing system
export function compareWithOldPricing() {
  console.log('\n=== Comparison with Old Pricing System ===')

  // Old system would use simple resolution-based pricing
  const oldPricing = {
    '1000x1000': 120,  // 1MP = 120 credits
    '2000x2000': 360   // 4MP = 360 credits
  }

  console.log('Old System (1000x1000):', oldPricing['1000x1000'], 'credits')
  console.log('New System (1000x1000, basic):', basicExample.totalCredits, 'credits')
  console.log('New System (1000x1000, with MyUpscaler):', myUpscalerExample.totalCredits, 'credits')

  console.log('\nOld System (2000x2000):', oldPricing['2000x2000'], 'credits')
  console.log('New System (2000x2000, basic):', highResExample.totalCredits, 'credits')

  return {
    oldSystem: oldPricing,
    newSystemBasic: {
      '1000x1000': basicExample.totalCredits,
      '2000x2000': highResExample.totalCredits
    },
    newSystemAdvanced: {
      '1000x1000': myUpscalerExample.totalCredits,
      '2000x2000': combinedExample.totalCredits
    }
  }
}