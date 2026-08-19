import {
  formatSlaCountdown,
  isLiveChatHandoffActive,
  parseSessionHandoffRecord,
  resolveLiveChatCountdownMinutes,
  resolveLiveChatWaitMinutes,
  sessionHandoffIsSame
} from '@humaner/shared/live-chat-handoff';
import { describe, expect, it } from 'vitest';

import { resolveTicketSlaMinutes } from '@/lib/desk/resolve-ticket-sla';

describe('resolveLiveChatWaitMinutes', () => {
  it('uses the tighter of SLA and live-chat timeout when live chat is on', () => {
    expect(
      resolveLiveChatWaitMinutes({
        enabled: true,
        timeoutMinutes: 20,
        slaMinutes: 5
      })
    ).toBe(5);
  });

  it('keeps the live-chat timeout when SLA is longer', () => {
    expect(
      resolveLiveChatWaitMinutes({
        enabled: true,
        timeoutMinutes: 20,
        slaMinutes: 1440
      })
    ).toBe(20);
  });

  it('falls back to the org timeout when live chat is off', () => {
    expect(
      resolveLiveChatWaitMinutes({
        enabled: false,
        timeoutMinutes: 20,
        slaMinutes: 5
      })
    ).toBe(20);
  });
});

describe('resolveLiveChatCountdownMinutes', () => {
  it('mirrors Desk wait timeout even after a team member joins', () => {
    expect(
      resolveLiveChatCountdownMinutes(
        {
          enabled: true,
          timeoutMinutes: 20,
          slaMinutes: 120
        },
        true
      )
    ).toBe(20);
  });

  it('is hidden when live chat is off', () => {
    expect(
      resolveLiveChatCountdownMinutes({
        enabled: false,
        timeoutMinutes: 20,
        slaMinutes: 120
      })
    ).toBeNull();
  });
});

describe('parseSessionHandoffRecord', () => {
  it('restores a ticket createdAt from an ISO string', () => {
    const createdAt = Date.parse('2026-08-19T12:00:00.000Z');
    const parsed = parseSessionHandoffRecord({
      ticketId: 't1',
      ticketNumber: 42,
      createdAt: '2026-08-19T12:00:00.000Z',
      status: 'OPEN',
      liveChatTimedOut: false,
      liveChat: { enabled: true, timeoutMinutes: 20, slaMinutes: 5 }
    });

    expect(parsed).toMatchObject({
      ticketId: 't1',
      ticketNumber: 42,
      createdAt,
      status: 'OPEN'
    });
    expect(isLiveChatHandoffActive(parsed)).toBe(true);
  });

  it('treats a timed-out ticket as inactive live chat', () => {
    expect(
      isLiveChatHandoffActive({
        ticketId: 't1',
        ticketNumber: 1,
        createdAt: Date.now(),
        liveChatTimedOut: true,
        liveChat: { enabled: true, slaMinutes: 5 }
      })
    ).toBe(false);
  });
});

describe('sessionHandoffIsSame', () => {
  it('ignores createdAt so poll snapshots do not rewrite storage', () => {
    const record = {
      ticketId: 't1',
      ticketNumber: 1,
      createdAt: Date.now(),
      status: 'OPEN' as const,
      liveChatTimedOut: false,
      liveChat: { enabled: true, timeoutMinutes: 20, slaMinutes: 5 }
    };

    expect(sessionHandoffIsSame(record, { ...record, createdAt: 1 })).toBe(
      true
    );
    expect(
      sessionHandoffIsSame(record, { ...record, status: 'RESOLVED' })
    ).toBe(false);
  });
});

describe('formatSlaCountdown', () => {
  it('returns overdue when the SLA window has elapsed', () => {
    expect(formatSlaCountdown(Date.now() - 10 * 60_000, 5)).toBe('SLA overdue');
  });
});

describe('resolveTicketSlaMinutes', () => {
  it('uses the matching escalation policy', () => {
    expect(
      resolveTicketSlaMinutes({
        urgency: 'HIGH',
        policies: [
          {
            urgencyLevel: 'HIGH',
            mode: 'LIVE',
            slaMinutes: 5
          }
        ]
      })
    ).toBe(5);
  });

  it('falls back to the Critical tier default for HIGH urgency', () => {
    expect(
      resolveTicketSlaMinutes({
        urgency: 'HIGH',
        policies: []
      })
    ).toBe(5);
  });
});
