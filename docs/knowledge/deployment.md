# Deployment — Netlify

## Production Deployment
- **Platform**: Netlify
- **Build command**: `npm run build:netlify`
- **Config**: `netlify.toml`

## Required Netlify Env Vars
All env vars from `.env.local` must be set in Netlify dashboard, plus:
- `CRON_SECRET` — Any long random string for securing the scheduled function

## Background Task Processing

### Architecture
Async AI tasks (RunningHub) need to be checked for completion even if the user closes the browser:

```
Browser polls every 10s:
  GET /api/enhance-image/poll?taskId=<uuid>

Netlify scheduled function runs every 1 minute:
  POST /api/tasks/process-pending
  Headers: { "x-cron-secret": CRON_SECRET }
```

### Netlify Scheduled Function
**File**: `netlify/functions/process-pending-tasks.js`

Runs every minute via Netlify's scheduled functions. Calls `POST /api/tasks/process-pending` with the cron secret.

### Process-Pending API
**File**: `src/app/api/tasks/process-pending/route.ts`
- Fetches all `history_items` with `status: 'processing'`
- Checks each task with RunningHub API
- On completion: atomic DB update + credit deduction
- On timeout: marks as failed

### Poll API
**File**: `src/app/api/enhance-image/poll/route.ts`
- Client calls every 10s while task is running
- Returns `{ status, outputUrl }` when complete
- Same atomic completion logic as process-pending (race-safe)

## Timeout Rules
| Condition | Action |
|---|---|
| No `runninghub_task_id` after 10 min | Mark as failed |
| Has task ID but no completion after 2 hr | Mark as failed |

## Build Notes
- `npm run build:netlify` runs `next build` with Netlify-specific settings
- Check `netlify.toml` for edge function and redirect configuration
- Next.js static export NOT used — server-side rendering required

## Local Development
```bash
npm run dev          # Standard Next.js dev server on port 3003
# Scheduled functions don't run locally — test process-pending manually:
curl -X POST http://localhost:3003/api/tasks/process-pending \
  -H "x-cron-secret: <your-CRON_SECRET>"
```
