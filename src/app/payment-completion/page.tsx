'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentPollerProps {
  userId: string
  onPaymentDetected: (paymentData: any) => void
}

export function PaymentPoller({ userId, onPaymentDetected }: PaymentPollerProps) {
  const [lastChecked, setLastChecked] = useState<number>(Date.now())
  const [isPolling, setIsPolling] = useState(true)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!userId || !isPolling) return

    const pollForPayments = async () => {
      try {
        console.log('🔍 Polling for new payments since:', new Date(lastChecked).toISOString())
        
        const response = await fetch(`/api/payments/recent?userId=${userId}&since=${lastChecked}`)
        if (response.ok) {
          const data = await response.json()
          
          if (data.newPayments && data.newPayments.length > 0) {
            console.log('💰 New payment detected!', data.newPayments)
            setIsPolling(false)
            onPaymentDetected(data.newPayments[0])
          } else {
            setLastChecked(Date.now())
          }
        }
      } catch (error) {
        console.error('❌ Payment polling error:', error)
      }
    }

    // Poll immediately, then every 2 seconds for faster detection
    pollForPayments()
    const interval = setInterval(pollForPayments, 2000)
    setPollingInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [userId, isPolling, lastChecked, onPaymentDetected])

  return null // This component doesn't render anything
}

export default function PaymentCompletionPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'waiting' | 'detected' | 'completed' | 'timeout'>('waiting')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes timeout
  const [userId, setUserId] = useState<string | null>(null)

  // Get user session
  useEffect(() => {
    const getUserSession = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUserId(data.user?.id)
        }
      } catch (error) {
        console.error('Failed to get user session:', error)
      }
    }

    getUserSession()
  }, [])

  // Countdown timer
  useEffect(() => {
    if (status !== 'waiting') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setStatus('timeout')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [status])

  const handlePaymentDetected = (payment: any) => {
    console.log('🎉 Payment completion detected:', payment)
    setPaymentData(payment)
    setStatus('detected')
    
    // Show success message briefly, then redirect
    setTimeout(() => {
      setStatus('completed')
      setTimeout(() => {
        router.push('/app/dashboard?payment=success')
      }, 2000)
    }, 2000)
  }

  const handleManualCheck = async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/debug/credits`)
      if (response.ok) {
        const data = await response.json()
        if (data.credits.balance > 0) {
          setStatus('detected')
          setPaymentData({ manual: true })
          setTimeout(() => {
            router.push('/app/dashboard?payment=success')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Manual check failed:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {userId && (
        <PaymentPoller 
          userId={userId} 
          onPaymentDetected={handlePaymentDetected} 
        />
      )}
      
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader className="space-y-4">
          {status === 'waiting' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Waiting for Payment Completion
              </CardTitle>
            </>
          )}
          
          {status === 'detected' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Payment Successful!
              </CardTitle>
            </>
          )}
          
          {status === 'completed' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Redirecting to Dashboard...
              </CardTitle>
            </>
          )}
          
          {status === 'timeout' && (
            <>
              <AlertCircle className="h-16 w-16 text-orange-600 mx-auto" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Taking Longer Than Expected
              </CardTitle>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'waiting' && (
            <>
              <p className="text-gray-600 mb-4">
                We're automatically detecting when your payment completes. This usually takes just a few seconds.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">Time remaining:</span>
                  <span className="font-mono text-blue-900 font-bold">{formatTime(timeLeft)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleManualCheck}
                  className="w-full"
                  variant="outline"
                >
                  Check Now
                </Button>
                
                <Button 
                  onClick={() => router.push('/app/dashboard')}
                  className="w-full"
                  variant="ghost"
                >
                  Go to Dashboard
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
          
          {status === 'detected' && (
            <>
              <p className="text-gray-600 mb-4">
                Your payment has been processed successfully! Credits have been added to your account.
              </p>
              
              {paymentData && !paymentData.manual && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-800">
                    <div>Plan: {paymentData.plan}</div>
                    <div>Credits: +{paymentData.creditsGranted || 'Processing...'}</div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {status === 'completed' && (
            <p className="text-gray-600">
              Taking you to your dashboard where you can start using your credits...
            </p>
          )}
          
          {status === 'timeout' && (
            <>
              <p className="text-gray-600 mb-4">
                Your payment is likely processing. You can check your dashboard or try the manual check.
              </p>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleManualCheck}
                  className="w-full"
                >
                  Check for Credits
                </Button>
                
                <Button 
                  onClick={() => router.push('/app/dashboard')}
                  className="w-full"
                  variant="outline"
                >
                  Go to Dashboard
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}