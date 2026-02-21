'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2, XCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader className="space-y-4">
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
              <CardTitle className="text-2xl font-bold text-gray-900">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <PaymentStatusClient />
    </Suspense>
  )
}

function PaymentStatusClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const paymentId = searchParams.get('payment_id')
    const sessionId = searchParams.get('session_id')
    const statusParam = searchParams.get('status')
    
    console.log('Payment status check - URL params:', {
      paymentId,
      sessionId,
      statusParam,
      allParams: Object.fromEntries(searchParams.entries())
    })

    // If we have clear success indicators
    if (statusParam === 'succeeded' || statusParam === 'completed') {
      setStatus('success')
      startSuccessCountdown()
      return
    }

    // If we have clear failure indicators
    if (statusParam === 'failed' || statusParam === 'cancelled') {
      setStatus('failed')
      return
    }

    // If we have a payment ID, check its status
    if (paymentId || sessionId) {
      const id = paymentId || sessionId
      if (id) {
        checkPaymentStatus(id)
      }
    } else {
      // No payment info, redirect to pricing
      setTimeout(() => {
        router.push('/#pricing-section')
      }, 2000)
    }
  }, [router, searchParams])

  const checkPaymentStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/payments/status?payment_id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setPaymentData(data)
        
        if (data.status === 'completed' || data.status === 'succeeded') {
          setStatus('success')
          startSuccessCountdown()
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          setStatus('failed')
        } else {
          setStatus('pending')
          // Poll again in 3 seconds
          setTimeout(() => checkPaymentStatus(id), 3000)
        }
      } else {
        setStatus('failed')
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      setStatus('failed')
    }
  }

  const startSuccessCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/app/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleManualRedirect = () => {
    if (status === 'success') {
      router.push('/app/dashboard')
    } else {
      router.push('/#pricing-section')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
      case 'pending':
        return <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-600 mx-auto" />
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'checking':
        return 'Checking Payment Status...'
      case 'pending':
        return 'Payment Pending...'
      case 'success':
        return 'Payment Successful!'
      case 'failed':
        return 'Payment Failed'
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return "We're verifying your payment details..."
      case 'pending':
        return 'Your payment is being processed. Please wait...'
      case 'success':
        return 'Your payment has been processed successfully! Credits have been added to your account.'
      case 'failed':
        return 'There was an issue with your payment. Please try again or contact support.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader className="space-y-4">
          {getStatusIcon()}
          <CardTitle className="text-2xl font-bold text-gray-900">
            {getStatusTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 mb-4">
            {getStatusMessage()}
          </p>
          
          {paymentData && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
              <p><strong>Payment ID:</strong> {paymentData.payment_id}</p>
              <p><strong>Amount:</strong> {paymentData.amount} {paymentData.currency}</p>
              <p><strong>Status:</strong> {paymentData.status}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">
                Redirecting to your dashboard in {countdown} seconds...
              </p>
              <Button 
                onClick={handleManualRedirect}
                className="mt-2 w-full"
                variant="outline"
              >
                Go to Dashboard Now
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <Button 
                onClick={handleManualRedirect}
                className="mt-2 w-full"
                variant="outline"
              >
                Try Again
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                This may take a few moments. Please don't close this window.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}