export type MailTagScope = {
  id: string;
  aliasId: string | null;
};

/** Tags available on a single alias: org-wide + that alias's own tags. */
export function tagsForAlias<T extends MailTagScope>(
  tags: T[],
  aliasId: string
): T[] {
  return tags.filter((tag) => tag.aliasId === null || tag.aliasId === aliasId);
}

/**
 * Tags safe to apply to every selected thread.
 * Mixed aliases → org-wide only; single alias → org-wide + that alias.
 */
export function tagsForAliasIds<T extends MailTagScope>(
  tags: T[],
  aliasIds: Iterable<string>
): T[] {
  const unique = [...new Set(aliasIds)];
  if (unique.length === 0) return tags.filter((tag) => tag.aliasId === null);
  if (unique.length === 1) {
    return tagsForAlias(tags, unique[0]!);
  }
  return tags.filter((tag) => tag.aliasId === null);
}
