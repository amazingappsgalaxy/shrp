/**
 * Synvow-specific model config derived from the central MODEL_REGISTRY.
 *
 * The central registry (src/services/models/index.ts) is the source of truth.
 * This file re-exports the subset of models whose primary provider is 'synvow',
 * shaped into the SynvowModelConfig format that the provider implementation needs.
 */
import { MODEL_REGISTRY } from '../../../models'
import type { SynvowModelConfig } from '../types'

/** All model IDs whose primary provider is Synvow */
export const SYNVOW_IMAGE_MODELS: string[] = Object.values(MODEL_REGISTRY)
  .filter(m => m.type === 'image' && m.providers[0] === 'synvow')
  .map(m => m.id)

export const SYNVOW_VIDEO_MODELS: string[] = Object.values(MODEL_REGISTRY)
  .filter(m => m.type === 'video' && m.providers[0] === 'synvow')
  .map(m => m.id)

/**
 * SynvowModelConfig view of the central registry — used internally by the
 * Synvow provider for routing (image vs video endpoint) and capability checks.
 */
export const SYNVOW_MODEL_CONFIG: Record<string, SynvowModelConfig> = Object.fromEntries(
  Object.values(MODEL_REGISTRY)
    .filter(m => m.providers[0] === 'synvow')
    .map(m => [
      m.id,
      {
        label: m.label,
        type: m.type as 'image' | 'video',
        description: m.description,
        costUsd: m.costUsd,
        controls: m.controls,
      } satisfies SynvowModelConfig,
    ])
)
