export const API_KEY_SCOPES = ['intelligence', 'helpdesk'] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export type ApiKeyAccessMode = 'full' | 'scoped';

export const API_KEY_SCOPE_OPTIONS: {
  id: ApiKeyScope;
  label: string;
  description: string;
}[] = [
  {
    id: 'intelligence',
    label: 'Intelligence',
    description:
      'Search knowledge, live context, memory, identify visitors, match runbooks.'
  },
  {
    id: 'helpdesk',
    label: 'Helpdesk',
    description: 'Create tickets, email your team, and check escalation.'
  }
];

const HELPDESK_INTELLIGENCE_TOOLS = new Set<string>([
  'check_escalation_signal',
  'create_ticket',
  'send_team_email'
]);

export function isApiKeyScope(value: string): value is ApiKeyScope {
  return API_KEY_SCOPES.includes(value as ApiKeyScope);
}

/** Empty scopes = full access (legacy keys and explicit full-access keys). */
export function apiKeyHasScope(
  scopes: readonly string[],
  required: ApiKeyScope
): boolean {
  if (scopes.length === 0) {
    return true;
  }
  return scopes.includes(required);
}

export function scopeForIntelligenceTool(tool: string): ApiKeyScope {
  return HELPDESK_INTELLIGENCE_TOOLS.has(tool) ? 'helpdesk' : 'intelligence';
}

export function normalizeApiKeyScopes(input: {
  access: ApiKeyAccessMode;
  scopes: readonly string[];
}): ApiKeyScope[] {
  if (input.access === 'full') {
    return [];
  }
  return API_KEY_SCOPES.filter((scope) => input.scopes.includes(scope));
}

export function formatApiKeyAccessLabel(scopes: readonly string[]): string {
  if (scopes.length === 0) {
    return 'Full access';
  }
  const labels = API_KEY_SCOPE_OPTIONS.filter((option) =>
    scopes.includes(option.id)
  ).map((option) => option.label);
  return labels.join(' · ') || 'Scoped';
}

export function apiKeyMissingScopeMessage(scope: ApiKeyScope): string {
  return scope === 'helpdesk'
    ? 'This API key does not have Helpdesk access.'
    : 'This API key does not have Intelligence access.';
}

export function requiredApiKeyScopeForPublicPath(
  pathname: string
): ApiKeyScope {
  if (
    pathname.includes('/handoff/ticket') ||
    pathname.includes('/visitors/erase')
  ) {
    return 'helpdesk';
  }
  return 'intelligence';
}
