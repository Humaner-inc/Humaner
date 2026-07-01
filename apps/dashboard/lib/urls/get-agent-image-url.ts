import { getApiUrl } from '@/lib/urls/get-api-url';

export function getAgentImageUrl(agentId: string, hash: string): string {
  return `${getApiUrl()}/agent-images/${agentId}?v=${hash}`;
}
