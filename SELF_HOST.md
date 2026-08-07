# Humaner Self-Host — Customer Support Starter Kit

Deploy a white-labelled support kit: **BYO agent** (your prompt + skillz + knowledge), **Helpdesk** (with tickets handoff), and **team / org management**.

Not included: Humaner Intelligence, Agent Desk, training loops, runbooks, collaborative Inboxes, live chat, Polar billing.

---

## A-to-Z: From clone to a workable support workspace

### 1. Clone and install

```bash
git clone https://github.com/Humaner-inc/humaner.git
cd humaner
pnpm install
```

### 2. Database — PostgreSQL 16+ with pgvector

```bash
sudo -u postgres psql
CREATE USER humaner WITH PASSWORD 'password' SUPERUSER;
CREATE DATABASE humaner OWNER humaner;
\c humaner
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 3. Environment — copy and fill

```bash
cp apps/dashboard/.env.example apps/dashboard/.env.local
```

Required variables:

```bash
NEXT_PUBLIC_DEPLOYMENT_MODE=oss
DATABASE_URL=postgresql://humaner:password@localhost:5432/humaner
DIRECT_URL=postgresql://humaner:password@localhost:5432/humaner
AUTH_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Email (SMTP or Resend)

Email is **required** for credentials sign-up — the verification OTP is delivered by mail.

```bash
EMAIL_SENDER="Acme <onboarding@yourdomain.com>"
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

Gmail: use an [app-specific password](https://support.google.com/accounts/answer/185833), not your normal login.

**No inbox yet?** In `development`, the server prints the OTP to the terminal:

```text
[auth] Email verification for you@example.com
       OTP:  AB12CD
       Link: http://localhost:3001/auth/verify-email/request/...
```

For Docker / non-development runs, set `SELF_HOST_LOG_VERIFICATION=true`. Never leave it on in production.

### 5. LLM key — BYO inference

```bash
ANTHROPIC_API_KEY=sk-ant-...   # or OPENAI_API_KEY=sk-...
```

The starter agent uses whichever key is set for chat inference and handoff summarization.

### 6. Knowledge base (optional)

Drop markdown files into `data/knowledge/`:

```bash
mkdir -p data/knowledge
npx @humaner/into-markdown https://yoursite.com > data/knowledge/site.md
```

The agent is grounded on these files — answers only from what it can find, otherwise offers to connect with the team.

### 7. Migrate and start

```bash
pnpm --filter @humaner/dashboard exec prisma migrate deploy
pnpm --filter @humaner/dashboard dev
```

Open http://localhost:3001.

### 8. Sign up and verify

1. Navigate to `/auth/sign-up` → Create your account
2. Enter the 6-character OTP from email (or terminal — see step 4)
3. You land on onboarding

**Skip the OTP entirely?** Mark verified in the DB:

```sql
UPDATE "User"
SET "emailVerified" = NOW()
WHERE email = 'you@example.com';
```

Then sign in at `/auth/login`.

### 9. Onboarding

The OSS onboarding is a short kit setup (not the Humaner Cloud wizard):

1. **Website** — your company URL
2. **Business** — name, industry, company size (no docs URL crawl)
3. **Invite team** — or skip if solo
4. **Agent prompt** — required Custom-style system prompt (same field as Humaner Cloud Custom). Industry skillz + `data/knowledge/` are appended at reply time; they do not replace your prompt.
5. **Launch** — accept operator responsibilities; Helpdesk is enabled by default

Skipped on purpose: Polar plans, target audience, paid personas, Cloud tone presets, data-improvement telemetry.

### 10. Create agent → copy Agent ID

After onboarding, go to **Dashboard → Agents → your agent → Integrations**. Copy the public **Agent ID** (`YOUR_AGENT_PUBLIC_ID`). This is the only value end-users paste into embeds.

### 11. Allowlist domains

**Widget settings → Allowed domains.** Add the hostname of the site embedding the widget. Leave empty only for local testing.

### 12. Embed the widget on your site

The customer site only needs the public Agent ID and your dashboard origin. No secret keys in the browser.

**HTML (before `</body>`):**

```html
<script
  src="https://yourwebsite.com/widget.js"
  data-agent="YOUR_AGENT_PUBLIC_ID"
  data-color="#e1ccaf"
  data-position="bottom-right"
  async
></script>
```

Use `data-agent`, not `data-agent-id`.

**React:**

```bash
npm install @humaner/react
```

```tsx
import { HumanerChat } from "@humaner/react";

export default function SupportPage() {
  return (
    <HumanerChat
      agentId="YOUR_AGENT_PUBLIC_ID"
      baseUrl="https://yourwebsite.com"
      position="bottom-right"
    />
  );
}
```

| Prop                                              | Notes                                          |
| ------------------------------------------------- | ---------------------------------------------- |
| `agentId`                                         | Required. Public Agent ID.                     |
| `baseUrl`                                         | Required for Self-Host. Your dashboard origin. |
| `position` / `color` / `greeting` / `defaultOpen` | Optional UI props                              |

**Hosted link:**

```
https://yourwebsite.com/widget/YOUR_AGENT_PUBLIC_ID?open=1
```

### 13. REST API (headless)

Create an org API key in the dashboard. Keep it server-side.

```bash
curl -N -X POST https://yourwebsite.com/api/v1/chat \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "YOUR_AGENT_PUBLIC_ID",
    "message": "Where is my order?",
    "sessionId": "sess_abc123"
  }'
