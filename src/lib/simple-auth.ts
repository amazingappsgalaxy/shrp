// Authentication system with Supabase integration
import bcrypt from 'bcryptjs';
import { supabase, type Database } from './supabase'
import * as authSimple from './auth-simple'

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: number
  updatedAt: number
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: number
  createdAt: number
}

type UsersRow = Database['public']['Tables']['users']['Row']
type SessionsRow = Database['public']['Tables']['sessions']['Row']

type UsersInsert = Database['public']['Tables']['users']['Insert']
type SessionsInsert = Database['public']['Tables']['sessions']['Insert']

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
    
    // Create user via Supabase
    const nowIso = new Date().toISOString()
    const insertUser: UsersInsert = {
      email,
      name,
      password_hash: passwordHash,
      created_at: nowIso,
      updated_at: nowIso,
    }
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(insertUser)
      .select()
      .single<UsersRow>();
    
    if (userError || !userData) {
      throw userError || new Error('Failed to create user');
    }
    
    // Create session via Supabase
    const sessionToken = generateSessionToken();
    const expiresIso = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
    const insertSession: SessionsInsert = {
      user_id: userData.id,
      token: sessionToken,
      expires_at: expiresIso,
      created_at: nowIso,
      user_agent: 'api',
      ip_address: '127.0.0.1',
    }
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert(insertSession)
      .select()
      .single<SessionsRow>();
    
    if (sessionError || !sessionData) {
      throw sessionError || new Error('Failed to create session');
    }
    
    return {
      user: { id: userData.id, email, name },
      session: { id: sessionData.id, token: sessionToken }
    }
  } catch (error) {
    console.warn('Supabase signup failed:', error)
    // No fallback needed - Supabase is the primary database
    return authSimple.signUpUser(email, password, name)
  }
}

// Sign in user
export async function signInUser(email: string, password: string) {
  try {
    // Find user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single<UsersRow>();
    
    if (userError || !userData) {
      throw userError || new Error('User not found');
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, userData.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }
    
    // Create session
    const nowIso = new Date().toISOString()
    const sessionToken = generateSessionToken();
    const expiresIso = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
    const insertSession: SessionsInsert = {
      user_id: userData.id,
      token: sessionToken,
      expires_at: expiresIso,
      created_at: nowIso,
      user_agent: 'api',
      ip_address: '127.0.0.1',
    }
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert(insertSession)
      .select()
      .single<SessionsRow>();
    
    if (sessionError || !sessionData) {
      throw sessionError || new Error('Failed to create session');
    }
    
    return {
      user: { id: userData.id, email: userData.email, name: userData.name },
      session: { id: sessionData.id, token: sessionToken }
    };
  } catch (error) {
    console.warn('Supabase signin failed:', error)
    return authSimple.signInUser(email, password)
  }
}

export async function getSession(token: string): Promise<{ user: User | null; session: Session | null }> {
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single<SessionsRow>();
    
    if (sessionError || !sessionData) {
      throw sessionError || new Error('Session not found')
    }
    
    // Check if session is expired
    const expiresAtMs = new Date(sessionData.expires_at).getTime()
    if (!expiresAtMs || expiresAtMs < Date.now()) {
      return { user: null, session: null };
    }

    // Fetch user
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.user_id)
      .single<UsersRow>()

    if (userFetchError || !userData) {
      throw userFetchError || new Error('User not found')
    }
    
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      passwordHash: userData.password_hash,
      createdAt: new Date(userData.created_at).getTime() || Date.now(),
      updatedAt: new Date(userData.updated_at).getTime() || Date.now(),
    }

    const session: Session = {
      id: sessionData.id,
      userId: sessionData.user_id,
      token: sessionData.token,
      expiresAt: expiresAtMs,
      createdAt: new Date(sessionData.created_at).getTime() || Date.now(),
    }
    
    return { user, session };
  } catch (error) {
    console.warn('Supabase getSession failed:', error)
    const fallback = await authSimple.getSession(token)
    if (fallback) {
      return fallback as unknown as { user: User | null; session: Session | null }
    }
    return { user: null, session: null };
  }
}

// Sign out user by invalidating session
export async function signOutUser(token: string) {
  if (!token) return
  
  try {
    console.log('Signing out user with token:', token)
    
    // Delete session directly with Supabase
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('token', token);
    
    if (error) {
      throw error
    }
    
    console.log('Session deleted successfully')
  } catch (error) {
    console.warn('Supabase signOut failed:', error)
    await authSimple.signOutUser(token)
  }
}