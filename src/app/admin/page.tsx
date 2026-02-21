'use client'

import { useState, useEffect } from 'react'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  // Check authentication on mount - safer version
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const isAuth = window.sessionStorage.getItem('adminAuthenticated') === 'true'
        if (isAuth) {
          setIsAuthenticated(true)
        }
      }
    } catch (err) {
      console.warn('SessionStorage access failed:', err)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!formData.email || !formData.password) {
        setError('Please enter both email and password')
        setIsLoading(false)
        return
      }

      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      })

      if (res.ok) {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          try {
            window.sessionStorage.setItem('adminAuthenticated', 'true')
            window.sessionStorage.setItem('adminEmail', formData.email.toLowerCase())
          } catch (storageErr) {
            console.warn('Could not save to sessionStorage:', storageErr)
          }
        }
        setIsAuthenticated(true)
        setError('')
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid admin credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('adminAuthenticated')
        window.sessionStorage.removeItem('adminEmail')
      }
    } catch (err) {
      console.warn('Logout cleanup failed:', err)
    }

    setIsAuthenticated(false)
    setFormData({ email: '', password: '' })
    setError('')
  }

  // Admin Dashboard View - Now using the new comprehensive AdminDashboard
  if (isAuthenticated) {
    return <AdminDashboard />
  }

  // Login Form View
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
            Admin Login
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              Admin Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter admin password"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
            This is a secure admin-only area. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  )
}