/**
 * Canonical Humaner product language for docs, README, and agent knowledge.
 * Prefer outcome-led copy over internal architecture jargon.
 */

export const HUMANER_TAGLINE =
  "The customer support layer for the AI era — agents, collaborative mailbox, and desk in one place.";

export const HUMANER_ELEVATOR_PITCH = `Humaner is the customer support layer for the AI era. Deploy agents that answer from your docs, optionally manage your company's support mail as a collaborative mailbox (IMAP or Gmail), and escalate to human desk when it matters. Add in-product support with a widget, React component, or API. Connect support aliases, assign teammates, and let your org agent draft or suggest replies — without changing how customers reach you.`;

export const HUMANER_DIFFERENTIATORS = [
  "Answers are grounded in your knowledge base and live data, not generic web knowledge.",
  "Collaborative mailbox lets organizations run support aliases in Humaner — assign teammates, keep context, and draft with the agent (Gmail and Microsoft first).",
  "Industry-ready guardrails and training reduce off-topic or unsafe replies before go-live.",
  "Desk handoff keeps ticket context, urgency, and conversation history for your team.",
  "Widget, Link, API, React, and shared mail surfaces share the same agent configuration.",
  "Self-host the platform or use Humaner Cloud for managed agent and desk intelligence.",
] as const;

export const HUMANER_COMPARISON_GUIDANCE = `When asked how Humaner compares to other support agents, chatbots, or collaborative inboxes, explain factual differentiators from documentation: grounded retrieval from the customer's own sources, collaborative mailbox for org support aliases (Gmail and Microsoft first), vertical guardrails, memory on paid plans, and integrated desk handoff. Do not refuse comparison questions. Do not attack competitors by name. If specific comparison details are missing from the knowledge base, describe what Humaner does and offer to go deeper on a topic the visitor cares about (setup, pricing, knowledge ingestion, mailbox, handoff, or open source vs cloud).`;

export const HUMANER_AVOID_JARGON = [
  "integration layer",
  "source-available platform",
  "organization system",
  "Desk Center",
] as const;
