# Development

This repo is Humaner's **integration layer** | Dashboard UI, widget, React SDK, and API routes.
**Agent intelligence** (Humaner v1.0 / v2.0 / v3.0) runs on Humaner's hosted runtime.

Most integrators embed the widget, install `@humaner/react`, or call `app.humaner.io`.
See [README.md](./README.md) and [docs](https://docs.humaner.io).

This guide is for **Humaner team members**, **security evaluators** reading auth/tenancy code, and **contributors** working on the SDK or widget.

---

## What you can run locally

| Surface                         | Local? | Notes                                      |
| ------------------------------- | ------ | ------------------------------------------ |
| Landing (`apps/landing`)        | ✅     | Marketing site + vision handbook           |
| Docs (`apps/documentation`)     | ✅     | Product documentation (`docs.humaner.io`)  |
| Dashboard UI (`apps/dashboard`) | ✅     | Auth, settings, desk, billing UI           |
| Widget iframe + `widget.js`     | ✅     | Point embed at `localhost:3001`            |
| `@humaner/react`                | ✅     | `baseUrl="http://localhost:3001"`          |
| API routes (`/api/v1/*`)        | ✅     | Requires your own keys + Redis (see below) |

## What you cannot self-host today

- Humaner prompt assembly and personality layers
- Training pipeline, eval gates, and model routing heuristics.
- A production-equivalent agent runtime without Humaner's hosted stack

Cloning gives you **the integration layer** to deploy your own agents, not Humaner models.
That is intentional > see [Docs/OPEN_SOURCING.md](./Docs/OPEN_SOURCING.md).

---

## Prerequisites

Only needed if you are running the monorepo locally (team / evaluator / SDK contributor):

- Node.js ≥ 20, pnpm 9 (`corepack enable`)
- Postgres (local or Supabase)
- Upstash Redis — rate limits + agent config cache
- Redis Iris — LangCache + agent memory (optional; needed for full chat locally)
- Anthropic API key — `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY`
- OpenAI API key — `OPENAI_API_KEY` (embeddings; optional, falls back to keyword search)

**Supabase pooler:** optional `DATABASE_CONNECTION_LIMIT` (default `5` per dashboard process) and `DATABASE_POOL_TIMEOUT` (default `20` seconds). Prisma adds `pgbouncer=true` on port 6543 automatically.

---

## Getting started

```bash
pnpm install

cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/landing/.env.example apps/landing/.env

pnpm --filter @humaner/dashboard exec prisma migrate dev
pnpm dev
```

| App       | URL                   | Command                  |
| --------- | --------------------- | ------------------------ |
| Landing   | http://localhost:3000 | `pnpm dev:landing`       |
| Dashboard | http://localhost:3001 | `pnpm dev:dashboard`     |
| Docs      | http://localhost:3004 | `pnpm dev:documentation` |

```bash
pnpm build       # production build
pnpm lint        # lint all packages
pnpm typecheck   # typecheck all packages
pnpm db:studio   # Prisma Studio
```

---

## Monorepo layout

```
apps/
  landing/     → humaner.io        (port 3000)
  documentation/ → docs.humaner.io   (port 3004)
  dashboard/   → app.humaner.io    (port 3001)
packages/
  react/       → @humaner/react
  shared/      → plans, URLs, shared types
```

---

## Working on `@humaner/react`

```bash
pnpm --filter @humaner/react typecheck
```

```tsx
<HumanerChat agentId="YOUR_AGENT_PUBLIC_ID" baseUrl="http://localhost:3001" />
```

Publish flow and npm release steps are documented when the package goes public.

---

## Deploy split

| Domain         | App              | Vercel root |
| -------------- | ---------------- | ----------- |
| humaner.io     | `apps/landing`   | landing     |
| app.humaner.io | `apps/dashboard` | dashboard   |

Set `NEXT_PUBLIC_LANDING_URL` and `NEXT_PUBLIC_APP_URL` in each project.

---

## Stack

Full list with links lives in the [README Built with section](./README.md#built-with). Summary:

- **App:** Next.js 15, React 19, Prisma, Turborepo, pnpm
- **AI:** Anthropic (Chat) · OpenAI (embeddings) · Firecrawl (KB ingestion)
- **Data:** PostgreSQL (Supabase) · Redis Iris + Upstash + Redis Cloud
- **Services:** Polar · Resend · Vercel

---
