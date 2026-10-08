# @humaner/dashboard

The Humaner Self-Host app: IMAP mailbox, tasks, calendar, resources, API keys and MCP, workspaces.

## Local development

From the repository root:

```bash
pnpm install
cp apps/dashboard/.env.example apps/dashboard/.env.local
pnpm --filter @humaner/dashboard exec prisma migrate deploy
pnpm --filter @humaner/dashboard dev
```

Open http://localhost:3001, then keep mail syncing with `pnpm --filter @humaner/dashboard imap:idle`.

Full setup: [`SELFHOST.md`](../../SELFHOST.md) · Contributing: [`CONTRIBUTING.md`](../../CONTRIBUTING.md)

## Layout

| Folder        | Contents                                                          |
| ------------- | ----------------------------------------------------------------- |
| `app/`        | Routes: dashboard, auth, MCP and REST API (`api/mcp`, `api/v1/*`) |
| `actions/`    | Server actions                                                    |
| `data/`       | Server-side reads                                                 |
| `lib/`        | Domain logic: auth, inbox, calendar, security                     |
| `components/` | UI                                                                |
| `schemas/`    | Zod input schemas                                                 |
| `prisma/`     | Schema and migrations                                             |
| `scripts/`    | IMAP IDLE worker and tooling                                      |
| `tests/`      | Vitest suites                                                     |
