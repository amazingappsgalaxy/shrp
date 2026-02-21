/**
 * Enhanced Image Metadata System for Sharpii.ai
 * Provides comprehensive image analysis, metadata extraction, and processing utilities
 */

import sharp from 'sharp'

export interface EnhancedImageMetadata {
  // Basic metadata
  width: number
  height: number
  fileSize: number
  format: string
  mimeType: string

  // Quality metrics
  quality?: number
  bitDepth?: number
  colorSpace?: string
  hasAlpha: boolean
  channels: number

  // Calculated properties
  megapixels: number
  aspectRatio: number
  creditsRequired: number
  processingComplexity: 'low' | 'medium' | 'high' | 'ultra'

  // Face detection (if applicable)
  faceCount?: number
  hasFaces: boolean

  // Image analysis
  brightness?: number
  contrast?: number
  sharpness?: number

  // Processing metadata
  isProcessable: boolean
  errors: string[]
  warnings: string[]
}

export interface ImageProcessingSettings {
  maxWidth: number
  maxHeight: number
  maxFileSize: number // in bytes
  allowedFormats: string[]
  qualityThreshold: number
}

export const DEFAULT_PROCESSING_SETTINGS: ImageProcessingSettings = {
  maxWidth: 4096,
  maxHeight: 4096,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFormats: ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'bmp'],
  qualityThreshold: 50
}

/**
 * Enhanced image metadata extraction using Sharp
 */
export async function getEnhancedImageMetadata(
  imageInput: string | Buffer,
  settings: ImageProcessingSettings = DEFAULT_PROCESSING_SETTINGS
): Promise<EnhancedImageMetadata> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    let imageBuffer: Buffer

    // Handle different input types
    if (typeof imageInput === 'string') {
      if (imageInput.startsWith('data:')) {
        // Base64 data URL
        const base64Data = imageInput.split(',')[1]
        if (!base64Data) {
          throw new Error('Invalid base64 data URL')
        }
        imageBuffer = Buffer.from(base64Data, 'base64')
      } else if (imageInput.startsWith('http')) {
        // Remote URL
        const response = await fetch(imageInput)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }
        imageBuffer = Buffer.from(await response.arrayBuffer())
      } else {
        // Assume local file path
        const fs = await import('fs')
        imageBuffer = fs.readFileSync(imageInput)
      }
    } else {
      imageBuffer = imageInput
    }

    // Use Sharp to analyze the image
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()
    const stats = await image.stats()

    // Extract basic metadata
    const width = metadata.width || 0
    const height = metadata.height || 0
    const format = metadata.format || 'unknown'
    const fileSize = imageBuffer.length
    const channels = metadata.channels || 3
    const hasAlpha = metadata.hasAlpha || false

    // Calculate derived properties
    const megapixels = (width * height) / 1000000
    const aspectRatio = width > 0 && height > 0 ? width / height : 0

    // Determine processing complexity
    const processingComplexity = getProcessingComplexity(width, height, format)

    // Calculate credits required
    const creditsRequired = calculateEnhancedCredits(width, height, format, processingComplexity)

    // Analyze image quality
    const qualityMetrics = await analyzeImageQuality(image, stats)

    // Face detection (simplified - would use actual ML model in production)
    const faceAnalysis = await detectFaces(imageBuffer)

    // Validate image against settings
    const validation = validateImage(width, height, fileSize, format, settings)
    errors.push(...validation.errors)
    warnings.push(...validation.warnings)

    // Map Sharp metadata.depth to numeric bit depth when available
    const depthToBitsMap: Record<string, number> = {
      uchar: 8,
      char: 8,
      ushort: 16,
      short: 16,
      uint: 32,
      int: 32,
      float: 32,
      double: 64
    }
    const bitDepth = metadata.depth ? depthToBitsMap[String(metadata.depth)] : undefined

    const result: EnhancedImageMetadata = {
      // Basic metadata
      width,
      height,
      fileSize,
      format,
      mimeType: `image/${format}`,

      // Quality metrics
      quality: qualityMetrics.quality,
      bitDepth,
      colorSpace: metadata.space,
      hasAlpha,
      channels,

      // Calculated properties
      megapixels,
      aspectRatio,
      creditsRequired,
      processingComplexity,

      // Face detection
      faceCount: faceAnalysis.count,
      hasFaces: faceAnalysis.count > 0,

      // Image analysis
      brightness: qualityMetrics.brightness,
      contrast: qualityMetrics.contrast,
      sharpness: qualityMetrics.sharpness,

      // Processing metadata
      isProcessable: errors.length === 0,
      errors,
      warnings
    }

    return result

  } catch (error) {
    console.error('Error extracting enhanced image metadata:', error)

    return {
      // Basic metadata - defaults
      width: 0,
      height: 0,
      fileSize: 0,
      format: 'unknown',
      mimeType: 'unknown',

      // Quality metrics
      hasAlpha: false,
      channels: 3,

      // Calculated properties
      megapixels: 0,
      aspectRatio: 0,
      creditsRequired: 0,
      processingComplexity: 'low',

      // Face detection
      faceCount: 0,
      hasFaces: false,

      // Processing metadata
      isProcessable: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      warnings
    }
  }
}

