# Model Registry — Sharpii.ai

Complete reference for all AI models. Source of truth: `src/services/models/index.ts`.

---

## Architecture Overview

All models are registered in `src/services/models/index.ts` with:
- **`providers[]`** — ordered list of providers (`'synvow'`, `'runninghub'`, `'evolink'`)
- **`type`** — `'image'` or `'video'`
- **`controls`** — UI capabilities (aspect ratios, reference image, etc.)
- **`credits`** — cost per generation

**Provider routing:**
- `providers[0] === 'runninghub'` → async ComfyUI workflow (cron-polled)
- `providers[0] === 'synvow'` → Synvow/GPT-Best API (sync or async via `after()`)
- `providers[0] === 'evolink'` → Evolink/Kling video API (async)

**API routes:**
- Image generation: `POST /api/generate-image`
- Image enhancement/upscaling: `POST /api/enhance-image`
- Video generation: `POST /api/generate-video`

---

## RunningHub Models (Sharpii Custom)

All RunningHub models use the async flow:
1. `startTaskForModel()` → creates RunningHub task → stores `_runningHubTaskId` in DB
2. Netlify cron (every 1 min) → `POST /api/tasks/process-pending` → calls `checkTaskOnce()`
3. On completion → updates DB `status: 'completed'` → uploads output to Bunny CDN

### Smart Upscaler
- **Model ID**: `smart-upscaler`
- **Route**: `/api/enhance-image`
- **Credits**: 80 (4K) | 120 (8K)
- **Workflow**: `2024900845141233665`
- **Settings**: `src/models/smart-upscaler/` (`config.ts`, `settings.txt`)
- **Key nodes**: #230 LoadImage, #213 ScaleBy, #214 Resize, #215 SaveImage
- **UI page**: `/app/upscaler` (second tab)

### Professional Upscaler
- **Model ID**: `pro-upscaler`
- **Route**: `/api/enhance-image`
- **Credits**: 100 (std) | 140 (maxmode 4K) | 200 (maxmode 8K)
- **Workflows**: 4 variants (portrait × maxmode) — see `src/models/pro-upscaler/settings.txt`
- **Settings**: `src/models/pro-upscaler/` (`config.ts`, `settings.txt`)
- **Key nodes**: #331 LoadImage, #341 SkinPath, #337 Prompt, #378 Resolution, #400/#224 SaveImage
- **UI page**: `/app/upscaler` (first tab)

### Crisp Upscaler
- **Model ID**: `crisp-upscaler`
- **Route**: `/api/enhance-image`
- **Credits**: 120 (flat)
- **Workflow**: `2033549152264654849`
- **Settings**: `src/models/crisp-upscaler/` (`config.ts`, `settings.txt`)
- **Key nodes**: #80 LoadImage, #70 SaveImage
- **UI page**: `/app/upscaler` (third tab)

### Soul 2.0
- **Model ID**: `soul-2`
- **Route**: `/api/generate-image` (RunningHub async branch)
- **Credits**: 50
- **Workflow**: `2033529679528861697`
- **Settings**: `src/models/soul-2/` (`config.ts`, `settings.txt`)
- **Key nodes**: #45 Prompt, #77 AspectRatio+LongEdge, #63 SaveImage
- **Type**: Text-to-image (no input image)
- **Aspect ratios**: 7 values — 16:9, 4:3, 3:2, 1:1, 2:3, 3:4, 9:16 (NO 21:9)
- **UI page**: `/app/image` (shows in model picker with tag "Sharpii")

### Skin Editor
- **Model ID**: `skin-editor`
- **Route**: `/api/enhance-image`
- **Credits**: 40–160 (depends on settings — see `model-pricing-config.ts`)
- **Workflows**: `2023005806844710914` (standard) | `2023026925354094594` (smart upscale)
- **Settings**: `src/models/skin-editor/` (`config.ts`, `settings.txt`)
- **Key nodes**: #97 LoadImage, #140 Prompt, #90 Denoise, #167 MaxShift, #85 Megapixels, #88 Guidance, #166 Style, #138 Protections
- **Output nodes**: #136 (standard) | #215 + #136 (smart upscale)
- **Modes**: Subtle, Clear, Pimples, Freckles, Custom
- **UI page**: `/app/skineditor`

---

## Synvow Models (Image)

All Synvow image models route through `POST /api/generate-image`.
Jobs run in `after()` (background after response is sent to client).
Client polls via `processingDbIds` → `GET /api/history/list?ids=...` every 5s.

| Model ID | Label | Credits | Notes |
|----------|-------|---------|-------|
| `nano-banana-2` | Nano Banana 2 | 20 | 1K, fast, ref support |
| `nano-banana-2-2k` | Nano Banana 2 | 40 | 2K output |
| `nano-banana-2-4k` | Nano Banana 2 | 80 | 4K output |
| `nano-banana-pro` | Nano Banana Pro | 50 | Gemini API, strict ref |
| `nano-banana` | Nano Banana | 20 | Legacy, same as nb-2 |
| `gemini-3.1-flash-image-preview` | Gemini Flash | 20 | Google, t2i only |
| `doubao-seedream-5-0-260128` | Seedream 5.0 Lite | 25 | ByteDance, base64 refs |
| `doubao-seedream-4-5-251128` | Seedream 4.5 | 20 | ByteDance, base64 refs |

