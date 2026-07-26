import type { EscalationMode } from '@prisma/client';

export type EscalationTier = {
  mode: EscalationMode;
  label: string;
  sla: string;
  action: string;
  trigger: string;
};

export const ESCALATION_TIERS: EscalationTier[] = [
  {
    mode: 'LIVE',
    label: 'Critical',
    trigger: 'Safety, payment failure, stranded user',
    sla: '< 5 min',
    action: 'Human takes chat'
  },
  {
    mode: 'PRIORITY',
    label: 'Priority',
    trigger: 'Billing dispute, access blocked',
    sla: '< 2 hr',
    action: 'Async reply with context'
  },
  {
    mode: 'STANDARD',
    label: 'Standard',
    trigger: 'Policy or feature questions',
    sla: '< 24 hr',
    action: 'Async or template'
  },
  {
    mode: 'SELF_RESOLVING',
    label: 'Low',
    trigger: 'Known pattern - routes to AI Desk',
    sla: 'AI Desk',
    action: 'AI Desk (runbooks + clusters)'
  }
];

export const MODE_LABEL: Record<EscalationMode, string> = {
  LIVE: 'Critical',
  PRIORITY: 'Priority',
  STANDARD: 'Standard',
  SELF_RESOLVING: 'Low'
};

export const URGENCY_LABEL = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
} as const;

/** Subtle row wash — replaces left-border urgency cues. */
export const URGENCY_GRADIENT: Record<keyof typeof URGENCY_LABEL, string> = {
  HIGH: 'bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent-color,#e1ccaf)_22%,transparent)_0%,transparent_60%)]',
  MEDIUM:
    'bg-[linear-gradient(90deg,hsl(var(--foreground)/0.07)_0%,transparent_55%)]',
  LOW: 'bg-[linear-gradient(90deg,hsl(var(--foreground)/0.03)_0%,transparent_45%)]'
};

export function formatSla(minutes: number | null): string {
  if (minutes === null) {
    return '—';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

export function getTierForMode(
  mode: EscalationMode
): EscalationTier | undefined {
  return ESCALATION_TIERS.find((tier) => tier.mode === mode);
}
