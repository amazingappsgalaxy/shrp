'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PricingEngine, PRICING_CONFIG, type ModelPricingConfig, type ResolutionTier } from '@/lib/pricing-engine'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Save, RotateCcw, Plus, Trash2, Info, DollarSign, Sliders } from 'lucide-react'
import { toast } from 'sonner'

interface PricingConfigPanelProps {
  className?: string
}

export function PricingConfigPanel({ className }: PricingConfigPanelProps) {
  const [config, setConfig] = useState({
    resolutionTiers: [...PRICING_CONFIG.resolutionTiers],
    modelConfigs: [...PRICING_CONFIG.modelConfigs]
  })
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  useEffect(() => {
    const hasResolutionChanges = JSON.stringify(config.resolutionTiers) !== JSON.stringify(PRICING_CONFIG.resolutionTiers)
    const hasModelChanges = JSON.stringify(config.modelConfigs) !== JSON.stringify(PRICING_CONFIG.modelConfigs)
    setHasChanges(hasResolutionChanges || hasModelChanges)
  }, [config])

  // Update resolution tier
  const updateResolutionTier = (index: number, updates: Partial<ResolutionTier>) => {
    const newTiers = [...config.resolutionTiers]
    newTiers[index] = { ...newTiers[index], ...updates }
    setConfig({ ...config, resolutionTiers: newTiers })
  }

  // Update model config
  const updateModelConfig = (modelId: string, updates: Partial<ModelPricingConfig>) => {
    const newConfigs = config.modelConfigs.map(model =>
      model.modelId === modelId ? { ...model, ...updates } : model
    )
    setConfig({ ...config, modelConfigs: newConfigs })
  }

  // Save configuration
  const saveConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/pricing-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })

      if (!response.ok) throw new Error('Failed to save configuration')

      // Update local pricing engine
      config.resolutionTiers.forEach((tier, index) => {
        if (index < PRICING_CONFIG.resolutionTiers.length) {
          PricingEngine.updateResolutionTier(tier.id, tier)
        }
      })

      config.modelConfigs.forEach(modelConfig => {
        PricingEngine.updateModelPricing(modelConfig.modelId, modelConfig)
      })

      toast.success('Pricing configuration saved successfully!')
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save pricing configuration:', error)
      toast.error('Failed to save pricing configuration')
    }
  }

  // Reset configuration
  const resetConfiguration = () => {
    setConfig({
      resolutionTiers: [...PRICING_CONFIG.resolutionTiers],
      modelConfigs: [...PRICING_CONFIG.modelConfigs]
    })
    setHasChanges(false)
    toast.success('Configuration reset to defaults')
  }

  // Test pricing calculation
  const testPricing = (modelId: string) => {
    try {
      const testScenarios = [
        { name: '1MP Image', width: 1000, height: 1000 },
        { name: '2MP Image', width: 1500, height: 1333 },
        { name: '4K Image', width: 2160, height: 2160 }
      ]

      const results = testScenarios.map(scenario => {
        const pricing = PricingEngine.calculateCredits(scenario.width, scenario.height, modelId, {})
        return `${scenario.name}: ${pricing.totalCredits} credits`
      }).join('\n')

      toast.success(`Test Results for ${modelId}:\n${results}`, { duration: 5000 })
    } catch (error) {
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-white">Pricing Configuration</h2>
              <p className="text-sm text-gray-400">Manage resolution tiers and model pricing</p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                Unsaved Changes
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetConfiguration}
              disabled={!hasChanges}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={saveConfiguration}
              disabled={!hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>

        <Tabs defaultValue="tiers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tiers">Resolution Tiers</TabsTrigger>
            <TabsTrigger value="models">Model Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="tiers" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Info className="w-4 h-4" />
                <span>Configure base credit costs for different image resolutions</span>
              </div>

              <div className="grid gap-4">
                {config.resolutionTiers.map((tier, index) => (
                  <Card key={tier.id} className="p-4 bg-gray-800/40">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm text-white">Tier Name</Label>
                        <Input
                          value={tier.name}
                          onChange={(e) => updateResolutionTier(index, { name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-white">Max Megapixels</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={tier.maxMegapixels === Infinity ? '' : tier.maxMegapixels}
                          onChange={(e) => updateResolutionTier(index, {
                            maxMegapixels: e.target.value === '' ? Infinity : parseFloat(e.target.value)
                          })}
                          placeholder="Leave empty for unlimited"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-white">Base Credits</Label>
                        <Input
                          type="number"
                          value={tier.baseCredits}
                          onChange={(e) => updateResolutionTier(index, {
                            baseCredits: parseInt(e.target.value) || 0
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-white">Description</Label>
                        <Input
                          value={tier.description}
                          onChange={(e) => updateResolutionTier(index, { description: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Sliders className="w-4 h-4" />
                <span>Configure model-specific pricing multipliers and fees</span>
              </div>

              <div className="grid gap-4">
                {config.modelConfigs.map((model, index) => (
                  <Card key={model.modelId} className="p-4 bg-gray-800/40">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white">{model.name}</h3>
                          <p className="text-sm text-gray-400">{model.modelId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={model.enabled}
                            onCheckedChange={(enabled) => updateModelConfig(model.modelId, { enabled })}
                          />
                          <Label className="text-sm text-white">Enabled</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testPricing(model.modelId)}
                          >
                            Test
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm text-white">Credit Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={model.creditMultiplier}
                            onChange={(e) => updateModelConfig(model.modelId, {
                              creditMultiplier: parseFloat(e.target.value) || 1
                            })}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Multiplies base credits (1.0 = no change)
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-white">Flat Fee (Credits)</Label>
                          <Input
                            type="number"
                            value={model.flatFee}
                            onChange={(e) => updateModelConfig(model.modelId, {
                              flatFee: parseInt(e.target.value) || 0
                            })}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Fixed cost added per enhancement
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-white">Description</Label>
                          <Input
                            value={model.description || ''}
                            onChange={(e) => updateModelConfig(model.modelId, {
                              description: e.target.value
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {model.options && model.options.length > 0 && (
                        <div className="pt-4 border-t border-gray-700">
                          <h4 className="text-sm font-medium text-white mb-2">Option Modifiers</h4>
                          <div className="grid gap-2 text-xs">
                            {model.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                                <span className="text-gray-300">{option.optionName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {option.modifierType}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Pricing Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Pricing Preview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {config.resolutionTiers.map((tier) => (
            <div key={tier.id} className="p-3 bg-gray-800/40 rounded-lg">
              <h4 className="text-sm font-medium text-white">{tier.name}</h4>
              <p className="text-xs text-gray-400 mb-2">{tier.description}</p>
              <div className="text-lg font-bold text-green-400">{tier.baseCredits} credits</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}