```

Chat streams SSE. On the final event, if `escalate: true`, a Helpdesk ticket is created with the transcript.

---

## Quick start (Docker)

```bash
export AUTH_SECRET="$(openssl rand -base64 32)"
export ANTHROPIC_API_KEY="sk-ant-..."   # or OPENAI_API_KEY
# Also export EMAIL_* (see step 4) or SELF_HOST_LOG_VERIFICATION=true

# Optional knowledge
# npx @humaner/into-markdown https://yoursite.com > data/knowledge/site.md

docker compose up --build
```

Open http://localhost:3001 → follow steps 8–12.

---

## Responsibility split

| Layer        | Your job                                                     | Dashboard job                                        |
| ------------ | ------------------------------------------------------------ | ---------------------------------------------------- |
| Agent prompt | Write the system prompt in onboarding or agent settings      | Wraps it with industry skillz, knowledge, and safety |
| Handoff      | Agent emits `escalate: true` when a human should take over   | Creates Helpdesk ticket with transcript + summary    |
| Helpdesk     | Staff the queue and reply to tickets                         | Assignment, replies, audit trail                     |
| Organization | —                                                            | Workspaces, roles, access control                    |
| Integrations | Point `baseUrl` / `widget.js` at your origin; paste Agent ID | Embed script, SDK, REST contracts                    |

## What you configure

| Setting             | Where                                                     |
| ------------------- | --------------------------------------------------------- |
| Brand / colors      | `apps/dashboard/brand.config.ts` (OSS → Acme)             |
| LLM API key         | `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`                   |
| Email delivery      | `EMAIL_*` in `.env.local`                                 |
| Agent system prompt | Onboarding → Agent prompt, or Dashboard → Agent → Persona |
| Industry behavior   | Agent onboarding (`@humaner/customer-support-skillz`)     |
| Knowledge           | `data/knowledge/*.md`                                     |
| Support email       | Helpdesk settings (async follow-up)                       |
| Team                | Organization → Members / invitations                      |

## Handoff and Helpdesk

When your agent can't resolve an issue, it emits `##HANDOFF##` on the last line. The dashboard creates a Helpdesk ticket with the full transcript and a summary generated by your BYO LLM.

SSE final event when escalating:

```json
{
  "delta": "",
  "done": true,
  "escalate": true,
  "handoff": {
    "humanDesk": true,
    "urgency": "high",
    "conversationSummary": "Customer cannot access account after password reset."
  }
}
```

Headless path: `POST /api/v1/handoff/ticket` with Agent ID + summary + urgency (Bearer API key). Urgency values: `low` | `medium` | `high` | `critical`.

## Google / GitHub OAuth (optional)

Configure OAuth apps with callback URLs:

```text
http://localhost:3001/api/auth/callback/google
http://localhost:3001/api/auth/callback/github
```

Set the corresponding `AUTH_GOOGLE_*` / `AUTH_GITHUB_*` env vars.

## Security checklist

| Check                               | Why                                                                 |
| ----------------------------------- | ------------------------------------------------------------------- |
| Domain allowlist                    | Stops other sites from embedding your Agent ID                      |
| Public Agent ID only in the browser | API keys stay on the server                                         |
| Org-scoped keys                     | A key only touches one organization's data                          |
| Hashed visitor IDs                  | Identify without sending raw PII as the id                          |
| Own the DB                          | Messages and tickets live in your Postgres; set retention as needed |

Report vulnerabilities to dev@humaner.io. Do not file public issues for exploitable findings.

## Verification checklist

1. DB migrated + email (or console OTP) working
2. Sign up → verify → complete **OSS onboarding** (no Polar popup)
3. Custom agent prompt saved and visible in agent settings
4. Nav shows Helpdesk only (no Inbox / Agent Desk / Clusters)
5. Ask about content in `data/knowledge/` → grounded answer
6. Force handoff (ask for a human) → ticket in Helpdesk
7. Widget loads from your origin with agent ID
8. Invite a teammate → member appears under Organization

## Packages

- [`@humaner/customer-support-skillz`](https://github.com/Humaner-inc/customer-support-skillz) — industry behavior
- [`@humaner/into-markdown`](https://github.com/Humaner-inc/into-markdown) — crawl site → `.md`
- [`@humaner/react`](./packages/react) — widget SDK

## Deep links

- [Self-hosting quickstart](https://docs.humaner.io/oss)
- [Agent brief (Markdown)](https://docs.humaner.io/oss/agent-brief) — copy-paste instructions for an AI coding agent
- [Self-hosting vs Cloud](https://docs.humaner.io/contributing/open-source-vs-cloud)
- [Widget integration](https://docs.humaner.io/oss/integrations/widget)
- [React SDK](https://docs.humaner.io/oss/integrations/react)
- [API reference](https://docs.humaner.io/api-reference)
