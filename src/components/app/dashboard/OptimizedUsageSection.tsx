'use client'

import React, { useState, useEffect } from 'react'
import { useAppData } from '@/lib/hooks/use-app-data'
import { Search, Plus, Minus, Zap, ChevronDown, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface Transaction {
    id: string
    amount: number
    type: 'credit' | 'debit'
    reason: string
    description: string
    balance_before: number
    balance_after: number
    created_at: string
    metadata?: any
}

const PAGE_SIZE = 15

function groupByDate(transactions: Transaction[]) {
    const groups: Record<string, Transaction[]> = {}
    for (const tx of transactions) {
        const d = new Date(tx.created_at)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        let key: string
        if (d.toDateString() === today.toDateString()) key = 'Today'
        else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday'
        else key = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        if (!groups[key]) groups[key] = []
        groups[key].push(tx)
    }
    return groups
}

export default function OptimizedUsageSection() {
    const { user } = useAppData()
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all')

    useEffect(() => {
        if (!user?.id) return
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/credits/history?limit=200', { credentials: 'include' })
                if (res.ok) {
                    const data = await res.json()
                    setAllTransactions(data.history || [])
                }
            } catch (error) {
                console.error('Error fetching credit history:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [user?.id])

    const filtered = allTransactions.filter(tx => {
        const desc = (tx.description || tx.reason || '').toLowerCase()
        const searchMatch = !search || desc.includes(search.toLowerCase()) ||
            (tx.metadata?.task_id || '').toLowerCase().includes(search.toLowerCase())
        const typeMatch = typeFilter === 'all' || tx.type === typeFilter
        return searchMatch && typeMatch
    })

    const visible = filtered.slice(0, visibleCount)
    const hasMore = visibleCount < filtered.length
    const groups = groupByDate(visible)
    const isFiltered = search || typeFilter !== 'all'

    if (loading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-white/5 rounded-md animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filters row */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
                        placeholder="Search..."
                        className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-8 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex items-center bg-white/5 border border-white/10 rounded-md p-0.5">
                    {(['all', 'credit', 'debit'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => { setTypeFilter(t); setVisibleCount(PAGE_SIZE) }}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all capitalize ${typeFilter === t ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}
                        >
                            {t === 'all' ? 'All' : t === 'credit' ? 'Credits' : 'Debits'}
                        </button>
                    ))}
                </div>

                {isFiltered && (
                    <span className="text-xs text-white/30">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                )}
            </div>

            {/* Transaction feed */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-md border border-white/10">
                    <Zap className="w-8 h-8 text-white/15 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-white/40">
                        {isFiltered ? 'No matching transactions' : 'No transactions yet'}
                    </p>
                    {isFiltered && (
                        <button onClick={() => { setSearch(''); setTypeFilter('all') }} className="mt-2 text-xs text-[#FFFF00]/60 hover:text-[#FFFF00]">
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div>
                    {Object.entries(groups).map(([date, txs]) => (
                        <div key={date}>
                            {/* Date divider */}
                            <div className="flex items-center gap-3 mb-2 mt-4 first:mt-0">
                                <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">{date}</span>
                                <div className="flex-1 h-px bg-white/5" />
                            </div>

                            {/* Transactions for this date */}
                            <div className="space-y-1">
                                {txs.map((tx, index) => {
                                    const isCredit = tx.type === 'credit'
                                    const time = new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                    return (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: Math.min(index * 0.02, 0.2) }}
                                            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-white/5 transition-colors group"
                                        >
                                            {/* Icon */}
                                            <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-green-500/12' : 'bg-red-500/10'}`}>
                                                {isCredit
                                                    ? <Plus className="w-3 h-3 text-green-400" />
                                                    : <Minus className="w-3 h-3 text-red-400" />
                                                }
                                            </div>

                                            {/* Description */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white/80 truncate">{tx.description || tx.reason || '—'}</p>
                                                {tx.metadata?.task_id && (
                                                    <p className="text-xs text-white/25 font-mono truncate mt-0.5">{tx.metadata.task_id}</p>
                                                )}
                                            </div>

                                            {/* Amount */}
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-sm font-bold tabular-nums ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isCredit ? '+' : ''}{tx.amount.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-white/25">{time}</p>
                                            </div>

                                            {/* Balance */}
                                            <div className="w-16 text-right flex-shrink-0 hidden sm:block">
                                                <p className="text-xs text-white/30 font-mono">{tx.balance_after?.toLocaleString() ?? '—'}</p>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {hasMore && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                                className="flex items-center gap-2 mx-auto text-xs text-white/40 hover:text-white/70 transition-colors py-2"
                            >
                                <ChevronDown className="w-3.5 h-3.5" />
                                Load more ({filtered.length - visibleCount} remaining)
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
