'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-client-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Activity,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CreditTransaction {
  id: string
  amount: number
  type: 'credit' | 'debit'
  reason: string
  description: string
  balanceBefore: number
  balanceAfter: number
  createdAt: number
  metadata?: any
}

interface UsageSectionProps {
  className?: string
}

export default function UsageSection({ className }: UsageSectionProps) {
  const { user } = useAuth()
  const [creditBalance, setCreditBalance] = useState<number>(0)
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadUsageData = async () => {
    if (!user?.id) return

    try {
      setIsRefreshing(true)

      // Use unified credit service
      const balance = await UnifiedCreditsService.getUserCredits(user.id)
      setCreditBalance(balance.total || 0)

      const history = await UnifiedCreditsService.getCreditHistory(user.id, 20)
      const mappedHistory: CreditTransaction[] = history.map((item) => ({
        id: item.id,
        amount: item.amount,
        type: item.type,
        reason: item.reason,
        description: item.description,
        balanceBefore: 0, // Calculate if needed
        balanceAfter: 0,  // Calculate if needed
        createdAt: item.createdAt,
        metadata: item.metadata
      }))
      setCreditHistory(mappedHistory)
    } catch (error) {
      console.error('Error loading usage data:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadUsageData()
  }, [user?.id])

  const formatTimestamp = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  const getTransactionIcon = (type: string, reason: string) => {
    if (type === 'credit') {
      return <TrendingUp className="w-4 h-4 text-green-600" />
    } else {
      if (reason === 'image_enhancement') {
        return <Activity className="w-4 h-4 text-blue-600" />
      }
      return <TrendingDown className="w-4 h-4 text-red-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600'
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Usage & Credits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-slate-200 rounded-lg"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Usage & Credits</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsageData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Balance */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-slate-900">
                {creditBalance.toLocaleString()} credits
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Transaction History - All Credits and Debits */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-900">All Credits & Debits</h3>
            <Badge variant="secondary">{creditHistory.length} transactions</Badge>
          </div>

          {creditHistory.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No transactions yet</p>
              <p className="text-xs text-slate-400">All credit additions, purchases, and usage will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {creditHistory.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type, transaction.reason)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {transaction.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {transaction.reason.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatTimestamp(transaction.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      Balance: {transaction.balanceAfter.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Credits Added</p>
            <p className="text-lg font-semibold text-green-600">
              +{creditHistory
                .filter(t => t.type === 'credit')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Credits Used</p>
            <p className="text-lg font-semibold text-red-600">
              -{creditHistory
                .filter(t => t.type === 'debit')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}