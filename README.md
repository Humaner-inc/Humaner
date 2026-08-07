<p align="center">
  <a href="https://humaner.io">Website</a>
  ·
  <a href="https://docs.humaner.io">Docs</a>
  ·
  <a href="https://docs.humaner.io/integrations/api">API</a>
  ·
  <a href="https://github.com/Humaner-inc">GitHub</a>
  ·
  <a href="https://humaner.io/security">Security</a>
</p>

<p align="center">
  <img src="apps/landing/public/app_dashboard.png" alt="All in one tool for customer support" width="800" />
</p>

---

There was a time when asking support to a company meant something, that's why we built Humaner, to scale care instead of indifference.

Humaner is your support layer to manage agents, helpdesk and inboxes all-in one tool:

- **Unique caracters** to suits brand identity and give the human feel people remember.
- **Cross-Session Memory** using metadata and visitoId to remembers customers problems/preferences across time.
- **Helpdesk** for escalations, ticketing and live support within your ORG.
- **Inboxes** to manage your mails and support within the same tool.
- **Training loop** across the help desk to learn from human behavior and content gaps.

### Self-Host vs Humaner Cloud

**Self-Host** is a free **customer-support starter kit**: white-labelled dashboard (default **Acme**), org/team, async **Helpdesk**, and a **starter agent** you configure with your own **Custom system prompt** (same idea as Humaner Cloud Custom) plus open Industry Skillz, markdown knowledge, and your LLM key. No Polar billing, no Cloud Intelligence IP.

**Humaner Cloud** (`app.humaner.io`) adds managed Agent Intelligence (Core Skillz, RAG, memory) and Desk Intelligence (Agent Desk, runbooks, clusters, live chat, Inbox).

```mermaid
flowchart TB
  SITE[Customer site / app]

  subgraph SH["Self-Host — this repo"]
    INT["Integration layer<br/>Widget · React SDK · REST API"]
    ORG["Organization<br/>multi-workspace · members · RBAC"]
    SA["Starter agent<br/>Your Custom prompt · Industry Skillz · markdown KB · BYO LLM"]
    HD["Helpdesk<br/>async tickets · urgency · assignees"]
  end

  subgraph HOSTED["Cloud — app.humaner.io"]
    HAI["Agent Intelligence<br/>Core Skillz · RAG · memory"]
    HDI["Desk Intelligence<br/>Agent Desk · runbooks · clusters · live chat"]
  end

  SITE --> INT
  INT --> SA
  SA --> HD
  INT -->|or Cloud| HAI
  HAI --> HD
  HD <-->|learning loop| HDI
  ORG --- HD
```

**Go from clone → workable support workspace:** follow the A→Z guide in [`SELF_HOST.md`](./SELF_HOST.md) (DB, SMTP, LLM key, sign-up, Custom agent prompt, Agent ID, widget embed, Helpdesk handoff).

