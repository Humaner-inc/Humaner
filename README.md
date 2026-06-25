# Humaner

Personality-driven AI support agents. Monorepo baseline for **humaner.io** (landing) and **app.humaner.io** (dashboard).

## Structure

```
apps/
  landing/     → humaner.io        (port 3000)
  dashboard/   → app.humaner.io    (port 3001)
packages/
  shared/      → plans, LLM tiers, shared URLs
```

## Stack

- **Achromatic** boilerplate (auth, orgs, settings) in `apps/dashboard`
- **Polar.sh** billing with usage metering (replaces Stripe)
- **Redis Iris** — LangCache (semantic cache) + Agent Memory (Learning Loop v3)
- **Upstash Redis** — rate limits + agent config cache
- **Anthropic** — Haiku 4.5 (Free) / Sonnet 4.6 (paid tiers)

## Pricing tiers (LLM)

| Tier | LLM | Context cap |
|------|-----|-------------|
| Free | Haiku 4.5 | 4K |
| Starter | Sonnet 4.6 | 8K (capped) |
| Growth | Sonnet 4.6 | 16K |
| Pro | Sonnet 4.6 | Full (128K) |

## Getting started

```bash
pnpm install
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/landing/.env.example apps/landing/.env

# Run migrations (requires Postgres)
pnpm --filter @humaner/dashboard exec prisma migrate dev

# Dev both apps
pnpm dev
```

- Landing: http://localhost:3000
- Dashboard: http://localhost:3001

## Deploy split

| Domain | App | Vercel project |
|--------|-----|----------------|
| humaner.io | `apps/landing` | Root = landing |
| app.humaner.io | `apps/dashboard` | Root = dashboard |

Set `NEXT_PUBLIC_LANDING_URL` and `NEXT_PUBLIC_APP_URL` in each project's env.

## Note

`apps/web` is a stale copy from an earlier attempt — delete it once nothing holds a lock on the folder. Use `apps/dashboard` going forward.
