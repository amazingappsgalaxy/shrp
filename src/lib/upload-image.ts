/**
 * Shared image upload utility.
 *
 * Common pattern used across editor, upscaler, and image pages:
 *   1. Read file as a data URI (client-side, no network)
 *   2. POST to /api/upload with { dataUri }
 *   3. Bunny CDN stores it under inputs/{today}/{userId}/{uuid}.{ext}
 *   4. Returns the public Bunny CDN URL
 *
 * The /api/upload endpoint is authenticated and uses the real userId,
 * ensuring proper per-user organization and cleanup.
 */

/**
 * Reads a File as a base64 data URI.
 */
export function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads a File to Bunny CDN via /api/upload.
 * Returns the public CDN URL.
 *
 * Throws on network error or if the server returns an error response.
 */
export async function uploadImageToCdn(file: File): Promise<string> {
  const dataUri = await readFileAsDataUri(file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUri }),
  })

  const data = await res.json() as { imageUrl?: string; error?: string }

  if (!res.ok || !data.imageUrl) {
    throw new Error(data.error ?? 'Upload failed')
  }

  return data.imageUrl
}
