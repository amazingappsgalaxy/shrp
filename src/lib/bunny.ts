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
  return new Date().toISOString().split('T')[0]
}

/** Bunny storage path for an input file */
export function getInputPath(userId: string, ext: string): string {
  return `inputs/${todayUtc()}/${userId}/${uuidv4()}.${ext}`
}

/** Bunny storage path for an output file */
export function getOutputPath(userId: string, ext: string): string {
  return `outputs/${todayUtc()}/${userId}/${uuidv4()}.${ext}`
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
    body: data,
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
  const m = url.split('?')[0].match(/\.(\w+)$/)
  return m ? m[1].toLowerCase() : 'jpg'
}

export function mimeFromExt(ext: string): string {
  return EXT_MIME[ext] ?? 'application/octet-stream'
}
