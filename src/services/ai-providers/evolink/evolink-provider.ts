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

/** Map internal model IDs to Evolink API model names */
const EVOLINK_MODEL_MAP: Record<string, string> = {
  'kling-3': 'kling-v3-text-to-video',
  'kling-o3': 'kling-o3-text-to-video',
  'kling-effects': 'kling-effects',
  'kling-video-motion-control': 'kling-motion-control',
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

  /** Returns the API model name for a given internal model ID */
  private resolveModelName(modelId: string): string {
    return EVOLINK_MODEL_MAP[modelId] ?? modelId
  }

  /**
   * Submit a video generation task.
   * Returns task ID for polling.
   */
  async submitTask(req: EvolinkVideoRequest): Promise<EvolinkSubmitResult> {
    const apiModelId = this.resolveModelName(req.model)

    const body: Record<string, unknown> = {
      model: apiModelId,
      prompt: req.prompt,
      duration: req.duration ?? 5,
      aspect_ratio: req.aspect_ratio ?? '16:9',
      quality: req.quality ?? '720p',
      sound: req.sound ?? 'off',
    }

    if (req.negative_prompt) body.negative_prompt = req.negative_prompt
    if (req.callback_url) body.callback_url = req.callback_url
    if (req.model_params) body.model_params = req.model_params

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
          output: data.result?.video_url ?? null,
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
