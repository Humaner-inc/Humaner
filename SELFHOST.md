# Humaner Self-Host | Mailbox kit

Self-host your own mailbox for your business(es): **IMAP inbox**, **tasks**, **in-app calendar**, **resources** , **API keys**, and even **MCP**. Login is through **email or Google**.

### 1. Clone and install

```bash
git clone https://github.com/Humaner-inc/humaner.git
cd humaner
pnpm install
```

### 2. Database — PostgreSQL 16+ with pgvector

User and database names are yours (e.g. `acme`).

```bash
sudo -u postgres psql
CREATE USER johndoe WITH PASSWORD 'password' SUPERUSER;
CREATE DATABASE acme OWNER johndoe;
\c acme
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 3. Environment | copy and fill your own

```bash
cp apps/dashboard/.env.example apps/dashboard/.env.local
```

Required variables:

```bash
NEXT_PUBLIC_DEPLOYMENT_MODE=oss   # mandatory to deploy the self-hosting framework
DATABASE_URL=postgresql://acme:password@localhost:5432/acme
DIRECT_URL=postgresql://acme:password@localhost:5432/acme
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

`NEXT_PUBLIC_DEPLOYMENT_MODE` is read at **build time**, it selects the Self-Host build. (Changing it later requires a rebuild.)

`AUTH_SECRET` signs sessions, mailbox credentials, and the sign-up verification OTP. Set it before first boot.
Set `AUTH_TRUST_HOST=true` when the dashboard runs behind a reverse proxy or in Docker so auth callback URLs resolve to your public origin.

### 4. Email (SMTP or Resend)

Email is **required** for credentials sign-up — the verification OTP is delivered by mail.

```bash
EMAIL_SENDER="Humaner <onboarding@yourdomain.com>"
EMAIL_MAILER=NodeMailer   # or Resend

# NodeMailer (e.g. Gmail)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=you@gmail.com
EMAIL_SERVER_PASS=your-app-specific-password

# Resend (alternative)
# EMAIL_MAILER=Resend
# EMAIL_RESEND_API_KEY=re_...
```

**No inbox yet?** In `development`, the server can deliver the OTP to the terminal:

```text
[auth] Email verification for you@example.com
       OTP:  AB12CD
       Link: http://localhost:3001/auth/verify-email/request/...
```

For Docker / non-development runs, set `SELF_HOST_LOG_VERIFICATION=true` only while wiring SMTP. Never leave it on for real users.

### 5. LLM keys.

Self-Host does not run a hosted agent. Set a Claude key if you use MCP tools that draft mail replies, or your own agent that calls the workspace API:

```bash
CLAUDE_API_KEY=sk-ant-...   # ANTHROPIC_API_KEY is accepted as an alias
```

Resources on Self-Host store files and URLs for **your** agent to embed

### 6. Resources — files for your agent

Add URLs, PDFs, or text in **Resources** then point your own agent at the stored sources>

### 7. Migrate and start

```bash
pnpm --filter @humaner/dashboard exec prisma migrate deploy
pnpm --filter @humaner/dashboard dev
```

Open http://localhost:3001. You land on **Inbox**.

### 8. Sign up and verify

1. Navigate to `/auth/sign-up` → Create your account (**email** or **Google**)
2. Enter the 6-digit OTP from email (or terminal — see step 4)
3. Enjoy the Inbox(ing)

**Skip the OTP entirely?** Mark verified in the DB:

```sql
UPDATE "User"
SET "emailVerified" = NOW()
WHERE email = 'you@example.com';
```

Then sign in at `/auth/login`.

### 9. Connect a mailbox (IMAP)

Workspace settings → Inbox. Pick a provider with IMAP (or Custom IMAP) and save credentials.

IMAP credentials are stored encrypted (`AUTH_SECRET`).

### 10. For mail syncing: IMAP IDLE worker

Run the idle worker next to the dashboard:

```bash
pnpm --filter @humaner/dashboard imap:idle
```

Production (no `.env.local` overlay):

```bash
pnpm --filter @humaner/dashboard imap:idle:prod
```

Keep this process running. It holds IMAP IDLE on connected mailboxes and pulls new mail as it arrives.

### 11. API keys and MCP

Create an org API key in the dashboard. Keep it server-side.

Workspace REST:

```bash
curl -X POST https://yourwebsite.com/api/v1/mail \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{ "tool": "list_mail_threads", "unreadOnly": true }'
```

### 12. Extra workspaces

Create additional workspaces from the switcher. There is no team or assignment setup, it's up to you.

---

## Quick start (Docker)

```bash
export AUTH_SECRET="$(openssl rand -base64 32)"
export ANTHROPIC_API_KEY="sk-ant-..."
# Also export EMAIL_* or SELF_HOST_LOG_VERIFICATION=true

docker compose up --build
```

Compose starts `pgvector/pgvector:pg16` and the dashboard together, and the entrypoint rejects a missing or placeholder `AUTH_SECRET`.

Open http://localhost:3001 → follow steps 8–11. Run `imap:idle` in a second process (or add it to your compose file) so mail keeps syncing.

---

## What you configure

| Setting          | Where                                             |
| ---------------- | ------------------------------------------------- |
| Brand / colors   | `apps/dashboard/brand.config.ts`                  |
| LLM API key      | `ANTHROPIC_API_KEY` (optional, for draft helpers) |
| Email delivery   | `EMAIL_*` in `.env.local`                         |
| Mailbox          | Workspace settings → Inbox (IMAP/SMTP)            |
| Mail sync        | `pnpm --filter @humaner/dashboard imap:idle`      |
| Resources        | Dashboard → Resources                             |
| API keys / MCP   | Workspace settings                                |
| Extra workspaces | Workspace switcher                                |

## Google OAuth (optional)

Dashboard login can use Google. Configure an OAuth app with:

```text
http://localhost:3001/api/auth/callback/google
```

Set `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET`. GitHub login is Cloud-only.

## Security checklist

| Check                          | Why                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Strong `AUTH_SECRET`           | Docker rejects placeholder secrets; generate with `openssl rand -base64 32`                |
| Encrypted IMAP credentials     | Mailbox passwords are encrypted with `AUTH_SECRET`                                         |
| Org-scoped keys                | A key only touches one organization's data                                                 |
| Trusted reverse proxy          | Rate limits use `X-Forwarded-For` / `X-Real-IP` — strip client-spoofed values at the proxy |
| No OTP console logging in prod | Disable `SELF_HOST_LOG_VERIFICATION` once email works                                      |
| Own the DB                     | Mail, tasks, and calendar live in your Postgres                                            |

Report vulnerabilities to dev@humaner.io. Do not file public issues for exploitable findings.

## Verification checklist

1. DB migrated + email (or console OTP) working
2. Sign up with email or Google
3. Connect IMAP mailbox in Workspace settings → Inbox
4. IMAP idle worker running — new mail appears in Inbox
5. Create a task and an in-app calendar event
6. Add a resource file
7. Create an API key and list threads over MCP or `/api/v1/mail`

## Packages

- [`@humaner/react`](./packages/react) — widget SDK (Cloud hosted agent; not used on Self-Host mailbox)

## Deep links

- [Quickstart](https://docs.humaner.io/oss/quickstart)
- [Self-hosting vs Cloud](https://docs.humaner.io/contributing/open-source-vs-cloud)
- [API (Self-hosting)](https://docs.humaner.io/oss/api)
- [API reference](https://docs.humaner.io/reference)
