import type { SynvowModelConfig } from '../types'

// ─── Image models ─────────────────────────────────────────────────────────────
// Endpoint: /v1/images/generations (synchronous — no polling required)

// ─── Video models ─────────────────────────────────────────────────────────────
// Endpoint: /v2/videos/generations (async — poll /v2/videos/generations/:task_id)

export const SYNVOW_MODEL_CONFIG: Record<string, SynvowModelConfig> = {
  // ── Image ──────────────────────────────────────────────────────────────────
  'nano-banana-2': {
    label: 'Nano Banana 2',
    type: 'image',
    description: 'Fast image generation with optional reference',
    costUsd: 0.02,
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      referenceImage: true,
    },
  },
  'nano-banana-2-2k': {
    label: 'Nano Banana 2 (2K)',
    type: 'image',
    description: '2K resolution output with optional reference',
    costUsd: 0.04,
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      referenceImage: true,
    },
  },
  'nano-banana-2-4k': {
    label: 'Nano Banana 2 (4K)',
    type: 'image',
    description: '4K resolution output with optional reference',
    costUsd: 0.08,
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      referenceImage: true,
    },
  },
  'nano-banana-pro': {
    label: 'Nano Banana Pro',
    type: 'image',
    description: 'High-quality generation with strict reference matching',
    costUsd: 0.05,
    controls: {
      referenceImage: true,
      strictReference: true,
    },
  },
  // Model ID confirmed via API: grok-2-image
  'grok-2-image': {
    label: 'Grok 2 Image',
    type: 'image',
    description: 'xAI Grok image generation model',
    costUsd: 0.07,
    controls: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
    },
  },

  // ── Video ──────────────────────────────────────────────────────────────────
  'veo3.1-fast': {
    label: 'Veo 3.1 Fast',
    type: 'video',
    description: 'Google Veo 3.1 fast video generation',
    costUsd: 0.50,
    controls: {
      firstFrameImage: true,
    },
  },
  'sora-2': {
    label: 'Sora 2',
    type: 'video',
    description: 'OpenAI Sora 2 video generation',
    costUsd: 0.50,
    controls: {
      durations: ['5', '10', '15'],
    },
  },
  // Full versioned ID required by the API
  'doubao-seedance-1-5-pro-251215': {
    label: 'Seedance 1.5 Pro',
    type: 'video',
    description: 'ByteDance Seedance high-quality video',
    costUsd: 0.35,
    controls: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      durations: ['5', '10'],
    },
  },
  // Kling uses a non-unified API format — replaced with grok-video-3 for unified testing
  'grok-video-3': {
    label: 'Grok Video 3',
    type: 'video',
    description: 'xAI Grok video generation model',
    costUsd: 0.60,
    controls: {},
  },
}

export const SYNVOW_IMAGE_MODELS = Object.entries(SYNVOW_MODEL_CONFIG)
  .filter(([, v]) => v.type === 'image')
  .map(([k]) => k)

export const SYNVOW_VIDEO_MODELS = Object.entries(SYNVOW_MODEL_CONFIG)
  .filter(([, v]) => v.type === 'video')
  .map(([k]) => k)
