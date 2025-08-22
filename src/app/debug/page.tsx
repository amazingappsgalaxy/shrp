'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [status, setStatus] = useState<string[]>([])
  const [error, setError] = useState<string>('')

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testBasicImports = async () => {
    try {
      addStatus('Testing basic imports...')
      
      // Test 1: Basic React
      addStatus('✓ React is working')
      
      // Test 2: Try to import Tebi config
      try {
        const { tebiConfig } = await import('@/lib/tebi')
        addStatus(`✓ Tebi config loaded: ${JSON.stringify(tebiConfig)}`)
      } catch (e) {
        addStatus(`✗ Tebi config import failed: ${e}`)
        throw e
      }
      
      // Test 3: Try to import Tebi client
      try {
        const { tebiClient } = await import('@/lib/tebi')
        addStatus(`✓ Tebi client loaded: ${tebiClient ? 'yes' : 'no'}`)
      } catch (e) {
        addStatus(`✗ Tebi client import failed: ${e}`)
        throw e
      }
      
      // Test 4: Try to import Tebi API
      try {
        const { tebiApi } = await import('@/lib/api/tebi')
        addStatus(`✓ Tebi API loaded: ${tebiApi ? 'yes' : 'no'}`)
      } catch (e) {
        addStatus(`✗ Tebi API import failed: ${e}`)
        throw e
      }
      
      addStatus('✓ All imports successful!')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      addStatus(`✗ Test failed: ${errorMessage}`)
      console.error('Debug test error:', err)
    }
  }

  const testEnvironment = () => {
    try {
      addStatus('Testing environment variables...')
      
      const envVars = {
        endpoint: process.env.NEXT_PUBLIC_TEBI_ENDPOINT,
        region: process.env.NEXT_PUBLIC_TEBI_REGION,
        bucket: process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME || process.env.TEBI_BUCKET_NAME,
        hasAccessKey: !!(process.env.NEXT_PUBLIC_TEBI_ACCESS_KEY_ID || process.env.TEBI_ACCESS_KEY_ID),
        hasSecretKey: !!(process.env.NEXT_PUBLIC_TEBI_SECRET_ACCESS_KEY || process.env.TEBI_SECRET_ACCESS_KEY)
      }
      
      addStatus(`Environment: ${JSON.stringify(envVars, null, 2)}`)
      
      if (!envVars.endpoint) {
        throw new Error('NEXT_PUBLIC_TEBI_ENDPOINT not set')
      }
      if (!envVars.region) {
        throw new Error('NEXT_PUBLIC_TEBI_REGION not set')
      }
      if (!envVars.bucket) {
        throw new Error('TEBI_BUCKET_NAME or NEXT_PUBLIC_TEBI_BUCKET_NAME not set')
      }
      if (!envVars.hasAccessKey) {
        throw new Error('TEBI_ACCESS_KEY_ID or NEXT_PUBLIC_TEBI_ACCESS_KEY_ID not set')
      }
      if (!envVars.hasSecretKey) {
        throw new Error('TEBI_SECRET_ACCESS_KEY or NEXT_PUBLIC_TEBI_SECRET_ACCESS_KEY not set')
      }
      
      addStatus('✓ All environment variables are set')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      addStatus(`✗ Environment test failed: ${errorMessage}`)
    }
  }

  const clearAll = () => {
    setStatus([])
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tebi.io Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Basic Tests</h2>
            <button
              onClick={testBasicImports}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 mb-3"
            >
              Test Imports
            </button>
            <button
              onClick={testEnvironment}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Test Environment
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <button
              onClick={clearAll}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Clear All
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error:</h3>
            <div className="text-red-700 font-mono text-sm bg-red-100 p-2 rounded">
              {error}
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Status Log</h2>
          {status.length === 0 ? (
            <p className="text-gray-500">No status messages yet. Run a test to see results.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {status.map((msg, index) => (
                <div key={index} className="p-2 bg-gray-100 rounded text-sm font-mono">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
