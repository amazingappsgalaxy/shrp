// Supabase-based authentication system
import { supabase, supabaseAdmin, type Database } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
const admin: SupabaseClient<Database> = (supabaseAdmin ?? supabase)
import bcrypt from 'bcryptjs'

// Type definitions
export interface User {
  id: string
  email: string
  name: string
  subscriptionStatus: 'free' | 'pro' | 'enterprise'
  apiUsage: number
  monthlyApiLimit: number
}

export interface Session {
  id: string
  token: string
}

export interface UserImage {
  id: string
  userId: string
  filename: string
  fileSize: number
  dimensions: { width: number; height: number }
  originalUrl: string
  enhancedUrl?: string
  status: 'uploaded' | 'processing' | 'enhanced' | 'failed'
  createdAt: number
  updatedAt: number
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Generate session token
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Sign up user
export async function signUpUser(email: string, password: string, name: string) {
  console.log('signUpUser called with:', { email, name });
  
  try {
    // Hash password
    const passwordHash = await hashPassword(password)
    
    // Create user with Supabase
    const { data: userData, error: userError } = await admin
      .from('users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        subscription_status: 'free',
        api_usage: 0,
        monthly_api_limit: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      throw new Error('Failed to create user')
    }

    // Create session
    const sessionToken = generateSessionToken()
    const { data: sessionData, error: sessionError } = await admin
      .from('sessions')
      .insert({
        user_id: userData.id,
        token: sessionToken,
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
        created_at: new Date().toISOString(),
        user_agent: '',
        ip_address: ''
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      throw new Error('Failed to create session')
    }

    console.log('Created user and session in Supabase:', { userId: userData.id, sessionId: sessionData.id })
    
    return {
      user: { 
        id: userData.id, 
        email: userData.email, 
        name: userData.name, 
        subscriptionStatus: userData.subscription_status as 'free' | 'pro' | 'enterprise', 
        apiUsage: userData.api_usage, 
        monthlyApiLimit: userData.monthly_api_limit 
      },
      session: { id: sessionData.id, token: sessionToken }
    }
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

// Sign in user
export async function signInUser(email: string, password: string) {
  try {
    // Find user by email
    const { data: userData, error: userError } = await admin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, userData.password_hash)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    // Create session
    const sessionToken = generateSessionToken()
    const { data: sessionData, error: sessionError } = await admin
      .from('sessions')
      .insert({
        user_id: userData.id,
        token: sessionToken,
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
        created_at: new Date().toISOString(),
        user_agent: '',
        ip_address: ''
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      throw new Error('Failed to create session')
    }

    console.log('User signed in with Supabase:', { userId: userData.id, sessionId: sessionData.id })
    
    return {
      user: { 
        id: userData.id, 
        email: userData.email, 
        name: userData.name, 
        subscriptionStatus: userData.subscription_status as 'free' | 'pro' | 'enterprise', 
        apiUsage: userData.api_usage, 
        monthlyApiLimit: userData.monthly_api_limit 
      },
      session: { id: sessionData.id, token: sessionToken }
    }
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

// Get session
export async function getSession(token: string) {
  if (!token) return null
  
  try {
    // Find session by token
    const { data: sessionData, error: sessionError } = await admin
      .from('sessions')
      .select(`
        *,
        users (*)
      `)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !sessionData) {
      return null
    }

    const sd = sessionData as unknown as {
      id: string;
      token: string;
      users: {
        id: string;
        email: string;
        name: string;
        subscription_status: 'free' | 'pro' | 'enterprise';
        api_usage: number;
        monthly_api_limit: number;
      }
    }

    return {
      user: { 
        id: sd.users.id, 
        email: sd.users.email, 
        name: sd.users.name, 
        subscriptionStatus: sd.users.subscription_status,
        apiUsage: sd.users.api_usage,
        monthlyApiLimit: sd.users.monthly_api_limit
      },
      session: { 
        id: sd.id, 
        token: sd.token 
      }
    }
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

// Sign out
export async function signOutUser(token: string) {
  try {
    // Delete session by token
    const { error } = await admin
      .from('sessions')
      .delete()
      .eq('token', token)

    if (error) {
      console.error('Error deleting session:', error)
      throw new Error('Failed to sign out')
    }

    console.log('User signed out with token:', token.substring(0, 8) + '...')
  } catch (error) {
    console.error('Sign out error:', error)
  }
}

// Upload image
export async function uploadImage(userId: string, imageData: {
  filename: string
  fileSize: number
  dimensions: { width: number; height: number }
  originalUrl: string
}) {
  try {
    const { data: imageDataResult, error: imageError } = await admin
      .from('images')
      .insert({
        user_id: userId,
        original_url: imageData.originalUrl,
        enhanced_url: '',
        filename: imageData.filename,
        file_size: imageData.fileSize,
        width: imageData.dimensions.width,
        height: imageData.dimensions.height,
        status: 'uploaded',
        enhancement_type: 'upscale',
        processing_time: 0,
        metadata: '{}'
      })
      .select()
      .single()

    if (imageError) {
      console.error('Error uploading image:', imageError)
      throw new Error('Failed to upload image')
    }

    console.log('Image uploaded to Supabase:', { imageId: imageDataResult.id, userId, filename: imageData.filename })
    
    return {
      id: imageDataResult.id,
      userId,
      ...imageData,
      status: 'uploaded' as const,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  } catch (error) {
    console.error('Upload image error:', error)
    throw error
  }
}

// Get user images
export async function getUserImages(userId: string) {
  try {
    const { data: images, error } = await admin
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting user images:', error)
      return []
    }

    return images.map(image => ({
      id: image.id,
      userId: image.user_id,
      originalUrl: image.original_url,
      enhancedUrl: image.enhanced_url,
      filename: image.filename,
      fileSize: image.file_size,
      dimensions: {
        width: image.width,
        height: image.height
      },
      status: image.status as 'uploaded' | 'processing' | 'enhanced' | 'failed',
      createdAt: new Date(image.created_at).getTime(),
      updatedAt: new Date(image.updated_at).getTime()
    }))
  } catch (error) {
    console.error('Get user images error:', error)
    return []
  }
}

// Update user API usage
export async function updateApiUsage(userId: string, increment: number = 1) {
  try {
    const { data: user, error: fetchError } = await admin
      .from('users')
      .select('api_usage')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching user API usage:', fetchError)
      return
    }

    const newApiUsage = (user.api_usage || 0) + increment

    const { error: updateError } = await admin
      .from('users')
      .update({ 
        api_usage: newApiUsage,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating API usage:', updateError)
      return
    }

    console.log(`API usage updated for user ${userId}: +${increment}`)
  } catch (error) {
    console.error('Update API usage error:', error)
  }
}

// Update image status
export async function updateImageStatus(imageId: string, status: 'uploaded' | 'processing' | 'enhanced' | 'failed', enhancedUrl?: string) {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (enhancedUrl) {
      updateData.enhanced_url = enhancedUrl
    }

    const { error } = await admin
      .from('images')
      .update(updateData)
      .eq('id', imageId)

    if (error) {
      console.error('Error updating image status:', error)
      throw new Error('Failed to update image status')
    }

    console.log(`Image ${imageId} status updated to ${status}`)
  } catch (error) {
    console.error('Update image status error:', error)
    throw error
  }
}

// Get user stats
export async function getUserStats(userId: string) {
  try {
    const { data: user, error: userError } = await admin
      .from('users')
      .select('api_usage, monthly_api_limit, subscription_status')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user stats:', userError)
      return {
        totalImages: 0,
        enhancedImages: 0,
        processingImages: 0,
        totalStorage: 0,
        apiUsage: 0,
        monthlyApiLimit: 100,
        subscriptionStatus: 'free' as const
      }
    }

    const { data: images, error: imagesError } = await admin
      .from('images')
      .select('status, file_size')
      .eq('user_id', userId)

    if (imagesError) {
      console.error('Error fetching user images:', imagesError)
      return {
        totalImages: 0,
        enhancedImages: 0,
        processingImages: 0,
        totalStorage: 0,
        apiUsage: user.api_usage,
        monthlyApiLimit: user.monthly_api_limit,
        subscriptionStatus: user.subscription_status as 'free' | 'pro' | 'enterprise'
      }
    }

    const totalImages = images.length
    const enhancedImages = images.filter(img => img.status === 'enhanced').length
    const processingImages = images.filter(img => img.status === 'processing').length
    const totalStorage = images.reduce((sum, img) => sum + (img.file_size || 0), 0)

    return {
      totalImages,
      enhancedImages,
      processingImages,
      totalStorage,
      apiUsage: user.api_usage,
      monthlyApiLimit: user.monthly_api_limit,
      subscriptionStatus: user.subscription_status as 'free' | 'pro' | 'enterprise'
    }
  } catch (error) {
    console.error('Get user stats error:', error)
    return {
      totalImages: 0,
      enhancedImages: 0,
      processingImages: 0,
      totalStorage: 0,
      apiUsage: 0,
      monthlyApiLimit: 100,
      subscriptionStatus: 'free' as const
    }
  }
}

// Track user activity
export async function trackActivity(userId: string, action: string, metadata?: any) {
  try {
    const { error } = await admin
      .from('user_activity')
      .insert({
        user_id: userId,
        action,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error tracking activity:', error)
      return
    }

    console.log(`Activity tracked: ${action} for user ${userId}`)
  } catch (error) {
    console.error('Track activity error:', error)
  }
}