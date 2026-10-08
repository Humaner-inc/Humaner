# Contributing to Humaner Self-Host

Humaner Self-Host is the open mailbox kit behind Humaner: IMAP inboxes, tasks, calendar, resources, API keys and MCP.

Questions that are not about the code belong at [docs.humaner.io](https://docs.humaner.io). Security problems go through [`SECURITY.md`](./SECURITY.md).

## Run it locally

Follow [`SELFHOST.md`](./SELFHOST.md) end to end or for the shorter version:

```bash
pnpm install
cp apps/dashboard/.env.example apps/dashboard/.env.local
# fill NEXT_PUBLIC_DEPLOYMENT_MODE=oss, DATABASE_URL, DIRECT_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL
pnpm --filter @humaner/dashboard exec prisma migrate deploy
pnpm --filter @humaner/dashboard dev            # http://localhost:3001
pnpm --filter @humaner/dashboard imap:idle      # live mail
```

Set `SELF_HOST_LOG_VERIFICATION=true` locally to print sign-up codes to the console. Never enable it on a deployment that serves real users.

## Repository layout

```
apps/
  dashboard/      Next.js app: inbox, tasks, calendar, resources, settings, API and MCP routes
packages/
  shared/         URLs, plans, shared types
```

Inside `apps/dashboard`: `app/` routes, `actions/` server actions, `data/` server reads, `lib/` domain logic, `components/` UI, `schemas/` Zod schemas, `prisma/` schema and migrations, `tests/` Vitest suites.

## Before you open anything

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

All four run in CI, together with `pnpm audit --audit-level high` and a production build.

## Conventions

- TypeScript strict, no `any` without a comment explaining why.
- Validate every server action and route input with Zod (`schemas/`).
- Every query on tenant data must be scoped by `organizationId`. Use the existing helpers in `lib/auth` and `lib/db/tenant-context.ts`.
- Never log mail content, addresses, credentials or API keys.
- Credentials and tokens are stored through `lib/security/sensitive-fields.ts`, never in clear text.
- Add a test for logic you change. UI-only changes need a screenshot in the issue.
- Match the surrounding code: naming, comment density, formatting (Prettier is enforced by a pre-commit hook).

## Reporting bugs and proposing changes

1. Search the existing issues first.
2. Open an issue with the version or commit, your deployment (Docker, VM, local), steps to reproduce and the log output.
3. For a patch, comment on the issue before writing it so we can agree on the approach.

### How patches land

This repository is published from Humaner's internal monorepo, history included. Pull requests are reviewed here, then applied upstream with your authorship preserved, and they show up in this repository on the next release. Because of that expect a maintainer message when it's done.

## Releases

Versions follow [Semantic Versioning](https://semver.org). Notable changes are listed in [`CHANGELOG.md`](./CHANGELOG.md).

## License

By contributing you agree that your work is licensed under the [GNU Affero General Public License v3.0](./LICENSE).
