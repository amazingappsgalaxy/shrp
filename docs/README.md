# Sharpii.ai Documentation Index

This directory contains all knowledge base documentation for the Sharpii.ai project.

## Files

### Core Reference (read these before coding)
- **`app-ui-components.md`** — Complete UI component system. Read before building any `/app/*` page.
  - Two-column layout architecture, design tokens, component patterns, z-index ladder

### System Knowledge (`knowledge/`)
- **`payments.md`** — DodoPayments integration: checkout flow, webhooks, subscriptions, cancellation
- **`credits.md`** — Credits system: two types, atomic RPC functions, deduction patterns, idempotency
- **`auth.md`** — Custom session auth, middleware, known issues
- **`ai-providers.md`** — Synvow/GPT-Best + RunningHub: endpoints, model routing, quirks
- **`database.md`** — Supabase schema, key tables, RLS notes, RPC functions
- **`deployment.md`** — Netlify deployment, background tasks, scheduled functions

## Quick Reference

| I need to... | Read... |
|---|---|
| Build a new `/app/*` page | `app-ui-components.md` |
| Work on payments/billing | `knowledge/payments.md` |
| Work on credits | `knowledge/credits.md` |
| Work on AI image generation | `knowledge/ai-providers.md` + `~/.claude/.../memory/apiknowledge.md` |
| Work on auth | `knowledge/auth.md` |
| Work on database | `knowledge/database.md` |
| Deploy or set up cron tasks | `knowledge/deployment.md` |

## Claude Code Auto-Memory
Located at `~/.claude/projects/-Users-dheer-Documents-shrp/memory/`:
- `MEMORY.md` — Project architecture & current state (auto-loaded into context)
- `apiknowledge.md` — Deep Synvow API reference (proxy limitations, model quirks)
- `synvow-provider.md` — Provider routing logic
