import Anthropic from '@anthropic-ai/sdk';
import { LLM_MODELS } from '@humaner/shared/plans';

/** Canonical model used for all deployed agents (widget + API). */
export const DEFAULT_CHAT_MODEL = LLM_MODELS.SONNET_5.id;

export function getAnthropicApiKey(): string | undefined {
  return (
    process.env.CLAUDE_API_KEY?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim() ||
    undefined
  );
}

export function isAnthropicConfigured(): boolean {
  return Boolean(getAnthropicApiKey());
}

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    throw new Error(
      'Missing Claude API key. Set CLAUDE_API_KEY (or ANTHROPIC_API_KEY) in the dashboard environment.'
    );
  }

  if (!client) {
    client = new Anthropic({ apiKey });
  }

  return client;
}
