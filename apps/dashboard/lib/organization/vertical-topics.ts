/**
 * Resolve which vertical topics are selected for an organization.
 * Empty storage means "all catalog topics" (legacy / pre-seed orgs).
 */
export function resolveSelectedVerticalTopics(
  stored: string[] | null | undefined,
  catalog: string[]
): string[] {
  if (!stored || stored.length === 0) {
    return [...catalog];
  }
  const catalogSet = new Set(catalog);
  return stored.filter((topic) => catalogSet.has(topic));
}
