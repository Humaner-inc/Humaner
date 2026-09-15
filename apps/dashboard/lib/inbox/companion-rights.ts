export const COMPANION_ACTIONS = ['DRAFT', 'ASSIGN', 'SEND'] as const;

export type CompanionAction = (typeof COMPANION_ACTIONS)[number];

export type CompanionAliasPolicy = CompanionAction;

export function isCompanionAction(value: string): value is CompanionAction {
  return value === 'DRAFT' || value === 'ASSIGN' || value === 'SEND';
}

export function normalizeCompanionActions(
  raw: Iterable<string> | null | undefined
): CompanionAction[] {
  const allowed = new Set<CompanionAction>();
  for (const value of raw ?? []) {
    if (isCompanionAction(value)) {
      allowed.add(value);
    }
  }
  return COMPANION_ACTIONS.filter((action) => allowed.has(action));
}

export function companionAllows(
  actions: readonly string[],
  action: CompanionAction
): boolean {
  return actions.includes(action);
}

/** Legacy exclusive alias policy expands into the implied workspace rights. */
export function expandAliasPolicy(
  policy: CompanionAliasPolicy
): CompanionAction[] {
  if (policy === 'SEND') return ['DRAFT', 'ASSIGN', 'SEND'];
  if (policy === 'ASSIGN') return ['DRAFT', 'ASSIGN'];
  return ['DRAFT'];
}

export function deriveCompanionActionsFromAliases(
  policies: readonly CompanionAliasPolicy[]
): CompanionAction[] {
  const allowed = new Set<CompanionAction>();
  for (const policy of policies) {
    for (const action of expandAliasPolicy(policy)) {
      allowed.add(action);
    }
  }
  if (allowed.size === 0) {
    allowed.add('DRAFT');
  }
  return COMPANION_ACTIONS.filter((action) => allowed.has(action));
}

export const COMPANION_INTEGRATION_IDS = [
  'linear',
  'stripe',
  'github',
  'notion'
] as const;

export type CompanionIntegrationId = (typeof COMPANION_INTEGRATION_IDS)[number];

/** Workspace tools that only run when that connector is activated. */
export const CONNECTOR_TOOL_INTEGRATION: Record<
  string,
  CompanionIntegrationId
> = {
  list_linear_issues: 'linear',
  create_linear_issue: 'linear',
  list_github_issues: 'github',
  list_github_pull_requests: 'github',
  create_github_issue: 'github',
  list_stripe_invoices: 'stripe',
  search_stripe_billing: 'stripe',
  search_notion_pages: 'notion'
};

export function integrationForConnectorTool(
  toolId: string
): CompanionIntegrationId | undefined {
  return CONNECTOR_TOOL_INTEGRATION[toolId];
}

/**
 * Why a connector tool may not run yet, or null when it may. Companion, MCP,
 * and REST all reach the same handlers, so the refusal lives here rather than
 * in one caller.
 */
export function connectorActivationError(
  toolId: string,
  integrations: readonly CompanionIntegrationId[]
): string | null {
  const integration = integrationForConnectorTool(toolId);
  if (!integration || integrations.includes(integration)) {
    return null;
  }
  return `${integration} is not connected. Activate it in Workspace Settings → Connect.`;
}

export function isCompanionIntegrationId(
  value: string | null | undefined
): value is CompanionIntegrationId {
  return (
    value === 'linear' ||
    value === 'stripe' ||
    value === 'github' ||
    value === 'notion'
  );
}

export function normalizeCompanionIntegrations(
  raw: Iterable<string> | null | undefined
): CompanionIntegrationId[] {
  const allowed = new Set<CompanionIntegrationId>();
  for (const value of raw ?? []) {
    if (isCompanionIntegrationId(value)) {
      allowed.add(value);
    }
  }
  return COMPANION_INTEGRATION_IDS.filter((id) => allowed.has(id));
}