/**
 * Determine processing complexity based on image properties
 */
function getProcessingComplexity(width: number, height: number, format: string): 'low' | 'medium' | 'high' | 'ultra' {
  const megapixels = (width * height) / 1000000

  if (megapixels <= 1) return 'low'      // ≤ 1MP
  if (megapixels <= 4) return 'medium'   // ≤ 4MP
  if (megapixels <= 16) return 'high'    // ≤ 16MP
  return 'ultra'                         // > 16MP
}

/**
 * Enhanced credit calculation with complexity factors
 */
function calculateEnhancedCredits(width: number, height: number, format: string, complexity: string): number {
  const baseMegapixels = (width * height) / 1000000

  // Base credits based on resolution
  let credits = Math.max(10, Math.ceil(baseMegapixels * 30))

  // Complexity multipliers
  const complexityMultipliers = {
    low: 1.0,
    medium: 1.2,
    high: 1.5,
    ultra: 2.0
  }

  // Format multipliers (some formats are more computationally expensive)
  const formatMultipliers: Record<string, number> = {
    png: 1.2,  // Alpha channel processing
    tiff: 1.3, // High quality format
    webp: 1.1, // Modern compression
    jpeg: 1.0, // Standard
    jpg: 1.0   // Standard
  }

  credits *= complexityMultipliers[complexity as keyof typeof complexityMultipliers] || 1.0
  credits *= formatMultipliers[format.toLowerCase()] || 1.0

  return Math.ceil(credits)
}

/**
 * Analyze image quality metrics
 */
async function analyzeImageQuality(image: sharp.Sharp, stats: sharp.Stats) {
  try {
    // Convert to grayscale for analysis
    const grayImage = image.clone().grayscale()

    // Ensure buffer can be generated (no need to keep data/info, avoids unused variables)
    await grayImage.raw().toBuffer()

    // Calculate brightness (mean pixel value)
    const brightness = stats.channels.reduce((sum, channel) => sum + channel.mean, 0) / stats.channels.length

    // Estimate contrast (standard deviation of pixel values)
    const contrast = Math.sqrt(
      stats.channels.reduce((sum, channel) => sum + Math.pow(channel.stdev, 2), 0) / stats.channels.length
    )

    // Simple sharpness estimation using Laplacian variance
    const sharpness = await estimateSharpness(grayImage)

    // Overall quality score (0-100)
    const quality = calculateQualityScore(brightness, contrast, sharpness)

    return {
      brightness: Math.round(brightness),
      contrast: Math.round(contrast),
      sharpness: Math.round(sharpness * 100) / 100,
      quality: Math.round(quality)
    }
  } catch (error) {
    console.error('Error analyzing image quality:', error)
    return {
      brightness: 128,
      contrast: 64,
      sharpness: 0.5,
      quality: 50
    }
  }
}

/**
 * Estimate image sharpness using Laplacian variance
 */
