# AI Providers

## Overview
Two AI providers in use:
1. **Synvow / GPT-Best** (`api.gptbest.vip`) — image generation and editing (Synvow proxy)
2. **RunningHub** — upscaling and skin editing via ComfyUI workflows

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

**Purpose**: ComfyUI-as-a-service for upscaling and skin editing workflows
**Key**: `RUNNINGHUB_API_KEY`
**Provider code**: `src/services/ai-providers/runninghub/runninghub-provider.ts`

### Async Flow
1. Submit workflow → returns `runninghubTaskId`
2. Store task in `history_items` table with `status: 'processing'`
3. Client polls `GET /api/enhance-image/poll?taskId=<uuid>` every 10s
4. Background: Netlify scheduled function also checks every minute via `POST /api/tasks/process-pending`
5. On completion: update DB → deduct credits (atomic race prevention)

### Smart Upscaler Workflow
- Workflow ID: `2024900845141233665`
- Node #230: LoadImage (input)
- Node #213: ImageScaleBy (`scale_by` param)
- Node #214: ImageResize+ (width/height)
- Node #215: SaveImage (output)
- 4K: `scale_by=2`, `4096×4096`, 80 credits
- 8K: `scale_by=4`, `8192×8192`, 120 credits

### Background Task Timeout Rules
- Stale (no RunningHub ID): fail after 10 minutes
- Stuck (has ID but no completion): fail after 2 hours

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
