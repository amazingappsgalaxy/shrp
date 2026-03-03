# Claude Code Configuration — Sharpii.ai

This is the main Sharpii.ai project. All knowledge, memory, and docs live here.

## Project
- **Root**: `/Users/dheer/Documents/shrp/`
- **Framework**: Next.js 15.4.6, React 19, TypeScript
- **Dev server**: `npm run dev` → port 3003
- **Build**: `npm run build`
- **Type check**: `npm run type-check`

## Key Commands
```bash
npm run dev          # Dev server (port 3003)
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # ESLint
npm run test         # Jest tests
npm run build:netlify   # Netlify build
```

## Tech Stack
- **AI backends**: RunningHub (upscaling, skin) + Synvow/GPT-Best (generation, edit)
- **Payments**: DodoPayments (NOT Stripe)
- **Database**: Supabase Postgres, custom session auth (NOT Supabase Auth)
- **Storage**: Bunny CDN (`shai.b-cdn.net`)
- **UI**: TailwindCSS, Framer Motion, Radix UI

## Required Env Vars
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SYNVOW_BASE_URL=https://api.gptbest.vip
SYNVOW_API_KEY=
RUNNINGHUB_API_KEY=
BUNNY_API_KEY=
BUNNY_STORAGE_ZONE=
DODO_API_KEY=
DODO_WEBHOOK_SECRET=
DODO_BASIC_MONTHLY_PRODUCT_ID=
DODO_CREATOR_MONTHLY_PRODUCT_ID=
DODO_PROFESSIONAL_MONTHLY_PRODUCT_ID=
DODO_ENTERPRISE_MONTHLY_PRODUCT_ID=
CRON_SECRET=
```

## Project Structure
```
src/
├── app/
│   ├── app/              # Authenticated app pages
│   │   ├── dashboard/    # User dashboard
│   │   ├── upscaler/     # Smart Upscaler
│   │   ├── skineditor/   # Skin Editor
│   │   ├── edit/         # Image Edit (Synvow)
│   │   ├── image/        # Image Generation (Synvow)
│   │   └── history/      # Generation history
│   └── api/              # API routes
│       ├── auth/         # Login, signup, session
│       ├── payments/     # Checkout, webhook, complete
│       ├── enhance-image/# RunningHub async flow + poll
│       ├── edit-image/   # Synvow edit (sync)
│       ├── generate-image/# Synvow generation (sync)
│       └── user/         # Me, subscription management
├── components/
│   ├── app/              # App-specific components
│   ├── providers/        # React context providers
│   └── ui/               # Shared UI components
├── lib/                  # Core utilities
│   ├── auth-simple.ts    # Server-side auth
│   ├── auth-client-simple.ts # Client auth hook
│   ├── unified-credits.ts # Credits service
│   ├── hooks/            # React hooks (useCredits, useAppData)
│   ├── dodo-client.ts    # DodoPayments SDK
│   └── bunny.ts          # Bunny CDN utilities
└── services/
    └── ai-providers/
        ├── synvow/       # Synvow/GPT-Best provider
        └── runninghub/   # RunningHub provider
```

## Knowledge Base Docs
All reference documentation lives in `docs/`:
- `docs/app-ui-components.md` — **Read before building any /app/* page** — layout, tokens, patterns
- `docs/knowledge/` — System knowledge (payments, auth, credits, AI providers, database)

## Claude Code Memory
Claude's auto-memory for this project is at:
`~/.claude/projects/-Users-dheer-Documents-shrp/memory/`
- `MEMORY.md` — Current project state (auto-loaded)
- `apiknowledge.md` — Detailed Synvow/GPT-Best API reference
- `synvow-provider.md` — Provider routing logic

## Important Patterns

### UI: Before building any page
1. Read `docs/app-ui-components.md`
2. Two-column layout: `grid grid-cols-1 lg:grid-cols-[420px_1fr]` with `pt-16`
3. Left sidebar: 420px, `bg-[#0c0c0e]`, fixed footer with CTA
4. Right col: sticky, `px-4 pt-2 pb-4 lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-4.5rem)]`
5. CTA always: `bg-[#FFFF00] h-14 rounded-xl text-black font-bold`

### Credits: Client-side
```typescript
const { total: creditBalance, isLoading: creditsLoading } = useCredits()
// Always guard with !creditsLoading to avoid false positives during initial SWR load
if (!creditsLoading && creditBalance < creditCost) { /* show error */ }
```

### Credits: Server-side deduction
```typescript
const deductResult = await UnifiedCreditsService.deductCredits(userId, cost, taskId, desc)
if (!deductResult.success) {
  console.error(`🚨 CRITICAL: credit deduction FAILED for user=${userId} task=${taskId}`)
}
```
- Always check `deductResult.success` — the function never throws
- Operation order: generate → DB update to completed → deduct credits

### API routes: Synvow image routing
- Text-to-image: `POST /v1/images/generations`
- Image-to-image (reference): `POST /v1/chat/completions` — response content has markdown URL
- Seedream models: always base64 for references; size = `"2K"` or `"3K"` only
- See `memory/apiknowledge.md` for full details

## Git Workflow
- Main branch: `master`
- Development: `development`
- Use conventional commits

## Troubleshooting
```bash
rm -rf .next && npm run dev   # Clear Next.js cache
npm run type-check            # Check for TypeScript errors
```

## UI/UX Design System
- **Style**: Dark UI, Brand yellow `#FFFF00`, clean minimal
- **Fonts**: System sans-serif
- **Design tokens**: see `docs/app-ui-components.md §2`

---
*Last updated: March 2026*
