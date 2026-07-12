/**
 * Canonical Humaner product language for docs, README, and agent knowledge.
 * Prefer outcome-led copy over internal architecture jargon.
 */

export const HUMANER_TAGLINE =
  "Customer support agents that answer from your docs, remember context, and hand off to your team when it matters.";

export const HUMANER_ELEVATOR_PITCH = `Humaner helps companies deploy AI support agents that stay grounded in their own knowledge, adapt to their industry, and escalate to human desk workflows when the agent cannot resolve an issue. You can embed a widget or React component in minutes, connect your documentation and live business data, and route frustrated customers to your team with full conversation context.`;

export const HUMANER_DIFFERENTIATORS = [
  "Answers are grounded in your knowledge base and live data, not generic web knowledge.",
  "Industry-ready guardrails and training reduce off-topic or unsafe replies before go-live.",
  "Desk handoff keeps ticket context, urgency, and conversation history for your team.",
  "Widget, Link, API, and React surfaces share the same agent configuration.",
  "Self-host the platform or use Humaner Cloud for managed agent and desk intelligence.",
] as const;

export const HUMANER_COMPARISON_GUIDANCE = `When asked how Humaner compares to other support agents or chatbots, explain factual differentiators from documentation: grounded retrieval from the customer's own sources, vertical guardrails, memory and live data on paid plans, and integrated desk handoff. Do not refuse comparison questions. Do not attack competitors by name. If specific comparison details are missing from the knowledge base, describe what Humaner does and offer to go deeper on a topic the visitor cares about (setup, pricing, knowledge ingestion, handoff, or open source vs cloud).`;

export const HUMANER_AVOID_JARGON = [
  "integration layer",
  "source-available platform",
  "organization system",
  "Desk Center",
  "Agent Intelligence",
  "Desk Intelligence",
] as const;
