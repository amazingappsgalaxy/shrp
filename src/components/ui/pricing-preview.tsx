'use client'

import React, { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModelPricingEngine, type PricingCalculationResult } from '@/lib/model-pricing-config'
import { PricingEngine, type PricingBreakdown } from '@/lib/pricing-engine'
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PricingPreviewProps {
  modelId: string
  width: number
  height: number
  currentSettings: Record<string, any>
  className?: string
}

export function PricingPreview({ modelId, width, height, currentSettings, className }: PricingPreviewProps) {
  const scenarios = useMemo(() => {
    try {
      // Base scenario (no options)
      const baseSettings = {}

      // Try new ModelPricingEngine first
      let basePricing: PricingCalculationResult | PricingBreakdown
      let currentPricing: PricingCalculationResult | PricingBreakdown

      try {
        basePricing = ModelPricingEngine.calculateCredits(width, height, modelId, baseSettings)

        // Current scenario (with current settings)
        currentPricing = ModelPricingEngine.calculateCredits(width, height, modelId, currentSettings)
      } catch (modelPricingError) {
        // Fallback to old pricing engine
        console.warn('ModelPricingEngine failed, using fallback:', modelPricingError)
        basePricing = PricingEngine.calculateCredits(width, height, modelId, baseSettings)
        currentPricing = PricingEngine.calculateCredits(width, height, modelId, currentSettings)
      }

      // Get model config to show option impact
      const modelConfig = PricingEngine.getModelConfig(modelId)
      const optionScenarios: Array<{
        name: string
        pricing: PricingBreakdown
        settings: Record<string, any>
        isExpensive?: boolean
      }> = []

      if (modelConfig?.options) {
        // Create scenarios for expensive options
        modelConfig.options.forEach(option => {
          if (option.conditions) {
            // Find the most expensive condition
            const expensiveCondition = option.conditions.reduce((max, condition) =>
              condition.modifier > max.modifier ? condition : max
            , option.conditions[0])

            if (expensiveCondition && expensiveCondition.modifier > 1) {
              const expensiveSettings = { ...baseSettings }

              // Set the option to trigger the expensive condition
              if (typeof expensiveCondition.when === 'function') {
                // For numeric options, use a high value
                if (option.optionKey === 'steps') expensiveSettings[option.optionKey] = 100
                else if (option.optionKey === 'scale') expensiveSettings[option.optionKey] = 8
                else if (option.optionKey === 'megapixels') expensiveSettings[option.optionKey] = 20
                else if (option.optionKey === 'creativity') expensiveSettings[option.optionKey] = 0.9
                else if (option.optionKey === 'hdr') expensiveSettings[option.optionKey] = 1
              } else {
                expensiveSettings[option.optionKey] = expensiveCondition.when
              }

              try {
                const expensivePricing = PricingEngine.calculateCredits(width, height, modelId, expensiveSettings)
                if (expensivePricing.totalCredits > basePricing.totalCredits) {
                  optionScenarios.push({
                    name: `High ${option.optionName}`,
                    pricing: expensivePricing,
                    settings: expensiveSettings,
                    isExpensive: true
                  })
                }
              } catch (error) {
                console.warn(`Failed to calculate pricing for ${option.optionName}:`, error)
              }
            }
          }

          if (option.modifierType === 'flat' && option.value > 0) {
            const flatSettings = { ...baseSettings, [option.optionKey]: true }
            try {
              const flatPricing = PricingEngine.calculateCredits(width, height, modelId, flatSettings)
              optionScenarios.push({
                name: option.optionName,
                pricing: flatPricing,
                settings: flatSettings
              })
            } catch (error) {
              console.warn(`Failed to calculate pricing for ${option.optionName}:`, error)
            }
          }
        })
      }

      return {
        base: { name: 'Base Cost', pricing: basePricing, settings: baseSettings },
        current: { name: 'Current Settings', pricing: currentPricing, settings: currentSettings },
        options: optionScenarios.slice(0, 3) // Limit to 3 scenarios for UI
      }
    } catch (error) {
      console.error('Failed to calculate pricing scenarios:', error)
      return null
    }
  }, [modelId, width, height, currentSettings])

  if (!scenarios) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-gray-400">
          <Info className="w-5 h-5 mx-auto mb-2" />
          <p className="text-sm">Unable to calculate pricing preview</p>
        </div>
      </Card>
    )
  }

  const getPriceChangeIcon = (current: number, base: number) => {
    if (current > base) return <TrendingUp className="w-3 h-3 text-red-400" />
    if (current < base) return <TrendingDown className="w-3 h-3 text-green-400" />
    return <Minus className="w-3 h-3 text-gray-400" />
  }

  const getPriceChangeColor = (current: number, base: number) => {
    if (current > base) return 'text-red-400'
    if (current < base) return 'text-green-400'
    return 'text-gray-400'
  }

  return (
    <Card className={`p-4 bg-zinc-950/95 backdrop-blur-xl border border-white/10 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-white">Pricing Preview</h3>
        </div>

        {/* Current vs Base */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-gray-800/40 rounded-lg border border-gray-700/50">
            <div>
              <span className="text-sm text-white font-medium">Current Settings</span>
              <div className="flex items-center gap-1 mt-1">
                {getPriceChangeIcon(scenarios.current.pricing.totalCredits, scenarios.base.pricing.totalCredits)}
                <span className={`text-xs ${getPriceChangeColor(scenarios.current.pricing.totalCredits, scenarios.base.pricing.totalCredits)}`}>
                  {scenarios.current.pricing.totalCredits === scenarios.base.pricing.totalCredits
                    ? 'Base cost'
                    : `${scenarios.current.pricing.totalCredits > scenarios.base.pricing.totalCredits ? '+' : ''}${scenarios.current.pricing.totalCredits - scenarios.base.pricing.totalCredits} credits`
                  }
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {scenarios.current.pricing.totalCredits} credits
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg">
            <span className="text-sm text-gray-400">Base cost (no options)</span>
            <span className="text-sm text-gray-300">{scenarios.base.pricing.totalCredits} credits</span>
          </div>
        </div>

        {/* Option Scenarios */}
        {scenarios.options.length > 0 && (
          <div className="space-y-2">
            <hr className="border-gray-700/50" />
            <div className="text-xs text-gray-400 mb-2">Option Impact Examples:</div>
            {scenarios.options.map((scenario, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">{scenario.name}</span>
                  {scenario.isExpensive && (
                    <Badge variant="outline" className="text-xs px-1 py-0 h-4 text-orange-400 border-orange-400/30">
                      High Cost
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {getPriceChangeIcon(scenario.pricing.totalCredits, scenarios.base.pricing.totalCredits)}
                  <span className={`text-xs ${getPriceChangeColor(scenario.pricing.totalCredits, scenarios.base.pricing.totalCredits)}`}>
                    {scenario.pricing.totalCredits} credits
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cost Range */}
        {scenarios.options.length > 0 && (
          <div className="pt-2 border-t border-gray-700/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Cost Range:</span>
              <span className="text-gray-300">
                {Math.min(scenarios.base.pricing.totalCredits, ...scenarios.options.map(s => s.pricing.totalCredits))} - {Math.max(scenarios.base.pricing.totalCredits, ...scenarios.options.map(s => s.pricing.totalCredits))} credits
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}