import { DEMO_AGENT_ROLE_PREFIX } from '@/lib/admin-demos/demo-agent-role';

export function excludeDemoAgentsUnlessAdmin(includeDemos: boolean): {
  NOT?: { role: { startsWith: string } };
} {
  if (includeDemos) {
    return {};
  }
  return { NOT: { role: { startsWith: DEMO_AGENT_ROLE_PREFIX } } };
}
