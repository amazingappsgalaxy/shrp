'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  Clock,
  Zap,
  CreditCard,
  Activity,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react'
import { CreditManager, creditUtils } from '@/lib/credits'
import { CreditsService } from '@/lib/credits-service'
import { motion } from 'framer-motion'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-client-simple'

interface CreditTransaction {
  id: string
  amount: number
  type: 'credit' | 'debit'
  reason: string
  description: string
  createdAt: number
  balanceBefore?: number
  balanceAfter?: number
  enhancementTaskId?: string
  expiryInfo?: {
    expires: string
  }
  isPermanent?: boolean
  isSubscription?: boolean
}

interface CreditBalance {
  total: number
  active: number
  expiring: number
  expired: number
}

export function UsageDashboard() {
  const { user } = useAuth()
  const [creditBalance, setCreditBalance] = useState<CreditBalance>({ total: 0, active: 0, expiring: 0, expired: 0 })
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadUsageData()
    }
  }, [user?.id])

  // Periodically refresh usage data every 30 seconds to keep credits up-to-date
  useEffect(() => {
    if (!user?.id) return
    const interval = setInterval(() => {
      loadUsageData()
    }, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  const loadUsageData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        setError('User not authenticated')
        return
      }

      // Use our new API endpoints - handle each API independently
      let balanceData = null
      let historyData = null

      try {
        const balanceRes = await fetch('/api/credits/balance', { credentials: 'include' })
        if (balanceRes.ok) {
          balanceData = await balanceRes.json()
        }
      } catch (error) {
        console.error('Failed to fetch balance data:', error)
      }

      try {
        const historyRes = await fetch('/api/credits/history?limit=20', { credentials: 'include' })
        if (historyRes.ok) {
          historyData = await historyRes.json()
          console.log('History API response:', historyData)
        } else {
          console.error('History API failed with status:', historyRes.status)
        }
      } catch (error) {
        console.error('Failed to fetch history data:', error)
      }

      // Calculate expiring soon credits (within 7 days)
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      let expiringSoon = 0
      if (balanceData?.breakdown?.expiring) {
        expiringSoon = balanceData.breakdown.expiring
          .filter((credit: any) => {
            const expiration = new Date(credit.expires_at)
            return expiration <= sevenDaysFromNow && expiration > now
          })
          .reduce((sum: number, credit: any) => sum + (credit.amount || 0), 0)
      }

      setCreditBalance({
        total: balanceData?.remaining || 0,
        active: balanceData?.remaining || 0,
        expiring: expiringSoon,
        expired: 0
      })

      // Transform history data - use new API data if available
      if (historyData?.history) {
        const typedHistory: CreditTransaction[] = historyData.history.map((h: any) => ({
          id: h.id,
          amount: h.amount,
          type: h.type,
          reason: h.source || h.reason || 'unknown',
          description: h.displayName || h.description,
          createdAt: h.createdAt,
          balanceBefore: undefined,
          balanceAfter: undefined,
          enhancementTaskId: h.metadata?.enhancement_task_id,
          expiryInfo: h.expiryInfo,
          isPermanent: h.isPermanent,
          isSubscription: h.isSubscription
        }))
        setTransactions(typedHistory)
        console.log('✅ Using new history API data with', typedHistory.length, 'transactions')
      } else {
        console.log('❌ History API failed, keeping existing transactions')
      }

    } catch (err) {
      console.error('Error loading usage data:', err)
      setError('Failed to load usage data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (transaction: CreditTransaction) => {
    if (transaction.type === 'credit') {
      return <ArrowUp className="h-4 w-4 text-green-500" />
    } else {
      return <ArrowDown className="h-4 w-4 text-red-500" />
    }
  }

  const getTransactionColor = (transaction: CreditTransaction) => {
    return transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">{error}</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Credit Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Available Credits</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {creditUtils.formatCredits(creditBalance.active)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Earned</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {creditUtils.formatCredits(transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Used</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {creditUtils.formatCredits(Math.abs(transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)))}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {creditUtils.formatCredits(creditBalance.expiring)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Credit History
            </h3>
            <button
              onClick={loadUsageData}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions yet. Start using credits to see your history here.
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                      {/* Show expiration info for credit transactions */}
                      {transaction.type === 'credit' && (
                        <div className="flex items-center gap-2 mt-1">
                          {transaction.isSubscription ? (
                            <>
                              <Calendar className="h-3 w-3 text-blue-500" />
                              <p className="text-xs text-blue-600">
                                Subscription credits • {transaction.expiryInfo ? `Expires ${transaction.expiryInfo.expires}` : 'Monthly expiry'}
                              </p>
                            </>
                          ) : transaction.isPermanent ? (
                            <>
                              <Coins className="h-3 w-3 text-green-500" />
                              <p className="text-xs text-green-600">
                                Permanent credits • No expiration
                              </p>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-blue-500" />
                              <p className="text-xs text-blue-600">
                                Credits allocated
                              </p>
                            </>
                          )}
                        </div>
                      )}
                      {/* Show task info for debit transactions */}
                      {transaction.type === 'debit' && transaction.enhancementTaskId && (
                        <div className="flex items-center gap-2 mt-1">
                          <Zap className="h-3 w-3 text-purple-500" />
                          <p className="text-xs text-purple-600">
                            Task: {transaction.enhancementTaskId.slice(-8)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getTransactionColor(transaction)}`}>
                      {transaction.type === 'credit' ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    {transaction.balanceAfter != null && (
                      <p className="text-sm text-gray-500">
                        Balance: {transaction.balanceAfter.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}