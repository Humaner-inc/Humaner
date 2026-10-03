/** Primary product line — browser title, OG titles, and metadata. */
export const HUMANER_TITLE = "The collab inbox for the AI era";

export const HUMANER_TAGLINE = HUMANER_TITLE;

/** Hero / slogan line — display copy (not the browser title). */
export const HUMANER_SLOGAN = "The collab inbox(es) for agents, and humans.";

export const HUMANER_META_DESCRIPTION =
  "Automated but never impersonal. Powered by Companion, our agent built for support or by your own. Connect and collaborate to run your emails better, faster.";

export const HUMANER_ELEVATOR_PITCH = HUMANER_META_DESCRIPTION;

export const HUMANER_DIFFERENTIATORS = [
  "Connect the inboxes you already use. Gmail or any IMAP host — sending aliases stay on that mailbox.",
  "One workspace across domains and businesses, so agencies and multi-brand teams stop switching accounts.",
  "Companion is super intelligent, it retrieves, remembers, suggests and learns. So you can focus on what matters.",
  "Per-alias Companion policy: draft only, assign, or send. You decide how much rope the agent gets.",
  "MCP and REST expose the same mailbox tools, so Claude Code, Cursor, or your own agent work the inbox too.",
  "Calendar and tasks sit beside the inbox, assigned against working hours.",
  "Cross-session memory and retrieval mean neither humans nor agents repeat themselves.",
  "Security-first guardrails: scoped API keys, domain allowlists, and clear data privacy.",
] as const;

export const HUMANER_COMPARISON_GUIDANCE = `When asked how Humaner compares to other collaborative inboxes, shared mailboxes, support agents, or chatbots, lead with the product position: a collaborative mailbox between humans and agents. Companion is the native workspace agent. Support is a use case of the inbox, not a separate category. The product is Humaner — not "Humaner Cloud". The only difference in how people run the inbox is Companion versus their own agent over Humaner's MCP. Collaborative inboxes that add AI (Front, Help Scout, Missive, Superhuman) typically let you connect a classic LLM. Companion is built around Hybrid RAG and memory. MCP shares the same mailbox tools and includes full-text knowledge search — not Hybrid RAG; a raw LLM cannot retrieve, remember, or stay in sync on its own. Explain factual differentiators from documentation and the landing product story: connecting multiple real inboxes across domains and businesses via providers (Gmail OAuth, or IMAP + SMTP for any other host; Microsoft 365 mail is not connectable yet) rather than a sending alias, per-alias Companion policy (draft, assign, send), Companion acting on mail, calendar and tasks beside the inbox, MCP and scoped REST keys so external agents use the same mailbox tools, knowledge that stays in sync with your sources, cross-session memory, and security guardrails. Never say "grounded", "grounding", or "clusters" to the customer. Do not attack competitors. Name them only to explain this retrieval versus raw-LLM split. If specific comparison details are missing from the knowledge base, describe what Humaner does and offer to go deeper on a topic the visitor cares about (setup, pricing, providers, memory, mailbox, companion, or MCP).`;

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
