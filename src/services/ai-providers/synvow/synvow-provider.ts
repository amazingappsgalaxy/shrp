import type {
  SynvowGenerateRequest,
  SynvowSubmitResult,
  SynvowPollResult,
  SynvowRawTaskResponse,
  SynvowModelType,
} from './types'
import { SYNVOW_IMAGE_MODELS } from './models'
import { config } from '../../../lib/config'

// Base URL is read from config so it can be overridden via SYNVOW_BASE_URL env var
function getBase(): string {
  return config.ai.synvow.baseUrl
}

export class SynvowProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  isImageModel(modelId: string): boolean {
    return SYNVOW_IMAGE_MODELS.includes(modelId)
  }

  getModelType(modelId: string): SynvowModelType {
    return this.isImageModel(modelId) ? 'image' : 'video'
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Submit a generation task.
   *
   * - Image models (no reference image): POST /v1/images/generations — synchronous, returns URL immediately.
   * - Image models (with reference image): POST /v1/chat/completions with image_url in content array.
   *   The model embeds the output URL in a markdown response; we extract it with a regex.
   * - Video models: POST /v2/videos/generations — async, returns task_id for polling.
   *
   * All image paths set immediateOutput; video paths set taskId for polling.
   */
  async submitTask(req: SynvowGenerateRequest): Promise<SynvowSubmitResult> {
    const type = this.getModelType(req.model)
    return type === 'image'
      ? this.submitImageTask(req)
      : this.submitVideoTask(req)
  }

  private async submitImageTask(req: SynvowGenerateRequest): Promise<SynvowSubmitResult> {
    const hasReferenceImage = !!(req.images?.length || req.reference_image)

    // When a reference image is provided, use the chat completions API (vision-style).
    // This matches exactly what ai.synvow.cc playground does for image-to-image tasks.
    if (hasReferenceImage) {
      return this.submitImageTaskWithReference(req)
    }

    // Text-to-image (no reference) — use the standard images/generations endpoint
    const endpoint = `${getBase()}/v1/images/generations`
    const body: Record<string, unknown> = {
      model: req.model,
      prompt: req.prompt,
      n: 1,
    }
    if (req.aspect_ratio) body.size = aspectRatioToSize(req.aspect_ratio)

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = (await res.json()) as {
      data?: Array<{ url?: string; revised_prompt?: string }>
      error?: { message?: string }
    }

    if (!res.ok) {
      throw new Error(data.error?.message ?? `Image API error ${res.status}`)
    }

    const url = data.data?.[0]?.url ?? null
    if (!url) throw new Error('Image API returned no URL')

    return { taskId: `sync_${Date.now()}`, type: 'image', immediateOutput: url }
  }

  /**
   * Image-to-image generation via the chat completions API.
   *
   * The playground (ai.synvow.cc) uses this exact format:
   *   POST /v1/chat/completions
   *   { model, messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url } }] }] }
   *
   * The model returns a text response with the image URL embedded in markdown
   * (e.g. "生成中...\n![image1](https://...jpg)") — we extract the URL via regex.
   */
  private async submitImageTaskWithReference(req: SynvowGenerateRequest): Promise<SynvowSubmitResult> {
    const endpoint = `${getBase()}/v1/chat/completions`

    // Resolve image URL — prefer explicit images array, fall back to reference_image
    let imageUrl: string | null = null
    if (req.images?.length) {
      const img = req.images[0]!
      imageUrl = img.type === 'url' ? img.data : `data:image/jpeg;base64,${img.data}`
    } else if (req.reference_image) {
      const isUrl = req.reference_image.startsWith('http')
      imageUrl = isUrl ? req.reference_image : `data:image/jpeg;base64,${req.reference_image}`
    }

    const content: unknown[] = [{ type: 'text', text: req.prompt }]
    if (imageUrl) {
      content.push({ type: 'image_url', image_url: { url: imageUrl } })
    }

    const body: Record<string, unknown> = {
      model: req.model,
      messages: [{ role: 'user', content }],
      stream: false,
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }

    if (!res.ok) {
      throw new Error(data.error?.message ?? `Chat completions API error ${res.status}`)
    }

    const content0 = data.choices?.[0]?.message?.content ?? ''

    // Extract image URL from markdown: ![imageN](url)
    const match = content0.match(/!\[image\d*\]\((https?:\/\/[^)]+)\)/)
    const url = match?.[1] ?? null
    if (!url) {
      throw new Error(`Image URL not found in response. Response content: ${content0.slice(0, 200)}`)
    }

    return { taskId: `sync_${Date.now()}`, type: 'image', immediateOutput: url }
  }

  private async submitVideoTask(req: SynvowGenerateRequest): Promise<SynvowSubmitResult> {
    const endpoint = `${getBase()}/v2/videos/generations`

    const body: Record<string, unknown> = {
      model: req.model,
      prompt: req.prompt,
    }
    if (req.aspect_ratio) body.aspect_ratio = req.aspect_ratio
    if (req.duration !== undefined) body.duration = req.duration
    if (req.audio_sync !== undefined) body.audio_sync = req.audio_sync
    if (req.images?.length) {
      body.images = req.images.map((img) =>
        img.type === 'url' ? img.data : `data:image/jpeg;base64,${img.data}`
      )
    }
    if (req.first_frame) {
      // first_frame is either a CDN URL or base64 — pass directly if URL, encode otherwise
      const isUrl = req.first_frame.startsWith('http')
      body.images = [isUrl ? req.first_frame : `data:image/jpeg;base64,${req.first_frame}`]
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = (await res.json()) as SynvowRawTaskResponse & { error?: { message?: string } }

    if (!res.ok) {
      throw new Error(data.error?.message ?? `Video API error ${res.status}`)
    }

    const taskId = data.task_id
    if (!taskId) throw new Error('Video API did not return a task_id')

    return { taskId, type: 'video', immediateOutput: null }
  }

  async pollTask(taskId: string, type: SynvowModelType): Promise<SynvowPollResult> {
    if (type === 'image') {
      // Images are synchronous — polling is not needed; return done immediately
      return { status: 'SUCCESS', output: null }
    }

    const endpoint = `${getBase()}/v2/videos/generations/${taskId}`

    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })

    const data = (await res.json()) as SynvowRawTaskResponse & {
      error?: { message?: string }
    }

    if (!res.ok) {
      throw new Error(data.error?.message ?? `Poll error ${res.status}`)
    }

    const status =
      (data.status as string) ??
      ((data.data as Record<string, unknown> | undefined)?.status as string | undefined) ??
      'UNKNOWN'

    const taskData = data.data ?? {}
    const output =
      typeof taskData.output === 'string' && taskData.output
        ? taskData.output
        : Array.isArray(taskData.outputs) && typeof taskData.outputs[0] === 'string' && taskData.outputs[0]
        ? (taskData.outputs[0] as string)
        : null

    return { status, output, raw: data }
  }
}

/** Convert aspect ratio string to OpenAI image size format */
function aspectRatioToSize(ratio: string): string {
  const map: Record<string, string> = {
    '1:1': '1024x1024',
    '16:9': '1792x1024',
    '9:16': '1024x1792',
    '4:3': '1365x1024',
    '3:4': '1024x1365',
  }
  return map[ratio] ?? '1024x1024'
}

/** Singleton factory — reads key from config */
export function getSynvowProvider(): SynvowProvider {
  const key = config.ai.synvow.apiKey
  if (!key) throw new Error('SYNVOW_API_KEY is not configured')
  return new SynvowProvider(key)
}