async function estimateSharpness(grayImage: sharp.Sharp): Promise<number> {
  try {
    // Apply Laplacian-like kernel for edge detection
    const laplacianKernel = {
      width: 3,
      height: 3,
      kernel: [
        0, -1, 0,
        -1, 4, -1,
        0, -1, 0
      ]
    }
    const filteredBuf = await grayImage.convolve(laplacianKernel).raw().toBuffer()
    const filtered = new Uint8Array(filteredBuf)

    // Calculate variance of filtered image
    let sum = 0
    let sumSquared = 0
    const length = filtered.length

    for (let i = 0; i < length; i++) {
      const value = filtered[i] ?? 0
      sum += value
      sumSquared += value * value
    }

    const mean = sum / length
    const variance = (sumSquared / length) - (mean * mean)

    return Math.sqrt(variance) / 255 // Normalize to 0-1 range
  } catch (error) {
    console.error('Error estimating sharpness:', error)
    return 0.5 // Default moderate sharpness
  }
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(brightness: number, contrast: number, sharpness: number): number {
  // Normalize brightness (optimal around 128)
  const brightnessScore = 100 - Math.abs(brightness - 128) / 128 * 100

  // Contrast score (higher is generally better, up to a point)
  const contrastScore = Math.min(contrast / 64 * 100, 100)

  // Sharpness score
  const sharpnessScore = Math.min(sharpness * 100, 100)

  // Weighted average
  return (brightnessScore * 0.3 + contrastScore * 0.4 + sharpnessScore * 0.3)
}

/**
 * Simple face detection placeholder
 * In production, this would use a proper ML model like MediaPipe or TensorFlow.js
 */
async function detectFaces(imageBuffer: Buffer): Promise<{ count: number; confidence: number }> {
  // Placeholder implementation
  // In a real application, you would integrate with:
  // - Google Vision API
  // - AWS Rekognition
  // - Azure Computer Vision
  // - Local ML models like MediaPipe

  try {
    // For now, return a mock result
    // This could be enhanced with actual face detection
    const mockFaceCount = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0

    return {
      count: mockFaceCount,
      confidence: mockFaceCount > 0 ? 0.8 + Math.random() * 0.2 : 0
    }
  } catch (error) {
    console.error('Error in face detection:', error)
    return { count: 0, confidence: 0 }
  }
}

/**
 * Validate image against processing settings
 */
function validateImage(
  width: number,
  height: number,
  fileSize: number,
  format: string,
  settings: ImageProcessingSettings
): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Check dimensions
  if (width > settings.maxWidth || height > settings.maxHeight) {
    errors.push(`Image dimensions ${width}x${height} exceed maximum allowed ${settings.maxWidth}x${settings.maxHeight}`)
  }

  // Check file size
  if (fileSize > settings.maxFileSize) {
    errors.push(`File size ${formatFileSize(fileSize)} exceeds maximum allowed ${formatFileSize(settings.maxFileSize)}`)
  }

  // Check format
  if (!settings.allowedFormats.includes(format.toLowerCase())) {
    errors.push(`Format '${format}' is not supported. Allowed formats: ${settings.allowedFormats.join(', ')}`)
  }

  // Warnings for suboptimal conditions
  if (width < 256 || height < 256) {
    warnings.push('Image resolution is quite low, enhancement results may be limited')
  }

  if (fileSize < 10000) { // Less than 10KB
    warnings.push('Image file size is very small, quality may be poor')
  }

  const aspectRatio = width / height
  if (aspectRatio > 4 || aspectRatio < 0.25) {
    warnings.push('Unusual aspect ratio detected, results may vary')
  }

  return { errors, warnings }
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
 * Create image processing report
 */
export function createProcessingReport(metadata: EnhancedImageMetadata): string {
  const lines: string[] = [
    '=== Image Processing Report ===',
    `Dimensions: ${metadata.width} × ${metadata.height} (${metadata.megapixels.toFixed(2)} MP)`,
    `File Size: ${formatFileSize(metadata.fileSize)}`,
    `Format: ${metadata.format.toUpperCase()}`,
    `Quality Score: ${metadata.quality || 'N/A'}/100`,
    `Processing Complexity: ${metadata.processingComplexity.toUpperCase()}`,
    `Credits Required: ${metadata.creditsRequired}`,
    `Faces Detected: ${metadata.faceCount || 0}`,
    '',
    'Quality Metrics:',
    `  Brightness: ${metadata.brightness || 'N/A'}/255`,
    `  Contrast: ${metadata.contrast || 'N/A'}`,
    `  Sharpness: ${metadata.sharpness || 'N/A'}`
  ]

  if (metadata.warnings.length > 0) {
    lines.push('', 'Warnings:')
    metadata.warnings.forEach(warning => lines.push(`  ⚠️  ${warning}`))
  }

  if (metadata.errors.length > 0) {
    lines.push('', 'Errors:')
    metadata.errors.forEach(error => lines.push(`  ❌ ${error}`))
  }

  lines.push('', `Processable: ${metadata.isProcessable ? '✅ Yes' : '❌ No'}`)

  return lines.join('\n')
}

// Export legacy functions for backward compatibility
export {
  getImageMetadata,
  getImageDimensions,
  calculateCreditsConsumed,
  formatResolution,
  getModelDisplayName
} from './image-metadata'