For AI coding agents: paste [Self-hosting — Agent Brief](https://docs.humaner.io/oss/agent-brief).

[Self-Host setup →](./SELF_HOST.md) · [Agent brief →](https://docs.humaner.io/oss/agent-brief) · [Full docs →](https://docs.humaner.io) · [Strategy →](./Docs/SELF_HOST_PLAN.md)

### Built for developer integrations

- **Widget embed:** one-line script, domain allowlist, visitor identify for cross-session memory > [docs](https://docs.humaner.io/integrations/widget).
- **React SDK:** drop-in `<HumanerChat />` with the same auth model as the widget > [docs](https://docs.humaner.io/integrations/react) · [package](./packages/react).
- **REST API:** SSE chat stream, agent metadata, webhooks coming soon > [docs](https://docs.humaner.io/integrations/api).
- **Knowledge-backed agents:** pre-built intelligence across verticals and personalized knowledge through org docs and sites.
- **Human-in-the-loop:** escalate to Human Desk; auto-training from desk conversations on Frontier plan.

## Brand

| Token  | Hex       | Use                                                                         |
| ------ | --------- | --------------------------------------------------------------------------- |
| White  | `#fff8f2` | Primary light surface, cream type on dark                                   |
| Black  | `#070607` | Primary dark surface, page canvas                                           |
| Accent | `#e1ccaf` | Fracture highlight — links, emphasis, warm CTAs                             |
| Grey   | `#7b7b73` | Sleek fracture only — selective CTA / section fills (not a default surface) |
| Cobalt | `#0682de` | Documentation warnings, messages, and banners                               |

Grey exists to break rhythm inside the brand: use it sparingly on a few section CTAs or marks for chrome-like sleekness. Do not replace black, white, or accent as the base system.

## Pricing

- **Free:** 50 messages/mo · 1 agent · Corporate personality · no inboxes
- **Classic:** from $20/mo · 200–1k messages · Humaner v1.0 · inboxes · Human Desk · 2 agents · hard stop (no overage)
- **Frontier:** from $150/mo · 2k–5k messages · Humaner v2.0 · cross-session memory · API · training loop · unlimited agents · overage from $0.015/msg
- **Humaner:** custom · Humaner v3.0 · coming soon.

[Full pricing →](https://humaner.io/pricing)

## Roadmap, issues & feature requests

**Feature requests & bugs:** use the Feedback button in the dashboard sidebar (bottom left).

**Security vulnerabilities:** we appreciate responsible, private disclosure. See [SECURITY.md](./SECURITY.md) · [Security framework](./Docs/SECURITY_FRAMEWORK.md) (published on the public mirror).

### Humaner API & SDK

Integrate Humaner on your site, app, or backend in minutes:

| Surface              | Docs                                                                   | Source in repo                       |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| Widget embed         | [integrations/widget](https://docs.humaner.io/integrations/widget)     | `apps/dashboard/public/widget.js`    |
| React component      | [integrations/react](https://docs.humaner.io/integrations/react)       | [`packages/react`](./packages/react) |
| REST API (Frontier+) | [integrations/api](https://docs.humaner.io/integrations/api)           | `apps/dashboard/app/api/v1/`         |
| Webhooks             | [integrations/webhooks](https://docs.humaner.io/integrations/webhooks) | dashboard webhook handlers           |

**Quick embed:**

```html
<script
  src="https://app.humaner.io/widget.js"
  data-agent="YOUR_AGENT_PUBLIC_ID"
  async
></script>
```

**Quick React:**

```tsx
import { HumanerChat } from "@humaner/react";

<HumanerChat agentId="YOUR_AGENT_PUBLIC_ID" position="bottom-right" />;
```

```bash
npm install @humaner/react
```

## Local development

**Most integrators use the hosted API** — no clone required. See [docs](https://docs.humaner.io) to embed in minutes.

This repo is for team members, evaluators, and SDK contributors. See [DEVELOPMENT.md](./DEVELOPMENT.md) for what runs locally vs on Humaner's hosted runtime.

```
apps/
  landing/        → humaner.io        (port 3000)
  documentation/  → docs.humaner.io   (port 3004)
  dashboard/      → app.humaner.io    (port 3001)
packages/
  react/       → @humaner/react
  shared/      → plans, URLs, shared types
```

## Open-source strategy

Humaner follows a **partial open-source** model: ship a workable support kit operators can run; keep managed intelligence on Cloud:

| Self-Host (this repo)                                                | Humaner Cloud                                     |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| White-label dashboard (`NEXT_PUBLIC_DEPLOYMENT_MODE=oss`)            | Hosted `app.humaner.io` product                   |
| Custom system prompt + Industry Skillz + `data/knowledge/` + BYO LLM | Core Skillz, managed RAG, memory, personalization |
| Helpdesk (async handoff), org/team, Widget / React / API             | Agent Desk, runbooks, clusters, live chat, Inbox  |
| No Polar / plan gates                                                | Polar billing, message quotas, paid personas      |

Set `NEXT_PUBLIC_DEPLOYMENT_MODE=oss` so Cloud-only UI and Polar checkout stay off. Details: [Docs/OPEN_SOURCING.md](./Docs/OPEN_SOURCING.md) · [SELF_HOST.md](./SELF_HOST.md).

## Built with

Humaner is built on tools we trust — and several we're proud to share the ecosystem with:

- [Next.js](https://nextjs.org) — dashboard, landing, and widget
- [Anthropic](https://anthropic.com) — Claude models for agent chat (Haiku / Sonnet)
- [OpenAI](https://openai.com) — embeddings for knowledge search and RAG
- [Polar](https://polar.sh) — subscriptions and usage billing
- [Redis](https://redis.io) — LangCache, agent memory, and knowledge search (Redis Iris + Upstash)
- [Firecrawl](https://firecrawl.dev) — knowledge source ingestion (docs and sites)
- [Resend](https://resend.com) — transactional email
- [PostgreSQL](https://www.postgresql.org) — tenant data via Supabase

## License

Source-available under review — license file coming before the repo goes public. `@humaner/react` is [MIT](./packages/react/package.json).
