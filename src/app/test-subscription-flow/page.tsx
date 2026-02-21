"use client"

import { useState } from 'react'
import { useSession } from '@/lib/auth-client-simple'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, X, AlertCircle, ExternalLink } from 'lucide-react'

interface TestResult {
  step: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
  url?: string
}

export default function TestSubscriptionFlow() {
  const { data: session } = useSession()
  const router = useRouter()
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r))
  }

  const testSubscriptionFlow = async () => {
    setIsRunning(true)
    setResults([])

    // Test 1: Check authentication
    const authIndex = results.length
    addResult({ step: 'Authentication Check', status: 'pending', message: 'Checking user session...' })
    
    if (!session?.user) {
      updateResult(authIndex, { 
        status: 'error', 
        message: 'User not authenticated. Please login first.',
        url: '/app/login'
      })
      setIsRunning(false)
      return
    }
    
    updateResult(authIndex, { 
      status: 'success', 
      message: `Authenticated as ${session.user.email}`,
      data: { userId: session.user.id, email: session.user.email }
    })

    // Test 2: Test Basic Plan Subscription Creation
    const basicIndex = results.length
    addResult({ step: 'Basic Plan Subscription', status: 'pending', message: 'Creating Basic plan subscription...' })
    
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'basic',
          billingPeriod: 'monthly'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        updateResult(basicIndex, { 
          status: 'success', 
          message: 'Basic subscription created successfully!',
          data: { 
            checkoutUrl: data.checkoutUrl,
            subscriptionId: data.subscriptionId
          },
          url: data.checkoutUrl
        })
      } else {
        updateResult(basicIndex, { 
          status: 'error', 
          message: `Failed: ${data.error || 'Unknown error'}`,
          data: data
        })
      }
    } catch (error) {
      updateResult(basicIndex, { 
        status: 'error', 
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }

    // Test 3: Test Creator Plan Subscription Creation
    const creatorIndex = results.length
    addResult({ step: 'Creator Plan Subscription', status: 'pending', message: 'Creating Creator plan subscription...' })
    
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'creator',
          billingPeriod: 'monthly'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        updateResult(creatorIndex, { 
          status: 'success', 
          message: 'Creator subscription created successfully!',
          data: { 
            checkoutUrl: data.checkoutUrl,
            subscriptionId: data.subscriptionId
          },
          url: data.checkoutUrl
        })
      } else {
        updateResult(creatorIndex, { 
          status: 'error', 
          message: `Failed: ${data.error || 'Unknown error'}`,
          data: data
        })
      }
    } catch (error) {
      updateResult(creatorIndex, { 
        status: 'error', 
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }

    // Test 4: Test Yearly Creator Plan
    const yearlyIndex = results.length
    addResult({ step: 'Creator Plan (Yearly)', status: 'pending', message: 'Creating Creator yearly subscription...' })
    
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'creator',
          billingPeriod: 'yearly'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        updateResult(yearlyIndex, { 
          status: 'success', 
          message: 'Yearly Creator subscription created successfully!',
          data: { 
            checkoutUrl: data.checkoutUrl,
            subscriptionId: data.subscriptionId
          },
          url: data.checkoutUrl
        })
      } else {
        updateResult(yearlyIndex, { 
          status: 'error', 
          message: `Failed: ${data.error || 'Unknown error'}`,
          data: data
        })
      }
    } catch (error) {
      updateResult(yearlyIndex, { 
        status: 'error', 
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }

    setIsRunning(false)
  }

  const openCheckoutUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />
      case 'error':
        return <X className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Running</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧪 Subscription Flow Test Suite
            </CardTitle>
            <CardDescription>
              Test the complete Dodo Payments subscription integration to ensure everything works correctly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!session?.user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <p>
                    You need to be logged in to test the subscription flow.{' '}
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-blue-600"
                      onClick={() => router.push('/app/login')}
                    >
                      Login here
                    </Button>
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={testSubscriptionFlow}
                disabled={!session?.user || isRunning}
                className="flex items-center gap-2"
              >
                {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
                Run Subscription Tests
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setResults([])}
                disabled={isRunning}
              >
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Results from the subscription flow tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(result.status)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{result.step}</h4>
                        {getStatusBadge(result.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {result.message}
                      </p>
                      
                      {result.data && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600">Show data</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      {result.url && result.status === 'success' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCheckoutUrl(result.url!)}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open Checkout
                        </Button>
                      )}
                      
                      {result.url && result.status === 'error' && result.step === 'Authentication Check' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(result.url!)}
                          className="flex items-center gap-2"
                        >
                          Go to Login
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Manual Testing Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">After running the tests:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Open Checkout" for any successful subscription test</li>
                <li>Complete the payment flow on the Dodo Payments page</li>
                <li>Return to the app and check if credits were allocated</li>
                <li>Go to the dashboard to verify subscription status</li>
                <li>Check the billing section for payment history</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Expected Product IDs in Dodo Dashboard:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground font-mono">
                <li>Basic Monthly: pdt_2bc24CYBPFj8olU2KxuiG</li>
                <li>Creator Monthly: pdt_ALjMHf8bJnZD0GRtNnUAY</li>
                <li>Creator Yearly: pdt_WNr5iJDaFOiDCXWKZWjX2</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}