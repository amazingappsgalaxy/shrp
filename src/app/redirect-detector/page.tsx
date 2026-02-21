'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowRight } from 'lucide-react'
import { PaymentRedirectHandler } from '@/lib/payment-redirect-handler'

export default function RedirectDetectorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader className="space-y-4">
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
              <CardTitle className="text-2xl font-bold text-gray-900">Detecting...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <RedirectDetectorClient />
    </Suspense>
  )
}

function RedirectDetectorClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'detecting' | 'redirecting' | 'error'>('detecting')
  const [redirectUrl, setRedirectUrl] = useState<string>('')

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const currentUrl = window.location.href
        console.log('🔍 Redirect detector - Current URL:', currentUrl)
        
        // Check if this is a return from Dodo
        const dodoRedirect = PaymentRedirectHandler.detectDodoRedirect(currentUrl)
        console.log('🎯 Dodo redirect detection:', dodoRedirect)
        
        if (dodoRedirect.isDodoRedirect && dodoRedirect.redirectUrl) {
          setRedirectUrl(dodoRedirect.redirectUrl)
          setStatus('redirecting')
          
          setTimeout(() => {
            router.push(dodoRedirect.redirectUrl!)
          }, 2000)
          return
        }
        
        // Check for standard payment redirect patterns
        const redirectTarget = await PaymentRedirectHandler.handlePostPaymentRedirect(currentUrl)
        console.log('📍 Standard redirect target:', redirectTarget)
        
        if (redirectTarget) {
          setRedirectUrl(redirectTarget)
          setStatus('redirecting')
          
          setTimeout(() => {
            router.push(redirectTarget)
          }, 2000)
          return
        }
        
        // No specific redirect needed, go to dashboard
        console.log('🏠 No specific redirect, going to dashboard')
        setRedirectUrl('/app/dashboard')
        setStatus('redirecting')
        
        setTimeout(() => {
          router.push('/app/dashboard')
        }, 2000)
        
      } catch (error) {
        console.error('❌ Redirect detection error:', error)
        setStatus('error')
        
        // Fallback to dashboard after error
        setTimeout(() => {
          router.push('/app/dashboard')
        }, 3000)
      }
    }

    handleRedirect()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader className="space-y-4">
          <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
          <CardTitle className="text-2xl font-bold text-gray-900">
            {status === 'detecting' && 'Detecting Payment Status...'}
            {status === 'redirecting' && 'Redirecting...'}
            {status === 'error' && 'Resolving Issue...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'detecting' && (
            <p className="text-gray-600">
              We're checking your payment status and preparing your redirect...
            </p>
          )}
          
          {status === 'redirecting' && (
            <>
              <p className="text-gray-600 mb-4">
                Payment processing complete! Taking you to your dashboard...
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-blue-800">
                  <span>Redirecting to:</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-mono">{redirectUrl}</span>
                </div>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <p className="text-gray-600 mb-4">
                We encountered a small issue, but we're taking you to your dashboard...
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  If you just completed a payment, your credits should appear shortly.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}