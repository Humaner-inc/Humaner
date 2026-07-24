/**
 * Canonical Humaner product language for docs, README, and agent knowledge.
 * Prefer outcome-led copy over internal architecture jargon.
 */

export const HUMANER_TAGLINE = "The customer support layer for developers.";

export const HUMANER_ELEVATOR_PITCH = `Humaner is the customer support layer designed for customer care and built for developers.`;

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
