import 'server-only';

/**
 * Self-Host (OSS) twin of `services/langcache.ts`.
 *
 * LangCache — semantic response caching — is part of Humaner Intelligence and
 * ships only in Cloud. Self-Host answers every turn live, so there is no cache
 * to invalidate when an agent's policy changes. josh renames this file onto
 * `services/langcache.ts`; the public surface is only what open callers use.
 */
export async function invalidateLangCacheForAgent(
  _agentId: string
): Promise<void> {
  // No semantic cache in Self-Host.
}
