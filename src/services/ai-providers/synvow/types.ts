// Synvow inference provider — type definitions

export type SynvowModelType = 'image' | 'video'

export interface SynvowModelControls {
  aspectRatios?: string[]
  quality?: string[]
  durations?: string[]
  referenceImage?: boolean
  firstFrameImage?: boolean
  audioSync?: boolean
  strictReference?: boolean
}

export interface SynvowModelConfig {
  label: string
  type: SynvowModelType
  description: string
  controls: SynvowModelControls
  /** Approximate cost in USD per generation */
  costUsd?: number
}

export interface SynvowImageInput {
  /** 'url' = Bunny CDN URL (preferred); 'base64' = raw base64 string */
  type: 'base64' | 'url'
  data: string
}

export interface SynvowGenerateRequest {
  model: string
  prompt: string
  aspect_ratio?: string
  /** Resolution tier — sent as imageSize in Gemini-format models (e.g. nano-banana-pro) */
  imageSize?: '1K' | '2K' | '3K' | '4K'
  quality?: string
  duration?: number
  audio_sync?: boolean
  images?: SynvowImageInput[]
  /** CDN URL or base64 string for strict reference matching (nano-banana-pro) */
  reference_image?: string
  /** CDN URL or base64 string for first-frame video seeding */
  first_frame?: string
  /** CDN URL of an existing video (for editing/effects/motion-control models) */
  video_url?: string
  /** CDN URL of a target image/video (for motion-control — the subject to apply motion to) */
  target_url?: string
  /** Negative prompt to guide the model away from undesired content */
  negative_prompt?: string
  /** Lock camera movement (Seedance models) */
  camera_fixed?: boolean
  /** Seed for reproducible results */
  seed?: number
  /** Auto-optimize and translate prompt to English (Veo models) */
  enhance_prompt?: boolean
  /** Upsample output to 1080p (Veo models) */
  enable_upsample?: boolean
  /** CDN URL for end-frame video seeding (Kling) */
  end_frame?: string
  /** High-definition output — Sora 2 Pro exclusive */
  hd?: boolean
  /** Suppress watermark on output (Sora) */
  watermark?: boolean
}

export type SynvowTaskStatus =
  | 'NOT_START'
  | 'SUBMITTED'
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'SUCCESS'
  | 'FAILURE'
  | 'FAILED'
  | 'ERROR'
  | string

export interface SynvowTaskData {
  output?: string
  outputs?: string[]
}

export interface SynvowRawTaskResponse {
  status?: SynvowTaskStatus
  task_id?: string
  data?: SynvowTaskData
}

export interface SynvowSubmitResult {
  taskId: string
  type: SynvowModelType
  /** URL or data: URI returned synchronously (image models only). If set, polling is not needed. */
  immediateOutput: string | null
  /** Raw request sent to the upstream API (for dev debugging) */
  _debugRequest?: unknown
  /** Raw response received from the upstream API (for dev debugging) */
  _debugResponse?: unknown
}

export interface SynvowPollResult {
  status: SynvowTaskStatus
  output: string | null
  raw?: unknown
}
