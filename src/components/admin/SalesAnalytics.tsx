'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface SalesData {
  totalRevenue: number
  monthlyRevenue: number
  weeklyRevenue: number
  dailyRevenue: number
  totalTransactions: number
  successfulTransactions: number
  averageTransactionValue: number
  revenueGrowth: number
  customerGrowth: number
  subscriptionBreakdown: Record<string, number>
  recentTransactions: PaymentRecord[]
  revenueByMonth: Array<{ month: string; revenue: number; transactions: number }>
}

interface PaymentRecord {
  id: string
  userId: string
  userEmail?: string
  amount: number
  currency: string
  status: string
  plan?: string
  paymentMethod?: string
  paidAt: string
  creditsGranted: number
}

export function SalesAnalytics() {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadSalesData()
  }, [timeRange])

  const loadSalesData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/sales-analytics?range=${timeRange}`)
      if (!response.ok) throw new Error('Failed to load sales data')

      const data = await response.json()
      setSalesData(data.salesData)
    } catch (error) {
      console.error('Error loading sales data:', error)
      toast.error('Failed to load sales analytics')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadSalesData()
    setRefreshing(false)
    toast.success('Sales data refreshed')
  }

  const exportData = async () => {
    try {
      const response = await fetch(`/api/admin/export-sales?range=${timeRange}`)
      if (!response.ok) throw new Error('Failed to export data')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Sales report exported')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export sales report')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'failed': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading sales analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gray-900/50 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-green-500" />
            <div>
              <h2 className="text-xl font-bold text-white">Sales Analytics</h2>
              <p className="text-sm text-gray-400">Revenue tracking and sales insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refreshData} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        {salesData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-4 bg-gray-800/50 border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">${(salesData.totalRevenue / 100).toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                <span className="text-green-400">{salesData.revenueGrowth.toFixed(1)}% growth</span>
              </div>
            </Card>

            <Card className="p-4 bg-gray-800/50 border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white">${(salesData.monthlyRevenue / 100).toLocaleString()}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <span className="text-gray-400 text-sm">
                  Weekly: ${(salesData.weeklyRevenue / 100).toLocaleString()}
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-gray-800/50 border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Transactions</p>
                  <p className="text-2xl font-bold text-white">{salesData.totalTransactions.toLocaleString()}</p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-500" />
              </div>
              <div className="mt-2">
                <span className="text-green-400 text-sm">
                  {salesData.successfulTransactions} successful
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-gray-800/50 border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Transaction</p>
                  <p className="text-2xl font-bold text-white">${(salesData.averageTransactionValue / 100).toFixed(2)}</p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                <span className="text-green-400">{salesData.customerGrowth.toFixed(1)}% customer growth</span>
              </div>
            </Card>
          </div>
        )}
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-900/50 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Subscription Plans</h3>
          <div className="space-y-3">
            {salesData && Object.entries(salesData.subscriptionBreakdown).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-white capitalize">{plan}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{count} customers</span>
                  <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                    {((count / salesData.totalTransactions) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gray-900/50 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue by Month</h3>
          <div className="space-y-3">
            {salesData && salesData.revenueByMonth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-white">{item.month}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">${(item.revenue / 100).toLocaleString()}</span>
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    {item.transactions} txns
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6 bg-gray-900/50 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <Badge variant="outline" className="text-gray-400 border-gray-500/30">
            Last {salesData?.recentTransactions.length || 0} transactions
          </Badge>
        </div>

        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800/50">
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Customer</TableHead>
                <TableHead className="text-white">Plan</TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">Credits</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData && salesData.recentTransactions.length > 0 ? (
                salesData.recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-gray-700">
                    <TableCell className="text-white">
                      {new Date(transaction.paidAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-white">
                      {transaction.userEmail || `User ${transaction.userId.slice(0, 8)}...`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                        {transaction.plan || 'Credits'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">
                      ${(transaction.amount / 100).toFixed(2)} {transaction.currency.toUpperCase()}
                    </TableCell>
                    <TableCell className="text-white">
                      {transaction.creditsGranted.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}