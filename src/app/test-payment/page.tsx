"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/lib/auth-client-simple'

export default function TestPaymentPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<Record<string, any> | null>(null)
  const { data: authData } = useSession()
  const router = useRouter()

  const testPayment = async (plan: string, billingPeriod: string) => {
    console.log('=== PAYMENT TEST START ===')
    console.log('Plan:', plan)
    console.log('Billing Period:', billingPeriod)
    console.log('Auth Data:', authData)
    
    setIsLoading(true)
    setDebugInfo({ step: 'Starting payment test...', authData })
    
    try {
      // Check authentication
      if (!authData?.user) {
        console.log('User not authenticated, redirecting to login')
        setDebugInfo({ step: 'User not authenticated', authData })
        router.push('/app/login?redirect=/test-payment')
        return
      }
      
      console.log('User authenticated, proceeding to checkout API')
      setDebugInfo({ step: 'User authenticated, calling checkout API...', user: authData.user })
      
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          plan,
          billingPeriod
        })
      })
      
      console.log('Checkout API response status:', response.status)
      setDebugInfo(prev => ({ ...prev || {}, responseStatus: response.status }))
      
      let data: any = null
      try {
        data = await response.json()
        console.log('Checkout API response data:', data)
        setDebugInfo(prev => ({ ...prev, responseData: data }))
      } catch (e) {
        console.error('Failed to parse checkout response:', e)
        setDebugInfo(prev => ({ ...prev || {}, parseError: e }))
      }
      
      if (response.status === 401) {
        console.log('Received 401, user session invalid')
        setDebugInfo(prev => ({ ...prev || {}, error: 'Session invalid' }))
        router.push('/app/login?redirect=/test-payment')
        return
      }
      
      if (!response.ok) {
        const message = (data && data.error) ? data.error : 'Failed to create checkout session'
        console.error('Checkout failed:', message)
        
        // Check if it's an API key authentication error
        if (message.includes('Invalid Dodo Payments API key') || message.includes('401 status code')) {
          setDebugInfo(prev => ({ 
            ...prev || {}, 
            error: message,
            isApiKeyError: true,
            solution: 'The Dodo Payments API key is invalid. Please check DODO_PAYMENTS_SETUP.md for setup instructions.'
          }))
          toast.error('Payment system configuration error - Invalid API key')
        } else {
          setDebugInfo(prev => ({ ...prev || {}, error: message }))
          toast.error(message)
        }
        return
      }
      
      // Success - redirect to checkout
      if (data && data.checkoutUrl) {
        console.log('SUCCESS: Redirecting to checkout URL:', data.checkoutUrl)
        setDebugInfo(prev => ({ ...prev || {}, success: true, checkoutUrl: data.checkoutUrl }))
        toast.success('Redirecting to payment...')
        window.location.href = data.checkoutUrl
      } else {
        console.error('No checkout URL received')
        setDebugInfo(prev => ({ ...prev || {}, error: 'No checkout URL received' }))
        toast.error('No checkout URL received')
      }
      
    } catch (error) {
      console.error('Payment test error:', error)
      setDebugInfo(prev => ({ ...prev || {}, error: error instanceof Error ? error.message : 'Unknown error' }))
      toast.error(error instanceof Error ? error.message : 'Payment test failed')
    } finally {
      setIsLoading(false)
      console.log('=== PAYMENT TEST END ===')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Payment System Test</h1>
        
        {/* Auth Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            {authData?.user ? (
              <div className="text-green-600">
                ✅ Logged in as: {authData.user.email}
              </div>
            ) : (
              <div className="text-red-600">
                ❌ Not logged in
                <Button 
                  onClick={() => router.push('/app/login?redirect=/test-payment')}
                  className="ml-4"
                >
                  Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Payment Buttons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Payment Flow</CardTitle>
            <CardDescription>
              Click any button below to test the payment flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => testPayment('basic', 'monthly')}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Testing...' : 'Test Basic Monthly ($9)'}
              </Button>
              
              <Button 
                onClick={() => testPayment('basic', 'yearly')}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Testing...' : 'Test Basic Yearly ($108)'}
              </Button>
              
              <Button 
                onClick={() => testPayment('creator', 'monthly')}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Testing...' : 'Test Creator Monthly ($25)'}
              </Button>
              
              <Button 
                onClick={() => testPayment('creator', 'yearly')}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Testing...' : 'Test Creator Yearly ($252)'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        {debugInfo && (
          <div className="mt-8">
            {debugInfo.isApiKeyError ? (
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">Payment System Configuration Error</h3>
                  </div>
                </div>
                <div className="text-red-700">
                  <p className="mb-3"><strong>Issue:</strong> Invalid Dodo Payments API key</p>
                  <p className="mb-3"><strong>Solution:</strong> {debugInfo.solution}</p>
                  <div className="bg-red-100 p-3 rounded border">
                    <p className="text-sm font-medium mb-2">Quick Fix Steps:</p>
                    <ol className="text-sm list-decimal list-inside space-y-1">
                      <li>Get a valid API key from your Dodo Payments dashboard</li>
                      <li>Update the DODO_PAYMENTS_API_KEY in your .env file</li>
                      <li>Restart the development server</li>
                      <li>Check DODO_PAYMENTS_SETUP.md for detailed instructions</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}