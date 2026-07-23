# Collaborative mailbox

**Status:** Product spec (MVP: IMAP + Gmail; Microsoft later)  
**Related docs:** Desk Intelligence  
**Inspired by:** Collaborative team inboxes such as [Missive](https://missiveapp.com/) — shared visibility, assignment, and behind-the-scenes collaboration — extended with Humaner’s AI agent layer.

---

## Positioning

**Humaner is the customer support layer for the AI era.**

Organizations already run support on email aliases. Humaner brings that mail into the same workspace as agents and desk: assign teammates to aliases, keep thread context, and let the org agent draft responses or suggest issue solving — without changing how customers write in.

**Inbox is optional.** Orgs are never forced to connect mail. Agents, widget, and Desk keep working with zero mailbox connections.

---

## MVP providers

1. **IMAP + SMTP** — custom domains (Zoho, OVH, Fastmail, cPanel, …)
2. **Gmail / Google Workspace** — OAuth

**Later:** Microsoft 365 / Outlook (same schema).

### Plans

| Plan     | Aliases |
| -------- | ------- |
| Classic  | **1**   |
| Refined  | **3**   |
| Frontier | **10**  |
| Humaner  | **10**  |

---

## Simplest connect flow

1. Email + password (SMTP same as IMAP by default; host presets from domain)
2. Declare aliases under the plan cap
3. Assign teammates (optional step; can finish later)

---

## Non-goals (MVP)

- Replacing every personal inbox (focus is **org support aliases**)
- Fully autonomous send without human confirmation
- Microsoft 365 OAuth (follow-on)
- Forcing Inbox in onboarding
