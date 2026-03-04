// Evolink AI provider — type definitions

export interface EvolinkVideoRequest {
  model: string
  prompt: string
  duration?: number
  aspect_ratio?: string
  quality?: '720p' | '1080p'
  sound?: 'on' | 'off'
  negative_prompt?: string
  callback_url?: string
  model_params?: Record<string, unknown>
}

export type EvolinkTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | string

export interface EvolinkTaskResult {
  video_url?: string
  thumbnail_url?: string
}

export interface EvolinkTaskResponse {
  id: string
  status: EvolinkTaskStatus
  progress: number
  model: string
  task_info?: {
    estimated_time?: number
    video_duration?: number
  }
  result?: EvolinkTaskResult
  usage?: {
    credits_reserved?: number
    billing_rule?: string
  }
  error?: string | { message?: string }
}

export interface EvolinkSubmitResult {
  taskId: string
  type: 'video'
  immediateOutput: null
}

export interface EvolinkPollResult {
  status: 'SUCCESS' | 'IN_PROGRESS' | 'FAILURE' | 'ERROR'
  output: string | null
  raw?: unknown
}
