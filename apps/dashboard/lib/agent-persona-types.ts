import type {
  CharacterType,
  EmojiMode,
  Formality,
  IndustryType,
  OpenerStyle,
  Verbosity
} from '@prisma/client';

/**
 * Persona-shaping fields read when rendering an agent's system prompt.
 *
 * This lives in its own public module (not `lib/build-system-prompt`, which is
 * private prompt IP) so the open Self-Host modules that only need the *shape*
 * of an agent — the agent-config cache and the vertical catalog — can import it
 * without pulling the private prompt builder into the public projection.
 */
export type SystemPromptAgent = {
  character: CharacterType;
  customCharacterPrompt?: string | null;
  industry: IndustryType;
  verbosity: Verbosity;
  formality: Formality;
  emojiMode: EmojiMode;
  openerStyle: OpenerStyle;
  allowTypos: boolean;
  // Specific values that must never receive a typo, e.g. order numbers, prices.
  typoExceptions: string[];
  forbiddenTopics: string[];
  fallbackMessage: string;
  role: string;
  name: string;
  /**
   * Whether this agent has cross-session visitor memory enabled (Frontier+).
   * When false, the no-cross-session-memory caveat is injected into the prompt.
   */
  hasCrossSessionMemory: boolean;
};
