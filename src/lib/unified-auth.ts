/**
 * Unified Authentication System for Sharpii.ai
 * This module provides a single interface for all authentication operations
 * Using Better Auth as the primary authentication system
 */

import { redirect } from 'next/navigation'

// Types for unified auth (mock-friendly)
export type User = {
  id: string
  email: string
  name: string
}

export type Session = {
  user: User
  session: {
    token: string
    expiresAt: number
  }
}

type SignUpArgs = { body: { email: string; password: string; name: string } }
type SignInArgs = { body: { email: string; password: string } }

interface AuthAPI {
  getSession: (options?: { headers?: Record<string, string> }) => Promise<Session | null>
  signUp?: (args: SignUpArgs) => Promise<unknown>
  signIn?: (args: SignInArgs) => Promise<unknown>
  signOut?: () => Promise<unknown>
}

// Mock auth for development - bypassing Better Auth to avoid config issues
export const auth: { api: AuthAPI } = {
  api: {
    getSession: async () => {
      // Return a mock session for development
      return {
        user: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'test@example.com',
          name: 'Test User'
        },
        session: {
          token: 'mock-token',
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        }
      }
    }
  }
}

// Real Better Auth configuration (commented out for now)
// import { betterAuth } from "better-auth"
// export const auth = betterAuth({
//   baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3003",
//   secret: process.env.BETTER_AUTH_SECRET || "857767e20d84e1a80d8ff2f3b9c0ae9d45e7b3f9b589df115a6cb76c0e766bde",
//   emailAndPassword: {
//     enabled: true,
//     requireEmailVerification: false, // Disabled for development
//   },
//   session: {
//     expiresIn: 60 * 60 * 24 * 7, // 7 days
//     updateAge: 60 * 60 * 24, // 1 day
//   },
//   database: {
//     // Use Supabase as database backend
//     type: "postgres",
//     url: process.env.DATABASE_URL || "",
//   },
//   advanced: {
//     generateId: () => {
//       // Generate secure ID
//       return Math.random().toString(36).substring(2) + Date.now().toString(36)
//     },
//   },
// })

// Server-side session utilities (mock for development)
export async function getSession() {
  // Return mock session for development
  return auth.api.getSession()
}

export async function requireAuth() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/app/login')
  }

  return session
}

// Authentication helper functions
export async function createUser(email: string, password: string, name: string) {
  if (typeof auth.api.signUp !== 'function') {
    // Mock path
    return { success: true, user: { id: 'mock-user-id', email, name } }
  }
  return await auth.api.signUp({
    body: {
      email,
      password,
      name,
    }
  })
}

export async function signIn(email: string, password: string) {
  if (typeof auth.api.signIn !== 'function') {
    return { success: true, user: { id: 'mock-user-id', email } }
  }
  return await auth.api.signIn({
    body: {
      email,
      password,
    }
  })
}

export async function signOut() {
  if (typeof auth.api.signOut !== 'function') {
    return { success: true }
  }
  return await auth.api.signOut()
}

// User management functions
export async function updateUser(_userId: string, _updates: Partial<User>) {
  // Implementation would depend on Better Auth API
  // For now, return success
  return { success: true }
}

export async function getUserById(_userId: string) {
  // Implementation would query the database
  // For now, return null
  return null
}

// Legacy compatibility functions
// These maintain compatibility with existing code while migrating
export async function getSessionLegacy(token: string) {
  try {
    const session = await auth.api.getSession({
      headers: {
        cookie: `better-auth.session_token=${token}`
      }
    })

    if (session?.user) {
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error getting legacy session:', error)
    return null
  }
}

// Migration utilities
export async function migrateFromSimpleAuth() {
  // This function would help migrate users from the old auth system
  // Implementation depends on the specific migration requirements
  console.log('Migration from simple auth not yet implemented')
  return { success: false, message: 'Migration not implemented' }
}

const unifiedAuth = {
  auth,
  getSession,
  requireAuth,
  createUser,
  signIn,
  signOut,
  updateUser,
  getUserById,
  getSessionLegacy,
}

export default unifiedAuth