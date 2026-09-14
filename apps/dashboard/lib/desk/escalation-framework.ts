import type { CSSProperties } from 'react';
import type { EscalationMode } from '@prisma/client';

import type { HandoffTicketUrgency } from '@/types/handoff-ticket';

export type EscalationTier = {
  mode: EscalationMode;
  label: string;
  /** Docs SLA target — short form for UI. */
  sla: string;
  /** Default SLA minutes when creating a policy on this tier. */
  defaultSlaMinutes: number | null;
  /** Matching ticket urgency stored on the policy. */
  urgencyLevel: HandoffTicketUrgency;
  /** Hex color for swatches (inline styles — reliable on dark UI). */
  color: string;
};

/** Critical · Priority · Medium · Low */
export const ESCALATION_TIERS: EscalationTier[] = [
  {
    mode: 'LIVE',
    label: 'Critical',
    sla: '< 5 min',
    defaultSlaMinutes: 5,
    urgencyLevel: 'HIGH',
    color: '#f85919'
  },
  {
    mode: 'PRIORITY',
    label: 'Priority',
    sla: '< 2 hr',
    defaultSlaMinutes: 120,
    urgencyLevel: 'MEDIUM',
    color: '#e8b04d'
  },
  {
    mode: 'STANDARD',
    label: 'Medium',
    sla: '< 24 hr',
    defaultSlaMinutes: 1440,
    urgencyLevel: 'MEDIUM',
    color: '#001afc'
  },
  {
    mode: 'SELF_RESOLVING',
    label: 'Low',
    sla: 'No human queue',
    defaultSlaMinutes: null,
    urgencyLevel: 'LOW',
    color: '#226342'
  }
];

export const MODE_LABEL: Record<EscalationMode, string> = {
  LIVE: 'Critical',
  PRIORITY: 'Priority',
  STANDARD: 'Medium',
  SELF_RESOLVING: 'Low'
};

export const MODE_COLOR: Record<EscalationMode, string> = {
  LIVE: '#f85919',
  PRIORITY: '#e8b04d',
  STANDARD: '#001afc',
  SELF_RESOLVING: '#226342'
};

export const URGENCY_LABEL = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
} as const;

/** Inline gradient wash for policy rows (Tailwind arbitrary color-mix is unreliable). */
export function modeGradientStyle(mode: EscalationMode): CSSProperties {
  const color = MODE_COLOR[mode];
  return {
    backgroundImage: `linear-gradient(90deg, ${color}42 0%, ${color}14 38%, transparent 68%)`
  };
}

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
