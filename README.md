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
Your agent is onboarded like a real employee through [Industry Skills](https://github.com/Humaner-inc/customer-support-skills) | Simply add your own Custom prompt, knowledge and API.

This repository do not include Humaner Intelligence, Agent Desk, loops, live chat or Inboxes from [Humaner Cloud](https://app.humaner.io).

## Features

**Starter agent**: Your Custom system prompt, Industry Skills, markdown knowledge (`data/knowledge/`) and your LLM API.

**Helpdesk**: Async tickets, urgency, assignees | Handoffs from agents land in a ticket dashboard for your team.

**Organization & team**: Multi-workspace orgs, members, and RBAC under the Humaner product brand.

---

## Integrations

**Widget embed**: One-line script with domain allowlist and visitor identify.

**React SDK**: Drop-in `<HumanerChat />` with the same auth model as the widget.

**REST API**: SSE chat stream and agent metadata for custom clients.

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
- Optional SMTP for sign-up verification email

### Services

- Anthropic (BYO LLM — required for agent chat)
- OpenAI (optional — knowledge embeddings and reranking)
- Resend or SMTP (transactional email)

```
apps/
  dashboard/      → Self-Host app (port 3001)
  documentation/  → docs (OSS pages)
packages/
  react/          → @humaner/react
  shared/         → plans, URLs, shared types
```

## Self-Host vs Humaner Cloud

| Self-Host (this repo)                                   | Humaner Cloud                                       |
| ------------------------------------------------------- | --------------------------------------------------- |
| Self-Host dashboard (`NEXT_PUBLIC_DEPLOYMENT_MODE=oss`) | Hosted `app.humaner.io`                             |
| Custom prompt · Industry Skills · markdown KB · BYO LLM | Inboxes · Cross-Session memory · Auto-training loop |
| Helpdesk, org/team, Widget / React / API                | Agent Desk · Runbooks · Live Chat handle            |
| No Polar / plan gates                                   | Polar billing · quotas · paid personas              |

Details: [`Docs/OPEN_SOURCING.md`](./Docs/OPEN_SOURCING.md) · [`SELFHOST.md`](./SELFHOST.md)

## Brand tokens

| Token  | Hex                               | Use                               |
| ------ | --------------------------------- | --------------------------------- |
| White  | `#F2F2F2`                         | Cool light surfaces               |
| Cream  | `#fcf4ec`                         | Warm light surface, dark-mode ink |
| Black  | `#0A0D0D`                         | Primary dark surface              |
| Greys  | `#eaeaea` · `#18181b` · `#1c1c1e` | Existing app greys                |
| Accent | `#e1ccaf`                         | Links, emphasis, warm CTAs        |
| Blue   | `#2252bc`                         | Docs, info, Classic plan          |
| Orange | `#f85919`                         | Warnings                          |
| Red    | `#aa1f18`                         | Deletion, unsolved                |
| Green  | `#023404` / `#226342`             | Validation, solved (light / dark) |

## License

This project is licensed under the **[GNU Affero General Public License v3.0](./LICENSE)** (AGPL-3.0).

**Security:** responsible disclosure via [`SECURITY.md`](./SECURITY.md) · [humaner.io/security](https://humaner.io/security).
