/**
 * Self-Host (OSS) twin of `plans.ts`.
 *
 * Cloud prices, Polar product keys, and volume quotes stay private. The public
 * kit only exposes the Self-Host capability matrix and the types the dashboard
 * still imports. josh renames this onto `plans.ts`.
 */

export type PlanTier = "free" | "classic";

export type LlmModelId = "claude-sonnet-5" | "claude-sonnet-4-5";

export type PlanFeature = {
  label: string;
  description?: string;
  included: boolean;
};

export type MemoryMode = "none" | "session" | "cross-session";

export type PersonalityAccess = "none" | "custom-only" | "all";

export type PlanCapabilities = {
  langCache: boolean;
  memory: MemoryMode;
  personalization: boolean;
  personalities: PersonalityAccess;
  contentGaps: boolean;
  autoTraining: boolean;
  humanDeskEmail: boolean;
  agentDesk: boolean;
  liveChat: boolean;
  apiAccess: boolean;
  liveData: boolean;
  removeWatermark: boolean;
  runbooks: boolean;
  copilot: boolean;
  hostedAgent: boolean;
  tasks: boolean;
  resources: boolean;
  mcp: boolean;
};

export const SELF_HOST_CAPABILITIES: PlanCapabilities = {
  langCache: false,
  memory: "none",
  personalization: false,
  personalities: "custom-only",
  contentGaps: false,
  autoTraining: false,
  humanDeskEmail: false,
  agentDesk: false,
  liveChat: false,
  apiAccess: true,
  liveData: false,
  removeWatermark: true,
  runbooks: false,
  copilot: false,
  hostedAgent: false,
  tasks: true,
  resources: true,
  mcp: true,
};

export type PlanCapabilityContext = {
  frontierBetaEnabled?: boolean | null;
};

export function getPlanCapabilities(
  _tier: string,
  _context?: PlanCapabilityContext,
): PlanCapabilities {
  return SELF_HOST_CAPABILITIES;
}

export function isCloudFreePlan(_tier: string): boolean {
  return false;
}

export type PlanDefinition = {
  tier: PlanTier;
  name: string;
  tagline: string;
  includedMessages: number;
  overagePerMessage: number | null;
  freeTrainingMessages: number;
  agents: number;
  members: number;
  mailboxAliases: number;
  model: LlmModelId;
  modelLabel: string;
  maxContextTokens: number;
  maxHistoryTurns: number;
  features: PlanFeature[];
  highlighted?: boolean;
};

export const INBOX_TRIAL_DAYS = 7;

/** Self-Host has no paid add-ons; shared code still imports the price constants. */
export const EXTRA_SEAT_PRICE_MONTHLY = 0;
export const EXTRA_SEAT_PRICE_YEARLY = 0;
export const EXTRA_INBOX_PRICE_MONTHLY = 0;
export const EXTRA_INBOX_PRICE_YEARLY = 0;

export const INBOX_MAX_KNOWLEDGE_SOURCES = 50;
export const INBOX_MAX_KNOWLEDGE_CHUNKS = 10_000;

const SONNET_5 = {
  id: "claude-sonnet-5" as const,
  label: "Sonnet 5",
  description: "Accurate, brand-aware responses with full knowledge backing",
};

const SONNET_45 = {
  id: "claude-sonnet-4-5" as const,
  label: "Sonnet 4.5",
  description: "Reliable fallback model",
};

export const LLM_MODELS = {
  SONNET_5,
  SONNET_45,
  /** @deprecated Use SONNET_5 */
  SONNET_46: SONNET_5,
  /** @deprecated Use SONNET_45 */
  HAIKU_45: SONNET_45,
} as const;

export const LLM_FALLBACK_CHAIN: LlmModelId[] = [LLM_MODELS.SONNET_45.id];

export const LLM_MODEL_FALLBACK_ID = LLM_MODELS.SONNET_45.id;

export const OPERATOR_OWNED_QUOTA_LABEL = "-";

export const UNLIMITED_AGENTS = 999;

export const SELF_HOST_PLAN: PlanDefinition = {
  tier: "free",
  name: "Self-Host",
  tagline: "Host your own mailbox.",
  includedMessages: 1_000_000,
  overagePerMessage: null,
  freeTrainingMessages: 1_000,
  agents: UNLIMITED_AGENTS,
  members: UNLIMITED_AGENTS,
  mailboxAliases: UNLIMITED_AGENTS,
  model: LLM_MODELS.SONNET_5.id,
  modelLabel: "Your model",
  maxContextTokens: 16_384,
  maxHistoryTurns: 12,
  features: [
    {
      label: "IMAP mailbox",
      description: "Connect any IMAP/SMTP provider. Sync with the idle worker.",
      included: true,
    },
    {
      label: "Inbox, tasks, calendar",
      description: "Shared mailbox UI, assignments, and an in-app calendar.",
      included: true,
    },
    {
      label: "Your LLM",
      description:
        "API keys and MCP for mailbox, tasks, calendar, and resources.",
      included: true,
    },
    {
      label: "Workspaces",
      description: "Multiple workspaces on one deployment.",
      included: true,
    },
    {
      label: "Resources",
      description: "Store files and URLs for your own agent to embed.",
      included: true,
    },
  ],
};

export function isSelfHostPricingPlan(plan: PlanDefinition): boolean {
  return plan.name === "Self-Host";
}

export function isOperatorOwnedQuotaPlan(_plan: PlanDefinition): boolean {
  return true;
}

export function formatPlanIncludedMessages(plan: PlanDefinition): string {
  if (isOperatorOwnedQuotaPlan(plan)) return OPERATOR_OWNED_QUOTA_LABEL;
  return formatMessages(plan.includedMessages);
}

export function formatPlanAgents(plan: PlanDefinition): string {
  if (isOperatorOwnedQuotaPlan(plan)) return OPERATOR_OWNED_QUOTA_LABEL;
  return formatAgents(plan.agents);
}

export function formatPlanMembers(plan: PlanDefinition): string {
  if (isSelfHostPricingPlan(plan)) return OPERATOR_OWNED_QUOTA_LABEL;
  return String(plan.members);
}

export function normalizePlanTier(tier: string): PlanTier {
  const normalized = tier.trim().toLowerCase();
  if (
    normalized === "refined" ||
    normalized === "grow" ||
    normalized === "native" ||
    normalized === "frontier" ||
    normalized === "byo" ||
    normalized === "humaner"
  ) {
    return "classic";
  }
  if (normalized === "free" || normalized === "classic") {
    return normalized;
  }
  return "free";
}

export function getPlanForTier(_tier: string): PlanDefinition {
  return SELF_HOST_PLAN;
}

export type PlanAddOns = {
  extraSeats?: number;
  extraMailboxes?: number;
};

export function getEffectivePlan(
  _tier: string,
  _includedMessages?: number | null,
  _addOns?: PlanAddOns,
): PlanDefinition {
  return SELF_HOST_PLAN;
}

export function getLlmModelLabel(modelId: LlmModelId): string {
  const match = Object.values(LLM_MODELS).find((model) => model.id === modelId);
  return match?.label ?? modelId;
}

export function formatAgents(count: number): string {
  if (count >= UNLIMITED_AGENTS) return "Unlimited";
  return String(count);
}

export function formatMessages(count: number): string {
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count % 1_000 === 0 ? 0 : 1)}k`;
  }
  return count.toLocaleString();
}

export function formatMailboxAliases(count: number): string | false {
  if (count <= 0) return false;
  return count === 1 ? "1 inbox" : `${count} inboxes`;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(price % 1 === 0 ? 0 : 2)}`;
}
