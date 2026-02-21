/**
 * POST /api/upload
 *
 * Uploads a base64 data URI image directly to RunningHub's file storage
 * and returns the filename key. This avoids sending large base64 payloads
 * through the /api/enhance-image route (Netlify's 6MB body limit).
 *
 * Body: { dataUri: "data:image/png;base64,..." }
 * Returns: { imageUrl: "<filename-key>" }
 *
 * The returned imageUrl can be passed directly as the imageUrl parameter
 * to /api/enhance-image. The RunningHub provider will use it as-is for
 * the LoadImage node since it's neither base64 nor an HTTP URL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'

const MAX_SIZE_BYTES = 15 * 1024 * 1024 // 15 MB decoded
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  // Auth
  const cookieStore = await cookies()
  const token =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    cookieStore.get('session')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await getSession(token)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { dataUri?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { dataUri } = body
  if (!dataUri || !dataUri.startsWith('data:')) {
    return NextResponse.json({ error: 'dataUri must be a base64 data URI' }, { status: 400 })
  }

  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches || !matches[1] || !matches[2]) {
    return NextResponse.json({ error: 'Invalid data URI format' }, { status: 400 })
  }

  const mimeType: string = matches[1]
  const base64Data: string = matches[2]

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json({ error: `Unsupported image type: ${mimeType}` }, { status: 400 })
  }

  const buffer = Buffer.from(base64Data, 'base64')
  if (buffer.byteLength > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 15MB)' }, { status: 413 })
  }

  // Upload directly to RunningHub's file storage
  const apiKey = process.env.RUNNINGHUB_API_KEY
  const baseUrl = process.env.RUNNINGHUB_BASE_URL || 'https://www.runninghub.ai'
  if (!apiKey) {
    return NextResponse.json({ error: 'RunningHub API key not configured' }, { status: 500 })
  }

  try {
    const rawExt = mimeType.split('/')[1] ?? 'jpg'
    const ext = rawExt.replace('jpeg', 'jpg')
    const fileName = `upload-${Date.now()}.${ext}`

    const formData = new FormData()
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
    formData.append('file', blob, fileName)
    formData.append('apikey', apiKey)
    formData.append('apiKey', apiKey)

    const uploadResponse = await fetch(`${baseUrl}/task/openapi/upload`, {
      method: 'POST',
      body: formData
    })

    if (!uploadResponse.ok) {
      throw new Error(`RunningHub upload failed: ${uploadResponse.status}`)
    }

    const data = await uploadResponse.json() as any
    if (data.code !== 0 || !data.data || (!data.data.url && !data.data.fileName)) {
      throw new Error(data.msg || 'RunningHub upload returned an error')
    }

    const imageUrl: string = data.data.fileName || data.data.url
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Upload to RunningHub failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
