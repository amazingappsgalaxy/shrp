'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-client-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import {
  Plus,
  Minus,
  ShoppingCart,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Safe date formatter to prevent stack overflow - with memoization
const dateFormatCache = new Map<number, string>()
const safeFormatDistance = (date: Date | number) => {
  try {
    if (!date) return 'Unknown time'

    const timestamp = typeof date === 'number' ? date : date.getTime()
    if (isNaN(timestamp)) return 'Unknown time'

    // Use cache for performance
    if (dateFormatCache.has(timestamp)) {
      return dateFormatCache.get(timestamp)!
    }

    const dateObj = new Date(timestamp)
    const formatted = formatDistanceToNow(dateObj, { addSuffix: true })

    // Cache with size limit to prevent memory issues
    if (dateFormatCache.size > 100) {
      const firstKey = dateFormatCache.keys().next().value
      if (firstKey !== undefined) {
        dateFormatCache.delete(firstKey)
      }
    }
    dateFormatCache.set(timestamp, formatted)

    return formatted
  } catch (error) {
    console.warn('Date formatting error:', error)
    return 'Unknown time'
  }
}

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  timestamp: number
  balanceAfter: number
}

interface SimpleUsageSectionProps {
  className?: string
}

export default function SimpleUsageSection({ className }: SimpleUsageSectionProps) {
  const { user } = useAuth()
  const [creditBalance, setCreditBalance] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false)

  const DEFAULT_TRANSACTION_LIMIT = 6 // Reduced from 10

  const loadData = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)

      // Get current balance with breakdown
      const balance = await UnifiedCreditsService.getUserCredits(user.id)
      setCreditBalance(balance)

      // Get credit transactions with reduced limit
      const creditHistory = await UnifiedCreditsService.getCreditHistory(user.id, 20)

      // Combine credit transactions into one timeline
      const allTransactions: Transaction[] = []

      // Add credit transactions
      creditHistory.forEach(credit => {
        allTransactions.push({
          id: credit.id,
          type: credit.type,
          amount: credit.amount,
          description: credit.description || credit.reason,
          timestamp: credit.createdAt,
          balanceAfter: 0 // We don't track running balance in this view
        })
      })

      // Sort by timestamp descending
      allTransactions.sort((a, b) => b.timestamp - a.timestamp)
      
      setAllTransactions(allTransactions)
      setTransactions(allTransactions.slice(0, DEFAULT_TRANSACTION_LIMIT))

    } catch (error) {
      console.error('Error loading usage data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [user?.id, loadData])

  if (isLoading) {
    return (
      <div className={`${className} max-w-md mx-auto`}>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-white/5 rounded-lg"></div>
          <div className="h-48 bg-white/5 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!creditBalance) {
    return null
  }

  return (
    <>
      <div className={`${className}`}>
        {/* Credits Overview - Minimal */}
        <div className="space-y-12">
          {/* Total Credits */}
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl font-light text-white mb-2">
                {creditBalance.remaining.toLocaleString()}
              </div>
              <div className="text-white/50">total credits available</div>
            </div>
          </div>

          {/* Credit Breakdown - Minimal */}
          <div>
            <h3 className="text-white/90 text-lg font-light mb-6">Credit Balance</h3>
            <div className="space-y-4">
              {/* Expiring Credits */}
              {creditBalance.breakdown.expiring.map((expiring: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-white/40" />
                    <div>
                      <div className="text-white/90 text-sm">Credits</div>
                      <div className="text-white/40 text-xs">
                        Expires {expiring.expires_at ? safeFormatDistance(new Date(expiring.expires_at)) : 'never'}
                      </div>
                    </div>
                  </div>
                  <div className="text-white text-sm">
                    {expiring.amount.toLocaleString()}
                  </div>
                </div>
              ))}

              {/* Permanent Credits */}
              {creditBalance.breakdown.permanent > 0 && (
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-4 h-4 text-white/40" />
                    <div>
                      <div className="text-white/90 text-sm">Purchased Credits</div>
                      <div className="text-white/40 text-xs">Never expires</div>
                    </div>
                  </div>
                  <div className="text-white text-sm">
                    {creditBalance.breakdown.permanent.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buy Credits Section - iOS Style */}
          <div>
            <h3 className="text-white/90 text-lg font-light mb-6">Buy Credits</h3>
            <div className="space-y-3 mb-8">
              {[
                { credits: 1000, price: 10, bonus: 0, popular: false },
                { credits: 5000, price: 45, bonus: 500, popular: true },
                { credits: 10000, price: 85, bonus: 1500, popular: false },
                { credits: 25000, price: 200, bonus: 5000, popular: false }
              ].map((pkg, index) => (
                <div
                  key={index}
                  onClick={() => setShowBuyCreditsModal(true)}
                  className={`
                    relative bg-white/[0.02] border rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5
                    ${pkg.popular
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-white/10 hover:border-white/20'
                    }
                  `}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-4 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Popular
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-light text-white">
                          {(pkg.credits + pkg.bonus).toLocaleString()}
                        </div>
                        {pkg.bonus > 0 && (
                          <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-medium">
                            +{pkg.bonus.toLocaleString()} bonus
                          </div>
                        )}
                      </div>
                      <div className="text-white/40 text-sm mt-1">credits • never expires</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-light text-white">${pkg.price}</div>
                      <div className="text-white/40 text-xs">one-time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction History - Minimal */}
          <div>
            <h3 className="text-white/90 text-lg font-light mb-6">Recent Activity</h3>

            {(showAllTransactions ? allTransactions : transactions).length === 0 ? (
              <div className="text-center text-white/40 text-sm py-8">
                No transactions yet
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {(showAllTransactions ? allTransactions : transactions).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 ${
                          transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <Plus className="w-4 h-4" />
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-white/90 text-sm">
                            {transaction.description}
                          </div>
                          <div className="text-white/40 text-xs">
                            {safeFormatDistance(transaction.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm">
                          {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()}
                        </div>
                        <div className="text-white/40 text-xs">
                          {transaction.balanceAfter.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View All Button */}
                {!showAllTransactions && allTransactions.length > DEFAULT_TRANSACTION_LIMIT && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAllTransactions(true)}
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      View all {allTransactions.length} transactions →
                    </button>
                  </div>
                )}

                {/* Show Less Button */}
                {showAllTransactions && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAllTransactions(false)}
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      ← Show less
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Buy Credits Modal - iOS Style */}
      {showBuyCreditsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-black/95 border border-white/10 rounded-3xl p-8 w-full max-w-lg backdrop-blur-xl shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-light text-white mb-3">Buy Credits</h3>
              <p className="text-white/50 text-sm">Choose a credit package that never expires</p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                { credits: 1000, price: 10, bonus: 0, popular: false },
                { credits: 5000, price: 45, bonus: 500, popular: true },
                { credits: 10000, price: 85, bonus: 1500, popular: false },
                { credits: 25000, price: 200, bonus: 5000, popular: false }
              ].map((pkg, index) => (
                <div
                  key={index}
                  className={`
                    relative bg-white/[0.05] border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02]
                    ${pkg.popular
                      ? 'border-blue-500/40 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                    }
                  `}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-5 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Most Popular
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="text-xl font-light text-white">
                          {(pkg.credits + pkg.bonus).toLocaleString()}
                        </div>
                        {pkg.bonus > 0 && (
                          <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-medium">
                            +{pkg.bonus.toLocaleString()} bonus
                          </div>
                        )}
                      </div>
                      <div className="text-white/40 text-sm">credits • never expires</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-light text-white">${pkg.price}</div>
                      <div className="text-white/40 text-xs">one-time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowBuyCreditsModal(false)}
                className="flex-1 h-12 border border-white/20 text-white hover:bg-white/10 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement purchase flow
                  setShowBuyCreditsModal(false)
                }}
                className="flex-1 h-12 bg-white text-black hover:bg-white/90 rounded-xl font-medium"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}