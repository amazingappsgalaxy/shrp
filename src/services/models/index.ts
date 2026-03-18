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
  /** Maximum number of reference images the model accepts (only relevant when referenceImage=true) */
  maxReferenceImages?: number
  /** Whether the model tries to match the reference strictly */
  strictReference?: boolean
  /** Whether the model accepts a first-frame image for video seeding */
  firstFrameImage?: boolean
  /** Whether the model accepts an end-frame image for video seeding */
  endFrameImage?: boolean
  /** Supported durations in seconds (video models) */
  durations?: string[]
  /** Whether the model supports audio-sync (video models) */
  audioSync?: boolean
  /** Whether the model supports enhance_prompt (auto-translates / optimizes prompt) */
  enhancePrompt?: boolean
  /** Whether the model supports enable_upsample (upscale to 1080p) */
  enableUpsample?: boolean
  /** Whether the model supports multi-shot generation (Kling) */
  multiShot?: boolean
  /** Whether the model supports element_list (Kling subject consistency) */
  elementList?: boolean
  /** Whether the model supports keep_original_sound (preserve input video audio) */
  keepOriginalSound?: boolean
  /** Whether the model supports hd (high-definition) output (Sora 2 Pro) */
  hd?: boolean
  /** Whether the first-frame image is required (not just optional) */
  requiresImage?: boolean
  /**
   * Whether the model requires a motion-source video upload (RunningHub motion-transfer models).
   * When true the Motion tab shows a mandatory video upload field.
   */
  requiresVideo?: boolean
  /**
   * Whether the model supports a Smart Recreate toggle that selects an alternative workflow path.
   * Applies to Mirai Motion Action and Portrait sub-models.
   */
  smartRecreate?: boolean
  /**
   * Whether the Smart Recreate mode exposes additional portrait-specific sub-modes
   * (Replace Character vs Smart Replace Character).
   * Only applies to Mirai Motion Portrait.
   */
  portraitSmartRecreateModes?: boolean
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
   * Groups quality variants of the same base model (e.g. nano-banana-2 family: separate model IDs per resolution).
   * Models sharing a qualityGroupId are shown as a quality tier picker, not separate models.
   */
  qualityGroupId?: string
  /** Resolution tier within a quality group */
  qualityTier?: '1K' | '2K' | '3K' | '4K'
  /**
   * For models that accept an imageSize parameter (e.g. nano-banana-pro via Gemini API).
   * These are a single model ID that supports multiple output sizes via a request param.
   */
  supportedImageSizes?: ('1K' | '2K' | '3K' | '4K')[]
  /**
   * Groups variant models of the same base model family (e.g. Veo 3.1: fast/standard/pro/pro-4k).
   * Models sharing a variantGroupId are shown as a single entry with a variant sub-picker.
   */
  variantGroupId?: string
  /** Variant tier label within a variant group (e.g. "Fast", "Standard", "Pro", "Pro 4K") */
  variantTier?: string
  /** Whether this is the representative/default model shown in the group picker */
  variantDefault?: boolean
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
      maxReferenceImages: 5,
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
      maxReferenceImages: 5,
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
      maxReferenceImages: 5,
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
      maxReferenceImages: 16,
    },
    providers: ['synvow'],
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    label: 'Gemini Flash',
    type: 'image',
    description: 'Google Gemini Flash — fast, high-quality text-to-image',
    credits: 20,
    costUsd: 0.02,
    tag: 'Google',
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    },
    providers: ['synvow'],
  },
  {
    id: 'nano-banana',
    label: 'Nano Banana',
    type: 'image',
    description: 'Fast generation with optional reference image',
    credits: 20,
    costUsd: 0.02,
    tag: 'Fast',
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      referenceImage: true,
      maxReferenceImages: 5,
    },
    providers: ['synvow'],
  },
  {
    id: 'doubao-seedream-5-0-260128',
    label: 'Seedream 5.0 Lite',
    type: 'image',
    description: 'ByteDance Seedream 5.0 Lite — photorealistic, multi-ref image generation',
    credits: 25,
    costUsd: 0.025,
    tag: 'ByteDance',
    supportedImageSizes: ['2K', '3K'],
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
      referenceImage: true,
      maxReferenceImages: 14,
    },
    providers: ['synvow'],
  },
  {
    id: 'doubao-seedream-4-5-251128',
    label: 'Seedream 4.5',
    type: 'image',
    description: 'ByteDance Seedream 4.5 — fast, high-quality generation with strong realism',
    credits: 20,
    costUsd: 0.02,
    tag: 'ByteDance',
    supportedImageSizes: ['2K', '3K'],
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
      referenceImage: true,
      maxReferenceImages: 14,
    },
    providers: ['synvow'],
  },
  {
    id: 'soul-2',
    label: 'Soul 2.0',
    type: 'image',
    description: 'Sharpii Soul 2.0 — photorealistic text-to-image generation',
    credits: 50,
    costUsd: 0.05,
    tag: 'Sharpii',
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
    },
    providers: ['runninghub'],
  },
]

