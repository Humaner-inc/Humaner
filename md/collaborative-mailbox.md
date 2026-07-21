# Collaborative mailbox

**Status:** Product spec (MVP: Gmail + Microsoft)  
**Related docs:** Desk Intelligence  
**Inspired by:** Collaborative team inboxes such as [Missive](https://missiveapp.com/) — shared visibility, assignment, and behind-the-scenes collaboration — extended with Humaner’s AI agent layer.

---

## Positioning

**Humaner is the customer support layer for the AI era.**

Organizations already run support on email aliases. Humaner brings that mail into the same workspace as agents and desk: assign teammates to aliases, keep thread context, and let the org agent draft responses or suggest issue solving — without changing how customers write in.

---

## Problem

Email was not designed for teams:

- Shared aliases create “who’s on this?” ambiguity.
- Forwarding and CC threads lose ownership and history.
- Chat widgets and helpdesks often sit beside mail instead of unifying it.
- AI sidebars that ignore inbox workflow do not help the people answering support@.

---

## Solution

**Collaborative mailbox** — manage company support mailing inside Humaner.

| Capability        | Description                                                      |
| ----------------- | ---------------------------------------------------------------- |
| Shared aliases    | Connect org support addresses into Humaner                       |
| Assignment        | Map team members to mail aliases                                 |
| Collaboration     | See status and context without customers seeing internal chatter |
| Agent in the loop | Draft replies or suggest solving paths from grounded knowledge   |
| Desk continuity   | Same org, agents, and escalation model as the rest of Humaner    |

Customers still email the same addresses. Your team works the threads in Humaner.

---

## MVP scope

### Providers (MVP)

1. **Gmail / Google Workspace** — OAuth connect for organization support aliases
2. **Microsoft 365 / Outlook** — OAuth connect for organization support aliases

### Product behaviors (MVP)

- Organization-level mailbox connection (not personal-only inbox chaos)
- Assign one or more workspace members to each alias
- Inbound threads visible to assigned / authorized org members
- Humaner agent can **draft** a reply or **suggest** a resolution path
- Humans approve/edit/send — no silent auto-send to customers in MVP
- Alignment with Humandesk / desk tickets where a thread escalates

### Plans

Available on **Classic**, **Refined**, **Frontier**, and **Humaner** (not Free).

| Plan     | Aliases |
| -------- | ------- |
| Classic  | **1**   |
| Refined  | **3**   |
| Frontier | **10**  |
| Humaner  | **10**  |

Shown on the pricing explore-features table as **Collaborative mailbox** with those alias caps. Providers: Gmail and Microsoft.

---

## Post-MVP: IMAP

**IMAP (and related generic mail sync) ships after MVP.**

Rationale: OAuth providers cover most modern company mail with clearer security and sync semantics for the first release. IMAP unlocks self-hosted and long-tail hosts once the collaborative model is proven with Gmail and Microsoft.

### Later IMAP checklist (not MVP)

- [ ] IMAP account connect (host, port, TLS, credentials or app password)
- [ ] Alias / folder mapping into the collaborative mailbox
- [ ] Same assignment + agent draft model as Gmail/Microsoft
- [ ] Sync reliability, rate limits, and conflict handling
- [ ] Security review (secret storage, least privilege, audit)

Until IMAP lands, docs and pricing should only promise **Gmail** and **Microsoft**.

---

## User stories

1. As an org admin, I connect `support@company.com` via Google or Microsoft so mail lands in Humaner.
2. As an admin, I assign Alice and Bob to that alias so ownership is explicit.
3. As Alice, I open a thread, ask the agent for a draft grounded in our docs, edit it, and send.
4. As Bob, I see who is working the thread and pick up when Alice is away.
5. As the org, I escalate a hard mail into desk with context preserved.

---

## Non-goals (MVP)

- Replacing every personal inbox (focus is **org support aliases**)
- Fully autonomous send without human confirmation
- IMAP / generic providers
- Full Missive-style task/CRM suite outside Humaner’s support scope

---

## Messaging examples

**Short:** Shared support mail in Humaner — assign aliases, draft with your agent.

**Longer:** Connect Gmail or Microsoft support aliases, put teammates on the right mailbox, and let your Humaner agent draft or suggest replies. The customer support layer for the AI era.

---

## References

- Humaner docs: Desk → Collaborative mailbox
- Pricing: Integrations + Desk Intelligence feature rows; Refined / Frontier cards
