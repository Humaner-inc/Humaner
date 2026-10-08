<h1 align="center">Humaner</h1>

<p align="center">
  Self-host your mailbox and run your business ops with your agent.
  <br />
  Inbox, tasks, calendar, and MCP.
</p>

<p align="center">
  <a href="https://humaner.io">Website</a>
  •
  <a href="https://docs.humaner.io/oss">Docs</a>
  •
  <a href="./SELFHOST.md">Self-Host guide</a>
  •
  <a href="https://github.com/Humaner-inc/Humaner/issues">Issues</a>
</p>

<p align="center">
  <a href="./CHANGELOG.md"><img alt="version" src="https://img.shields.io/github/package-json/v/Humaner-inc/Humaner?label=version&color=f85919" /></a>
  <a href="https://github.com/Humaner-inc/Humaner/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Humaner-inc/Humaner/ci.yml?branch=main&label=CI" /></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/badge/license-AGPL--3.0-blue" /></a>
  <a href="https://github.com/Humaner-inc/Humaner/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/Humaner-inc/Humaner?logo=github&label=Stars" /></a>
  <a href="https://docs.humaner.io/oss/api"><img alt="MCP ready" src="https://img.shields.io/badge/MCP-ready-f85919" /></a>
  <a href="./SELFHOST.md"><img alt="Docker Compose" src="https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white" /></a>
  <img alt="PostgreSQL 16+" src="https://img.shields.io/badge/PostgreSQL-16%2B-336791?logo=postgresql&logoColor=white" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
</p>

![hero](github.png)

## About

Humaner Self-Host is an IMAP mailbox you run yourself: shared inbox, attachments, tasks, in-app calendar, resources, extra workspaces. Login is email or Google.

Point your own agent to run boring tasks for you, send, draft, book.. [MCP](https://docs.humaner.io/oss/api).

## Features

**Inbox** | IMAP/SMTP providers, aliases, attachments. Sync with the idle worker.

**Tasks & calendar** | sit beside the mailbox to manage your ops.

**Resources** | URLs, PDFs, text for _your_ agent to embed.

**API keys & MCP** | mailbox, tasks, calendar, resources. Org-scoped keys.

**Workspaces** | extra workspaces in a snap.

---

## Get started

A→Z: [`SELFHOST.md`](./SELFHOST.md)

```bash
git clone https://github.com/Humaner-inc/humaner.git
cd humaner
pnpm install
cp apps/dashboard/.env.example apps/dashboard/.env.local
# NEXT_PUBLIC_DEPLOYMENT_MODE=oss, DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL
pnpm --filter @humaner/dashboard exec prisma migrate deploy
pnpm --filter @humaner/dashboard dev
```

Open [http://localhost:3001](http://localhost:3001) → Inbox. Connect IMAP, then keep mail syncing:

```bash
pnpm --filter @humaner/dashboard imap:idle
```

[Self-Host setup →](./SELFHOST.md) · [OSS docs →](https://docs.humaner.io/oss)

## Architecture

- Monorepo · pnpm · React · TypeScript · Next.js
- PostgreSQL 16+ (pgvector) · Prisma · Tailwind · shadcn/ui

**Host:** your Postgres, your dashboard (Docker, VM, etc.). SMTP/Resend for sign-up OTP.

**Optional:** `CLAUDE_API_KEY` or your own agent to automatize your inbox.

```
apps/
  dashboard/      → Self-Host app (port 3001)
packages/
  shared/         → plans, URLs, shared types
```

Questions → [docs.humaner.io](https://docs.humaner.io) (hosted, not in this repo).

## Self-Host vs Cloud

|              | Self-Host                             | Cloud (`app.humaner.io`)             |
| ------------ | ------------------------------------- | ------------------------------------ |
| Mailbox      | IMAP + idle worker                    | IMAP idle (Railway) + Gmail Pub/Sub  |
| Agent        | Yours, over MCP / API keys            | Companion                            |
| Calendar     | In-app                                | In-app + Google / Outlook / Calendly |
| Team         | Extra workspaces · Assigned           | Team dock, invites, Connect          |
| Not included | Companion, Desk, invoices, Hybrid RAG | —                                    |
| Billing      | None                                  | Polar                                |

Details: [`SELFHOST.md`](./SELFHOST.md)

## License

This project is licensed under the **[GNU Affero General Public License v3.0](./LICENSE)** (AGPL-3.0).

**Security:** responsible disclosure via [`SECURITY.md`](./SECURITY.md) · [humaner.io/security](https://humaner.io/security).
