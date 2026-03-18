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

interface UnifiedModel {
  modelId: string
  modelName: string
  type: 'image' | 'video'
  provider: 'runninghub' | 'synvow' | 'unknown'
  enabled: boolean
  pricingType: 'tiered' | 'flat'
  flatCredits?: number
  costUsd?: number
  tag?: string
  description?: string
  config?: ModelConfig
}

interface PricingResponse {
  models: UnifiedModel[]
  stats: { totalModels: number; imageModels: number; videoModels: number; tieredModels: number }
}

type FilterType = 'all' | 'image' | 'video' | 'tiered' | 'flat'

function Skeleton() {
  return <div className="animate-pulse bg-white/10 rounded h-7 w-full" />
}

function ProviderBadge({ provider }: { provider: string }) {
  if (provider === 'runninghub') return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-medium">RunningHub</span>
  )
  if (provider === 'synvow') return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">Synvow</span>
  )
  return <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40 font-medium">{provider}</span>
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'image') return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium">Image</span>
  )
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-medium">Video</span>
  )
}

export default function ModelPricingPage() {
  const [data, setData] = useState<PricingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/model-pricing', { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        if (d.models?.length > 0) setSelectedId(d.models[0].modelId)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = (data?.models ?? []).filter((m) => {
    if (filter === 'image') return m.type === 'image'
    if (filter === 'video') return m.type === 'video'
    if (filter === 'tiered') return m.pricingType === 'tiered'
    if (filter === 'flat') return m.pricingType === 'flat'
    return true
  }).filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.modelName.toLowerCase().includes(q) || m.modelId.toLowerCase().includes(q)
  })

  const selected = filtered.find((m) => m.modelId === selectedId) ?? filtered[0] ?? null

  const FILTERS: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Image', value: 'image' },
    { label: 'Video', value: 'video' },
    { label: 'Tiered', value: 'tiered' },
    { label: 'Flat', value: 'flat' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-bold">Model Pricing</h1>
          <p className="text-white/40 text-sm mt-1">Credit costs for all {data?.stats.totalModels ?? '…'} models</p>
        </div>
        {data?.stats && (
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Total Models', value: data.stats.totalModels },
              { label: 'Image', value: data.stats.imageModels },
              { label: 'Video', value: data.stats.videoModels },
              { label: 'Tiered Pricing', value: data.stats.tieredModels },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center min-w-[70px]">
                <div className="text-[#FFFF00] font-bold text-lg">{s.value}</div>
                <div className="text-white/40 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Left: model list */}
          <div className="space-y-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search models…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20"
            />
            {/* Filters */}
            <div className="flex flex-wrap gap-1">
              {FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    filter === value ? 'bg-[#FFFF00] text-black' : 'text-white/50 bg-white/5 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Model list */}
            <div className="space-y-0.5 max-h-[600px] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <p className="text-white/30 text-xs px-3 py-2">No models match filter</p>
              )}
              {filtered.map((m) => (
                <button
                  key={m.modelId}
                  onClick={() => setSelectedId(m.modelId)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                    selected?.modelId === m.modelId
                      ? 'bg-[#FFFF00]/10 border border-[#FFFF00]/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className={`text-sm font-medium truncate ${selected?.modelId === m.modelId ? 'text-[#FFFF00]' : 'text-white/80'}`}>
                    {m.modelName}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <TypeBadge type={m.type} />
                    <span className="text-white/30 text-xs">
                      {m.pricingType === 'flat'
                        ? `${m.flatCredits} cr`
                        : `${m.config?.resolutionPricing?.[0]?.baseCredits}–${m.config?.resolutionPricing?.[m.config.resolutionPricing.length - 1]?.baseCredits} cr`
                      }
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: selected model detail */}
          <div className="space-y-5">
            {selected ? (
              <>
                {/* Header */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-white font-bold text-xl">{selected.modelName}</h2>
                      <p className="text-white/30 font-mono text-xs mt-0.5">{selected.modelId}</p>
                      {selected.description && (
                        <p className="text-white/50 text-sm mt-2">{selected.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeBadge type={selected.type} />
                      <ProviderBadge provider={selected.provider} />
                      {selected.tag && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-medium">{selected.tag}</span>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        selected.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {selected.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing summary */}
                  {selected.pricingType === 'flat' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-white/40 text-xs">Credits / Generation</div>
                        <div className="text-[#FFFF00] font-bold text-2xl mt-1">{selected.flatCredits?.toLocaleString()}</div>
                      </div>
                      {selected.costUsd != null && (
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-white/40 text-xs">Est. Cost (USD)</div>
                          <div className="text-white font-semibold text-lg mt-1">${selected.costUsd.toFixed(3)}</div>
                        </div>
                      )}
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-white/40 text-xs">Pricing Type</div>
                        <div className="text-white font-semibold mt-1">Flat fee</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-white/40 text-xs">Min Credits</div>
                        <div className="text-[#FFFF00] font-bold text-2xl mt-1">
                          {Math.min(...(selected.config?.resolutionPricing?.map(t => t.baseCredits) ?? [0]))}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-white/40 text-xs">Max Credits</div>
                        <div className="text-[#FFFF00] font-bold text-2xl mt-1">
                          {Math.max(...(selected.config?.resolutionPricing?.map(t => t.baseCredits) ?? [0]))}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-white/40 text-xs">Global Multiplier</div>
                        <div className="text-white font-semibold text-lg mt-1">{selected.config?.globalMultiplier ?? 1}x</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tiered: Resolution pricing table */}
                {selected.pricingType === 'tiered' && selected.config?.resolutionPricing?.length ? (
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                      <h3 className="text-white font-semibold">Resolution Pricing Tiers</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Resolution</th>
                            <th className="text-right px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Dimensions</th>
                            <th className="text-right px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Megapixels</th>
                            <th className="text-right px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Base Credits</th>
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selected.config.resolutionPricing.map((tier) => (
                            <tr key={tier.resolution} className="hover:bg-white/[0.02]">
                              <td className="px-4 py-3 text-white font-mono text-xs">{tier.resolution}</td>
                              <td className="px-4 py-3 text-right text-white/60 text-xs">{tier.width.toLocaleString()}×{tier.height.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-white/60 text-xs">{tier.megapixels?.toFixed(1)} MP</td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-[#FFFF00] font-bold">{tier.baseCredits.toLocaleString()}</span>
                                <span className="text-white/30 text-xs ml-1">cr</span>
                              </td>
                              <td className="px-4 py-3 text-white/50 text-xs">{tier.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {/* Tiered: Setting increments */}
                {selected.pricingType === 'tiered' && selected.config?.settingIncrements?.length ? (
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                      <h3 className="text-white font-semibold">Setting Increments</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Setting</th>
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Type</th>
                            <th className="text-right px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Default Increment</th>
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Description</th>
                            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selected.config.settingIncrements.map((s) => (
                            <tr key={s.settingKey} className="hover:bg-white/[0.02]">
                              <td className="px-4 py-3">
                                <div className="text-white text-xs font-medium">{s.settingName}</div>
                                <div className="text-white/30 text-xs font-mono">{s.settingKey}</div>
                              </td>
                              <td className="px-4 py-3 text-white/50 text-xs capitalize">{s.incrementType.replace('_', ' ')}</td>
                              <td className="px-4 py-3 text-right text-white font-semibold">{s.defaultIncrement}{s.incrementType === 'flat_credits' ? ' cr' : '%'}</td>
                              <td className="px-4 py-3 text-white/40 text-xs max-w-xs">{s.description}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  s.enabled ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/30'
                                }`}>
                                  {s.enabled ? 'active' : 'inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {/* Flat pricing: simple info card */}
                {selected.pricingType === 'flat' && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-3">Pricing Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/50">Credits per generation</span>
                        <span className="text-[#FFFF00] font-bold">{selected.flatCredits?.toLocaleString()} credits</span>
                      </div>
                      {selected.costUsd != null && (
                        <div className="flex justify-between">
                          <span className="text-white/50">Estimated USD cost</span>
                          <span className="text-white font-medium">${selected.costUsd.toFixed(4)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-white/50">Pricing model</span>
                        <span className="text-white">Flat fee per generation</span>
                      </div>
                    </div>
                  </div>
                )}

                {selected.config?.lastUpdated ? (
                  <p className="text-white/20 text-xs">
                    Config last updated: {new Date(selected.config.lastUpdated).toLocaleString()}
                  </p>
                ) : null}
              </>
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
