'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
// Using divider instead of separator and simple alert styling
import { PlusCircle, Trash2, Save, RefreshCw, DollarSign, Settings, Target } from 'lucide-react'
import {
  ModelPricingConfiguration,
  ResolutionBasePricing,
  SettingPriceIncrement,
  ModelPricingEngine,
  PricingCalculationResult
} from '@/lib/model-pricing-config'

interface ModelPricingManagerProps {
  onConfigUpdate?: (modelId: string, config: ModelPricingConfiguration) => void
}

export default function ModelPricingManager({ onConfigUpdate }: ModelPricingManagerProps) {
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [modelConfigs, setModelConfigs] = useState<ModelPricingConfiguration[]>([])
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [pricingPreview, setPricingPreview] = useState<PricingCalculationResult | null>(null)

  // Preview settings for testing - dynamically based on selected model
  const [previewSettings, setPreviewSettings] = useState<Record<string, any>>({
    width: 1000,
    height: 1000,
  })

  // Get selected config
  const selectedConfig = modelConfigs.find(c => c.modelId === selectedModel)

  // Initialize preview settings based on selected model
  useEffect(() => {
    if (selectedConfig && selectedConfig.settingIncrements.length > 0) {
      // Reset all settings to defaults when model changes
      const initialSettings: Record<string, any> = {
        width: 1000,
        height: 1000,
      }

      // Add default values for all setting increments from the new model
      selectedConfig.settingIncrements.forEach(increment => {
        initialSettings[increment.settingKey] = increment.defaultValue ?? 0
      })

      setPreviewSettings(initialSettings)
    } else if (selectedConfig) {
      // If no setting increments, just set basic width/height
      setPreviewSettings({
        width: 1000,
        height: 1000,
      })
    }
  }, [selectedModel])

  useEffect(() => {
    loadModelConfigs()
  }, [])

  useEffect(() => {
    if (selectedModel) {
      generatePricingPreview()
    }
  }, [selectedModel, previewSettings])

  const loadModelConfigs = () => {
    setLoading(true)
    try {
      const configs = ModelPricingEngine.getAvailableModels()
      setModelConfigs(configs)
      if (configs.length > 0 && !selectedModel && configs[0]) {
        setSelectedModel(configs[0].modelId)
      }
    } catch (error) {
      console.error('Error loading model configs:', error)
      setSaveStatus({ type: 'error', message: 'Failed to load model configurations' })
    } finally {
      setLoading(false)
    }
  }

  const generatePricingPreview = () => {
    if (!selectedModel || !selectedConfig) return

    try {
      const result = ModelPricingEngine.calculateCredits(
        previewSettings.width,
        previewSettings.height,
        selectedModel,
        previewSettings
      )
      setPricingPreview(result)
    } catch (error) {
      console.error('Error generating pricing preview:', error)
      setPricingPreview(null)
    }
  }

  const saveModelConfig = async (config: ModelPricingConfiguration) => {
    setLoading(true)
    setSaveStatus({ type: null, message: '' })

    try {
      // Update local state
      const success = ModelPricingEngine.updateModelConfig(config.modelId, config)

      if (success) {
        // Update the configs list
        setModelConfigs(prev =>
          prev.map(c => c.modelId === config.modelId ? config : c)
        )

        setSaveStatus({ type: 'success', message: 'Model pricing configuration saved successfully!' })

        if (onConfigUpdate) {
          onConfigUpdate(config.modelId, config)
        }

        // Regenerate preview
        generatePricingPreview()
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to save configuration' })
      }
    } catch (error) {
      console.error('Error saving model config:', error)
      setSaveStatus({ type: 'error', message: 'Failed to save configuration' })
    } finally {
      setLoading(false)
    }
  }

  const updateResolutionPricing = (index: number, updates: Partial<ResolutionBasePricing>) => {
    if (!selectedConfig) return

    const updatedConfig = {
      ...selectedConfig,
      resolutionPricing: selectedConfig.resolutionPricing.map((rp, i) =>
        i === index ? { ...rp, ...updates, megapixels: (updates.width || rp.width) * (updates.height || rp.height) / 1000000 } : rp
      )
    }
    saveModelConfig(updatedConfig)
  }

  const addResolutionTier = () => {
    if (!selectedConfig) return

    const newTier: ResolutionBasePricing = {
      resolution: '1000x1000',
      width: 1000,
      height: 1000,
      megapixels: 1.0,
      baseCredits: 100,
      description: 'New Resolution Tier'
    }

    const updatedConfig = {
      ...selectedConfig,
      resolutionPricing: [...selectedConfig.resolutionPricing, newTier]
    }
    saveModelConfig(updatedConfig)
  }

  const removeResolutionTier = (index: number) => {
    if (!selectedConfig) return

    const updatedConfig = {
      ...selectedConfig,
      resolutionPricing: selectedConfig.resolutionPricing.filter((_, i) => i !== index)
    }
    saveModelConfig(updatedConfig)
  }

  const updateSettingIncrement = (index: number, updates: Partial<SettingPriceIncrement>) => {
    if (!selectedConfig) return

    const updatedConfig = {
      ...selectedConfig,
      settingIncrements: selectedConfig.settingIncrements.map((si, i) =>
        i === index ? { ...si, ...updates } : si
      )
    }
    saveModelConfig(updatedConfig)
  }

  const addSettingIncrement = () => {
    if (!selectedConfig) return

    const newIncrement: SettingPriceIncrement = {
      settingKey: 'new_setting',
      settingName: 'New Setting',
      incrementType: 'percentage',
      defaultIncrement: 0,
      enabled: true,
      defaultValue: 0,
      description: 'New setting increment'
    }

    const updatedConfig = {
      ...selectedConfig,
      settingIncrements: [...selectedConfig.settingIncrements, newIncrement]
    }
    saveModelConfig(updatedConfig)
  }

  const removeSettingIncrement = (index: number) => {
    if (!selectedConfig) return

    const updatedConfig = {
      ...selectedConfig,
      settingIncrements: selectedConfig.settingIncrements.filter((_, i) => i !== index)
    }
    saveModelConfig(updatedConfig)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Model Pricing Manager</h2>
          <p className="text-muted-foreground">
            Configure granular pricing for each AI model with resolution-based base pricing and setting increments
          </p>
        </div>
        <Button onClick={loadModelConfigs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {saveStatus.type && (
        <div className={`p-4 rounded-lg border ${saveStatus.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
          <div className={`text-sm ${saveStatus.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>
            {saveStatus.message}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Select Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {modelConfigs.map((config) => (
                  <SelectItem key={config.modelId} value={config.modelId}>
                    <div className="flex items-center justify-between w-full">
                      <span>{config.modelName}</span>
                      {config.enabled ? (
                        <Badge variant="default" className="ml-2">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-2">Disabled</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedConfig && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Label>Global Multiplier:</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5.0"
                    value={selectedConfig.globalMultiplier}
                    onChange={(e) => saveModelConfig({
                      ...selectedConfig,
                      globalMultiplier: parseFloat(e.target.value) || 1.0
                    })}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label>Flat Fee:</Label>
                  <Input
                    type="number"
                    min="0"
                    value={selectedConfig.flatFee}
                    onChange={(e) => saveModelConfig({
                      ...selectedConfig,
                      flatFee: parseInt(e.target.value) || 0
                    })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">credits</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Live Preview
            </CardTitle>
            <CardDescription>
              Test pricing calculations with different settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedConfig ? (
              <div className="space-y-3">
                {/* Image dimensions */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={previewSettings.width}
                      onChange={(e) => setPreviewSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 1000 }))}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      value={previewSettings.height}
                      onChange={(e) => setPreviewSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 1000 }))}
                      className="h-8"
                    />
                  </div>
                </div>

                {/* Dynamic settings based on selected model */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedConfig.settingIncrements
                    .filter(increment => increment.enabled !== false)
                    .map((increment) => (
                    <div key={increment.settingKey} className="space-y-1">
                      <Label className="text-xs font-medium">{increment.settingName}</Label>
                      {increment.settingKey.includes('enable') || increment.settingKey === 'smartUpscale' || typeof increment.defaultValue === 'boolean' ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={Boolean(previewSettings[increment.settingKey])}
                            onCheckedChange={(checked) => setPreviewSettings(prev => ({
                              ...prev,
                              [increment.settingKey]: checked
                            }))}
                          />
                          <span className="text-xs text-muted-foreground">
                            {increment.incrementType === 'percentage' && increment.defaultIncrement > 0
                              ? `(+${increment.defaultIncrement}%)`
                              : increment.incrementType === 'flat_credits' && increment.defaultIncrement > 0
                              ? `(+${increment.defaultIncrement} credits)`
                              : ''}
                          </span>
                        </div>
                      ) : (
                        <Input
                          type="number"
                          step={increment.settingKey.includes('scale') || increment.settingKey.includes('denoise') ? "0.1" : "1"}
                          value={previewSettings[increment.settingKey] ?? increment.defaultValue}
                          onChange={(e) => setPreviewSettings(prev => ({
                            ...prev,
                            [increment.settingKey]: parseFloat(e.target.value) || increment.defaultValue
                          }))}
                          className="h-8"
                        />
                      )}
                      <div className="text-xs text-muted-foreground">
                        Default: {increment.defaultValue} |
                        {increment.incrementType === 'percentage' ? ` ${increment.defaultIncrement}% per unit` :
                         increment.incrementType === 'flat_credits' ? ` ${increment.defaultIncrement} credits per unit` :
                         ' Conditional pricing'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Results */}
                {pricingPreview && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="text-xl font-bold text-green-600 mb-2">
                      {pricingPreview.totalCredits} credits
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="font-medium text-foreground">Pricing Breakdown:</div>
                      {pricingPreview.breakdown.map((line, i) => (
                        <div key={i} className="text-xs text-muted-foreground">{line}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select a model to see pricing preview
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Info */}
        {selectedConfig && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedConfig.modelName}</CardTitle>
              <CardDescription>{selectedConfig.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>Resolution Tiers: {selectedConfig.resolutionPricing.length}</div>
                <div>Setting Increments: {selectedConfig.settingIncrements.length}</div>
                <div>Last Updated: {new Date(selectedConfig.lastUpdated).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedConfig && (
        <Tabs defaultValue="resolution" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resolution">Resolution Pricing</TabsTrigger>
            <TabsTrigger value="settings">Setting Increments</TabsTrigger>
          </TabsList>

          <TabsContent value="resolution" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Base Pricing by Input Resolution</h3>
              <Button onClick={addResolutionTier} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Resolution Tier
              </Button>
            </div>

            <div className="grid gap-4">
              {selectedConfig?.resolutionPricing?.map((rp, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                      <div>
                        <Label>Width</Label>
                        <Input
                          type="number"
                          value={rp.width}
                          onChange={(e) => updateResolutionPricing(index, { width: parseInt(e.target.value) || rp.width })}
                        />
                      </div>
                      <div>
                        <Label>Height</Label>
                        <Input
                          type="number"
                          value={rp.height}
                          onChange={(e) => updateResolutionPricing(index, { height: parseInt(e.target.value) || rp.height })}
                        />
                      </div>
                      <div>
                        <Label>Base Credits</Label>
                        <Input
                          type="number"
                          value={rp.baseCredits}
                          onChange={(e) => updateResolutionPricing(index, { baseCredits: parseInt(e.target.value) || rp.baseCredits })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={rp.description}
                          onChange={(e) => updateResolutionPricing(index, { description: e.target.value })}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeResolutionTier(index)}
                          disabled={selectedConfig.resolutionPricing.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {rp.megapixels.toFixed(2)} MP • {rp.resolution}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Setting Price Increments</h3>
              <Button onClick={addSettingIncrement} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Setting Increment
              </Button>
            </div>

            <div className="grid gap-4">
              {selectedConfig?.settingIncrements?.map((si, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                      <div>
                        <Label>Setting Key</Label>
                        <Input
                          value={si.settingKey}
                          onChange={(e) => updateSettingIncrement(index, { settingKey: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Setting Name</Label>
                        <Input
                          value={si.settingName}
                          onChange={(e) => updateSettingIncrement(index, { settingName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={si.incrementType}
                          onValueChange={(value) => updateSettingIncrement(index, { incrementType: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="flat_credits">Flat Credits</SelectItem>
                            <SelectItem value="conditional">Conditional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Default Increment</Label>
                        <Input
                          type="number"
                          value={si.defaultIncrement}
                          onChange={(e) => updateSettingIncrement(index, { defaultIncrement: parseFloat(e.target.value) || 0 })}
                        />
                        <div className="text-xs text-muted-foreground">
                          {si.incrementType === 'percentage' ? '%' : 'credits'}
                        </div>
                      </div>
                      <div>
                        <Label>Default Value</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={si.defaultValue ?? 0}
                          onChange={(e) => updateSettingIncrement(index, { defaultValue: parseFloat(e.target.value) || 0 })}
                        />
                        <div className="text-xs text-muted-foreground">
                          No charge if ≤ this value
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <Label>Enabled</Label>
                        <Switch
                          checked={si.enabled ?? true}
                          onCheckedChange={(checked) => updateSettingIncrement(index, { enabled: checked })}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSettingIncrement(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Description</Label>
                      <Input
                        value={si.description}
                        onChange={(e) => updateSettingIncrement(index, { description: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
