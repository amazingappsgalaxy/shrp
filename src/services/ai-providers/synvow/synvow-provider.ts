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
    // nano-banana-pro uses a distinct Gemini-style API regardless of whether a reference is provided
    if (req.model === 'nano-banana-pro') {
      return this.submitNanaBanaProTask(req)
    }

    // Seedream models (doubao-seedream-*) use the standard images/generations endpoint for BOTH
    // text-to-image AND image-to-image — reference images go in the `image` array, not chat completions.
    if (isSeedreamModel(req.model)) {
      return this.submitSeedreamTask(req)
    }

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

    return { taskId: `sync_${Date.now()}`, type: 'image', immediateOutput: url, _debugRequest: body, _debugResponse: data }
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

    // Build all reference image URLs — supports multiple references
    const imageUrls: string[] = []
    if (req.images?.length) {
      for (const img of req.images) {
        imageUrls.push(img.type === 'url' ? img.data : `data:image/jpeg;base64,${img.data}`)
      }
    } else if (req.reference_image) {
      const isUrl = req.reference_image.startsWith('http')
      imageUrls.push(isUrl ? req.reference_image : `data:image/jpeg;base64,${req.reference_image}`)
    }

    // Inject aspect ratio as a text instruction — the chat completions endpoint ignores the `size`
    // body param for image-to-image tasks; only the prompt text reliably controls output dimensions.
    const promptText = req.aspect_ratio
      ? `${req.prompt}. The output image must be in ${req.aspect_ratio} aspect ratio.`
      : req.prompt

    const content: unknown[] = [{ type: 'text', text: promptText }]
    for (const url of imageUrls) {
      content.push({ type: 'image_url', image_url: { url } })
    }

    const body: Record<string, unknown> = {
      model: req.model,
      messages: [{ role: 'user', content }],
      stream: false,
    }
    // Also pass size param as a hint (may be ignored by some proxy versions)
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

    return { taskId: `sync_${Date.now()}`, type: 'image', immediateOutput: url, _debugRequest: body, _debugResponse: data }
  }

  /**
   * Seedream 4.5 / 5.0 Lite image generation.
   *
   * API source: https://www.volcengine.com/docs/82379/1541523 (official Volcengine)
   * Proxy: https://gpt-best.apifox.cn (api-347833949, api-332061825 — same /v1/images/generations endpoint)
   *
   * Key differences from other Synvow image models:
   *   • Reference images go in `image: [url1, url2]` — NOT chat completions
   *   • `size` must be a quality tier label "2K" or "3K" (Method 1 per Volcengine docs).
   *     Pixel strings like "2848x1600" are officially supported (Method 2) but the gptbest
   *     proxy only documents tier labels and may ignore pixel strings, producing 1:1 output.
   *   • Aspect ratio is expressed as natural language appended to the prompt — the model
   *     composes the output at the requested ratio when told in the prompt.
   *   • `sequential_image_generation: "disabled"` forces single-image output
   *   • Up to 14 reference images supported
   */
  private async submitSeedreamTask(req: SynvowGenerateRequest): Promise<SynvowSubmitResult> {
    const endpoint = `${getBase()}/v1/images/generations`

    const tier = req.imageSize ?? '2K'
    // Append aspect ratio as natural language so the model composes correctly.
    // Method 1 from Volcengine docs: size = tier label, aspect ratio = prompt description.
    const aspectHint = seedreamAspectRatioHint(req.aspect_ratio)
    const prompt = aspectHint ? `${req.prompt}, ${aspectHint}` : req.prompt

    const body: Record<string, unknown> = {
      model: req.model,
      prompt,
      size: tier,
      sequential_image_generation: 'disabled',
      watermark: false,
      n: 1,
    }

    // Reference images: Volcengine API servers (China) cannot reach external CDN URLs.
    // Always convert URLs to base64 data URIs before sending.
    const imageInputs: string[] = []
    const allImageInputs = req.images?.length
      ? req.images
      : req.reference_image
        ? [{ type: (req.reference_image.startsWith('http') ? 'url' : 'base64') as 'url' | 'base64', data: req.reference_image }]
        : []
    for (const img of allImageInputs) {
      if (img.type === 'base64') {
        imageInputs.push(`data:image/jpeg;base64,${img.data}`)
      } else {
        // Fetch URL and convert to base64 so the Volcengine API can access it
        const resp = await fetch(img.data)
        if (!resp.ok) throw new Error(`Failed to fetch reference image (${resp.status}): ${img.data}`)
        const ct = resp.headers.get('content-type') || 'image/jpeg'
        const mime = ct.split(';')[0]?.trim() ?? 'image/jpeg'
        const buf = await resp.arrayBuffer()
        const b64 = Buffer.from(buf).toString('base64')
        imageInputs.push(`data:${mime};base64,${b64}`)
      }
    }
    if (imageInputs.length > 0) body.image = imageInputs

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = (await res.json()) as {
      data?: Array<{ url?: string }>
      error?: { message?: string }
    }

    if (!res.ok) {
      throw new Error(data.error?.message ?? `Seedream API error ${res.status}`)
    }

    const url = data.data?.[0]?.url ?? null
    if (!url) throw new Error('Seedream API returned no URL')

    return { taskId: `sync_${Date.now()}`, type: 'image', immediateOutput: url, _debugRequest: body, _debugResponse: data }
  }

  /**
   * nano-banana-pro uses a Gemini-style generateContent API.
   *
   * Format:
   *   POST /v1beta/models/nano-banana-pro:generateContent
   *   {
   *     "contents": [{ "role": "user", "parts": [
   *       { "inlineData": { "data": "<base64>", "mimeType": "image/jpeg" } },  // each reference
   *       { "text": "<prompt>" }
   *     ]}],
   *     "generationConfig": {
   *       "imageConfig": { "aspectRatio": "3:4", "imageSize": "2K" },
   *       "responseModalities": ["IMAGE"]
   *     }
   *   }
   *
   * References are passed as base64 (inlineData). If the caller passes CDN URLs,
   * they are fetched and converted to base64 here.
   *
   * The response is expected to contain the generated image either as:
   *   a) candidates[0].content.parts[n].inlineData.data  (base64 JPEG/PNG)
   *   b) candidates[0].content.parts[n].text             (markdown with embedded URL)
   * The immediateOutput is either a data: URI (case a) or a plain URL (case b).
   */
  private async submitNanaBanaProTask(req: SynvowGenerateRequest): Promise<SynvowSubmitResult> {
    const endpoint = `${getBase()}/v1beta/models/nano-banana-pro:generateContent`

    // Build parts: reference images first (as inlineData), then the prompt text
    const parts: unknown[] = []

    const imageInputs = req.images ?? (req.reference_image ? [{ type: 'url' as const, data: req.reference_image }] : [])
    for (const img of imageInputs) {
      let base64Data: string
      let mimeType = 'image/jpeg'

      if (img.type === 'base64') {
        base64Data = img.data
      } else {
        // Fetch URL and convert to base64
        const resp = await fetch(img.data)
        if (!resp.ok) throw new Error(`Failed to fetch reference image (${resp.status}): ${img.data}`)
        const ct = resp.headers.get('content-type') || 'image/jpeg'
        mimeType = ct.split(';')[0]?.trim() ?? 'image/jpeg'
        const buf = await resp.arrayBuffer()
        base64Data = Buffer.from(buf).toString('base64')
      }
      parts.push({ inlineData: { data: base64Data, mimeType } })
    }

    // The gptbest.vip proxy ignores imageConfig when responseModalities includes TEXT.
    // Aspect ratio via text injection is the only reliable approach (confirmed working).
    // Resolution is hard-capped at 1K by this proxy — no parameter or prompt trick changes it.
    const aspectHint = req.aspect_ratio
      ? ` Output image must be in ${req.aspect_ratio} aspect ratio.`
      : ''
    parts.push({ text: `${req.prompt}${aspectHint}` })

    const requestBody = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        // ['TEXT', 'IMAGE'] is required — proxies drop imageConfig when only ['IMAGE'] is set
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          ...(req.aspect_ratio ? { aspectRatio: req.aspect_ratio } : {}),
        },
      },
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    const rawResponse = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { data?: string; mimeType?: string }
            text?: string
          }>
        }
      }>
      error?: { message?: string }
    }

    if (!res.ok) {
      throw new Error(rawResponse.error?.message ?? `NB Pro API error ${res.status}`)
    }

    const responseParts = rawResponse.candidates?.[0]?.content?.parts ?? []

    // Case a: inline image data (base64)
    const inlinePart = responseParts.find(p => p.inlineData?.data)
    if (inlinePart?.inlineData?.data) {
      const mime = inlinePart.inlineData.mimeType ?? 'image/jpeg'
      const dataUri = `data:${mime};base64,${inlinePart.inlineData.data}`
      return {
        taskId: `sync_nbpro_${Date.now()}`,
        type: 'image',
        immediateOutput: dataUri,
        _debugRequest: requestBody,
        _debugResponse: rawResponse,
      }
    }

    // Case b: text part may contain a markdown image URL
    const textPart = responseParts.find(p => p.text)
    if (textPart?.text) {
      const match = textPart.text.match(/!\[image\d*\]\((https?:\/\/[^)]+)\)/)
      const url = match?.[1] ?? null
      if (url) {
        return {
          taskId: `sync_nbpro_${Date.now()}`,
          type: 'image',
          immediateOutput: url,
          _debugRequest: requestBody,
          _debugResponse: rawResponse,
        }
      }
    }

    throw new Error(
      `NB Pro returned no image. Response: ${JSON.stringify(rawResponse).slice(0, 400)}`
    )
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
    if (req.negative_prompt) body.negative_prompt = req.negative_prompt
    if (req.camera_fixed !== undefined) body.camera_fixed = req.camera_fixed
    if (req.seed !== undefined) body.seed = req.seed

    // Video input (for kling-effects, kling-video-motion-control)
    if (req.video_url) body.video_url = req.video_url
    if (req.target_url) body.target_url = req.target_url

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

