/**
 * Sharpii AI — media filename utilities.
 *
 * All user-facing files (CDN uploads + downloads) should use
 * `generateMediaFilename` so filenames are clean and brand-consistent.
 *
 * Format: sharpii-ai_{PromptHint}_{DDMMYYYY}_{7digitRandom}.{ext}
 * Examples:
 *   sharpii-ai_GirlOnBeach_05032026_1234567.png
 *   sharpii-ai_CinematicSunset_05032026_9876543.mp4
 *   sharpii-ai_05032026_3456789.jpg   ← no prompt available
 */

/**
 * Generate a clean Sharpii-branded filename for a generated media file.
 *
 * @param ext    File extension without the dot (e.g. "png", "mp4")
 * @param prompt Optional generation prompt — first 3 words are used as a hint
 * @param date   Optional date (defaults to now)
 */
export function generateMediaFilename(
  ext: string,
  prompt?: string | null,
  date?: Date
): string {
  const d = date ?? new Date()
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  const dateStr = `${day}${month}${year}`

  const random = Math.floor(1_000_000 + Math.random() * 9_000_000) // 7-digit, never < 1M

  let hint = ''
  if (prompt?.trim()) {
    hint = prompt
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('')
      .slice(0, 12) // hard cap — keeps filenames short regardless of prompt length
    if (hint) hint = `_${hint}`
  }

  return `sharpii-ai${hint}_${dateStr}_${random}.${ext}`
}

/**
 * Force-download a media file from any URL, including cross-origin CDN URLs.
 * Uses fetch → Blob → object URL so the browser never opens it in a new tab.
 *
 * CLIENT-SIDE ONLY — do not import in server/API routes.
 */
export async function downloadMedia(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href     = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    // Fallback: open in new tab (CORS blocked or network error)
    // The browser's native save dialog will at least let the user save manually.
    window.open(url, '_blank')
  }
}
