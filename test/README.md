# Widget embed test pages (local)

Temporary static pages for the four-vertical load-test setup in
`Docs/REAL_CONDITION_LOAD_TEST.md`. **Delete this entire `test/` folder**
when you are done.

## Setup

1. Run the dashboard locally (`pnpm dev:dashboard` → usually `http://localhost:3001`).
2. Create four agents in one workspace (Retail, SaaS, Wellness, Hospitality) and
   ingest real `/docs` per vertical.
3. For each agent: **Integrations → Widget** → add **allowed domains** for where
   you will open these pages (see below).
4. Copy config:

   ```bash
   cp test/widget-config.example.js test/widget-config.local.js
   ```

   Fill `baseUrl` and the four `agents.*` public IDs (same as
   `Docs/scripts/load-chat.config.json`).

## Open the pages

### Option A — separate origin (recommended, matches production embed)

Serve this folder on another port so the parent page is cross-origin from the
dashboard:

```bash
npx --yes serve test -l 4321
```

Open `http://localhost:4321/` and pick a vertical.

On **each** of the four agents, add allowed domain: `localhost` (or
`localhost:4321` if your dashboard UI accepts host with port).

### Option B — same origin as dashboard

Copy or symlink these HTML files under
`apps/dashboard/public/test/` and open
`http://localhost:3001/test/ecommerce.html` (etc.).

Allowed domain for each agent must include the **parent** embed origin
(`localhost` / `localhost:3001`).

## Files

| File                       | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `widget-config.example.js` | Template — copy to `widget-config.local.js` |
| `widget-config.local.js`   | Your IDs (gitignored)                       |
| `embed.js`                 | Injects `widget.js` from `baseUrl`          |
| `*.html`                   | One fake site per vertical                  |

REST load traffic should still use `Docs/scripts/load-chat-conversations.mjs`;
these pages are for widget UI, allowed-domain, and handoff smoke tests.
