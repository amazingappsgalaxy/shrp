// Server-side database operations using Supabase
import { supabase as supabaseClient, supabaseAdmin as supabaseAdminMaybe } from './supabase'
import type { Tables, Updates, Inserts, Json } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Ensure we always have a SupabaseClient<Database> for typing; in local/dev it falls back to public client
const admin: SupabaseClient<Database> = supabaseAdminMaybe ?? supabaseClient

// Soft-detect when we're not using the service role key (RLS may block server reads)
const usingPublicClientForServer = !supabaseAdminMaybe
if (usingPublicClientForServer) {
  console.warn('[auth] SUPABASE_SERVICE_ROLE_KEY not set. Using public client on server - RLS may block reads.')
}

function isRLSPermissionError(err: any): boolean {
  const code = (err && err.code) || ''
  const msg = ((err && (err.message || err.error_description)) || '').toLowerCase()
  // 42501 = Postgres permission denied, common RLS/ACL error; message checks cover PostgREST phrasing
  return code === '42501' || msg.includes('permission denied') || msg.includes('row level security') || msg.includes('rls')
}

// Export Supabase client as dbServer for compatibility
export const dbServer = {
  query: async (queryObj: unknown) => {
    // This is a compatibility layer - in practice, use Supabase queries directly
    console.warn('dbServer.query called - consider migrating to direct Supabase queries')
    return {}
  },
  transact: async (transactions: unknown[]) => {
    // This is a compatibility layer - in practice, use Supabase transactions directly
    console.warn('dbServer.transact called - consider migrating to direct Supabase transactions')
    return {}
  }
}

// Export transaction builder as txServer for compatibility
export const txServer = {
  users: {},
  sessions: {},
  userActivity: {},
  images: {}
}

// Export ID generator as idServer for compatibility
export const idServer = () => {
  return crypto.randomUUID()
}

// User management functions
export async function createUser(userData: {
  email: string;
  name: string;
  passwordHash: string;
}) {
  const payload: Inserts<'users'> = {
    email: userData.email,
    name: userData.name,
    password_hash: userData.passwordHash,
    subscription_status: 'free',
    api_usage: 0,
    monthly_api_limit: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from('users')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating user:', error)
    throw new Error('Failed to create user')
  }

  return (data as Tables<'users'>).id
}

export async function createSession(sessionData: {
  userId: string;
  token: string;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
}) {
  const payload: Inserts<'sessions'> = {
    user_id: sessionData.userId,
    token: sessionData.token,
    expires_at: new Date(sessionData.expiresAt).toISOString(),
    ip_address: sessionData.ipAddress || '127.0.0.1', // Use localhost as default instead of empty string
    user_agent: sessionData.userAgent ?? '',
    created_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from('sessions')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating session:', error)
    throw new Error('Failed to create session')
  }

  return (data as Tables<'sessions'>).id
}

export async function findUserByEmail(email: string) {
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    // PGRST116 is "no rows found"
    if ((error as any).code === 'PGRST116') {
      return null
    }
    // When using public client on the server, RLS can block reads; treat as not found for auth flow
    if (isRLSPermissionError(error)) {
      console.warn('RLS blocked user lookup by email; returning null. Configure SUPABASE_SERVICE_ROLE_KEY for server-side reads.')
      return null
    }
    console.error('Error finding user by email:', error)
    throw new Error('Failed to find user')
  }

  if (!data) return null

  return {
    id: (data as Tables<'users'>).id,
    email: (data as Tables<'users'>).email,
    name: (data as Tables<'users'>).name,
    passwordHash: (data as Tables<'users'>).password_hash,
    subscriptionStatus: (data as Tables<'users'>).subscription_status,
    apiUsage: (data as Tables<'users'>).api_usage,
    monthlyApiLimit: (data as Tables<'users'>).monthly_api_limit,
    isAdmin: false, // Default since is_admin column doesn't exist
    createdAt: new Date((data as Tables<'users'>).created_at).getTime(),
    updatedAt: new Date((data as Tables<'users'>).updated_at).getTime()
  }
}

