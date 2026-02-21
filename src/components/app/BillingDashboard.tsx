'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Download, 
  Receipt, 
  Calendar, 
  DollarSign,
  RefreshCw,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/lib/auth-client-simple'

interface Payment {
  id: string
  dodoPaymentId: string
  amount: number
  currency: string
  status: string
  plan: string
  billingPeriod: string
  creditsGranted: number
  createdAt: number
  paidAt: number
  invoiceUrl?: string
}

interface Invoice {
  id: string
  paymentId: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  issuedAt: number
  dueAt: number
  downloadUrl: string
}

export default function BillingDashboard() {
  const { user: authData, isLoading: authLoading } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)

  const loadBillingData = async () => {
    if (!authData?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Load real payments from API
      const paymentsResponse = await fetch('/api/billing/payments', {
        credentials: 'include'
      })

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        setPayments(paymentsData.payments || [])
      } else {
        // Fallback to empty if API fails
        setPayments([])
      }

    } catch (error) {
      console.error('Error loading billing data:', error)
      // Show empty state on error instead of error message
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only load data when auth is not loading and we have a user
    if (!authLoading) {
      loadBillingData()
    }
  }, [authData, authLoading])

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Checking authentication...</span>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-red-500 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Unable to Load Billing Data</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
        <Button onClick={loadBillingData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  const downloadInvoice = async (paymentId: string, dodoPaymentId: string) => {
    try {
      setDownloadingInvoice(paymentId)

      const response = await fetch(`/api/billing/invoice/${dodoPaymentId}/download`, {
        credentials: 'include'
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')

        if (contentType?.includes('application/pdf')) {
          // Handle PDF download
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `invoice-${dodoPaymentId}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          // Handle JSON response (fallback invoice data)
          const data = await response.json()
          if (data.downloadUrl) {
            const a = document.createElement('a')
            a.href = data.downloadUrl
            a.download = `invoice-${dodoPaymentId}.pdf`
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }
        }
      } else {
        console.error('Failed to download invoice:', response.statusText)
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
    } finally {
      setDownloadingInvoice(null)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100) // Convert from cents
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading billing information...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Payment Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/3 border border-white/8 rounded-lg p-4">
          <div className="text-center">
            <div className="text-xl font-light text-white mb-1">
              {formatAmount(
                payments
                  .filter(p => p.status === 'completed')
                  .reduce((sum, p) => sum + p.amount, 0),
                payments[0]?.currency || 'USD'
              )}
            </div>
            <div className="text-sm text-white/50">Total Spent</div>
          </div>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-lg p-4">
          <div className="text-center">
            <div className="text-xl font-light text-white mb-1">
              {payments.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-sm text-white/50">Total Payments</div>
          </div>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-lg p-4">
          <div className="text-center">
            <div className="text-xl font-light text-white mb-1">
              {formatAmount(
                payments
                  .filter(p =>
                    p.status === 'completed' &&
                    new Date(p.paidAt).getMonth() === new Date().getMonth()
                  )
                  .reduce((sum, p) => sum + p.amount, 0),
                payments[0]?.currency || 'USD'
              )}
            </div>
            <div className="text-sm text-white/50">This Month</div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white/3 border border-white/8 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-light text-white">Payment History</h3>
          <button
            onClick={loadBillingData}
            className="text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-2">
          {payments.length === 0 ? (
            <div className="text-center py-6 text-white/50">
              <div className="text-sm">No payment history yet</div>
              <div className="text-xs text-white/30 mt-1">Your purchases will appear here</div>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <div>
                    <div className="text-sm text-white/90 capitalize">{payment.plan} Plan - {payment.billingPeriod}</div>
                    <div className="text-xs text-white/40">
                      {formatDate(payment.paidAt)} • {payment.creditsGranted?.toLocaleString() || '0'} credits
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-white/70">
                      {formatAmount(payment.amount, payment.currency)}
                    </div>
                  </div>
                  {payment.status === 'completed' && (
                    <button
                      onClick={() => downloadInvoice(payment.id, payment.dodoPaymentId)}
                      disabled={downloadingInvoice === payment.id}
                      className="bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      {downloadingInvoice === payment.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      PDF
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}