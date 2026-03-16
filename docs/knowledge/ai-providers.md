# AI Providers

## Overview
Three AI providers in use:
1. **Synvow / GPT-Best** (`api.gptbest.vip`) — image generation, editing, and video
2. **RunningHub** — custom Sharpii models via ComfyUI workflows (upscaling, skin, Soul 2.0)
3. **Evolink** — Kling video generation

> Full model registry with all model IDs, credits, and implementation notes: `docs/knowledge/model-registry.md`

> For deep Synvow API details, see `~/.claude/projects/-Users-dheer-Documents-shrp/memory/apiknowledge.md`

---

## 1. Synvow / GPT-Best

**Base URL**: `https://api.gptbest.vip` (env: `SYNVOW_BASE_URL`)
**Key**: `SYNVOW_API_KEY`
**Playground**: `https://ai.synvow.cc`
**Provider code**: `src/services/ai-providers/synvow/synvow-provider.ts`

### Endpoints
| Endpoint | Purpose |
|---|---|
| `POST /v1/images/generations` | Text-to-image (all standard models) |
| `POST /v1/chat/completions` | Image-to-image with reference (nano-banana-2 family) |
| `POST /v1beta/models/nano-banana-pro:generateContent` | Gemini-style API (NB Pro) |
| `POST /v2/videos/generations` | Async video generation |
| `GET /v2/videos/generations/{taskId}` | Poll video status |

### CRITICAL: Reference Image Routing
```
No reference image → POST /v1/images/generations
Reference image present + not Seedream + not NB Pro → POST /v1/chat/completions
Seedream model → POST /v1/images/generations (with base64 image array)
nano-banana-pro → POST /v1beta/.../generateContent (Gemini format)
```
Using `/v1/images/generations` with a reference image **silently ignores** it — always use chat/completions for references.

### Confirmed Working Models
| Model ID | Type | Notes |
|---|---|---|
| `nano-banana-2` | img2img + t2i | 1K output, fast |
| `nano-banana-2-2k` | img2img + t2i | 2K output |
| `nano-banana-2-4k` | img2img + t2i | 4K output |
| `nano-banana-pro` | img2img | Gemini API, 1K only (proxy hard-cap) |
| `nano-banana` | t2i/img2img | Same as nb-2, no qualityGroupId |
| `grok-2-image` | t2i only | xAI Grok, no reference support |
| `gemini-3.1-flash-image-preview` | t2i only | Google Gemini |
| `doubao-seedream-5-0-260128` | t2i + img2img | ByteDance, China servers |
| `doubao-seedream-4-5-251128` | t2i + img2img | ByteDance, China servers |

### Image-to-Image Request (nano-banana-2 family)
```json
{
  "model": "nano-banana-2",
  "messages": [{ "role": "user", "content": [
    { "type": "text", "text": "<prompt>. The output image must be in 1:1 aspect ratio." },
    { "type": "image_url", "image_url": { "url": "<bunny-cdn-url>" } }
  ]}],
  "stream": false
}
```
Response: extract URL from markdown in `choices[0].message.content`:
```typescript
const match = content.match(/!\[image\d*\]\((https?:\/\/[^)]+)\)/)
```

