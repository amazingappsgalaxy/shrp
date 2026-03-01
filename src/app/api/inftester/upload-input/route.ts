import { NextRequest, NextResponse } from 'next/server'
import { uploadBuffer, getInputPath, mimeFromExt, extFromUrl } from '@/lib/bunny'

/**
 * POST /api/inftester/upload-input
 * Accepts a multipart file, uploads it to Bunny CDN, and returns the public URL.
 * No auth required — this is a testing-only endpoint.
 */
export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
  }

  const maxSize = 20 * 1024 * 1024 // 20 MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 })
  }

  try {
    const ext = extFromUrl(file.name) || 'jpg'
    const contentType = file.type || mimeFromExt(ext)
    // Store under inputs/{today}/inftester/{uuid}.{ext} — expires on the same daily cleanup
    const storagePath = getInputPath('inftester', ext)
    const buffer = Buffer.from(await file.arrayBuffer())
    const cdnUrl = await uploadBuffer(storagePath, buffer, contentType)
    return NextResponse.json({ url: cdnUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
