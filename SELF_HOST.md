# Humaner Self-Host

Deploy your own support helpdesk with a **starter agent** powered by our /customer-support-skillz. Bring your LLM API key. White-label via `brand.config.ts`.

Not included within self-hosting:
Humaner Intelligence, AI Desk, training-loop, runbooks, inboxes and live chat handoff.

## Quick start (Docker)

```bash
# 1. Required secrets
export AUTH_SECRET="$(openssl rand -base64 32)"
export ANTHROPIC_API_KEY="sk-ant-..."   # or OPENAI_API_KEY

# 2. Optional — white-label
# Edit apps/dashboard/brand.config.ts (name, logo, helpdesk label, colors)

# 3. Optional — knowledge for the starter agent
# Drop .md files into data/knowledge/
# npx @humaner/into-markdown https://yoursite.com > data/knowledge/site.md

# 4. Boot
docker compose up --build
```

Open http://localhost:3001

## What you configure

| Setting                 | Where                                                       |
| ----------------------- | ----------------------------------------------------------- |
| LLM API key             | `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`                     |
| Industry → **behavior** | Agent onboarding (loads `@humaner/customer-support-skillz`) |
| Knowledge               | `data/knowledge/*.md` (context-stuffing, ~50 pages)         |
| Support email           | Org settings (async handoff)                                |
| Brand                   | `apps/dashboard/brand.config.ts`                            |

You do **not** write a system prompt. The starter agent assembles it from
industry skillz (baseline tone + behavior + escalation + guardrails) and your
knowledge files.

## Async Helpdesk only

Tickets are async (email follow-up). Live chat is Cloud / optional add-on —
see [docs.humaner.io/oss/desk/replies](https://docs.humaner.io/oss/desk/replies).

## Local dev (without Docker)

Requires PostgreSQL 16+ with pgvector extension (`CREATE EXTENSION IF NOT EXISTS vector;`).

```bash
pnpm install
cp apps/dashboard/.env.example apps/dashboard/.env.local
# Set at minimum:
#   NEXT_PUBLIC_DEPLOYMENT_MODE=oss
#   DATABASE_URL=postgresql://...
#   DIRECT_URL=postgresql://...   (same as DATABASE_URL for direct connection)
#   AUTH_SECRET=$(openssl rand -base64 32)
#   ANTHROPIC_API_KEY=sk-ant-...

pnpm --filter @humaner/dashboard exec prisma migrate deploy
pnpm --filter @humaner/dashboard dev
```

## Packages

- [`@humaner/customer-support-skillz`](https://github.com/Humaner-inc/customer-support-skillz) — industry behavior (bundled)
- [`@humaner/into-markdown`](https://github.com/Humaner-inc/into-markdown) — crawl site → `.md` knowledge
- [`@humaner/react`](./packages/react) — widget SDK

## Architecture

See [docs.humaner.io/self-host/architecture](https://docs.humaner.io/self-host/architecture) for the full Self-Host plan and boundary details.
