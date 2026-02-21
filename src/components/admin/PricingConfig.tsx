'use client'

import { useState, useEffect } from 'react'

interface ResolutionTier {
  id: string
  name: string
  maxMegapixels: number
  baseCost: number
  enabled: boolean
}

interface ModelConfig {
  id: string
  modelId: string
  name: string
  multiplier: number
  flatFee: number
  enabled: boolean
}

interface OptionModifier {
  id: string
  optionName: string
  modifierType: 'multiplier' | 'flat_fee' | 'percentage'
  value: number
  enabled: boolean
}

interface PricingConfig {
  resolutionTiers: ResolutionTier[]
  modelConfigs: ModelConfig[]
  optionModifiers: OptionModifier[]
  globalSettings: {
    minimumCost: number
    maximumCost: number
    defaultModel: string
    currency: string
  }
}

interface PricingConfigProps {
  onClose: () => void
}

export default function PricingConfig({ onClose }: PricingConfigProps) {
  const [config, setConfig] = useState<PricingConfig>({
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
      { id: '4', modelId: 'swinir', name: 'SwinIR', multiplier: 1.5, flatFee: 2, enabled: true }
    ],
    optionModifiers: [
      { id: '1', optionName: 'face_enhance', modifierType: 'flat_fee', value: 2, enabled: true },
      { id: '2', optionName: 'noise_reduction', modifierType: 'multiplier', value: 1.3, enabled: true },
      { id: '3', optionName: 'color_correction', modifierType: 'flat_fee', value: 1, enabled: true },
      { id: '4', optionName: 'hdr_enhancement', modifierType: 'multiplier', value: 1.8, enabled: true }
    ],
    globalSettings: {
      minimumCost: 1,
      maximumCost: 50,
      defaultModel: 'esrgan',
      currency: 'USD'
    }
  })

  const [activeTab, setActiveTab] = useState('tiers')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Load current config from API
  useEffect(() => {
    loadPricingConfig()
  }, [])

  const loadPricingConfig = async () => {
    try {
      const response = await fetch('/api/admin/pricing/config', {
        headers: {
          'X-Admin-Email': sessionStorage.getItem('adminEmail') || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to load pricing config:', error)
    }
  }

  const savePricingConfig = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch('/api/admin/pricing/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Email': sessionStorage.getItem('adminEmail') || ''
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setSaveMessage('✅ Pricing configuration saved successfully!')
      } else {
        setSaveMessage('❌ Failed to save pricing configuration')
      }
    } catch (error) {
      console.error('Failed to save pricing config:', error)
      setSaveMessage('❌ Error saving pricing configuration')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const calculatePreview = (width: number, height: number, modelId: string) => {
    const megapixels = (width * height) / 1000000
    const tier = config.resolutionTiers.find(t => t.enabled && megapixels <= t.maxMegapixels)
    const model = config.modelConfigs.find(m => m.enabled && m.modelId === modelId)

    if (!tier || !model) return 0

    let cost = tier.baseCost * model.multiplier + model.flatFee

    // Apply option modifiers (example calculation)
    config.optionModifiers.forEach(modifier => {
      if (modifier.enabled) {
        if (modifier.modifierType === 'multiplier') {
          cost *= modifier.value
        } else if (modifier.modifierType === 'flat_fee') {
          cost += modifier.value
        } else if (modifier.modifierType === 'percentage') {
          cost *= (1 + modifier.value / 100)
        }
      }
    })

    return Math.max(config.globalSettings.minimumCost,
           Math.min(config.globalSettings.maximumCost, Math.round(cost)))
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        minWidth: '800px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Pricing Configuration</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '0.375rem',
            backgroundColor: saveMessage.includes('✅') ? '#dcfce7' : '#fee2e2',
            color: saveMessage.includes('✅') ? '#166534' : '#dc2626',
            border: `1px solid ${saveMessage.includes('✅') ? '#bbf7d0' : '#fecaca'}`
          }}>
            {saveMessage}
          </div>
        )}

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          {[
            { id: 'tiers', name: 'Resolution Tiers' },
            { id: 'models', name: 'Model Configs' },
            { id: 'options', name: 'Option Modifiers' },
            { id: 'global', name: 'Global Settings' },
            { id: 'preview', name: 'Pricing Preview' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Resolution Tiers Tab */}
        {activeTab === 'tiers' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Resolution Pricing Tiers
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {config.resolutionTiers.map((tier, index) => (
                <div key={tier.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px', gap: '1rem', alignItems: 'center' }}>
                    <div>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.resolutionTiers[index]) {
                            newConfig.resolutionTiers[index].name = e.target.value
                          }
                          setConfig(newConfig)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280' }}>Max MP:</label>
                      <input
                        type="number"
                        value={tier.maxMegapixels}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.resolutionTiers[index]) {
                            newConfig.resolutionTiers[index].maxMegapixels = parseFloat(e.target.value)
                          }
                          setConfig(newConfig)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280' }}>Base Cost:</label>
                      <input
                        type="number"
                        value={tier.baseCost}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.resolutionTiers[index]) {
                            newConfig.resolutionTiers[index].baseCost = parseFloat(e.target.value)
                          }
                          setConfig(newConfig)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={tier.enabled}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.resolutionTiers[index]) {
                            newConfig.resolutionTiers[index].enabled = e.target.checked
                          }
                          setConfig(newConfig)
                        }}
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Configs Tab */}
        {activeTab === 'models' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              AI Model Configurations
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {config.modelConfigs.map((model, index) => (
                <div key={model.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 80px', gap: '1rem', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280' }}>Model Name:</label>
                      <input
                        type="text"
                        value={model.name}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.modelConfigs[index]) {
                            newConfig.modelConfigs[index].name = e.target.value
                          }
                          setConfig(newConfig)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280' }}>Model ID:</label>
                      <input
                        type="text"
                        value={model.modelId}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.modelConfigs[index]) {
                            newConfig.modelConfigs[index].modelId = e.target.value
                          }
                          setConfig(newConfig)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280' }}>Multiplier:</label>
                      <input
                        type="number"
                        step="0.1"
                        value={model.multiplier}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.modelConfigs[index]) {
                            newConfig.modelConfigs[index].multiplier = parseFloat(e.target.value)
                          }
                          setConfig(newConfig)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280' }}>Flat Fee:</label>
                      <input
                        type="number"
                        value={model.flatFee}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.modelConfigs[index]) {
                            newConfig.modelConfigs[index].flatFee = parseFloat(e.target.value)
                          }
                          setConfig(newConfig)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={model.enabled}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.modelConfigs[index]) {
                            newConfig.modelConfigs[index].enabled = e.target.checked
                          }
                          setConfig(newConfig)
                        }}
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Option Modifiers Tab */}
        {activeTab === 'options' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Enhancement Option Modifiers
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {config.optionModifiers.map((option, index) => (
                <div key={option.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 100px 80px', gap: '1rem', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280' }}>Option Name:</label>
                      <input
                        type="text"
                        value={option.optionName}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.optionModifiers[index]) {
                            newConfig.optionModifiers[index].optionName = e.target.value
                          }
                          setConfig(newConfig)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280' }}>Type:</label>
                      <select
                        value={option.modifierType}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.optionModifiers[index]) {
                            newConfig.optionModifiers[index].modifierType = e.target.value as 'multiplier' | 'flat_fee' | 'percentage'
                          }
                          setConfig(newConfig)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="multiplier">Multiplier</option>
                        <option value="flat_fee">Flat Fee</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280' }}>Value:</label>
                      <input
                        type="number"
                        step="0.1"
                        value={option.value}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.optionModifiers[index]) {
                            newConfig.optionModifiers[index].value = parseFloat(e.target.value)
                          }
                          setConfig(newConfig)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={option.enabled}
                        onChange={(e) => {
                          const newConfig = { ...config }
                          if (newConfig.optionModifiers[index]) {
                            newConfig.optionModifiers[index].enabled = e.target.checked
                          }
                          setConfig(newConfig)
                        }}
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Settings Tab */}
        {activeTab === 'global' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Global Pricing Settings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Minimum Cost (Credits):
                </label>
                <input
                  type="number"
                  value={config.globalSettings.minimumCost}
                  onChange={(e) => {
                    const newConfig = { ...config }
                    newConfig.globalSettings.minimumCost = parseFloat(e.target.value)
                    setConfig(newConfig)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    color: '#374151',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Maximum Cost (Credits):
                </label>
                <input
                  type="number"
                  value={config.globalSettings.maximumCost}
                  onChange={(e) => {
                    const newConfig = { ...config }
                    newConfig.globalSettings.maximumCost = parseFloat(e.target.value)
                    setConfig(newConfig)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    color: '#374151',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Default Model:
                </label>
                <select
                  value={config.globalSettings.defaultModel}
                  onChange={(e) => {
                    const newConfig = { ...config }
                    newConfig.globalSettings.defaultModel = e.target.value
                    setConfig(newConfig)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    color: '#374151',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {config.modelConfigs.filter(m => m.enabled).map(model => (
                    <option key={model.modelId} value={model.modelId}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Currency:
                </label>
                <input
                  type="text"
                  value={config.globalSettings.currency}
                  onChange={(e) => {
                    const newConfig = { ...config }
                    newConfig.globalSettings.currency = e.target.value
                    setConfig(newConfig)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    color: '#374151',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Pricing Preview Tab */}
        {activeTab === 'preview' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Pricing Preview Calculator
            </h3>
            <div style={{ display: 'grid', gap: '2rem' }}>
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem',
                border: '1px solid #e5e7eb'
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                  Test Different Scenarios:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  {[
                    { name: '1080p Image', width: 1920, height: 1080 },
                    { name: '4K Image', width: 3840, height: 2160 },
                    { name: '8K Image', width: 7680, height: 4320 },
                    { name: 'Instagram Square', width: 1080, height: 1080 }
                  ].map(scenario => (
                    <div key={scenario.name} style={{
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db'
                    }}>
                      <h5 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        {scenario.name}
                      </h5>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        {scenario.width} × {scenario.height} ({((scenario.width * scenario.height) / 1000000).toFixed(1)}MP)
                      </p>
                      {config.modelConfigs.filter(m => m.enabled).map(model => (
                        <div key={model.modelId} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          marginBottom: '0.25rem'
                        }}>
                          <span>{model.name}:</span>
                          <span style={{ fontWeight: '600' }}>
                            {calculatePreview(scenario.width, scenario.height, model.modelId)} credits
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Cancel
          </button>

          <button
            onClick={savePricingConfig}
            disabled={isSaving}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.375rem',
              backgroundColor: isSaving ? '#9ca3af' : '#3b82f6',
              color: 'white',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}