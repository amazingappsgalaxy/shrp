/**
 * POST /api/upload
 *
 * Uploads a base64 data URI image to Bunny CDN and returns the public CDN URL.
 * Used by the editor/upscaler when the local image is a data URI (to avoid
 * sending large base64 payloads through /api/enhance-image — Netlify 6MB limit).
 *
 * Body: { dataUri: "data:image/png;base64,..." }
 * Returns: { imageUrl: "https://shai.b-cdn.net/inputs/..." }
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { uploadBuffer, getInputPath, mimeFromExt } from '@/lib/bunny'

const MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB
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

  const userId = session.user.id

  let buffer: Buffer
  let mimeType: string

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    // Binary FormData upload — preferred path (no base64 inflation)
    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    mimeType = file.type || 'image/jpeg'
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: `Unsupported image type: ${mimeType}` }, { status: 400 })
    }
    buffer = Buffer.from(await file.arrayBuffer())
  } else {
    // Legacy base64 JSON path
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
    mimeType = matches[1]
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: `Unsupported image type: ${mimeType}` }, { status: 400 })
    }
    buffer = Buffer.from(matches[2], 'base64')
  }

  if (buffer.byteLength > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 25MB)' }, { status: 413 })
  }

  try {
    const rawExt = mimeType.split('/')[1] ?? 'jpg'
    const ext = rawExt.replace('jpeg', 'jpg')
    const storagePath = getInputPath(userId, ext)
    const imageUrl = await uploadBuffer(storagePath, buffer, mimeType)
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Upload to Bunny CDN failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
