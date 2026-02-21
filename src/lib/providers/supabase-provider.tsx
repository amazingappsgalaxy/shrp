'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import type { Tables } from '../supabase'
import type { Inserts, Updates } from '../supabase'

interface SupabaseContextType {
  user: User | null
  session: Session | null
  userProfile: Tables<'users'> | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: unknown; data?: unknown }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Tables<'users'>>) => Promise<{ error: unknown }>
  createUserProfile: (userId: string, email: string, name: string) => Promise<{ error: unknown }>
  resetPassword: (email: string) => Promise<{ error: unknown }>
  updatePassword: (password: string) => Promise<{ error: unknown }>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<Tables<'users'> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Only fetch profile if user is confirmed or email confirmation is disabled
        if (session.user.email_confirmed_at || event === 'SIGNED_IN') {
          const profile = await fetchUserProfile(session.user.id)
          
          // If profile doesn't exist after sign-in, create it
          if (!profile && event === 'SIGNED_IN') {
            await createUserProfile(session.user.id, session.user.email || '', session.user.user_metadata?.name || 'User')
            await fetchUserProfile(session.user.id)
          }
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Only log error if it's not a "no rows" error (user profile doesn't exist yet)
        if (error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error)
        }
        return null
      }

      setUserProfile(data)
      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // Input validation
      if (!email?.trim()) {
        return { error: { message: 'Email is required' } }
      }
      
      if (!password) {
        return { error: { message: 'Password is required' } }
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return { error: { message: 'Please enter a valid email address' } }
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      return { error }
    } catch (error) {
      console.error('SignIn error:', error)
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { error: { message: 'Network error. Please check your internet connection.' } }
      }
      return { error: { message: 'An unexpected error occurred during sign in' } }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { error: { message: 'Please enter a valid email address' }, data: null }
      }

      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError) {
        return { error: authError, data: null }
      }

      // Only create profile if user was successfully created and we have a session
      // (meaning email confirmation is disabled)
      if (authData.user && authData.session) {
        const payload: Inserts<'users'> = {
          id: authData.user.id,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          password_hash: '', // This will be handled by Supabase Auth
          subscription_status: 'free',
          api_usage: 0,
          monthly_api_limit: 100,
          is_email_verified: authData.user.email_confirmed_at ? true : false,
        }

        const { error: profileError } = await supabase
          .from('users')
          .insert(payload)

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          return { error: profileError, data: authData }
        }
      }

      return { error: null, data: authData }
    } catch (error) {
      console.error('Signup error:', error)
      return { error: error instanceof Error ? error : { message: 'An unexpected error occurred' }, data: null }
    }
  }

  const createUserProfile = async (userId: string, email: string, name: string) => {
    try {
      const payload: Inserts<'users'> = {
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password_hash: '',
        subscription_status: 'free',
        api_usage: 0,
        monthly_api_limit: 100,
        is_email_verified: false,
      }

      const { error } = await supabase
        .from('users')
        .insert(payload)

      return { error }
    } catch (error) {
      return { error: error instanceof Error ? error : { message: 'Failed to create profile' } }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Tables<'users'>>) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      const { error } = await supabase
        .from('users')
        .update(updates as Updates<'users'>)
        .eq('id', user.id)

      if (!error && userProfile) {
        setUserProfile({ ...userProfile, ...updates })
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      // Input validation
      if (!email?.trim()) {
        return { error: { message: 'Email is required' } }
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return { error: { message: 'Please enter a valid email address' } }
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/app/reset-password`,
      })
      return { error }
    } catch (error) {
      console.error('Reset password error:', error)
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { error: { message: 'Network error. Please check your internet connection.' } }
      }
      return { error: { message: 'An unexpected error occurred while sending reset email' } }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      // Input validation
      if (!password) {
        return { error: { message: 'Password is required' } }
      }
      
      if (password.length < 6) {
        return { error: { message: 'Password must be at least 6 characters long' } }
      }
      
      if (password.length > 128) {
        return { error: { message: 'Password must be less than 128 characters' } }
      }
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      return { error }
    } catch (error) {
      console.error('Update password error:', error)
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { error: { message: 'Network error. Please check your internet connection.' } }
      }
      return { error: { message: 'An unexpected error occurred while updating password' } }
    }
  }

  const value = {
    user,
    session,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    createUserProfile,
    resetPassword,
    updatePassword,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

// Hook for database queries
export function useSupabaseQuery<T>(
  table: string,
  query?: (queryBuilder: unknown) => unknown
) {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const { user } = useSupabase()

  useEffect(() => {
    if (!user) {
      setData(null)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const fromAny = supabase.from as unknown as (table: string) => any
        let queryBuilder = fromAny(table).select('*')
        
        if (query) {
          const maybeModified = query(queryBuilder as unknown)
          if (maybeModified) {
            queryBuilder = maybeModified as typeof queryBuilder
          }
        }
        
        const { data, error } = await queryBuilder
        
        if (error) {
          setError(error)
        } else {
          setData((data as unknown as T[]) ?? [])
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [table, user, query])

  return { data, loading, error }
}

// Hook for real-time subscriptions
export function useSupabaseSubscription<T>(
  table: string,
  filter?: string
) {
  const [data, setData] = useState<T[] | null>(null)
  const { user } = useSupabase()

  useEffect(() => {
    if (!user) {
      setData(null)
      return
    }

    // Initial fetch
    const fetchInitialData = async () => {
      const fromAny = supabase.from as unknown as (table: string) => any
      const { data: initialData } = await fromAny(table)
        .select('*')
        .eq('user_id', user.id)
      
      setData((initialData as unknown as T[]) || [])
    }

    fetchInitialData()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as any,
          filter: filter || `user_id=eq.${user.id}`,
        },
        (payload: unknown) => {
          console.log('Real-time update:', payload)
          // Refetch data on changes
          fetchInitialData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [table, filter, user])

  return data
}