/** Returns true for Seedream / doubao-seedream model IDs */
function isSeedreamModel(modelId: string): boolean {
  return modelId.startsWith('doubao-seedream')
}

/**
 * Returns a natural-language aspect ratio hint to append to the Seedream prompt.
 *
 * Seedream uses Method 1 from Volcengine docs: `size` = quality tier label ("2K"/"3K"),
 * aspect ratio = described in natural language in the prompt. The model then composes
 * the output at the intended ratio.
 *
 * Source: https://www.volcengine.com/docs/82379/1541523
 */
function seedreamAspectRatioHint(ratio: string | undefined): string {
  if (!ratio || ratio === '1:1') return ''
  const map: Record<string, string> = {
    '16:9':  'wide landscape 16:9 aspect ratio',
    '9:16':  'tall portrait 9:16 aspect ratio',
    '4:3':   'horizontal 4:3 aspect ratio',
    '3:4':   'vertical 3:4 aspect ratio',
    '3:2':   'horizontal 3:2 aspect ratio',
    '2:3':   'vertical 2:3 aspect ratio',
    '21:9':  'ultrawide cinematic 21:9 aspect ratio',
  }
  return map[ratio] ?? ''
}

/** Convert aspect ratio string to OpenAI image size format (used by non-Seedream models) */
function aspectRatioToSize(ratio: string): string {
  const map: Record<string, string> = {
    '1:1':  '1024x1024',
    '16:9': '1792x1024',
    '9:16': '1024x1792',
    '4:3':  '1365x1024',
    '3:4':  '1024x1365',
    '3:2':  '1536x1024',
    '2:3':  '1024x1536',
    '21:9': '2048x768',
  }
  return map[ratio] ?? '1024x1024'
}

/** Singleton factory — reads key from config */
export function getSynvowProvider(): SynvowProvider {
  const key = config.ai.synvow.apiKey
  if (!key) throw new Error('SYNVOW_API_KEY is not configured')
  return new SynvowProvider(key)
}
