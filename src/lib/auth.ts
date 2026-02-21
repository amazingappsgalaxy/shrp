/**
 * Main authentication module - now using unified auth system
 * @deprecated - Use @/lib/unified-auth for new code
 */

// Re-export from unified auth for backward compatibility
export {
  auth,
  getSession,
  requireAuth,
  createUser,
  signIn,
  signOut,
  type Session,
  type User
} from './unified-auth'