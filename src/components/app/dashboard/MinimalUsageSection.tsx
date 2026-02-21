'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-client-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import {
  Coins,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  timestamp: number
  balanceAfter: number
}

interface MinimalUsageSectionProps {
  className?: string
}

export default function MinimalUsageSection({ className }: MinimalUsageSectionProps) {
  const { user } = useAuth()
  const [currentBalance, setCurrentBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = async () => {
    if (!user?.id) return

    try {
      setIsRefreshing(true)

      // Get current balance
      const balance = await UnifiedCreditsService.getUserCredits(user.id)
      setCurrentBalance(balance.total || 0)

      // Get credit transactions
      const creditHistory = await UnifiedCreditsService.getCreditHistory(user.id, 50)

      const allTransactions: Transaction[] = creditHistory.map(credit => ({
        id: credit.id,
        type: credit.type,
        amount: credit.amount,
        description: credit.description || credit.reason,
        timestamp: credit.createdAt,
        balanceAfter: 0
      }))

      // Sort by timestamp (most recent first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp)

      // Calculate running balance (working backwards from current balance)
      let runningBalance = balance.total || 0
      for (let i = 0; i < allTransactions.length; i++) {
        const transaction = allTransactions[i]
        if (!transaction) continue

        transaction.balanceAfter = runningBalance

        // Adjust balance for the next (older) transaction
        if (transaction.type === 'credit') {
          runningBalance -= transaction.amount // Remove the credit we just processed
        } else {
          runningBalance += transaction.amount // Add back the debit we just processed
        }
      }

      setTransactions(allTransactions.slice(0, 10))
    } catch (error) {
      console.error('Failed to load credits:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Credits & Usage</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Balance */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <div className="text-sm text-slate-600 mb-1">Current Balance</div>
          <div className="text-3xl font-bold text-slate-900">
            {currentBalance.toLocaleString()}
          </div>
          <div className="text-sm text-slate-500">credits</div>
        </div>

        {/* Transaction Timeline */}
        <div>
          <div className="text-sm font-medium text-slate-900 mb-4">Recent Activity</div>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Coins className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No transactions yet</div>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${transaction.type === 'credit'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                      }`}>
                      {transaction.type === 'credit' ? (
                        <Plus className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {transaction.description}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className={`text-sm font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {transaction.balanceAfter.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Credits Added</div>
            <div className="text-lg font-semibold text-green-600">
              +{transactions
                .filter(t => t.type === 'credit')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Credits Used</div>
            <div className="text-lg font-semibold text-red-600">
              -{transactions
                .filter(t => t.type === 'debit')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}