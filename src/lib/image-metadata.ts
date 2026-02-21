/**
 * Image metadata extraction utilities
 */

export interface ImageMetadata {
  width: number
  height: number
  fileSize: number
  format: string
}

/**
 * Extract metadata from an image URL
 */
export async function getImageMetadata(imageUrl: string): Promise<ImageMetadata> {
  try {
    // Fetch the image to get file size
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const fileSize = blob.size
    
    // Extract format from content type or URL
    let format = 'unknown'
    const contentType = response.headers.get('content-type')
    if (contentType) {
      const typeMatch = contentType.match(/image\/(\w+)/)
      if (typeMatch && typeMatch[1]) {
        format = typeMatch[1].toLowerCase()
      }
    } else {
      // Fallback to URL extension
      const urlMatch = imageUrl.match(/\.(jpg|jpeg|png|webp|gif|bmp)(?:\?|$)/i)
      if (urlMatch && urlMatch[1]) {
        format = urlMatch[1].toLowerCase()
        if (format === 'jpg') format = 'jpeg'
      }
    }
    
    // Get dimensions using Image API
    const dimensions = await getImageDimensions(imageUrl)
    
    return {
      width: dimensions.width,
      height: dimensions.height,
      fileSize,
      format
    }
  } catch (error) {
    console.error('Error extracting image metadata:', error)
    // Return default values if extraction fails
    return {
      width: 0,
      height: 0,
      fileSize: 0,
      format: 'unknown'
    }
  }
}

/**
 * Get image dimensions from URL (server-side compatible)
 */
export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = src
    } else {
      // Server-side: return default dimensions for base64 images or skip dimension extraction
      if (src.startsWith('data:')) {
        // For base64 images, we can't easily extract dimensions server-side
        // Return reasonable defaults
        resolve({ width: 1024, height: 1024 })
      } else {
        // For HTTP URLs, we could use a library like 'image-size' but for now return defaults
        resolve({ width: 1024, height: 1024 })
      }
    }
  })
}

/**
 * Calculate credits consumed based on image resolution
 */
/**
 * Calculate credits consumed using the new model-specific pricing engine
 * This function now supports per-model pricing with detailed settings
 */
export function calculateCreditsConsumed(
  width: number,
  height: number,
  modelId?: string,
  settings?: Record<string, any>
): number {
  // If modelId is provided, use the new pricing engine
  if (modelId && settings) {
    try {
      const { ModelPricingEngine } = require('./model-pricing-config')
      const result = ModelPricingEngine.calculateCredits(width, height, modelId, settings)
      return result.totalCredits
    } catch (error) {
      console.warn('ModelPricingEngine failed, using fallback pricing:', error)
      // Fall through to legacy calculation
    }
  }

  // Legacy calculation for backward compatibility
  const megapixels = (width * height) / 1000000

  // Credit calculation based on resolution tiers
  if (megapixels <= 1) {
    return 60 // ≤ 1000×1000 (≤ 1 MP)
  } else if (megapixels <= 2.25) {
    return 120 // ≤ 1500×1500 (≤ 2.25 MP)
  } else if (megapixels <= 4.66) {
    return 360 // ≤ 2160×2160 (≤ 4.66 MP)
  } else {
    return 360 // Default to highest tier for larger images
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format resolution for display
 */
export function formatResolution(width: number, height: number): string {
  if (width === 0 || height === 0) return 'Unknown'
  return `${width} × ${height}`
}

/**
 * Get model display name from model ID
 */
export function getModelDisplayName(modelId: string): string {
  const modelNames: Record<string, string> = {
    'femat-magic-image-refiner': 'Magic Image Refiner',
    'face-enhancer': 'Face Enhancer',
    'skin-smoother': 'Skin Smoother'
  }
  
  return modelNames[modelId] || modelId
}