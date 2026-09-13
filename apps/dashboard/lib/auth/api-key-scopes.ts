export const API_KEY_SCOPES = ['intelligence', 'mailbox', 'calendar'] as const;

/** @deprecated Legacy keys may still carry this scope in the database. */
export const LEGACY_API_KEY_SCOPE = 'helpdesk' as const;

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
      'Workspace knowledge, memory, and live context for agents over REST or MCP.'
  },
  {
    id: 'mailbox',
    label: 'Mailbox',
    description:
      'List, search, draft, assign, tag, note, and send mail over REST or MCP.'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'List and create hosted calendar events over REST or MCP.'
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

function scopeIncludesLegacyHelpdesk(scopes: readonly string[]): boolean {
  return scopes.includes(LEGACY_API_KEY_SCOPE);
}

/** Empty scopes = full access (legacy keys and explicit full-access keys). */
export function apiKeyHasScope(
  scopes: readonly string[],
  required: ApiKeyScope | typeof LEGACY_API_KEY_SCOPE
): boolean {
  if (scopes.length === 0) {
    return true;
  }
  if (required === 'intelligence') {
    return (
      scopes.includes('intelligence') || scopeIncludesLegacyHelpdesk(scopes)
    );
  }
  if (required === LEGACY_API_KEY_SCOPE) {
    return (
      scopeIncludesLegacyHelpdesk(scopes) || scopes.includes('intelligence')
    );
  }
  return scopes.includes(required);
}

export function scopeForIntelligenceTool(tool: string): ApiKeyScope {
  void HELPDESK_INTELLIGENCE_TOOLS.has(tool);
  return 'intelligence';
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

  const labels = new Set<string>();
  for (const scope of scopes) {
    if (scope === LEGACY_API_KEY_SCOPE) {
      labels.add('Intelligence');
      continue;
    }
    const option = API_KEY_SCOPE_OPTIONS.find((entry) => entry.id === scope);
    if (option) {
      labels.add(option.label);
    }
  }

  return [...labels].join(' · ') || 'Scoped';
}

export function apiKeyMissingScopeMessage(
  scope: ApiKeyScope | typeof LEGACY_API_KEY_SCOPE
): string {
  if (scope === 'mailbox') {
    return 'This API key does not have Mailbox access.';
  }
  if (scope === 'calendar') {
    return 'This API key does not have Calendar access.';
  }
  return 'This API key does not have Intelligence access.';
}

export function requiredApiKeyScopeForPublicPath(
  pathname: string
): ApiKeyScope {
  if (
    pathname.includes('/handoff/ticket') ||
    pathname.includes('/visitors/erase')
  ) {
    return 'intelligence';
  }
  if (pathname.includes('/calendar')) {
    return 'calendar';
  }
  if (
    pathname.includes('/mail') ||
    pathname.includes('/mcp') ||
    pathname.includes('/tasks')
  ) {
    return 'mailbox';
  }
  return 'intelligence';
}
