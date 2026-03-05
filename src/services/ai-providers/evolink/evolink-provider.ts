import type {
  EvolinkVideoRequest,
  EvolinkTaskResponse,
  EvolinkSubmitResult,
  EvolinkPollResult,
} from './types'

/**
 * Evolink AI provider.
 *
 * Base URL: https://api.evolink.ai
 * Authentication: Bearer token (EVOLINK_API_KEY env var)
 *
 * Supported models:
 *   - kling-3  → API model: kling-v3-text-to-video
 *   - kling-o3 → API model: kling-o3-text-to-video
 *
 * Flow:
 *   1. POST /v1/videos/generations → returns { id, status: 'pending', ... }
 *   2. Poll GET /v1/tasks/{id} until status === 'completed'
 *   3. Extract result.video_url from completed task
 */

/** Map internal model IDs to Evolink API model names.
 *  When a first_frame (image_start) is provided at request time,
 *  the provider automatically routes to the I2V variant. */
const EVOLINK_MODEL_MAP: Record<string, string> = {
  'kling-3': 'kling-v3-text-to-video',
  'kling-o3': 'kling-o3-text-to-video',
  'kling-effects': 'kling-effects',
  'kling-video-motion-control': 'kling-motion-control',
}

/** I2V variants: when image_start or image_end is present, use this model instead */
const EVOLINK_I2V_MAP: Record<string, string> = {
  'kling-3': 'kling-v3-image-to-video',
  'kling-o3': 'kling-o3-image-to-video',
}

function getBase(): string {
  return process.env.EVOLINK_BASE_URL || 'https://api.evolink.ai'
}

export class EvolinkProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  /** Returns the API model name. Auto-selects I2V variant when image inputs are present. */
  private resolveModelName(modelId: string, hasImageInput: boolean): string {
    if (hasImageInput && EVOLINK_I2V_MAP[modelId]) return EVOLINK_I2V_MAP[modelId]!
    return EVOLINK_MODEL_MAP[modelId] ?? modelId
  }

  /**
   * Submit a video generation task.
   * Returns task ID for polling.
   */
  async submitTask(req: EvolinkVideoRequest): Promise<EvolinkSubmitResult> {
    const hasImageInput = !!(req.image_start || req.image_end)
    const apiModelId = this.resolveModelName(req.model, hasImageInput)

    const body: Record<string, unknown> = {
      model: apiModelId,
      prompt: req.prompt,
      quality: req.quality ?? '720p',
    }

    // Only include these when present — some models (kling-o3-video-edit) don't support them
    if (req.duration !== undefined) body.duration = req.duration
    if (req.aspect_ratio !== undefined) body.aspect_ratio = req.aspect_ratio
    if (req.sound !== undefined) body.sound = req.sound
    if (req.negative_prompt) body.negative_prompt = req.negative_prompt
    if (req.callback_url) body.callback_url = req.callback_url
    // image_start / image_end for I2V models (Kling image-to-video)
    if (req.image_start) body.image_start = req.image_start
    if (req.image_end) body.image_end = req.image_end
    // video_url for edit / reference-to-video models
    if (req.video_url) body.video_url = req.video_url
    // keep_original_sound for edit / reference-to-video models
    if (req.keep_original_sound !== undefined) body.keep_original_sound = req.keep_original_sound
    // image_urls: up to 4 reference images
    if (req.image_urls?.length) body.image_urls = req.image_urls
    // model_params is passed as-is — multi_shot, shot_type, multi_prompt, mode, cfg_scale, etc.
    if (req.model_params && Object.keys(req.model_params).length > 0) {
      body.model_params = req.model_params
    }

    const res = await fetch(`${getBase()}/v1/videos/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = (await res.json()) as EvolinkTaskResponse

    if (!res.ok) {
      const errMsg =
        typeof data.error === 'string'
          ? data.error
          : (data.error as { message?: string } | undefined)?.message ?? `Evolink API error ${res.status}`
      throw new Error(errMsg)
    }

    if (!data.id) throw new Error('Evolink API did not return a task id')

    return { taskId: data.id, type: 'video', immediateOutput: null }
  }

  /**
   * Poll the status of a submitted task.
   * Returns normalized status + output URL when complete.
   */
  async pollTask(taskId: string): Promise<EvolinkPollResult> {
    const res = await fetch(`${getBase()}/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    const data = (await res.json()) as EvolinkTaskResponse

    if (!res.ok) {
      throw new Error(`Evolink poll error ${res.status}`)
    }

    switch (data.status) {
      case 'completed':
        return {
          status: 'SUCCESS',
          // API returns results: string[] — first element is the video URL.
          // data.result?.video_url is a legacy fallback (not used by current API).
          output: data.results?.[0] ?? data.result?.video_url ?? null,
          raw: data,
        }
      case 'failed':
        return {
          status: 'FAILURE',
          output: null,
          raw: data,
        }
      case 'pending':
      case 'processing':
        return {
          status: 'IN_PROGRESS',
          output: null,
          raw: data,
        }
      default:
        return {
          status: 'IN_PROGRESS',
          output: null,
          raw: data,
        }
    }
  }
}

/** Singleton factory — reads key from env */
export function getEvolinkProvider(): EvolinkProvider {
  const key = process.env.EVOLINK_API_KEY || ''
  if (!key) {
    console.warn('⚠️ EVOLINK_API_KEY is not configured — Evolink models will fail')
  }
  return new EvolinkProvider(key)
}
