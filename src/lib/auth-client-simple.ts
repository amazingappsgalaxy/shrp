'use client'

import { useAppData, APP_DATA_KEY } from '@/lib/hooks/use-app-data'
import { mutate } from 'swr'

export interface User {
  id: string
  email: string
  name: string
}

export interface Session {
  id: string
  token: string
}

export interface AuthData {
  user: User | null
  session: Session | null
}

// Auth functions
export async function signUp(email: string, password: string, name: string) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Signup failed')
  }

  // Prime SWR cache after signup
  mutate(APP_DATA_KEY)

  return data
}

export async function signIn(email: string, password: string) {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Signin failed')
  }

  // Prime SWR cache after signin
  mutate(APP_DATA_KEY)

  return data
}

export async function signOut() {
  const response = await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Signout failed')
  }

  // Clear SWR cache
  mutate(APP_DATA_KEY, { user: null, credits: null, subscription: null, profile: null }, false)

  return response.json()
}

// Backward-compatible hook — now backed by SWR (single shared request)
export function useSession() {
  const { user, isLoading, mutate: refresh } = useAppData()

  return {
    data: {
      user,
      session: user ? { id: '', token: '' } : null,
    } as AuthData,
    isLoading,
    refresh: () => { refresh() },
  }
}

// Backward-compatible hook — returns user directly
export function useAuth() {
  const { user, isLoading, isDemo } = useAppData()

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isDemo,
  }
}
