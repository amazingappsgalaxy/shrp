'use client'

import React, { useState, useEffect } from 'react'
import { useAppData } from '@/lib/hooks/use-app-data'
import { CreditCard, Download, CheckCircle, XCircle, FileText, AlertTriangle, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'

const openPlansPopup = () => window.dispatchEvent(new CustomEvent('sharpii:open-plans'))

interface Payment {
    id: string
    plan: string
    amount: number
    currency: string
    status: string
    date: string
    created_at: string
    billing_period: string
    payment_method?: string
    invoice_url?: string
}

export default function BillingSection() {
    const { user, subscription: subData, isLoading: authLoading, mutate } = useAppData()
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [reactivating, setReactivating] = useState(false)

    const subscription = subData?.subscription || null

    useEffect(() => {
        if (!user?.id) return

        const fetchInvoices = async () => {
            try {
                const res = await fetch('/api/user/invoices', { credentials: 'include' })
                if (res.ok) {
                    const data = await res.json()
                    setPayments(data.invoices || [])
                }
            } catch (error) {
                console.error('Error fetching billing data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchInvoices()
    }, [user?.id])

    const handleCancelSubscription = async () => {
        setCancelling(true)
        try {
            const res = await fetch('/api/user/subscription/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(data.message || 'Auto-renew turned off. Your plan stays active until period end.')
                setShowCancelConfirm(false)
                mutate()
            } else {
                toast.error(data.error || 'Failed to cancel subscription')
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.')
        } finally {
            setCancelling(false)
        }
    }

    const handleReactivate = async () => {
        setReactivating(true)
        try {
            const res = await fetch('/api/user/subscription/reactivate', {
                method: 'POST',
                credentials: 'include'
            })
            const data = await res.json()
            if (res.ok) {
                toast.success('Auto-renew re-enabled. Your plan will renew normally.')
                mutate()
            } else {
                toast.error(data.error || 'Failed to reactivate subscription')
            }
        } catch {
            toast.error('An error occurred. Please try again.')
        } finally {
            setReactivating(false)
        }
    }

    const handleDownloadInvoice = async (paymentId: string) => {
        try {
            const res = await fetch(`/api/billing/invoice/${paymentId}/download`, { credentials: 'include' })
            if (res.ok) {
                const contentType = res.headers.get('content-type')
                if (contentType?.includes('application/pdf')) {
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `invoice-${paymentId}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                } else {
                    const data = await res.json()
                    if (data.url) window.open(data.url, '_blank')
                    else toast.error('Invoice download not available for this payment')
                }
            } else {
                toast.error('Failed to download invoice')
            }
        } catch {
            toast.error('Failed to download invoice')
        }
    }

    const formatAmount = (amount: number, currency: string) => {
        const displayAmount = amount >= 100 ? amount / 100 : amount
        return displayAmount.toLocaleString('en-US', { style: 'currency', currency: currency || 'USD' })
    }

    const subscriptionStatus = subscription?.status
    const isActiveLike = !!subscriptionStatus && ['active', 'trialing', 'pending'].includes(subscriptionStatus)
    const isPendingCancellation = subscriptionStatus === 'pending_cancellation'
    const canCancel = isActiveLike && !isPendingCancellation

    if (authLoading || loading) {
        return (
            <div className="space-y-3">
                <div className="h-28 bg-white/5 rounded-md animate-pulse" />
                <div className="h-48 bg-white/5 rounded-md animate-pulse" />
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Subscription Card */}
            <div className="bg-white/5 border border-white/10 rounded-md p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#FFFF00]" />
                        <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">Subscription</span>
                    </div>
                    {subscriptionStatus === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" /> Active
                        </span>
                    )}
                    {subscriptionStatus === 'trialing' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" /> Trial
                        </span>
                    )}
                    {subscriptionStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-white/70 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" /> Pending
                        </span>
                    )}
                    {isPendingCancellation && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" /> Cancels at period end
                        </span>
                    )}
                    {subscriptionStatus === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" /> Cancelled
                        </span>
                    )}
                </div>

                {subscription ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <div className="text-xs text-white/40 mb-0.5">Plan</div>
                                <div className="text-sm font-bold text-white capitalize">
                                    {subscription.plan.includes('day') ? 'Day Pass' : subscription.plan}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-white/40 mb-0.5">Billing</div>
                                <div className="text-sm font-bold text-white capitalize">{subscription.billing_period}</div>
                            </div>
                            <div>
                                <div className="text-xs text-white/40 mb-0.5">
                                    {isPendingCancellation ? 'Expires On' : 'Next Billing'}
                                </div>
                                <div className="text-sm font-bold text-white">
                                    {subscription.next_billing_date
                                        ? new Date(subscription.next_billing_date).toLocaleString(undefined, {
                                            month: 'long', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })
                                        : '-'}
                                </div>
                            </div>
                        </div>

                        {isPendingCancellation && (
                            <div className="flex items-start gap-2 bg-yellow-500/8 border border-yellow-500/15 rounded-lg p-3">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-yellow-200/70">
                                    Auto-renew is off. Your plan stays active until{' '}
                                    {subscription.next_billing_date
                                        ? new Date(subscription.next_billing_date).toLocaleString(undefined, {
                                            month: 'long', day: 'numeric', year: 'numeric'
                                        })
                                        : 'the end of your billing period'}.
                                </p>
                            </div>
                        )}

                        {(subscription.billing_name || subscription.billing_email) && (
                            <div className="pt-3 border-t border-white/8">
                                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Billing Details</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-xs text-white/30 mb-0.5">Billed To</div>
                                        <div className="text-sm text-white font-medium">{subscription.billing_name}</div>
                                        <div className="text-xs text-white/50">{subscription.billing_email}</div>
                                    </div>
                                    {subscription.billing_address && (
                                        <div>
                                            <div className="text-xs text-white/30 mb-0.5">Address</div>
                                            <div className="text-xs text-white/50 leading-relaxed">
                                                {subscription.billing_address.line1 || subscription.billing_address.street}<br />
                                                {subscription.billing_address.city}, {subscription.billing_address.state}<br />
                                                {subscription.billing_address.country}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/8">
                            {canCancel && (
                                <>
                                    <button
                                        onClick={openPlansPopup}
                                        className="px-4 py-2 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-sm font-bold rounded-md transition-colors"
                                    >
                                        Upgrade Plan
                                    </button>
                                    {!showCancelConfirm ? (
                                        <button
                                            onClick={() => setShowCancelConfirm(true)}
                                            className="px-4 py-2 bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 text-sm font-medium rounded-md border border-white/10 transition-colors"
                                        >
                                            Turn off auto-renew
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/15 rounded-md px-3 py-2">
                                            <span className="text-xs text-red-300/80">
                                                Are you sure? Your plan stays active until the end of the billing period.
                                            </span>
                                            <button
                                                onClick={handleCancelSubscription}
                                                disabled={cancelling}
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md transition-colors flex items-center gap-1"
                                            >
                                                {cancelling && <Loader2 className="w-3 h-3 animate-spin" />}
                                                Yes, turn off
                                            </button>
                                            <button
                                                onClick={() => setShowCancelConfirm(false)}
                                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-md transition-colors"
                                            >
                                                Keep Plan
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                            {isPendingCancellation && (
                                <button
                                    onClick={handleReactivate}
                                    disabled={reactivating}
                                    className="px-4 py-2 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-sm font-bold rounded-md transition-colors flex items-center gap-2 disabled:opacity-70"
                                >
                                    {reactivating && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Turn auto-renew back on
                                </button>
                            )}
                            {subscriptionStatus === 'cancelled' && (
                                <button
                                    onClick={openPlansPopup}
                                    className="px-4 py-2 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-sm font-bold rounded-md transition-colors"
                                >
                                    Subscribe Again
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/40">No active subscription</span>
                        <button
                            onClick={openPlansPopup}
                            className="px-4 py-2 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-sm font-bold rounded-md transition-colors"
                        >
                            View Plans
                        </button>
                    </div>
                )}
            </div>

            {/* Payment History */}
            <div className="bg-white/5 border border-white/10 rounded-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#FFFF00]" />
                        <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">Payment History</span>
                    </div>
                    <span className="text-xs text-white/30">{payments.length} payment{payments.length !== 1 ? 's' : ''}</span>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-10 text-white/40">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-white/15" />
                        <p className="text-sm">No payments yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/3 border-b border-white/8">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Plan</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Amount</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {payments.map((payment, index) => {
                                    const normalizedStatus = (payment.status || '').toLowerCase()
                                    const isPaid = normalizedStatus === 'succeeded' || normalizedStatus === 'paid'
                                    const isProcessing = normalizedStatus === 'processing' || normalizedStatus === 'pending'
                                    const canDownloadInvoice = !['failed', 'cancelled', 'canceled'].includes(normalizedStatus)

                                    return (
                                        <tr key={payment.id + '-' + index} className="hover:bg-white/3 transition-colors">
                                            <td className="px-5 py-3 text-white/70">
                                                {new Date(payment.date || payment.created_at).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-5 py-3 text-white/70 capitalize">
                                                {payment.plan || '-'}
                                                {payment.billing_period && (
                                                    <span className="text-white/30 ml-1">({payment.billing_period})</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 font-semibold text-white">
                                                {formatAmount(payment.amount, payment.currency)}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    isPaid ? 'bg-green-500/10 text-green-400'
                                                    : isProcessing ? 'bg-yellow-500/10 text-yellow-300'
                                                    : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                    {isPaid ? <CheckCircle className="w-2.5 h-2.5" />
                                                        : isProcessing ? <Clock className="w-2.5 h-2.5" />
                                                        : <AlertTriangle className="w-2.5 h-2.5" />}
                                                    {isPaid ? 'Paid' : isProcessing ? 'Processing' : (payment.status || 'Failed')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {canDownloadInvoice ? (
                                                    <button
                                                        onClick={() => {
                                                            if (payment.invoice_url) window.open(payment.invoice_url, '_blank')
                                                            else handleDownloadInvoice(payment.id)
                                                        }}
                                                        className="inline-flex items-center gap-1 text-xs text-[#FFFF00] hover:text-[#c9c900] transition-colors"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        Download
                                                    </button>
                                                ) : (
                                                    <span className="text-white/20 text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