export async function findUserById(id: string) {
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if ((error as any).code === 'PGRST116') {
      return null
    }
    if (isRLSPermissionError(error)) {
      console.warn('RLS blocked user lookup by id; returning null. Configure SUPABASE_SERVICE_ROLE_KEY for server-side reads.')
      return null
    }
    console.error('Error finding user by ID:', error)
    throw new Error('Failed to find user')
  }

  if (!data) return null

  return {
    id: (data as Tables<'users'>).id,
    email: (data as Tables<'users'>).email,
    name: (data as Tables<'users'>).name,
    passwordHash: (data as Tables<'users'>).password_hash,
    subscriptionStatus: (data as Tables<'users'>).subscription_status,
    apiUsage: (data as Tables<'users'>).api_usage,
    monthlyApiLimit: (data as Tables<'users'>).monthly_api_limit,
    isAdmin: false, // Default since is_admin column doesn't exist
    createdAt: new Date((data as Tables<'users'>).created_at).getTime(),
    updatedAt: new Date((data as Tables<'users'>).updated_at).getTime()
  }
}

export async function findSessionByToken(token: string) {
  const nowIso = new Date().toISOString()

  const { data: session, error: sErr } = await admin
    .from('sessions')
    .select('*')
    .eq('token', token)
    .gt('expires_at', nowIso)
    .single()

  if (sErr && (sErr as any).code !== 'PGRST116') {
    console.error('Error finding session by token:', sErr)
    throw new Error('Failed to find session')
  }

  if (!session) return null

  const { data: user, error: userErr } = await admin
    .from('users')
    .select('id,email,name,subscription_status,api_usage,monthly_api_limit')
    .eq('id', (session as Tables<'sessions'>).user_id)
    .single()

  if (userErr) {
    console.error('Error finding user for session:', userErr, 'user_id:', (session as Tables<'sessions'>).user_id)
  }

  return {
    session: {
      id: (session as Tables<'sessions'>).id,
      userId: (session as Tables<'sessions'>).user_id,
      token: (session as Tables<'sessions'>).token,
      expiresAt: new Date((session as Tables<'sessions'>).expires_at).getTime(),
      createdAt: new Date((session as Tables<'sessions'>).created_at).getTime()
    },
    user: user
      ? {
          id: (user as Tables<'users'>).id,
          email: (user as Tables<'users'>).email,
          name: (user as Tables<'users'>).name,
          subscriptionStatus: (user as Tables<'users'>).subscription_status,
          apiUsage: (user as Tables<'users'>).api_usage,
          monthlyApiLimit: (user as Tables<'users'>).monthly_api_limit,
          isAdmin: false // Default since is_admin column doesn't exist
        }
      : null
  }
}

export async function deleteSession(token: string) {
  const { error } = await admin
    .from('sessions')
    .delete()
    .eq('token', token)

  if (error) {
    console.error('Error deleting session:', error)
    throw new Error('Failed to delete session')
  }
}

type UpdateUserInput = {
  lastLoginAt?: number | string | Date
  apiUsage?: number | { $increment: number }
  subscriptionStatus?: string
}

export async function updateUser(userId: string, updates: UpdateUserInput) {
  const updateData: Updates<'users'> = {}
  
  if (updates.lastLoginAt) {
    updateData.last_login_at = new Date(updates.lastLoginAt).toISOString()
  }
  if (updates.apiUsage !== undefined) {
    // Support $increment pattern used in callers
    if (typeof updates.apiUsage === 'object' && '$increment' in updates.apiUsage && updates.apiUsage.$increment != null) {
      // Fetch current value, then increment
      const { data: current, error: fetchErr } = await admin
        .from('users')
        .select('api_usage')
        .eq('id', userId)
        .single()
      if (!fetchErr && current) {
        updateData.api_usage = (current as Tables<'users'>).api_usage + Number(updates.apiUsage.$increment)
      }
    } else if (typeof updates.apiUsage === 'number') {
      updateData.api_usage = updates.apiUsage
    }
  }
  if (updates.subscriptionStatus) {
    updateData.subscription_status = updates.subscriptionStatus
  }
  
  updateData.updated_at = new Date().toISOString()

  const { error } = await admin
    .from('users')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    console.error('Error updating user:', error)
    throw new Error('Failed to update user')
  }
}

