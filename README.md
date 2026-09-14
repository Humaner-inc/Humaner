![hero](github.png)

<p align="center">
  <p align="center">
    Self-host customer support | Agents, Helpdesk, and Team management.
    <br />
    <br />
    <a href="https://humaner.io"><strong>Website</strong></a>
    ·
    <a href="https://docs.humaner.io/oss"><strong>Docs</strong></a>
    ·
    <a href="https://github.com/Humaner-inc/humaner/issues"><strong>Issues</strong></a>
  </p>
</p>

## About

Humaner is the customer support layer made for customers care and built for developers.
Host your own support using Humaner infra to run agents, escalation, ticketing and manage team members.  
Your agent works the mailbox through [Inbox Skills](https://github.com/Humaner-inc/Inbox-skills) and MCP | Simply add your own Unique prompt, knowledge and API.

This repository do not include Humaner Intelligence, Agent Desk, loops, live chat or Inboxes from [Humaner Cloud](https://app.humaner.io).

## Features

**Starter agent**: Your agent config with Humaner skills and Hybrid RAG. (`data/knowledge/`).

**Helpdesk**: Async tickets, urgency, assignees | Handoffs from agents land in a ticket dashboard for your team.

**Organization & team**: Multi-workspace orgs, members, and RBAC under the Humaner product brand.

**Visitor identify**: First name, email, company on the widget | stored on your DB.

**Configuration**: Identity, endpoints and guardrails for your support.

---

## Chat Integrations

**Widget embed**: One-line script with domain allowlist and visitor identify.

**React SDK**: Drop-in `<HumanerChat />` with the same auth model as the widget.

**REST API**: SSE chat stream, session history, handoff ticket, visitor identify.

## Get started

Clone → workable support workspace in minutes: follow the A→Z guide in [`SELFHOST.md`](./SELFHOST.md)

Paste the [Self-hosting — Agent Brief](https://docs.humaner.io/oss/agent-brief) to your IDE Agent.

```bash
git clone https://github.com/Humaner-inc/humaner.git
cd humaner
pnpm install
cp apps/dashboard/.env.example apps/dashboard/.env.local
# fill DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL, CLAUDE_API_KEY
pnpm --filter @humaner/dashboard exec prisma migrate deploy
pnpm --filter @humaner/dashboard dev
```

Open [http://localhost:3001](http://localhost:3001) · set `NEXT_PUBLIC_DEPLOYMENT_MODE=oss`.

[Self-Host setup →](./SELFHOST.md) · [Agent brief →](https://docs.humaner.io/oss/agent-brief) · [OSS docs →](https://docs.humaner.io/oss)

## Architecture

- Monorepo
- pnpm
- React
- TypeScript
- Next.js
- PostgreSQL (pgvector)
- Prisma
- Tailwind CSS
- shadcn/ui

### Hosting

- PostgreSQL 16+ with pgvector (database)
- Your host for the dashboard (Vercel, Docker, VM, etc.)
- Optional SMTP for answering customers issues.

### Services

- BYO LLM — required for agent chat
- OpenAI (optional > knowledge embeddings and reranking)
- Resend or SMTP (transactional/support emails)

```
apps/
  dashboard/      → Self-Host app (port 3001)
packages/
  react/          → @humaner/react
  shared/         → plans, URLs, shared types
```

Questions → [docs.humaner.io](https://docs.humaner.io) (hosted, not in this repo).

## Self-Host vs Custom vs Native

|                           | Self-Host (your own support)             | Custom (Humaner infra)                        | Native (Humaner agents)                                 |
| ------------------------- | ---------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| Who runs the agent        | You · BYO LLM                            | Your stack · Humaner API                      | Humaner · `app.humaner.io`                              |
| Agent layer               | Own agent · Industry Skills · Hybrid RAG | Full Intelligence over `/api/v1/intelligence` | Hosted Intelligence · Personas · memory · auto-training |
| Desk                      | Human Helpdesk (tickets + handoff)       | Agent Desk + Human Desk + runbooks + loops    | Same + Live Chat handle + Inboxes                       |
| Widget / React / chat API | Yes · Self-Host handlers                 | Yes · managed Custom layer                    | Yes · Native pipeline                                   |
| Visitor identify          | CRM-lite on your Postgres                | Identity merge + memory                       | Cross-session recognition                               |
| Billing                   | None                                     | Polar · Custom plan                           | Polar · Humaner / Frontier                              |

Self-Host doesn't integrates Custom API, Humaner Intelligence or inboxes.

Details: [`SELFHOST.md`](./SELFHOST.md)

## License

This project is licensed under the **[GNU Affero General Public License v3.0](./LICENSE)** (AGPL-3.0).

**Security:** responsible disclosure via [`SECURITY.md`](./SECURITY.md) · [humaner.io/#security](https://humaner.io/#security).
