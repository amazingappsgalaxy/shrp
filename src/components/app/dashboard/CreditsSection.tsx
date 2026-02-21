'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAppData, APP_DATA_KEY } from '@/lib/hooks/use-app-data'
import { Calendar, Lock, Zap, ArrowRight, RefreshCw, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'

const openPlansPopup = () => window.dispatchEvent(new CustomEvent('sharpii:open-plans'))

export default function CreditsSection() {
    const { user, credits: creditsData, subscription: subData, isLoading, mutate } = useAppData()

    const credits = creditsData ?? {
        total: 0,
        subscription_credits: 0,
        permanent_credits: 0,
        subscription_expire_at: null as string | null
    }
    const subscription = subData ?? {
        has_active_subscription: false,
        current_plan: 'free',
        subscription: null as any
    }

    const [activating, setActivating] = useState(false)
    const [activatingSlowMode, setActivatingSlowMode] = useState(false)
    const [loadingTopup, setLoadingTopup] = useState<number | null>(null)
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pollAttemptsRef = useRef(0)
    const MAX_POLL_ATTEMPTS = 12

    const stopPolling = () => {
        if (pollRef.current) clearTimeout(pollRef.current)
        pollRef.current = null
        setActivating(false)
        setActivatingSlowMode(false)
    }

    const scheduleSlowPoll = () => {
        pollRef.current = setTimeout(async () => {
            await mutate()
            scheduleSlowPoll()
        }, 30000)
    }

    const schedulePoll = () => {
        if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
            setActivating(false)
            setActivatingSlowMode(true)
            scheduleSlowPoll()
            return
        }
        pollRef.current = setTimeout(async () => {
            pollAttemptsRef.current += 1
            await mutate()
            schedulePoll()
        }, 5000)
    }

    // Start polling if subscription is pending and credits are 0
    useEffect(() => {
        if (!user?.id || isLoading) return

        const subStatus = subscription.subscription?.status
        if (credits.total === 0 && subStatus === 'pending') {
            setActivating(true)
            pollAttemptsRef.current = 0
            schedulePoll()
        }

        return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, isLoading])

    // Stop polling once credits appear
    useEffect(() => {
        if (credits.total > 0 && (activating || activatingSlowMode)) {
            stopPolling()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [credits.total])

    const handleTopup = async (creditAmount: number) => {
        setLoadingTopup(creditAmount)
        try {
            const res = await fetch('/api/payments/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ credits: creditAmount })
            })
            const data = await res.json()
            if (res.ok && data.checkoutUrl) {
                window.location.href = data.checkoutUrl
            } else {
                toast.error(data.error || data.message || 'Failed to start checkout')
            }
        } catch {
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoadingTopup(null)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="h-36 bg-white/5 rounded-md animate-pulse" />
                <div className="h-14 bg-white/5 rounded-md animate-pulse" />
                <div className="h-20 bg-white/5 rounded-md animate-pulse" />
            </div>
        )
    }

    const planLabel = subscription.current_plan.charAt(0).toUpperCase() + subscription.current_plan.slice(1)
    const sub = subscription.subscription
    const isPendingCancel = sub?.status === 'pending_cancellation'

    return (
        <div className="space-y-3">
            {/* Main credits block */}
            <div className="bg-white/5 border border-white/10 rounded-md p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Available Credits</p>
                        <div className="flex items-end gap-3">
                            <span className="text-5xl font-black text-white tabular-nums leading-none">
                                {credits.total.toLocaleString()}
                            </span>
                            {/* Info button — hover shows breakdown */}
                            <div className="relative group mb-1.5">
                                <button className="flex items-center justify-center w-5 h-5 rounded text-white/25 hover:text-white/60 transition-colors">
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                                {/* Tooltip */}
                                <div className="absolute left-0 bottom-full mb-2 w-52 bg-[#111] border border-white/10 rounded-md p-3 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Credit Breakdown</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFF00]" />
                                                <span className="text-xs text-white/60">Subscription</span>
                                            </div>
                                            <span className="text-xs font-bold text-white tabular-nums">{credits.subscription_credits.toLocaleString()}</span>
                                        </div>
                                        {credits.subscription_expire_at && (
                                            <p className="text-[10px] text-white/25 pl-3">
                                                Expires {new Date(credits.subscription_expire_at).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                <span className="text-xs text-white/60">Permanent</span>
                                            </div>
                                            <span className="text-xs font-bold text-white tabular-nums">{credits.permanent_credits.toLocaleString()}</span>
                                        </div>
                                        <p className="text-[10px] text-white/25 pl-3">Never expires</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription expiry row */}
                {credits.subscription_credits > 0 && credits.subscription_expire_at && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-white/30">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>
                            Subscription credits expire{' '}
                            {new Date(credits.subscription_expire_at).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                )}

                {credits.total === 0 && activating && (
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                        <p className="text-sm text-white/40">Activating your credits…</p>
                    </div>
                )}
                {credits.total === 0 && activatingSlowMode && (
                    <div className="mt-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                            <p className="text-sm text-amber-400/80">Payment received — credits are being processed.</p>
                        </div>
                        <p className="text-xs text-white/30 pl-5">This can take a few minutes. This page will update automatically.</p>
                    </div>
                )}
                {credits.total === 0 && !activating && !activatingSlowMode && (
                    <p className="mt-4 text-sm text-white/30">No credits yet. Subscribe to a plan to get started.</p>
                )}
            </div>

            {/* Plan status row */}
            <div className="bg-white/5 border border-white/10 rounded-md px-4 py-3 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-white">
                        {subscription.has_active_subscription ? `${planLabel} Plan` : 'No Active Plan'}
                    </p>
                    {sub?.next_billing_date && (
                        <p className="text-xs text-white/40 mt-0.5">
                            {isPendingCancel ? 'Expires' : 'Renews'}{' '}
                            {new Date(sub.next_billing_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    )}
                </div>
                <button
                    onClick={openPlansPopup}
                    className="flex items-center gap-1.5 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
                >
                    {subscription.has_active_subscription ? 'Upgrade' : 'View Plans'}
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {/* One-time top-up */}
            <div className="bg-white/5 border border-white/10 rounded-md p-4">
                <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">One-Time Top-Up</span>
                </div>

                {subscription.has_active_subscription ? (
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { credits: 500, price: 5 },
                            { credits: 1000, price: 9 },
                            { credits: 2500, price: 20 },
                            { credits: 5000, price: 35 }
                        ].map((pkg) => (
                            <button
                                key={pkg.credits}
                                onClick={() => handleTopup(pkg.credits)}
                                disabled={loadingTopup !== null}
                                className="flex flex-col items-center py-3 border border-white/10 hover:border-[#FFFF00]/50 hover:bg-[#FFFF00]/5 rounded transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loadingTopup === pkg.credits ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-[#FFFF00] mb-1" />
                                ) : (
                                    <span className="text-sm font-bold text-white group-hover:text-[#FFFF00] transition-colors">{pkg.credits.toLocaleString()}</span>
                                )}
                                <span className="text-xs text-white/35 mt-0.5">credits</span>
                                <span className="text-xs font-bold text-[#FFFF00] mt-1.5">${pkg.price}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-white/25 flex-shrink-0" />
                        <span className="text-xs text-white/40">Requires an active subscription</span>
                    </div>
                )}
            </div>
        </div>
    )
}
