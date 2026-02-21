'use client'

import React, { useState } from 'react'
import { PRICING_PLANS } from '@/lib/pricing-config'
import { X, Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
    currentPlan: string
    currentBillingPeriod: string
    onClose: () => void
    onSuccess: (subscription: any, creditsDelta: number) => void
    /** When true, renders as an inline card (no fixed overlay). Used inside the pricing popup. */
    inline?: boolean
}

export default function UpgradeModal({ currentPlan, currentBillingPeriod, onClose, onSuccess, inline = false }: Props) {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [step, setStep] = useState<'select' | 'confirm'>('select')
    const [loading, setLoading] = useState(false)

    const billingPeriod: 'monthly' | 'yearly' = currentBillingPeriod === 'yearly' ? 'yearly' : 'monthly'

    const normalizedCurrentPlan = currentPlan.toLowerCase()
    const currentPlanConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === normalizedCurrentPlan)
    const currentPrice = currentPlanConfig?.price[billingPeriod] ?? 0

    // Only show plans with higher price (upgrades only, no downgrades, no Day Pass)
    const availablePlans = PRICING_PLANS.filter(p => {
        if (p.name.toLowerCase() === 'day pass') return false
        return p.price[billingPeriod] > currentPrice
    })

    const selectedPlanConfig = selectedPlan
        ? PRICING_PLANS.find(p => p.name.toLowerCase() === selectedPlan)
        : null
    const selectedPrice = selectedPlanConfig?.price[billingPeriod] ?? 0
    const priceDiff = selectedPrice - currentPrice
    const creditsDelta = (selectedPlanConfig?.credits.monthly ?? 0) - (currentPlanConfig?.credits.monthly ?? 0)

    const handleConfirm = async () => {
        if (!selectedPlan) return
        setLoading(true)
        try {
            const res = await fetch('/api/user/subscription/change-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ plan: selectedPlan, billingPeriod })
            })
            const data = await res.json()
            if (res.ok) {
                const delta = data.credits_adjustment?.delta_credited ?? 0
                toast.success(
                    `Upgraded to ${selectedPlanConfig?.name}!` +
                    (delta > 0 ? ` ${delta.toLocaleString()} extra credits added.` : '')
                )
                onSuccess(data.subscription, delta)
            } else {
                toast.error(data.error || 'Failed to upgrade plan')
            }
        } catch {
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const innerContent = (
        <>
                {/* Header */}
                {!inline && (
                    <div className="flex items-center justify-between p-5 border-b border-white/8">
                        <h2 className="text-base font-bold text-white">
                            {step === 'select' ? 'Upgrade Plan' : 'Confirm Upgrade'}
                        </h2>
                        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {step === 'select' && (
                    <div className="p-5 space-y-2">
                        <p className="text-xs text-white/40 mb-4">
                            Current:{' '}
                            <span className="capitalize text-white/60 font-medium">{currentPlanConfig?.name ?? currentPlan}</span>
                            {' · '}
                            <span className="text-white/60">${currentPrice}/{billingPeriod === 'yearly' ? 'yr' : 'mo'}</span>
                        </p>

                        {availablePlans.length === 0 ? (
                            <p className="text-sm text-white/50 text-center py-6">You're already on the highest plan.</p>
                        ) : (
                            availablePlans.map(plan => {
                                const key = plan.name.toLowerCase()
                                const price = plan.price[billingPeriod]
                                const diff = price - currentPrice
                                return (
                                    <button
                                        key={key}
                                        onClick={() => { setSelectedPlan(key); setStep('confirm') }}
                                        className="w-full flex items-center justify-between p-4 border border-white/10 hover:border-[#FFFF00]/50 hover:bg-[#FFFF00]/5 rounded-lg transition-all group"
                                    >
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white group-hover:text-[#FFFF00] transition-colors">{plan.name}</span>
                                                {plan.badge && (
                                                    <span className="text-xs px-1.5 py-0.5 bg-[#FFFF00]/15 text-[#FFFF00] rounded">{plan.badge}</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-white/40 mt-0.5">{plan.credits.monthly.toLocaleString()} credits/mo</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white">${price}/{billingPeriod === 'yearly' ? 'yr' : 'mo'}</div>
                                            <div className="text-xs text-[#FFFF00] mt-0.5">+${diff} now</div>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                )}

                {step === 'confirm' && selectedPlanConfig && (
                    <div className="p-5 space-y-4">
                        <div className="bg-white/5 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">From</span>
                                <span className="text-white/70 capitalize font-medium">
                                    {currentPlanConfig?.name ?? currentPlan} · ${currentPrice}/{billingPeriod === 'yearly' ? 'yr' : 'mo'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">To</span>
                                <span className="text-white capitalize font-bold">
                                    {selectedPlanConfig.name} · ${selectedPrice}/{billingPeriod === 'yearly' ? 'yr' : 'mo'}
                                </span>
                            </div>
                            <div className="border-t border-white/8 pt-3 flex justify-between text-sm">
                                <span className="text-white/50">Charged now (prorated)</span>
                                <span className="text-[#FFFF00] font-bold">${priceDiff}</span>
                            </div>
                            {creditsDelta > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">Credits added immediately</span>
                                    <span className="text-green-400 font-medium">+{creditsDelta.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-white/30">
                            You'll be charged the prorated difference immediately. Future renewals will be at ${selectedPrice}/{billingPeriod === 'yearly' ? 'yr' : 'mo'}.
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setStep('select')}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-white/8 hover:bg-white/12 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                {loading ? 'Upgrading…' : 'Confirm Upgrade'}
                            </button>
                        </div>
                    </div>
                )}
        </>
    )

    if (inline) {
        return (
            <div className="w-full max-w-md mx-auto">
                {innerContent}
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[10001] bg-black/80 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md">
                {innerContent}
            </div>
        </div>
    )
}
