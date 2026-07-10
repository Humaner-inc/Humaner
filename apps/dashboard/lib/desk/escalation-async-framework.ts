import type { EscalationMode } from '@prisma/client';

export type EscalationTierRow = {
  mode: EscalationMode;
  label: string;
  trigger: string;
  sla: string;
  humanAction: string;
};

export const ESCALATION_ASYNC_TIERS: EscalationTierRow[] = [
  {
    mode: 'LIVE',
    label: 'Live',
    trigger: 'Stranded traveller, payment failure, safety issue',
    sla: '< 5 min',
    humanAction: 'Real-time chat takeover'
  },
  {
    mode: 'PRIORITY',
    label: 'Priority async',
    trigger: 'High-value account, billing dispute, multi-day wait',
    sla: '< 2 hours',
    humanAction: 'Async reply with full context'
  },
  {
    mode: 'STANDARD',
    label: 'Standard async',
    trigger: 'Feature questions, policy clarifications',
    sla: '< 24 hours',
    humanAction: 'Async reply or AI template'
  },
  {
    mode: 'SELF_RESOLVING',
    label: 'Self-resolving',
    trigger: 'Knowledge gap detected — not escalation-worthy',
    sla: 'No human',
    humanAction: 'KB updated; next visitor gets the answer'
  }
];

export const ESCALATION_MODE_B2C_NOTES: Record<EscalationMode, string> = {
  LIVE: 'Widget visitors expecting instant help on transactional issues.',
  PRIORITY: 'Refund and order disputes after the bot tried live data.',
  STANDARD: 'Policy and product questions that can wait until the next shift.',
  SELF_RESOLVING:
    'Turn repeat gaps into knowledge — shrinks queue volume over time.'
};

export const ESCALATION_MODE_B2B_NOTES: Record<EscalationMode, string> = {
  LIVE: 'Enterprise accounts with SLA breach risk or multi-stakeholder blockers.',
  PRIORITY: 'Account owner or CSM async follow-up with CRM context attached.',
  STANDARD: 'Technical clarifications routed by knowledge area, not timestamp.',
  SELF_RESOLVING: 'Draft KB answers for approval — reduces load on senior CS.'
};
