/**
 * Bunny CDN storage utility.
 *
 * Storage zone : shrp  (env: BUNNY_STORAGE_ZONE_NAME)
 * CDN hostname  : shai.b-cdn.net  (env: BUNNY_CDN_HOSTNAME)
 *
 * Folder layout:
 *   inputs/{YYYY-MM-DD}/{userId}/{uuid}.{ext}
 *   outputs/{YYYY-MM-DD}/{userId}/{uuid}.{ext}
 */

import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

// ─── Config helpers ─────────────────────────────────────────────────────────

function cfg(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var: ${key}`)
  return v
}

function storageBase() {
  return `https://${cfg('BUNNY_STORAGE_HOSTNAME')}/${cfg('BUNNY_STORAGE_ZONE_NAME')}`
}

function cdnBase() {
  return `https://${cfg('BUNNY_CDN_HOSTNAME')}`
}

// ─── Path helpers ────────────────────────────────────────────────────────────

/** Today's UTC date as YYYY-MM-DD */
function todayUtc(): string {
  return new Date().toISOString().split('T')[0]!
}

/** Bunny storage path for an input file */
export function getInputPath(userId: string, ext: string): string {
  return `inputs/${todayUtc()}/${userId}/${uuidv4()}.${ext}`
}

/**
 * Bunny storage path for an output file.
 * Pass `filename` (e.g. from generateMediaFilename) to use a human-readable name
 * instead of a random UUID. The ext param is ignored when filename is provided.
 */
export function getOutputPath(userId: string, ext: string, filename?: string): string {
  const name = filename ?? `${uuidv4()}.${ext}`
  return `outputs/${todayUtc()}/${userId}/${name}`
}

/** Full Bunny CDN URL from a storage path */
export function getCdnUrl(path: string): string {
  return `${cdnBase()}/${path}`
}

// ─── Upload helpers ───────────────────────────────────────────────────────────

/** Upload a Buffer/Uint8Array to Bunny. Returns the public CDN URL. */
export async function uploadBuffer(
  path: string,
  data: Buffer | Uint8Array,
  contentType = 'application/octet-stream'
): Promise<string> {
  const url = `${storageBase()}/${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: cfg('BUNNY_STORAGE_API_KEY'),
      'Content-Type': contentType,
    },
    body: data as BodyInit,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Bunny upload failed (${res.status}): ${text}`)
  }

  return getCdnUrl(path)
}

/** Download a remote URL and upload it to Bunny. Returns the public CDN URL. */
export async function uploadFromUrl(
  path: string,
  sourceUrl: string,
  contentType?: string
): Promise<string> {
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch source URL (${response.status}): ${sourceUrl}`)
  }

  const ct = contentType || response.headers.get('content-type') || 'application/octet-stream'
  const buffer = Buffer.from(await response.arrayBuffer())
  return uploadBuffer(path, buffer, ct)
}

/**
 * Download a remote URL, upload it to Bunny, and return both the CDN URL and the buffer.
 * Use this when you also need to generate a thumbnail — avoids re-fetching from CDN
 * (which may not have propagated yet) by reusing the already-downloaded buffer.
 */
export async function uploadFromUrlWithBuffer(
  path: string,
  sourceUrl: string,
  contentType?: string
): Promise<{ url: string; buffer: Buffer }> {
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch source URL (${response.status}): ${sourceUrl}`)
  }

  const ct = contentType || response.headers.get('content-type') || 'application/octet-stream'
  const buffer = Buffer.from(await response.arrayBuffer())
  const url = await uploadBuffer(path, buffer, ct)
  return { url, buffer }
}

// ─── Delete helpers ───────────────────────────────────────────────────────────

/**
 * Delete an entire day-folder from Bunny.
 * e.g. folder = "inputs/2026-02-22"  or  "outputs/2026-01-23"
 */
export async function deleteFolder(folder: string): Promise<void> {
  // Bunny deletes folders via DELETE on the path with a trailing slash
  const url = `${storageBase()}/${folder}/`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { AccessKey: cfg('BUNNY_STORAGE_API_KEY') },
  })

  // 200 = deleted, 404 = already gone — both are fine
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Bunny folder delete failed (${res.status}): ${text}`)
  }
}

// ─── MIME / extension helpers ─────────────────────────────────────────────────

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

export function extFromUrl(url: string): string {
  const base = url.split('?')[0] ?? url
  const m = base.match(/\.(\w+)$/)
  return (m?.[1] ?? '').toLowerCase()
}

export function mimeFromExt(ext: string): string {
  return EXT_MIME[ext] ?? 'application/octet-stream'
}

// ─── Thumbnail helpers ────────────────────────────────────────────────────────

const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'm4v'])

/**
 * Derives thumbnail storage path from an original output path.
 * e.g. outputs/2026-03-18/userId/image.png → outputs/2026-03-18/userId/image_smallthumbnail.png
 */
export function getThumbnailPath(originalPath: string): string {
  return originalPath.replace(/\.[^.]+$/, '_smallthumbnail.png')
}

/**
 * Resizes a buffer to a max 400px wide PNG thumbnail and uploads to Bunny CDN.
 * Returns the CDN URL, or null on any failure.
 * Never throws — thumbnail failure must never block the main upload flow.
 */
export async function generateAndUploadThumbnailFromBuffer(
  outputPath: string,
  imageBuffer: Buffer
): Promise<string | null> {
  try {
    const thumbBuffer = await sharp(imageBuffer)
      .resize({ width: 600, withoutEnlargement: true })
      .png({ compressionLevel: 6 })
      .toBuffer()

    const thumbPath = getThumbnailPath(outputPath)
    const thumbUrl = await uploadBuffer(thumbPath, thumbBuffer, 'image/png')
    console.log(`✅ Thumbnail uploaded — ${thumbUrl}`)
    return thumbUrl
  } catch (err) {
    console.error(`❌ Thumbnail generation failed for ${outputPath}:`, err)
    return null
  }
}

/**
 * Fetches sourceUrl, resizes to max 400px wide WebP thumbnail, uploads to Bunny CDN.
 * Returns the CDN URL of the thumbnail, or null on any failure.
 * Never throws — thumbnail failure must never block the main upload flow.
 */
export async function generateAndUploadThumbnail(
  outputPath: string,
  sourceUrl: string
): Promise<string | null> {
  try {
    const ext = extFromUrl(sourceUrl)
    if (VIDEO_EXTS.has(ext)) return null

    const response = await fetch(sourceUrl)
    if (!response.ok) {
      console.error(`❌ Thumbnail fetch failed (${response.status}) for ${sourceUrl}`)
      return null
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    return await generateAndUploadThumbnailFromBuffer(outputPath, buffer)
  } catch (err) {
    console.error(`❌ Thumbnail fetch/process error for ${sourceUrl}:`, err)
    return null
  }
}
