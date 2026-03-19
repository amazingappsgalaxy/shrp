import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

export type KlingModel = 'avatar-voice' | 'avatar-generate' | 'kling-lip-sync'
const KLING_MODELS: KlingModel[] = ['avatar-voice', 'avatar-generate', 'kling-lip-sync']

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const klingModel = body.klingModel as KlingModel
  if (!KLING_MODELS.includes(klingModel)) {
    return NextResponse.json({ error: 'Invalid klingModel' }, { status: 400 })
  }

  const baseUrl = config.ai.synvow.baseUrl
  const apiKey = config.ai.synvow.apiKey

  try {
    let endpoint: string
    let requestPayload: Record<string, unknown>

    if (klingModel === 'kling-lip-sync') {
      endpoint = '/kling/v1/videos/lip-sync'
      requestPayload = {
        input: {
          video_url: body.video_url,
          mode: 'text2video',
          text: body.text,
          voice_id: body.voice_id,
          voice_language: body.voice_language ?? 'en',
        },
      }
    } else {
      // avatar-voice or avatar-generate
      endpoint = '/kling/v1/videos/avatar/image2video'
      requestPayload = { image: body.image }

      if (klingModel === 'avatar-voice') {
        requestPayload.audio_id = body.audio_id
        if (body.prompt) requestPayload.prompt = body.prompt
      } else {
        // avatar-generate
        requestPayload.sound_file = body.sound_file
        if (body.prompt) requestPayload.prompt = body.prompt
      }
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    const data = (await res.json()) as { data?: { task_id?: string }; message?: string }

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? 'Kling API error', _debugResponse: data },
        { status: 500 }
      )
    }

    const taskId = data.data?.task_id
    if (!taskId) {
      return NextResponse.json(
        { error: 'No task_id in response', _debugResponse: data },
        { status: 500 }
      )
    }

    return NextResponse.json({ taskId, klingModel, requestPayload, _debugResponse: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
