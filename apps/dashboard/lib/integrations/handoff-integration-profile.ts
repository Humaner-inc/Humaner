const EMBED_INTEGRATION_IDS = new Set(['widget', 'react', 'hosted-link']);
const API_INTEGRATION_IDS = new Set(['rest-api']);

export type HandoffIntegrationProfile = {
  /** Organization selected or inferred API (REST) integration usage. */
  usesApiIntegration: boolean;
  /** Organization selected embed channels (widget, React, hosted link). */
  usesEmbedIntegration: boolean;
  /** Embed-only setup with no API channel — live chat applies to widget tickets only. */
  isWidgetOnly: boolean;
};

/**
 * Infer how handoffs reach Human Desk from onboarding selections and API keys.
 * Empty onboarding defaults to widget when no API keys exist, otherwise API.
 */
export function resolveHandoffIntegrationProfile(input: {
  onboardingIntegrations: string[];
  hasApiKeys: boolean;
}): HandoffIntegrationProfile {
  const selected =
    input.onboardingIntegrations.length > 0
      ? input.onboardingIntegrations
      : input.hasApiKeys
        ? ['rest-api']
        : ['widget'];

  const usesApiIntegration =
    selected.some((id) => API_INTEGRATION_IDS.has(id)) ||
    (input.onboardingIntegrations.length === 0 && input.hasApiKeys);
  const usesEmbedIntegration = selected.some((id) =>
    EMBED_INTEGRATION_IDS.has(id)
  );

  return {
    usesApiIntegration,
    usesEmbedIntegration,
    isWidgetOnly: usesEmbedIntegration && !usesApiIntegration
  };
}

export function ticketSupportsLiveChat(input: {
  orgLiveChatEnabled: boolean;
  ticketSource: 'WIDGET' | 'API' | 'EMAIL';
}): boolean {
  return input.orgLiveChatEnabled && input.ticketSource === 'WIDGET';
}
