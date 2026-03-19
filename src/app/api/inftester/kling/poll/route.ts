import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')
  const klingModel = searchParams.get('klingModel')

  if (!taskId || !klingModel) {
    return NextResponse.json({ error: 'Missing taskId or klingModel' }, { status: 400 })
  }

  const baseUrl = config.ai.synvow.baseUrl
  const apiKey = config.ai.synvow.apiKey

  try {
    const endpoint =
      klingModel === 'kling-lip-sync'
        ? `/kling/v1/videos/lip-sync/${taskId}`
        : `/kling/v1/videos/avatar/image2video/${taskId}`

    const res = await fetch(`${baseUrl}${endpoint}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    const data = (await res.json()) as {
      data?: {
        task_status?: string
        task_result?: { videos?: Array<{ id: string; url: string; duration: string }> }
      }
      message?: string
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? 'Kling poll error', raw: data },
        { status: 500 }
      )
    }

    const taskStatus = data.data?.task_status ?? ''

    // Normalize Kling statuses → what the frontend poll loop expects
    let status: string
    if (taskStatus === 'succeed') status = 'SUCCESS'
    else if (taskStatus === 'failed') status = 'FAILURE'
    else if (taskStatus === 'processing' || taskStatus === 'submitted') status = 'IN_PROGRESS'
    else status = taskStatus

    const output = data.data?.task_result?.videos?.[0]?.url ?? null

    return NextResponse.json({ status, output, raw: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
