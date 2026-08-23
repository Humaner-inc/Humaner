export const DEMO_AGENT_ROLE_PREFIX = 'Demo · ';

export function demoAgentRole(hostname: string): string {
  const host = hostname.replace(/^www\./i, '').slice(0, 200);
  return `${DEMO_AGENT_ROLE_PREFIX}${host}`;
}

export function isDemoAgentRole(role: string): boolean {
  return role.startsWith(DEMO_AGENT_ROLE_PREFIX);
}

export function hostnameFromDemoRole(role: string): string | null {
  if (!isDemoAgentRole(role)) {
    return null;
  }
  const host = role.slice(DEMO_AGENT_ROLE_PREFIX.length).trim();
  if (!host || !/^[a-z0-9.-]+$/i.test(host)) {
    return null;
  }
  return host;
}

export function websiteFromDemoRole(role: string): string | null {
  const host = hostnameFromDemoRole(role);
  return host ? `https://${host}` : null;
}
