'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client-simple'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaymentDebugPage() {
  const { data: authData, isLoading: sessionLoading } = useSession()
  const [storedPlan, setStoredPlan] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  useEffect(() => {
    // Check for stored plan
    const plan = localStorage.getItem('selectedPlan')
    setStoredPlan(plan)
    addLog(`Page loaded - Stored plan: ${plan || 'None'}`)
  }, [])

  useEffect(() => {
    addLog(`Auth state changed - User: ${authData?.user?.email || 'None'}, Loading: ${sessionLoading}`)
  }, [authData, sessionLoading])

  const clearStoredPlan = () => {
    localStorage.removeItem('selectedPlan')
    setStoredPlan(null)
    addLog('Cleared stored plan')
  }

  const setTestPlan = () => {
    const testPlan = {
      plan: 'basic',
      billingPeriod: 'monthly'
    }
    localStorage.setItem('selectedPlan', JSON.stringify(testPlan))
    setStoredPlan(JSON.stringify(testPlan))
    addLog(`Set test plan: ${JSON.stringify(testPlan)}`)
  }

  const testCheckoutAPI = async () => {
    addLog('Testing checkout API...')
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          plan: 'basic',
          billingPeriod: 'monthly'
        })
      })

      const data = await response.json()
      addLog(`Checkout API response: ${response.status} - ${JSON.stringify(data)}`)
    } catch (error) {
      addLog(`Checkout API error: ${error}`)
    }
  }

  const checkCredits = async () => {
    addLog('Checking user credits...')
    try {
      const response = await fetch('/api/debug/credits', {
        method: 'GET',
        credentials: 'include'
      })

      const data = await response.json()
      addLog(`Credits response: ${response.status} - ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      addLog(`Credits check error: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Flow Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Authentication Status</h3>
            <p>User: {authData?.user?.email || 'Not authenticated'}</p>
            <p>Loading: {sessionLoading ? 'Yes' : 'No'}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Stored Plan</h3>
            <p className="mb-2">{storedPlan || 'No stored plan'}</p>
            <div className="space-x-2">
              <Button onClick={setTestPlan} variant="outline">Set Test Plan</Button>
              <Button onClick={clearStoredPlan} variant="outline">Clear Plan</Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">API Testing</h3>
            <div className="space-x-2">
              <Button onClick={testCheckoutAPI} variant="outline">Test Checkout API</Button>
              <Button onClick={checkCredits} variant="outline">Check Credits</Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Debug Logs</h3>
            <Button onClick={clearLogs} variant="outline" className="mb-2">Clear Logs</Button>
            <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}