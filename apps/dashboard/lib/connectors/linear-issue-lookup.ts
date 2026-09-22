export type LinearIssueRef = {
  id: string;
  identifier: string;
};

/** Exact Linear id or identifier (ENG-123) — never the first search hit. */
export function findLinearIssueMatch<T extends LinearIssueRef>(
  issueId: string,
  nodes: readonly T[]
): T | null {
  const needle = issueId.trim().toLowerCase();
  if (!needle) {
    return null;
  }

  return (
    nodes.find(
      (node) =>
        node.id.toLowerCase() === needle ||
        node.identifier.toLowerCase() === needle
    ) ?? null
  );
}
