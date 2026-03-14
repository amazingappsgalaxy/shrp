'use client'

import { useEffect, useState } from 'react'
import { getAdminHeaders } from '@/lib/admin-client-auth'

interface ResolutionTier {
  resolution: string
  width: number
  height: number
  megapixels: number
  baseCredits: number
  description: string
}

interface SettingIncrement {
  settingKey: string
  settingName: string
  incrementType: string
  defaultIncrement: number
  enabled: boolean
  description: string
}

interface ModelConfig {
  modelId: string
  modelName: string
  enabled: boolean
  resolutionPricing: ResolutionTier[]
  settingIncrements: SettingIncrement[]
  globalMultiplier: number
  flatFee: number
  description?: string
  lastUpdated: number
}

interface PricingResponse {
  models: string[]
  configs?: Record<string, ModelConfig>
}

function Skeleton() {
  return <div className="animate-pulse bg-white/10 rounded h-7 w-full" />
}

export default function ModelPricingPage() {
  const [data, setData] = useState<PricingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/model-pricing', { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        if (d.models?.length > 0) setSelectedModel(d.models[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const selectedConfig = data?.configs?.[selectedModel || '']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Model Pricing</h1>
        <p className="text-white/40 text-sm mt-1">Credit costs per model and resolution tier</p>
      </div>

      {/* Config file note */}
      <div className="bg-[#FFFF00]/5 border border-[#FFFF00]/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-[#FFFF00] text-sm mt-0.5">🔧</span>
        <div>
          <p className="text-[#FFFF00]/80 text-sm font-medium">Read-only reference</p>
          <p className="text-white/40 text-xs mt-0.5">
            Model pricing is configured in <code className="text-white/60 bg-white/10 px-1 py-0.5 rounded">src/lib/model-pricing-config.ts</code>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
          {/* Model list */}
          <div className="space-y-1">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Models</p>
            {(data?.models ?? []).map((model) => (
              <button
                key={model}
                onClick={() => setSelectedModel(model)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                  selectedModel === model
                    ? 'bg-[#FFFF00]/10 text-[#FFFF00] border border-[#FFFF00]/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {model}
              </button>
            ))}
            {(data?.models ?? []).length === 0 && (
              <p className="text-white/30 text-xs px-3">No models found</p>
            )}
          </div>

          {/* Model config detail */}
          <div className="space-y-5">
            {selectedConfig ? (
              <>
                {/* Header */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-white font-bold text-lg">{selectedConfig.modelName || selectedModel}</h2>
                      {selectedConfig.description && (
                        <p className="text-white/40 text-sm mt-1">{selectedConfig.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        selectedConfig.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedConfig.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-white/40 text-xs">Global Multiplier</div>
                      <div className="text-white font-semibold mt-1">{selectedConfig.globalMultiplier}x</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-white/40 text-xs">Flat Fee</div>
                      <div className="text-white font-semibold mt-1">{selectedConfig.flatFee} credits</div>
                    </div>
                  </div>
                </div>

                {/* Resolution pricing table */}
                {selectedConfig.resolutionPricing?.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                      <h3 className="text-white font-semibold">Resolution Pricing</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Resolution</th>
                            <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Dimensions</th>
                            <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Megapixels</th>
                            <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Base Credits</th>
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selectedConfig.resolutionPricing.map((tier) => (
                            <tr key={tier.resolution}>
                              <td className="px-4 py-3 text-white font-mono text-xs">{tier.resolution}</td>
                              <td className="px-4 py-3 text-right text-white/60 text-xs">{tier.width}×{tier.height}</td>
                              <td className="px-4 py-3 text-right text-white/60 text-xs">{tier.megapixels?.toFixed(1)} MP</td>
                              <td className="px-4 py-3 text-right text-[#FFFF00] font-semibold text-sm">{tier.baseCredits.toLocaleString()}</td>
                              <td className="px-4 py-3 text-white/40 text-xs">{tier.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Setting increments */}
                {selectedConfig.settingIncrements?.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                      <h3 className="text-white font-semibold">Setting Increments</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Setting</th>
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Type</th>
                            <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Default Increment</th>
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selectedConfig.settingIncrements.map((setting) => (
                            <tr key={setting.settingKey}>
                              <td className="px-4 py-3">
                                <div className="text-white text-xs font-medium">{setting.settingName}</div>
                                <div className="text-white/30 text-xs font-mono">{setting.settingKey}</div>
                              </td>
                              <td className="px-4 py-3 text-white/50 text-xs capitalize">{setting.incrementType.replace('_', ' ')}</td>
                              <td className="px-4 py-3 text-right text-white font-semibold text-sm">{setting.defaultIncrement}%</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  setting.enabled ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/30'
                                }`}>
                                  {setting.enabled ? 'active' : 'inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <p className="text-white/20 text-xs">
                  Last updated: {selectedConfig.lastUpdated ? new Date(selectedConfig.lastUpdated).toLocaleString() : '—'}
                </p>
              </>
            ) : selectedModel ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                <p className="text-white/30 text-sm">No detailed config available for <span className="text-white/50">{selectedModel}</span></p>
                <p className="text-white/20 text-xs mt-2">Check <code className="bg-white/10 px-1 rounded">src/lib/model-pricing-config.ts</code></p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                <p className="text-white/30 text-sm">Select a model to view pricing details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
