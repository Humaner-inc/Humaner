/** Primary product line — browser title, OG titles, hero, and positioning. */
export const HUMANER_TITLE = "Collaborative mailbox between Humans and Agents.";

export const HUMANER_TAGLINE = HUMANER_TITLE;

export const HUMANER_META_DESCRIPTION =
  "Connect every inbox you own — any domain, any business — into one collaborative mailbox. Companion and MCP draft, triage, and act on mail beside your team.";

export const HUMANER_ELEVATOR_PITCH = HUMANER_META_DESCRIPTION;

export const HUMANER_DIFFERENTIATORS = [
  "Connect the inboxes you already use. Gmail, Microsoft, or any IMAP host — sending aliases stay on that mailbox.",
  "One workspace across domains and businesses, so agencies and multi-brand teams stop switching accounts.",
  "Companion is the native workspace agent — it drafts, triages, and acts on mail with you, never behind your back.",
  "Per-alias Companion policy: draft only, assign, or send. You decide how much rope the agent gets.",
  "MCP and REST expose the same mailbox tools, so Claude Code, Cursor, or your own agent work the inbox too.",
  "Calendar and tasks sit beside the inbox, assigned against working hours.",
  "Cross-session memory and retrieval mean neither humans nor agents repeat themselves.",
  "Security-first guardrails: scoped API keys, domain allowlists, and clear data privacy.",
] as const;

export const HUMANER_COMPARISON_GUIDANCE = `When asked how Humaner compares to other collaborative inboxes, shared mailboxes, support agents, or chatbots, lead with the product position: a collaborative mailbox between humans and agents. Companion is the native workspace agent. Support is a use case of the inbox, not a separate category. Explain factual differentiators from documentation and the landing product story: connecting multiple real inboxes across domains and businesses via providers (Gmail, Microsoft, IMAP) rather than a sending alias, per-alias Companion policy (draft, assign, send), Companion acting on mail, calendar and tasks beside the inbox, MCP and scoped REST keys so external agents use the same mailbox tools, knowledge that stays in sync with your sources, cross-session memory, and security guardrails. Never say "grounded", "grounding", or "clusters" to the customer. Do not attack competitors by name. If specific comparison details are missing from the knowledge base, describe what Humaner does and offer to go deeper on a topic the visitor cares about (setup, pricing, providers, memory, mailbox, companion, MCP, or open source vs cloud).`;

export const HUMANER_AVOID_JARGON = [
  "integration layer",
  "source-available platform",
  "organization system",
  "Desk Center",
  "grounded",
  "grounding",
  "clusters",
  "cluster",
] as const;
