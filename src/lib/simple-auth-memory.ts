// Simple in-memory authentication system for testing
import bcrypt from 'bcryptjs'

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

// In-memory storage (for development only)
const users: User[] = []
const sessions: Session[] = []

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

// Generate ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Sign up user
export async function signUpUser(email: string, password: string, name: string) {
  console.log('signUpUser called with:', { email, name });
  
  try {
    // Check if user already exists
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      throw new Error('User already exists')
    }
    
    // Hash password
    const passwordHash = await hashPassword(password)
    
    // Create user
    const userId = generateId()
    const user: User = {
      id: userId,
      email,
      name,
      passwordHash,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    users.push(user)
    
    // Create session
    const sessionId = generateId()
    const sessionToken = generateSessionToken()
    const session: Session = {
      id: sessionId,
      userId,
      token: sessionToken,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: Date.now()
    }
    
    sessions.push(session)
    
    return {
      user: { id: userId, email, name },
      session: { id: sessionId, token: sessionToken }
    }
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

// Sign in user
export async function signInUser(email: string, password: string) {
  try {
    // Find user
    const user = users.find(u => u.email === email)
    if (!user) {
      throw new Error('Invalid credentials')
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }
    
    // Create session
    const sessionId = generateId()
    const sessionToken = generateSessionToken()
    const session: Session = {
      id: sessionId,
      userId: user.id,
      token: sessionToken,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: Date.now()
    }
    
    sessions.push(session)
    
    return {
      user: { id: user.id, email: user.email, name: user.name },
      session: { id: sessionId, token: sessionToken }
    }
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

// Get session
export async function getSession(token: string) {
  try {
    const session = sessions.find(s => s.token === token)
    if (!session || session.expiresAt < Date.now()) {
      return null
    }
    
    // Get user
    const user = users.find(u => u.id === session.userId)
    if (!user) return null
    
    return {
      user: { id: user.id, email: user.email, name: user.name },
      session: { id: session.id, token: session.token }
    }
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

// Sign out
export async function signOutUser(token: string) {
  try {
    const sessionIndex = sessions.findIndex(s => s.token === token)
    if (sessionIndex !== -1) {
      sessions.splice(sessionIndex, 1)
    }
  } catch (error) {
    console.error('Sign out error:', error)
  }
}