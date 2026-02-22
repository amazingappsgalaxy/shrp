/**
 * Auth module - thin wrapper over simple-auth for legacy route compatibility.
 * New code should import directly from @/lib/simple-auth or @/lib/auth-simple.
 */
import { getSession as getSimpleSession } from './simple-auth'

// Provides a compatible auth.api.getSession() interface for legacy routes
export const auth = {
  api: {
    async getSession(opts: { headers?: Record<string, string> }) {
      const cookieHeader = opts.headers?.cookie || ''
      const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/)
      const token = match?.[1]
      if (!token) return null
      const result = await getSimpleSession(token)
      if (!result?.user) return null
      return { user: result.user, session: result.session }
    }
  }
}

export { getSession } from './simple-auth'