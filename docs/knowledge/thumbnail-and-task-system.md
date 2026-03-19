# Thumbnail & Task Processing System

> Complete reference for how tasks complete, outputs are stored, and thumbnails are generated.
> Read this before touching: `bunny.ts`, `TaskManagerProvider`, `process-mine`, `process-pending`, or any route that uploads images.

---

## 1. The CDN Propagation Rule

**The most important rule in this system:**

> Never re-fetch a file from Bunny CDN immediately after uploading it. CDN propagation takes several seconds and the re-fetch will get a 404 or stale response.

**Wrong pattern** (old bug — DO NOT use):
```typescript
const url = await uploadFromUrl(path, sourceUrl)      // uploads to Bunny
const thumb = await generateAndUploadThumbnail(path, url)  // re-fetches from Bunny CDN — BROKEN
```

**Correct pattern** (always use this):
```typescript
const { url, buffer } = await uploadFromUrlWithBuffer(path, sourceUrl)  // downloads once
const thumb = await generateAndUploadThumbnailFromBuffer(path, buffer)   // uses in-memory buffer
```

The buffer is held in memory for the thumbnail step — no CDN round-trip, no propagation race.

---

## 2. Bunny CDN Utilities (`src/lib/bunny.ts`)

### Core Upload Functions

| Function | Use when |
|---|---|
| `uploadBuffer(path, buffer, ct)` | You already have data in memory |
| `uploadFromUrl(path, sourceUrl, ct)` | You need the URL only and don't need a thumbnail |
| `uploadFromUrlWithBuffer(path, sourceUrl, ct)` | You need both the URL and a thumbnail (always prefer this for image outputs) |

### Thumbnail Functions

| Function | Use when |
|---|---|
| `generateAndUploadThumbnailFromBuffer(outputPath, buffer)` | Always — use after `uploadFromUrlWithBuffer` |
| `generateAndUploadThumbnail(outputPath, sourceUrl)` | **Avoid** — re-fetches from URL, unsafe immediately after upload. Only safe for pre-existing stable URLs (e.g., days-old CDN files). |

### Thumbnail Spec
- **Size**: max 400px wide, `withoutEnlargement: true` (small images stay small)
- **Format**: PNG, compressionLevel 6
- **Naming**: `originalName_smallthumbnail.png`
  - e.g. `sharpii-ai_Sunset_19032026_1234567.png` → `sharpii-ai_Sunset_19032026_1234567_smallthumbnail.png`
- **Path**: same folder as the original, derived by `getThumbnailPath(originalPath)`
- **Never throws**: `generateAndUploadThumbnailFromBuffer` catches all errors and returns `null`. Thumbnail failure must never block the main upload.

### Path Helpers
```typescript
getOutputPath(userId, ext, filename?)   // outputs/YYYY-MM-DD/userId/filename.ext
getInputPath(userId, ext)               // inputs/YYYY-MM-DD/userId/uuid.ext
getCdnUrl(path)                         // https://shai.b-cdn.net/path
getThumbnailPath(originalPath)          // replaces extension with _smallthumbnail.png
```

### Output URL Schema (stored in `history_items.output_urls`)
```typescript
{
  type: 'image' | 'video',
  url: string,            // Bunny CDN URL (permanent)
  original_url?: string,  // Original provider URL (expires in hours/days)
  thumbnail_url?: string  // Bunny CDN URL for the _smallthumbnail.png
}
```

---

## 3. Task Processing Pipeline

There are **three code paths** that can complete a task. All use `.eq('status', 'processing')` atomic guards so only one wins:

### Path A — `process-mine` (client-initiated, fastest)
**File**: `src/app/api/tasks/process-mine/route.ts`

- **Triggered by**: `TaskManagerProvider` every 5s while the browser is open, and immediately on task creation
- **Auth**: No session auth. Client passes `{ taskIds: string[] }` in body. Server queries only those IDs.
- **Scope**: RunningHub tasks only (image enhancement/upscaling). Filters out `_provider: evolink/synvow` and `_type: image-generation/edit-generation`.
- **Concurrency**: Up to 10 tasks per call
- **Effect**: Polls RunningHub → on success: uploads to Bunny, generates thumbnail, marks `completed` in DB, deducts credits
- **Credit safety**: Only deducts if `!settings._creditsAlreadyDeducted`. Uses atomic DB update — if another path already completed the task, `won` is null and credits are not deducted twice.

### Path B — `process-pending` (cron, fallback)
**File**: `src/app/api/tasks/process-pending/route.ts`

- **Triggered by**: Netlify scheduled function every ~60s, and pg_cron in Supabase
- **Auth**: Requires `x-cron-secret` header
- **Scope**: All task types — RunningHub, video (Evolink/Synvow), sync generation timeouts
- **Concurrency**: Up to 50 tasks, batched in groups of 10
- **Effect**: Same as process-mine for RunningHub. Also handles video polling and marks stale sync tasks as failed.
- **Timeout rules**:
  - RunningHub tasks with no RH ID: fail after 10 min
  - RunningHub tasks stuck `running`: fail after 2 hours
  - Video tasks with no provider ID: fail after 5 min
  - Video tasks stuck: fail after 2 hours
  - `image-generation` / `edit-generation` sync tasks: fail after 15 min (credits refunded)

### Path C — In-route completion (synchronous tasks)
**Files**: `src/app/api/generate-image/route.ts`, `src/app/api/edit-image/route.ts`

