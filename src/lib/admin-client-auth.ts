'use client'

/**
 * Client-side admin authentication utilities.
 * Uses sessionStorage — safe in browser only.
 */

const ADMIN_AUTH_KEY = 'adminAuthenticated'
const ADMIN_EMAIL_KEY = 'adminEmail'

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true'
  } catch {
    return false
  }
}

export function getAdminEmail(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.sessionStorage.getItem(ADMIN_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setAdminAuthenticated(email: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
    window.sessionStorage.setItem(ADMIN_EMAIL_KEY, email.toLowerCase())
  } catch {
    // ignore
  }
}

export function adminLogout(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(ADMIN_AUTH_KEY)
    window.sessionStorage.removeItem(ADMIN_EMAIL_KEY)
  } catch {
    // ignore
  }
}

export function getAdminHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-admin-email': getAdminEmail(),
  }
}
