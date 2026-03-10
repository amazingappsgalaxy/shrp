/**
 * Shared image upload utility.
 *
 * Uploads a File to Bunny CDN via /api/upload (multipart/form-data binary upload).
 * The /api/upload endpoint is authenticated and uses the real userId,
 * ensuring proper per-user organization and cleanup.
 */

/**
 * Uploads a File to Bunny CDN via /api/upload.
 * Returns the public CDN URL.
 *
 * Throws on network error or if the server returns an error response.
 */
export async function uploadImageToCdn(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: form,
  })

  const data = await res.json() as { imageUrl?: string; error?: string }

  if (!res.ok || !data.imageUrl) {
    throw new Error(data.error ?? 'Upload failed')
  }

  return data.imageUrl
}