- **Triggered by**: The generation API itself after the AI returns (using Next.js `after()`)
- **Scope**: Synvow image generation and image edit
- **Effect**: Uploads to Bunny, generates thumbnail, marks `completed` in DB, deducts credits

### Path D — `enhance-image/poll` (legacy client poll)
**File**: `src/app/api/enhance-image/poll/route.ts`

- **Triggered by**: Client-side polling for direct enhance requests (not via TaskManager)
- **Effect**: Same as process-mine for a single task

---

## 4. TaskManagerProvider (`src/components/providers/TaskManagerProvider.tsx`)

Central state machine for tracking async tasks from the browser.

### State
- Tasks stored in a `Map<historyId, WatchedTask>` in React state
- `tasksRef` mirrors the map — used inside intervals to prevent stale closure reads
- `prevTaskStatusRef` tracks previous statuses for credit refresh detection

### Intervals (when tasks are `processing`)
| Interval | Rate | Action |
|---|---|---|
| `intervalRef` | 5s | Calls `poll()` — checks DB for status changes |
| `processIntervalRef` | 5s | Calls `triggerProcessing()` — kicks `process-mine` API |

Both intervals start when the first processing task is added, stop when no processing tasks remain.

### Public API

```typescript
addWatchedTask(historyId, label?)  // Add a task to watch. Idempotent for completed/failed tasks.
resolveTask(historyId)             // Mark completed immediately (for sync tasks where API returned)
failTask(historyId, errorMessage?) // Mark failed immediately
dismissTask(historyId)             // Remove from UI (user clicked X)
```

**Important**: `addWatchedTask` will not overwrite a task that's already `completed` or `failed`. If called with an ID that already completed, it's a no-op.

### Credit Refresh
When any task transitions to `completed`, TaskManagerProvider calls `mutate(APP_DATA_KEY)` to re-fetch `/api/user/me`, which updates the credit balance displayed everywhere via `useCredits()`.

### Auto-dismiss
- `completed` tasks: auto-dismissed from UI after 2 seconds
- `failed` tasks: stay in UI until user clicks the X button

---

## 5. Image Page Special Case (`src/app/app/image/page.tsx`)

The image generation page has its own polling system (`processingDbIds` + 5s interval) and does **not** use `addWatchedTask`. It directly calls `process-mine` itself:

1. **On task creation**: calls `process-mine` after 2s delay
2. **Every 5s poll tick**: calls `process-mine` before checking DB status

This is because Synvow image generation creates RunningHub-style polling tasks (soul-2, etc.) that need `process-mine` but the page predates the TaskManager integration for this flow.

---

## 6. Where Thumbnails Are Displayed

| Page | Component | Logic |
|---|---|---|
| `/app/image` | Grid `<img>` | `img.thumbnailUrl \|\| img.url` |
| `/app/history` | `HistoryGrid` | `primaryOutput.thumbnail_url \|\| primaryOutput.url` |
| `/app/upscaler` | Output panel | Full-res (no thumbnail needed — single large image) |

The fallback to `url` ensures pages work for historical items that don't have thumbnails yet.

---

## 7. Common Bugs & Pitfalls

### Bug: CDN propagation (the original thumbnail failure)
`generateAndUploadThumbnail(path, url)` where `url` is a just-uploaded Bunny CDN URL → CDN hasn't propagated → 404. Always use `uploadFromUrlWithBuffer` + `generateAndUploadThumbnailFromBuffer`.

### Bug: SSR hydration mismatch from localStorage
Reading from `localStorage` inside `useState()` initializer causes server/client HTML mismatch. Always init with defaults in `useState`, then restore from `localStorage` inside a `useEffect(() => {}, [])`.

### Pitfall: `process-mine` skips non-RunningHub tasks
If `settings._provider === 'evolink'` or `'synvow'`, or `settings._type === 'image-generation'` / `'edit-generation'`, `process-mine` will return `{ processed: 0 }` for those task IDs. They rely on the cron (`process-pending`) or their own API route (`generate-image`, `edit-image`).

### Pitfall: Double credit deduction prevention
The atomic DB update (`.eq('status', 'processing')`) ensures only one path wins. The losing path gets `won = null` and skips credit deduction. Never deduct credits outside this pattern.

### Pitfall: `_creditsAlreadyDeducted` flag
Some tasks deduct credits **upfront** before sending to RunningHub (e.g. smart upscaler). These set `settings._creditsAlreadyDeducted = true`. The completion path checks this flag and skips deduction. If the task **fails** and this flag is set, credits are refunded via `allocatePermanentCredits`.

---

## 8. Adding a New AI Output Type

Checklist when adding a new generation route that produces images:

1. Use `uploadFromUrlWithBuffer` (not `uploadFromUrl`) to get both the CDN URL and buffer
2. Call `generateAndUploadThumbnailFromBuffer(outputPath, buffer)` for images (not videos)
3. Store result as `{ type: 'image', url: bunnyUrl, original_url: providerUrl, thumbnail_url: thumbUrl }` in `output_urls`
4. Use atomic DB update: `.eq('status', 'processing')` + `.maybeSingle()` + check `won` before deducting credits
5. Store `completed_at`, `generation_time_ms`, and `credits_used` on the completed record
6. If the task is RunningHub-async, set `settings._runningHubTaskId` so `process-mine` can pick it up
7. If credits deducted upfront, set `settings._creditsAlreadyDeducted = true` and `settings._creditsToDeduct = N`
