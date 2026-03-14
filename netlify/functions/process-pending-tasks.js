/**
 * Netlify Scheduled Function — runs every minute.
 *
 * Primary scheduler for processing in-progress enhancement tasks.
 * pg_cron serves as a backup (runs every 2 minutes).
 * Atomic DB updates in process-pending prevent any double-processing.
 *
 * Schedule is configured in netlify.toml:
 *   [functions."process-pending-tasks"]
 *     schedule = "* * * * *"
 */

exports.handler = async function (event, context) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[process-pending-tasks] CRON_SECRET env var is not set — skipping')
    return { statusCode: 500, body: 'CRON_SECRET not configured' }
  }

  if (!appUrl) {
    console.error('[process-pending-tasks] NEXT_PUBLIC_APP_URL env var is not set — skipping')
    return { statusCode: 500, body: 'NEXT_PUBLIC_APP_URL not configured' }
  }

  try {
    // 25-second timeout — gives the API route time to process tasks
    // without holding the Netlify function open indefinitely
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    let response
    try {
      response = await fetch(`${appUrl}/api/tasks/process-pending`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': cronSecret,
        },
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    // Guard against HTML error pages or empty bodies
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error(`[process-pending-tasks] Non-JSON response (${response.status}):`, text.slice(0, 200))
      return { statusCode: response.status, body: 'Non-JSON response from API' }
    }

    const data = await response.json()

    if (!response.ok) {
      console.error(`[process-pending-tasks] API returned ${response.status}:`, data)
      return { statusCode: response.status, body: JSON.stringify(data) }
    }

    console.log('[process-pending-tasks] completed:', JSON.stringify(data))
    return { statusCode: 200, body: JSON.stringify(data) }

  } catch (error) {
    if (error.name === 'AbortError') {
      // Timeout is not a failure — the API route is still running on the server
      console.log('[process-pending-tasks] fetch timed out (25s) — API route continues processing')
      return { statusCode: 202, body: 'Processing continues async' }
    }
    console.error('[process-pending-tasks] error:', error.message)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}
