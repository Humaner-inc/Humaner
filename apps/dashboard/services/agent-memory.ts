import 'server-only';

/**
 * Self-Host (OSS) twin of `services/agent-memory.ts`.
 *
 * Cross-session visitor memory (working memory, long-term facts, recognition)
 * is part of Humaner Intelligence and ships only in Cloud. Self-Host keeps no
 * memory store, so deleting an agent, purging a visitor, or removing a workspace
 * has no memory to clear. josh renames this file onto `services/agent-memory.ts`;
 * the public surface is only what open callers (agent/data-retention) use.
 */
export async function purgeVisitorMemory(_ownerId: string): Promise<void> {
  // No cross-session memory store in Self-Host.
}
