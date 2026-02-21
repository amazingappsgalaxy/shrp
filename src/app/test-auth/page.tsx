'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestAuthPage() {
  const [message, setMessage] = useState('Better Auth Test Page')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold">{message}</h1>
        <p className="text-gray-600">
          This is a test page for Better Auth integration.
        </p>
        <Button 
          onClick={() => setMessage('Button clicked!')}
          className="w-full"
        >
          Test Button
        </Button>
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Next Steps:</h2>
          <ul className="text-sm text-left space-y-1">
            <li>✅ Better Auth installed and configured</li>
            <li>✅ API routes created</li>
            <li>✅ Auth components created</li>
            <li>🔄 Testing authentication flow</li>
          </ul>
        </div>
      </div>
    </div>
  )
}