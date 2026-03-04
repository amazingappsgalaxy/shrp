import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { uploadBuffer, getInputPath } from '@/lib/bunny'

const MAX_VIDEO_SIZE = 200 * 1024 * 1024 // 200 MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
const MIME_TO_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
}

/**
 * POST /api/upload-video
 *
 * Accepts a video file via multipart/form-data, uploads to Bunny CDN.
 * Returns: { videoUrl: "https://shai.b-cdn.net/inputs/..." }
 */
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

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const mimeType = file.type || 'video/mp4'
  if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported video type: ${mimeType}. Supported: mp4, webm, mov, avi` },
      { status: 400 }
    )
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: 'Video too large (max 200 MB)' }, { status: 413 })
  }

  try {
    const ext = MIME_TO_EXT[mimeType] ?? 'mp4'
    const storagePath = getInputPath(userId, ext)
    const buffer = Buffer.from(await file.arrayBuffer())
    const videoUrl = await uploadBuffer(storagePath, buffer, mimeType)
    return NextResponse.json({ videoUrl })
  } catch (error) {
    console.error('Video upload to Bunny CDN failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
