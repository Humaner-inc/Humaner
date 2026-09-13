/** Client-safe API key format constants (no DB or Node crypto). */

export const API_KEY_PREFIX = 'hu_';
export const API_KEY_LEGACY_PREFIX = 'api_';
export const API_KEY_RANDOM_SIZE = 16;
export const API_KEY_LENGTH = API_KEY_RANDOM_SIZE * 2 + API_KEY_PREFIX.length;
export const API_KEY_LEGACY_LENGTH =
  API_KEY_RANDOM_SIZE * 2 + API_KEY_LEGACY_PREFIX.length;

/** Placeholder shown in docs/snippets before a real key is created. */
export const API_KEY_SNIPPET_PLACEHOLDER = 'Your_api_key';
