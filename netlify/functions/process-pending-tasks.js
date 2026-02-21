/**
 * Netlify Scheduled Function — runs every minute.
 *
 * Calls /api/tasks/process-pending to check all in-progress RunningHub tasks
 * and update the database with their results.
 *
 * This ensures tasks complete correctly even when users close their browsers.
 * Works for all models: skin-editor, smart-upscaler, and any future models.
 *
 * Schedule is configured in netlify.toml:
 *   [functions."process-pending-tasks"]
 *     schedule = "* * * * *"
 */

exports.handler = async function (event, context) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET env var is not set — skipping task processing')
    return { statusCode: 200, body: 'CRON_SECRET not configured' }
  }

  try {
    const response = await fetch(`${appUrl}/api/tasks/process-pending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret
      }
    })

    const data = await response.json()
    console.log('process-pending-tasks scheduled run result:', data)

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('process-pending-tasks scheduled function error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