export async function trackUserActivity(userId: string, action: string, metadata?: Record<string, unknown>) {
  const payload: Inserts<'user_activity'> = {
    user_id: userId,
    action,
    metadata: (metadata as Json) ?? {},
    created_at: new Date().toISOString()
  }

  const { error } = await admin
    .from('user_activity')
    .insert(payload)

  if (error) {
    console.error('Error tracking user activity:', error)
    // Don't throw error for activity tracking to avoid breaking main flows
  }
}

// New: list user activity (for dashboards/fallbacks)
export async function listUserActivity(userId: string, limit: number = 10) {
  const { data, error } = await admin
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error listing user activity:', error)
    return []
  }

  const rows = (data || []) as Array<{
    id: string
    user_id: string
    action: string
    metadata: unknown
    created_at: string
  }>

  return rows.map((a) => ({
    id: a.id,
    userId: a.user_id,
    action: a.action,
    metadata: a.metadata,
    createdAt: new Date(a.created_at).getTime()
  }))
}

// Images: create, list, update status
export async function createImage(params: {
  userId: string;
  filename: string;
  fileSize: number;
  width: number;
  height: number;
  originalUrl: string;
  status?: 'uploaded' | 'processing' | 'enhanced' | 'failed';
}) {
  const payload: Inserts<'images'> = {
    user_id: params.userId,
    filename: params.filename,
    file_size: params.fileSize,
    width: params.width,
    height: params.height,
    original_url: params.originalUrl,
    status: params.status || 'uploaded',
    enhancement_type: 'none',
    processing_time: 0,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from('images')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    console.error('Error creating image:', error)
    throw new Error('Failed to create image')
  }

  const img = data as Tables<'images'>

  return {
    id: img.id as string,
    userId: img.user_id as string,
    filename: img.filename as string,
    fileSize: img.file_size as number,
    width: img.width as number,
    height: img.height as number,
    originalUrl: img.original_url as string,
    enhancedUrl: img.enhanced_url as string | null,
    status: img.status as 'uploaded' | 'processing' | 'enhanced' | 'failed',
    createdAt: new Date(img.created_at).getTime(),
    updatedAt: new Date(img.updated_at).getTime()
  }
}

export async function listUserImages(userId: string, limit: number = 20) {
  const { data, error } = await admin
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error listing user images:', error)
    return []
  }

  const rows = (data || []) as Tables<'images'>[]

  return rows.map((img) => ({
    id: img.id as string,
    userId: img.user_id as string,
    filename: img.filename as string,
    fileSize: img.file_size as number,
    width: img.width as number,
    height: img.height as number,
    originalUrl: img.original_url as string,
    enhancedUrl: img.enhanced_url as string | null,
    status: img.status as 'uploaded' | 'processing' | 'enhanced' | 'failed',
    createdAt: new Date(img.created_at).getTime(),
    updatedAt: new Date(img.updated_at).getTime()
  }))
}

export async function setImageStatus(
  imageId: string,
  status: 'uploaded' | 'processing' | 'enhanced' | 'failed',
  enhancedUrl?: string
) {
  const update: Updates<'images'> = {
    status,
    updated_at: new Date().toISOString()
  }
  if (enhancedUrl) {
    update.enhanced_url = enhancedUrl
  }

  const { error } = await admin
    .from('images')
    .update(update)
    .eq('id', imageId)

  if (error) {
    console.error('Error updating image status:', error)
    throw new Error('Failed to update image status')
  }
}

export async function checkSupabaseServerConnection() {
  try {
    const { error } = await admin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .limit(1)
    
    return !error
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}