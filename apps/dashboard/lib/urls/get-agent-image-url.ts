export function getAgentImageUrl(agentId: string, hash: string): string {
  // Relative so the browser always loads from the current origin (local,
  // preview, or production). Absolute base URLs break when NEXT_PUBLIC_BASE_URL
  // does not match the tab the user is on.
  return `/api/agent-images/${agentId}?v=${hash}`;
}
