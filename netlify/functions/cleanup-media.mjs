/**
 * Netlify scheduled function — runs daily at 02:00 UTC.
 * Deletes expired Bunny CDN media folders based on retention policy.
 *
 * Retention:
 *   inputs/  → delete folders older than 1 day
 *   outputs/ → delete folders older than 31 days
 *
 * Keep in sync with src/config/media-retention.ts if durations change.
 */

// ─── Retention config (mirrored from src/config/media-retention.ts) ────────

const MEDIA_RETENTION = {
  inputs: { type: 'days', days: 1 },
  outputs: { type: 'days', days: 31 },
}

function getExpiryDate(policy) {
  if (policy.type === 'permanent') return null
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - policy.days)
  return d.toISOString().split('T')[0]
}

// ─── Bunny helpers ─────────────────────────────────────────────────────────

function cfg(key) {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var: ${key}`)
  return v
}

async function deleteFolder(folder) {
  const zone = cfg('BUNNY_STORAGE_ZONE_NAME')
  const hostname = cfg('BUNNY_STORAGE_HOSTNAME')
  const apiKey = cfg('BUNNY_STORAGE_API_KEY')

  const url = `https://${hostname}/${zone}/${folder}/`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { AccessKey: apiKey },
  })

  // 200 = deleted, 404 = already gone — both are acceptable
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Bunny DELETE ${folder} failed (${res.status}): ${text}`)
  }
  return res.status
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler() {
  console.log('🧹 cleanup-media: starting')

  const results = []

  for (const [category, policy] of Object.entries(MEDIA_RETENTION)) {
    const expiryDate = getExpiryDate(policy)

    if (!expiryDate) {
      console.log(`⏭  cleanup-media: ${category} is permanent — skipping`)
      results.push({ category, skipped: true })
      continue
    }

    const folder = `${category}/${expiryDate}`
    console.log(`🗑  cleanup-media: deleting ${folder}`)

    try {
      const status = await deleteFolder(folder)
      console.log(`✅ cleanup-media: ${folder} → HTTP ${status}`)
      results.push({ category, folder, status })
    } catch (err) {
      console.error(`❌ cleanup-media: ${folder} → ${err.message}`)
      results.push({ category, folder, error: err.message })
    }
  }

  console.log('✅ cleanup-media: done', JSON.stringify(results))
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// Netlify v2 scheduled function — runs at 02:00 UTC every day
export const config = {
  schedule: '0 2 * * *',
}