**Seedream notes**: Use base64 for reference images (Volcengine servers in China can't fetch Bunny CDN). `imageSize` must be `"2K"` or `"3K"` only.

**nano-banana-pro notes**: Uses Gemini-style API (`/v1beta/models/.../generateContent`). Proxy hard-caps output at 1K.

---

## Synvow Models (Video)

All Synvow video models route through `POST /api/generate-video`.
Uses Synvow's async video endpoint (`/v2/videos/generations`).

| Model ID | Label | Credits | Notes |
|----------|-------|---------|-------|
| `veo3.1-fast` | Veo 3.1 Fast | 350 | Google, 5–8s |
| `veo3.1` | Veo 3.1 Standard | 500 | Google, audio, 5–8s |
| `veo3.1-pro` | Veo 3.1 Pro | 600 | Google, audio |
| `veo3.1-pro-4k` | Veo 3.1 Pro 4K | 800 | Google, 4K |
| `veo3.1-components` | Veo 3.1 Components | 550 | Multi-image assembly |
| `veo3` | Veo 3 | 500 | Google, with native audio |
| `veo2` | Veo 2 | 400 | Google, photorealistic |
| `sora-2` | Sora 2 | 500 | OpenAI, REQUIRES first frame |
| `sora-2-pro` | Sora 2 Pro | 700 | OpenAI, HD, up to 25s |
| `doubao-seedance-1-5-pro-251215` | Seedance 1.5 Pro | 350 | ByteDance, audio-sync |

---

## Evolink Models (Video)

Evolink = Kling API proxy. Routes through `POST /api/generate-video`.

| Model ID | Label | Credits | Notes |
|----------|-------|---------|-------|
| `kling-3` | Kling 3.0 Pro | 300 | Multi-shot, elements |
| `kling-o3` | Kling O3 OMNI | 350 | Advanced motion |
| `kling-o3-video-edit` | Kling O3 Edit | 280 | Video editing |
| `kling-o3-reference-to-video` | Kling O3 Ref2Vid | 350 | Style transfer |
| `kling-effects` | Kling Effects | 250 | Legacy, effects |
| `kling-video-motion-control` | Kling Motion Control | 300 | Legacy, motion |

---

## Adding a New Model — Checklist

### Synvow model
1. Add entry to `IMAGE_MODELS` or `VIDEO_MODELS` in `src/services/models/index.ts`
2. Set `providers: ['synvow']`
3. Verify model ID matches the Synvow API model ID exactly
4. Test at `https://ai.synvow.cc` playground first
5. Check if it needs image-to-image (chat/completions) or text-to-image (images/generations)

### RunningHub model
1. Export the ComfyUI workflow from RunningHub — note all node IDs and field names
2. Create `src/models/<model-id>/` directory with:
   - `config.ts` — workflow ID, node IDs, credits, timing constants
   - `settings.txt` — complete node mapping documentation (this file format)
3. Add entry to `IMAGE_MODELS` (or wherever) in `src/services/models/index.ts`
   - Set `providers: ['runninghub']`
4. Add handler in `startTaskForModel()` in `src/services/ai-providers/runninghub/runninghub-provider.ts`
   - Skip `validateRequest()` if text-to-image (no imageUrl)
   - Build `nodeInfoListOverride` array from model settings
   - Return `{ success, runningHubTaskId, expectedNodeIds }`
5. If it's an image generation model: add RunningHub branch in `/api/generate-image/route.ts`
   - The branch is already generic: `if (modelConfig.providers[0] === 'runninghub')`
6. If it's an upscaling/enhancement model: add to `/api/enhance-image/route.ts`
   - `startTaskForModel()` is already called generically for all RunningHub models
7. Add pricing entry to `src/lib/model-pricing-config.ts` if it's an enhancement model
8. Update settings.txt using the format in this doc

### Common pitfalls
- Remote URL → RunningHub LoadImage node: MUST upload first, then pass file key
- Invalid nodeId or fieldName → `APIKEY_INVALID_NODE_INFO` error from RunningHub
- `nodeInfoListOverride` must use string values for number fields when the API expects strings
- `aspect_ratio` for Soul-2 must use the full combo label, not the short form
- Don't add `_type: 'image-generation'` to RunningHub task settings — the cron skips those

---

## Future Provider Expansion

If adding a new 3rd-party API provider:
1. Create `src/services/ai-providers/<provider>/` with:
   - `<provider>-provider.ts` — implements the provider API calls
   - `index.ts` — exports provider factory
2. Register in `src/services/ai-providers/provider-factory.ts`
3. Add new `ProviderType` enum value if needed
4. Add model entries with `providers: ['<new-provider>']`
5. Add the new provider string to routing logic in the relevant API route
6. Document in `docs/knowledge/ai-providers.md`
