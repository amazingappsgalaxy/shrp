import { EnhancementSettings } from './types'

/**
 * Utility functions for AI providers
 */

/**
 * Validate image URL format
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate image format based on file extension or MIME type
 */
export function isValidImageFormat(url: string, supportedFormats: string[] = ['jpg', 'jpeg', 'png', 'webp']): boolean {
  const extension = url.split('.').pop()?.toLowerCase()
  return extension ? supportedFormats.includes(extension) : false
}

/**
 * Sanitize enhancement settings by removing undefined values and applying defaults
 */
export function sanitizeSettings(settings: Partial<EnhancementSettings>): EnhancementSettings {
  return {
    prompt: settings.prompt || 'enhance image quality',
    negative_prompt: settings.negative_prompt,
    steps: settings.steps || 20,
    guidance_scale: settings.guidance_scale || 7.5,
    creativity: settings.creativity || 0.35,
    resemblance: settings.resemblance || 0.6,
    hdr: settings.hdr || 1,
    resolution: settings.resolution || 'original',
    scheduler: settings.scheduler || 'DDIM',
    guess_mode: settings.guess_mode || false,
    seed: settings.seed,
    mask: settings.mask
  }
}

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Calculate estimated processing time based on image size and complexity
 */
export function estimateProcessingTime(imageUrl: string, settings: EnhancementSettings): number {
  // Base time in seconds
  let baseTime = 30
  
  // Adjust based on resolution
  if (settings.resolution === '2048') {
    baseTime *= 2
  } else if (settings.resolution === '1024') {
    baseTime *= 1.5
  }
  
  // Adjust based on steps
  if (settings.steps && settings.steps > 20) {
    baseTime *= (settings.steps / 20)
  }
  
  return Math.round(baseTime)
}

/**
 * Format error message for consistent error handling
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string') {
      return maybeMessage
    }
  }
  
  return 'An unknown error occurred'
}

/**
 * Check if URL is accessible
 */
export async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Convert base64 to blob URL (useful for handling different input formats)
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}