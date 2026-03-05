// Evolink AI provider — type definitions

export interface EvolinkMultiPromptShot {
  index: number
  prompt: string
  /** Duration as a string per API spec (e.g. "5") */
  duration: string
}

export interface EvolinkModelParams {
  /** Enable multi-shot mode (Kling 3.0+) */
  multi_shot?: boolean
  /** Required when multi_shot=true: "customize" | "intelligence" */
  shot_type?: 'customize' | 'intelligence'
  /** Per-shot prompts; required when shot_type="customize" */
  multi_prompt?: EvolinkMultiPromptShot[]
  /** Subject library references (max 3) */
  element_list?: { element_id: number }[]
  watermark_info?: { enabled: boolean }
  /** Scene mode: "std" | "pro" (Kling) */
  mode?: string
  /** Prompt adherence 0-1 (Kling) */
  cfg_scale?: number
}

export interface EvolinkVideoRequest {
  model: string
  prompt: string
  duration?: number
  aspect_ratio?: string
  quality?: '720p' | '1080p'
  sound?: 'on' | 'off'
  negative_prompt?: string
  callback_url?: string
  model_params?: EvolinkModelParams
  /** First-frame image URL for image-to-video (Kling I2V: image_start) */
  image_start?: string
  /** End-frame image URL for image-to-video (Kling I2V: image_end) */
  image_end?: string
  /** Reference or source video URL (kling-o3-video-edit, kling-o3-reference-to-video) */
  video_url?: string
  /** Whether to preserve original audio from input video */
  keep_original_sound?: boolean
  /** Optional reference image URLs for style/scene guidance */
  image_urls?: string[]
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
  /** Completed task output URLs — API returns results[0] as the video URL */
  results?: string[]
  /** Legacy / fallback result shape (if ever used) */
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
