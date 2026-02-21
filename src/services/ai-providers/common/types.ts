// Base types and interfaces for AI model providers

export interface EnhancementSettings {
  prompt: string
  negative_prompt?: string
  steps?: number
  guidance_scale?: number
  creativity?: number
  resemblance?: number
  hdr?: number
  resolution?: 'original' | '1024' | '2048'
  scheduler?: 'DDIM' | 'DPMSolverMultistep' | 'K_EULER_ANCESTRAL' | 'K_EULER' | 'sgm_uniform' | 'simple' | 'normal'
  sampler_name?: string
  guess_mode?: boolean
  seed?: number
  mask?: string
  strength?: number
  denoise?: number
  enable_upscale?: boolean
  upscaler?: string
  mode?: string
  // Dynamic properties for node overrides
  [key: string]: any
}

export interface EnhancementRequest {
  imageUrl: string
  settings: EnhancementSettings
  userId: string
  imageId: string
}

export interface EnhancementResponse {
  success: boolean
  enhancedUrl?: string | string[]
  outputs?: { type: 'image' | 'video'; url: string }[]
  error?: string
  message?: string
  metadata?: {
    modelVersion?: string
    processingTime?: number
    settings?: EnhancementSettings
    userId?: string
    imageId?: string
    outputFormat?: string
    provider?: string
    model?: string
    timestamp?: number
    details?: unknown
    jobId?: string
  }
}

export interface ModelProvider {
  name: string
  displayName: string
  description: string
  supportedFeatures: string[]
  maxImageSize?: number
  supportedFormats?: string[]
}

export type PrimitiveParamDefault = string | number | boolean

export interface ModelParameter {
  type: 'string' | 'number' | 'boolean' | 'select'
  default: PrimitiveParamDefault
  min?: number
  max?: number
  step?: number
  options?: string[]
  description: string
}

export interface ModelInfo {
  id: string
  name: string
  displayName: string
  description: string
  provider: ModelProvider
  version?: string
  capabilities: string[]
  parameters?: Record<string, ModelParameter>
  pricing?: {
    costPerImage?: number
    currency?: string
  }
}

export enum ProviderType {
  RUNNINGHUB = 'runninghub'
}

export interface ProviderConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
  retries?: number
}

export interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  message?: string
  estimatedTime?: number
}

export interface EnhancementJob {
  id: string
  userId: string
  imageId: string
  provider: ProviderType
  model: string
  status: ProcessingStatus
  request: EnhancementRequest
  response?: EnhancementResponse
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}
