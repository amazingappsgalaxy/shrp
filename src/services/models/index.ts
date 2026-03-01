/**
 * Provider-agnostic model registry.
 *
 * A Model describes *what* a generation task does and how much it costs.
 * The `providers` array lists which AI providers can fulfill the request,
 * in priority order (first = primary, rest = fallbacks).
 *
 * Provider implementations live under src/services/ai-providers/<name>/.
 */

export type ModelType = 'image' | 'video'

export interface ModelControls {
  /** Supported aspect ratios (e.g. ["1:1", "16:9"]) */
  aspectRatios?: string[]
  /** Whether the model accepts a reference image input */
  referenceImage?: boolean
  /** Whether the model tries to match the reference strictly */
  strictReference?: boolean
  /** Whether the model accepts a first-frame image for video seeding */
  firstFrameImage?: boolean
  /** Supported durations in seconds (video models) */
  durations?: string[]
  /** Whether the model supports audio-sync (video models) */
  audioSync?: boolean
}

export interface ModelConfig {
  /** Unique model ID used when calling the provider API */
  id: string
  /** Human-readable label */
  label: string
  type: ModelType
  description: string
  /** Credit cost per generation (displayed in UI and deducted from balance) */
  credits: number
  /** Approximate USD cost per generation (informational) */
  costUsd: number
  /** UI tag shown in the model picker (e.g. "Fast", "Premium", "Creative") */
  tag: string
  controls: ModelControls
  /**
   * Groups quality variants of the same base model (e.g. nano-banana 1K/2K/4K).
   * Models sharing a qualityGroupId are shown as a quality tier picker, not separate models.
   */
  qualityGroupId?: string
  /** Resolution tier within a quality group */
  qualityTier?: '1K' | '2K' | '4K'
  /**
   * For models that accept an imageSize parameter (e.g. nano-banana-pro via Gemini API).
   * These are a single model ID that supports multiple output sizes via a request param.
   */
  supportedImageSizes?: ('1K' | '2K' | '4K')[]
  /**
   * Ordered list of provider IDs that can fulfill this model.
   * First entry is the primary provider; subsequent entries are fallbacks.
   */
  providers: string[]
}

// ─── Image models ──────────────────────────────────────────────────────────────

const IMAGE_MODELS: ModelConfig[] = [
  {
    id: 'nano-banana-2',
    label: 'Nano Banana 2',
    type: 'image',
    description: 'Fast generation with optional reference',
    credits: 20,
    costUsd: 0.02,
    tag: 'Fast',
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      referenceImage: true,
    },
    qualityGroupId: 'nano-banana',
    qualityTier: '1K',
    providers: ['synvow'],
  },
  {
    id: 'nano-banana-2-2k',
    label: 'Nano Banana 2',
    type: 'image',
    description: '2K resolution with optional reference',
    credits: 40,
    costUsd: 0.04,
    tag: 'Fast',
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      referenceImage: true,
    },
    qualityGroupId: 'nano-banana',
    qualityTier: '2K',
    providers: ['synvow'],
  },
  {
    id: 'nano-banana-2-4k',
    label: 'Nano Banana 2',
    type: 'image',
    description: '4K resolution with optional reference',
    credits: 80,
    costUsd: 0.08,
    tag: 'Fast',
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      referenceImage: true,
    },
    qualityGroupId: 'nano-banana',
    qualityTier: '4K',
    providers: ['synvow'],
  },
  {
    id: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    type: 'image',
    description: 'High-quality with strict reference matching',
    credits: 50,
    costUsd: 0.05,
    tag: 'Pro',
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      referenceImage: true,
      strictReference: true,
    },
    // Resolution is hard-capped at 1K by the api.gptbest.vip proxy — 2K/4K are non-functional.
    // Use nano-banana-2-4k for 4K output instead.
    providers: ['synvow'],
  },
  {
    id: 'grok-2-image',
    label: 'Grok 2',
    type: 'image',
    description: 'xAI Grok image generation (text-to-image)',
    credits: 70,
    costUsd: 0.07,
    tag: 'Creative',
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
    },
    providers: ['synvow'],
  },
]

// ─── Video models ──────────────────────────────────────────────────────────────

const VIDEO_MODELS: ModelConfig[] = [
  {
    id: 'veo3.1-fast',
    label: 'Veo 3.1 Fast',
    type: 'video',
    description: 'Google Veo 3.1 fast video generation',
    credits: 500,
    costUsd: 0.50,
    tag: 'Google',
    controls: { firstFrameImage: true },
    providers: ['synvow'],
  },
  {
    id: 'sora-2',
    label: 'Sora 2',
    type: 'video',
    description: 'OpenAI Sora 2 video generation',
    credits: 500,
    costUsd: 0.50,
    tag: 'OpenAI',
    controls: { durations: ['5', '10', '15'] },
    providers: ['synvow'],
  },
  {
    id: 'doubao-seedance-1-5-pro-251215',
    label: 'Seedance 1.5 Pro',
    type: 'video',
    description: 'ByteDance Seedance high-quality video',
    credits: 350,
    costUsd: 0.35,
    tag: 'ByteDance',
    controls: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      durations: ['5', '10'],
    },
    providers: ['synvow'],
  },
  {
    id: 'grok-video-3',
    label: 'Grok Video 3',
    type: 'video',
    description: 'xAI Grok video generation',
    credits: 600,
    costUsd: 0.60,
    tag: 'xAI',
    controls: {},
    providers: ['synvow'],
  },
]

// ─── Registry ──────────────────────────────────────────────────────────────────

const ALL_MODELS = [...IMAGE_MODELS, ...VIDEO_MODELS]

/** Full model registry keyed by model ID */
export const MODEL_REGISTRY: Record<string, ModelConfig> = Object.fromEntries(
  ALL_MODELS.map(m => [m.id, m])
)

/** All image models */
export function getImageModels(): ModelConfig[] {
  return IMAGE_MODELS
}

/** All video models */
export function getVideoModels(): ModelConfig[] {
  return VIDEO_MODELS
}

/** Look up a model by ID (returns undefined if not found) */
export function getModel(id: string): ModelConfig | undefined {
  return MODEL_REGISTRY[id]
}

/** Returns the primary provider ID for a model */
export function getPrimaryProvider(modelId: string): string | undefined {
  return MODEL_REGISTRY[modelId]?.providers[0]
}