### Seedream Models — Special Handling
- Reference images: MUST be base64 (Volcengine servers in China can't reach Bunny CDN)
- Size: `"2K"` or `"3K"` tier labels ONLY (not pixel strings)
- Aspect ratio: no API param — append to prompt: `"wide landscape 16:9 aspect ratio"`

### nano-banana-pro — Special Handling
- Gemini API format with `inlineData` (base64, NOT URL)
- `responseModalities` MUST be `["TEXT", "IMAGE"]` (not `["IMAGE"]` alone)
- `imageConfig.aspectRatio` and `imageConfig.imageSize` are IGNORED by proxy
- Proxy hard-caps at 1K — use `nano-banana-2-4k` for 4K output
- Aspect ratio: inject into text prompt

### Output Image Hosting
- Synvow outputs: `https://webstatic.aiproxy.vip/output/{date}/{uuid}.jpg` (temporary)
- Always re-upload to Bunny CDN via `uploadFromUrl()` in the `after()` block

---

## 2. RunningHub

**Purpose**: ComfyUI-as-a-service for all Sharpii custom AI models
**Key**: `RUNNINGHUB_API_KEY`
**Provider code**: `src/services/ai-providers/runninghub/runninghub-provider.ts`
**Base URL**: `https://www.runninghub.ai`

### Models on RunningHub
| Model ID | Name | Route | Credits |
|----------|------|-------|---------|
| `smart-upscaler` | Smart Upscaler | `/api/enhance-image` | 80–120 |
| `pro-upscaler` | Professional Upscaler | `/api/enhance-image` | 100–200 |
| `crisp-upscaler` | Crisp Upscaler | `/api/enhance-image` | 120 |
| `soul-2` | Soul 2.0 | `/api/generate-image` | 50 |
| `skin-editor` | Skin Editor | `/api/enhance-image` | 40–160 |

> Full node mappings and workflow details: `src/models/<model-id>/settings.txt`

### Async Flow
1. `startTaskForModel(request, modelId)` → submits workflow → returns `runningHubTaskId`
2. Route stores task in `history_items` with `status: 'processing'` + `_runningHubTaskId`
3. Client polls `GET /api/enhance-image/poll?taskId=<uuid>` every 10s (upscaler pages)
   OR client polls `GET /api/history/list?ids=...` every 5s (image page for Soul 2.0)
4. Background: Netlify cron (every 1 min) → `POST /api/tasks/process-pending` → `checkTaskOnce()`
5. On completion: DB update (atomic, `.eq('status', 'processing')`) → upload to Bunny CDN → deduct credits

### Task Type Detection in process-pending
- `settings._type === 'image-generation'` → Synvow/sync task, skip (times out after 15 min)
- `settings._type === 'edit-generation'` → sync task, skip
- `settings._runningHubTaskId` present → RunningHub async task, poll and update

### RunningHub API Calls
```typescript
// Create task
POST /task/openapi/create
{ apiKey, workflowId, nodeInfoList: [{ nodeId, fieldName, fieldValue }] }
→ { code: 0, data: { taskId } }

// Check status
POST /task/openapi/status
{ apiKey, taskId }
→ { code: 0, data: 'SUCCESS' | 'FAILED' | 'QUEUED' | 'RUNNING' }

// Get outputs (call after SUCCESS)
POST /task/openapi/outputs
{ apiKey, taskId }
→ { code: 0, data: [{ nodeId, fileUrl }] }

// Upload image (image-to-image models)
POST /task/openapi/upload (multipart/form-data)
fields: file (binary), apikey, apiKey
→ { code: 0, data: { fileName } }
```

### Image Input — CRITICAL
- Remote URLs (Bunny CDN URLs) → RunningHub downloads them automatically
- Base64 data URIs → converted to buffer and uploaded via `/task/openapi/upload`
- The `fileName` from upload response is used as `fieldValue` for LoadImage nodes
- Soul 2.0 has no image input (text-to-image) — pass `''` as imageUrl

### Background Task Timeout Rules
- Stale tasks (no `_runningHubTaskId` after 10 min) → marked failed
- Stuck tasks (has ID but no completion after 2 hr) → marked failed

### Common Errors
- `APIKEY_INVALID_NODE_INFO` → wrong nodeId or fieldName in nodeInfoListOverride
- No output after SUCCESS → wait 1s then poll `/task/openapi/outputs` (retry up to 3×)
- Task stays QUEUED → RunningHub capacity issue, will resolve automatically

---

## 3. Evolink

**Purpose**: Kling video generation
**Key**: `EVOLINK_API_KEY` (or similar)
**Provider code**: `src/services/ai-providers/evolink/`
**Models**: `kling-3`, `kling-o3`, `kling-o3-video-edit`, `kling-o3-reference-to-video`, `kling-effects`, `kling-video-motion-control`

---

## Proxy Limitations Reference (api.gptbest.vip)

| Parameter | Works? | Notes |
|---|---|---|
| `size` in chat/completions body | ❌ Ignored | For img2img tasks |
| `imageConfig.aspectRatio` (Gemini) | ❌ Ignored | When responseModalities includes TEXT |
| `imageConfig.imageSize` (Gemini) | ❌ Ignored | Hard-capped at 1K for NB Pro |
| Text prompt aspect ratio instruction | ✅ Works | For NB2, NB Pro, Seedream |
| Text prompt resolution instruction | ❌ Doesn't work | Proxy ignores for NB Pro |
| nano-banana-2 quality variants (model IDs) | ✅ Works | Each ID = different resolution backend |
| Seedream `size: "2K"` / `"3K"` | ✅ Works | Use tier labels only |
| Seedream `size: "2848x1600"` (pixels) | ❌ Unreliable | May produce squeezed 1:1 output |
| Seedream `image: [base64]` reference | ✅ Works | Must convert CDN URLs to base64 first |
| Seedream `image: [cdn_url]` reference | ❌ Fails | China servers can't reach Bunny CDN |