// ─── Video models ──────────────────────────────────────────────────────────────

const VIDEO_MODELS: ModelConfig[] = [
  // ── Kling models (Evolink) ─────────────────────────────────────────────────
  {
    id: 'kling-3',
    label: 'Kling 3.0 Pro',
    type: 'video',
    description: 'Kuaishou Kling 3.0 Pro — multi-shot cinematic video generation',
    credits: 300,
    costUsd: 0.30,
    tag: 'Premium',
    controls: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      durations: ['1', '5', '10', '15'],
      audioSync: true,
      multiShot: true,
      elementList: true,
      firstFrameImage: true,
      endFrameImage: true,
    },
    providers: ['evolink'],
  },
  {
    id: 'kling-o3',
    label: 'Kling O3 OMNI',
    type: 'video',
    description: 'Kuaishou Kling O3 OMNI — advanced video generation with superior motion',
    credits: 350,
    costUsd: 0.35,
    tag: 'Advanced',
    controls: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      durations: ['1', '5', '10', '15'],
      audioSync: true,
      multiShot: true,
      elementList: true,
      firstFrameImage: true,
      endFrameImage: true,
    },
    providers: ['evolink'],
  },
  // ── Google Veo 3.1 family (grouped as variant picker) ─────────────────────
  {
    id: 'veo3.1-fast',
    label: 'Veo 3.1',
    type: 'video',
    description: 'Fastest generation, great for iteration',
    credits: 350,
    costUsd: 0.35,
    tag: 'Google',
    variantGroupId: 'veo-3.1',
    variantTier: 'Fast',
    variantDefault: true,
    controls: {
      aspectRatios: ['16:9', '9:16'],
      durations: ['5', '8'],
      firstFrameImage: true,
      enhancePrompt: true,
      enableUpsample: true,
    },
    providers: ['synvow'],
  },
  {
    id: 'veo3.1',
    label: 'Veo 3.1',
    type: 'video',
    description: 'Enhanced generation with improved motion coherence',
    credits: 500,
    costUsd: 0.50,
    tag: 'Google',
    variantGroupId: 'veo-3.1',
    variantTier: 'Standard',
    controls: {
      aspectRatios: ['16:9', '9:16'],
      durations: ['5', '8'],
      firstFrameImage: true,
      audioSync: true,
      enhancePrompt: true,
      enableUpsample: true,
    },
    providers: ['synvow'],
  },
  {
    id: 'veo3.1-pro',
    label: 'Veo 3.1',
    type: 'video',
    description: 'Professional-grade video with advanced controls',
    credits: 600,
    costUsd: 0.60,
    tag: 'Google',
    variantGroupId: 'veo-3.1',
    variantTier: 'Pro',
    controls: {
      aspectRatios: ['16:9', '9:16'],
      durations: ['5', '8'],
      firstFrameImage: true,
      audioSync: true,
      enhancePrompt: true,
      enableUpsample: true,
    },
    providers: ['synvow'],
  },
  {
    id: 'veo3.1-pro-4k',
    label: 'Veo 3.1',
    type: 'video',
    description: 'Ultra-high resolution 4K professional video',
    credits: 800,
    costUsd: 0.80,
    tag: 'Google',
    variantGroupId: 'veo-3.1',
    variantTier: 'Pro 4K',
    controls: {
      aspectRatios: ['16:9', '9:16'],
      durations: ['5', '8'],
      firstFrameImage: true,
      audioSync: true,
      enhancePrompt: true,
    },
    providers: ['synvow'],
  },
  {
    id: 'veo3.1-components',
    label: 'Veo 3.1',
    type: 'video',
    description: 'Multi-image component assembly into video',
    credits: 550,
    costUsd: 0.55,
    tag: 'Google',
    variantGroupId: 'veo-3.1',
    variantTier: 'Components',
    controls: {
      aspectRatios: ['16:9', '9:16'],
      durations: ['5', '8'],
      enhancePrompt: true,
    },
    providers: ['synvow'],
  },
  // ── Google Veo 3 ──────────────────────────────────────────────────────────
  {
    id: 'veo3',
    label: 'Veo 3',
    type: 'video',
    description: 'Google Veo 3 — cinematic video with native audio generation',
    credits: 500,
    costUsd: 0.50,
    tag: 'Google',
    controls: {
      aspectRatios: ['16:9', '9:16'],
      durations: ['5', '8'],
      firstFrameImage: true,
      audioSync: true,
      enhancePrompt: true,
      enableUpsample: true,
    },
    providers: ['synvow'],
  },
  // ── Google Veo 2 ──────────────────────────────────────────────────────────
  {
    id: 'veo2',
    label: 'Veo 2',
    type: 'video',
    description: 'Google Veo 2 — photorealistic video generation',
    credits: 400,
    costUsd: 0.40,
    tag: 'Google',
    controls: {
      aspectRatios: ['16:9', '9:16'],
      durations: ['5', '8'],
      firstFrameImage: true,
      enhancePrompt: true,
      enableUpsample: true,
    },
    providers: ['synvow'],
  },
  // ── OpenAI Sora models ────────────────────────────────────────────────────
  {
    id: 'sora-2',
    label: 'Sora 2',
    type: 'video',
    description: 'OpenAI Sora 2 — cinematic image-to-video generation',
    credits: 500,
    costUsd: 0.50,
    tag: 'OpenAI',
    controls: {
      aspectRatios: ['16:9', '9:16'],   // API only supports 16:9 and 9:16
      durations: ['4', '15'],           // 4–15s range (valid: 4,8,10,12,15)
      firstFrameImage: true,            // images[] is REQUIRED by the API
      requiresImage: true,
    },
    providers: ['synvow'],
  },
  {
    id: 'sora-2-pro',
    label: 'Sora 2 Pro',
    type: 'video',
    description: 'OpenAI Sora 2 Pro — highest quality, up to 25s, HD support',
    credits: 700,
    costUsd: 0.70,
    tag: 'OpenAI',
    controls: {
      aspectRatios: ['16:9', '9:16'],   // API only supports 16:9 and 9:16
      durations: ['4', '25'],           // 4–25s range (25s is Pro-only)
      firstFrameImage: true,            // images[] is REQUIRED by the API
      requiresImage: true,
      hd: true,                         // HD mode exclusive to sora-2-pro
    },
    providers: ['synvow'],
  },
  // ── ByteDance Seedance ─────────────────────────────────────────────────────
  {
    id: 'doubao-seedance-1-5-pro-251215',
    label: 'Seedance 1.5 Pro',
    type: 'video',
    description: 'ByteDance Seedance 1.5 Pro — high-quality video with strong prompt adherence',
    credits: 350,
    costUsd: 0.35,
    tag: 'ByteDance',
    controls: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      durations: ['4', '12'],           // 4–12s range per API docs
      firstFrameImage: true,
      audioSync: true,                  // generate_audio is exclusive to 1.5 Pro
    },
    providers: ['synvow'],
  },
  // ── Video editing models ───────────────────────────────────────────────────
  {
    id: 'kling-o3-video-edit',
    label: 'Kling O3 Edit',
    type: 'video',
    description: 'AI-powered video editing — transform existing videos with natural language instructions',
    credits: 280,
    costUsd: 0.28,
    tag: 'Edit',
    controls: {
      multiShot: true,
      elementList: true,
      keepOriginalSound: true,
    },
    providers: ['evolink'],
  },
  // ── Reference-to-video models ──────────────────────────────────────────────
  {
    id: 'kling-o3-reference-to-video',
    label: 'Kling O3 Ref2Vid',
    type: 'video',
    description: 'Generate new videos guided by a reference video\'s style and motion using Kling O3',
    credits: 350,
    costUsd: 0.35,
    tag: 'Motion',
    controls: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      durations: ['3', '5', '8', '10'],
      multiShot: true,
      elementList: true,
      keepOriginalSound: true,
    },
    providers: ['evolink'],
  },
  // ── Mirai Motion - Replicate (RunningHub) ─────────────────────────────────
  //
  // Three sub-models grouped under variantGroupId 'mirai-motion-replicate'.
  // Each maps to a distinct RunningHub ComfyUI workflow (and Smart Recreate
  // selects an alternative workflow path within the same sub-model).
  //
  // Future API access: each sub-model has its own unique model ID so external
  // callers can target Action / Portrait / Inhuman independently.
  {
    id: 'mirai-motion-action',
    label: 'Mirai Motion - Replicate',
    type: 'video',
    description: 'Transfer motion from a reference video to any character. Smart Recreate replaces the background automatically.',
    credits: 350,
    costUsd: 0.35,
    tag: 'Motion',
    variantGroupId: 'mirai-motion-replicate',
    variantTier: 'Action',
    variantDefault: true,
    controls: {
      requiresVideo: true,
      requiresImage: true,
      smartRecreate: true,
    },
    providers: ['runninghub'],
  },
  {
    id: 'mirai-motion-portrait',
    label: 'Mirai Motion - Replicate',
    type: 'video',
    description: 'Portrait-optimised motion transfer with Replace Character and Smart Replace modes.',
    credits: 350,
    costUsd: 0.35,
    tag: 'Motion',
    variantGroupId: 'mirai-motion-replicate',
    variantTier: 'Portrait',
    controls: {
      requiresVideo: true,
      requiresImage: true,
      smartRecreate: true,
      portraitSmartRecreateModes: true,
    },
    providers: ['runninghub'],
  },
  {
    id: 'mirai-motion-inhuman',
    label: 'Mirai Motion - Replicate',
    type: 'video',
    description: 'Motion transfer for non-human / creature subjects. No prompt required.',
    credits: 350,
    costUsd: 0.35,
    tag: 'Motion',
    variantGroupId: 'mirai-motion-replicate',
    variantTier: 'Inhuman',
    controls: {
      requiresVideo: true,
      requiresImage: true,
    },
    providers: ['runninghub'],
  },
  // ── Legacy models (kept for backwards compatibility) ───────────────────────
  {
    id: 'kling-effects',
    label: 'Kling Effects',
    type: 'video',
    description: 'Apply AI effects and style transformations to existing videos',
    credits: 250,
    costUsd: 0.25,
    tag: 'Edit',
    controls: {
      aspectRatios: ['16:9', '9:16', '1:1'],
    },
    providers: ['evolink'],
  },
  {
    id: 'kling-video-motion-control',
    label: 'Kling Motion Control',
    type: 'video',
    description: 'Transfer motion from a reference video to a target subject or image',
    credits: 300,
    costUsd: 0.30,
    tag: 'Motion',
    controls: {},
    providers: ['evolink'],
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
