import {
  buildVisitorHomeTickets,
  formatSlaCountdown,
  isHandoffTicketClosed,
  isLiveChatHandoffActive,
  isLiveChatWaitElapsed,
  mergeLiveChatPollMessages,
  parseSessionHandoffRecord,
  resolveLiveChatCountdownMinutes,
  resolveLiveChatWaitMinutes,
  sessionHandoffIsSame,
  shouldReplaceVisitorTranscript,
  withLiveChatSlaOverdueMessage
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

  it('does not treat SLA timeout as a resolved ticket', () => {
    expect(
      isHandoffTicketClosed({
        ticketId: 't1',
        ticketNumber: 1,
        createdAt: Date.now(),
        status: 'OPEN',
        liveChatTimedOut: true,
        liveChat: { enabled: true }
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
  it('hides the wait label once the window has elapsed', () => {
    expect(formatSlaCountdown(Date.now() - 10 * 60_000, 5)).toBeNull();
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

describe('mergeLiveChatPollMessages', () => {
  it('does not replay pre-handoff assistant turns from a late poll', () => {
    const prev = [
      { role: 'user' as const, content: 'Do you have GitHub integration?' },
      {
        role: 'assistant' as const,
        content:
          "That's not something Humaner does, at least not from what I know."
      },
      { role: 'assistant' as const, content: 'On it!' }
    ];

    const merged = mergeLiveChatPollMessages(prev, [
      { id: '1', role: 'USER', content: 'Do you have GitHub integration?' },
      {
        id: '2',
        role: 'ASSISTANT',
        content:
          "That's not something Humaner does, at least not from what I know."
      },
      { id: '3', role: 'ASSISTANT', content: 'On it!' },
      {
        id: '4',
        role: 'HUMAN',
        content: 'Hey johnny, we can follow up by email.'
      }
    ]);

    expect(merged).toEqual([
      ...prev,
      {
        id: '4',
        role: 'human',
        content: 'Hey johnny, we can follow up by email.'
      }
    ]);
  });

  it('skips a human reply that is already in the transcript', () => {
    const prev = [
      { id: '4', role: 'human' as const, content: 'We are looking into this.' }
    ];
    expect(
      mergeLiveChatPollMessages(prev, [
        { id: '4', role: 'HUMAN', content: 'We are looking into this.' },
        { id: '5', role: 'HUMAN', content: 'We are looking into this.' }
      ])
    ).toEqual(prev);
  });

  it('skips a human reply whose content is already stored as assistant', () => {
    const prev = [
      { role: 'assistant' as const, content: 'We are looking into this.' }
    ];
    expect(
      mergeLiveChatPollMessages(prev, [
        { id: '4', role: 'HUMAN', content: 'We are looking into this.' }
      ])
    ).toEqual(prev);
  });
});

describe('isLiveChatWaitElapsed', () => {
  it('is true once the wait window has passed', () => {
    expect(
      isLiveChatWaitElapsed(
        1_000,
        { enabled: true, timeoutMinutes: 5, slaMinutes: 5 },
        1_000 + 5 * 60_000
      )
    ).toBe(true);
  });

  it('is false before the wait window ends', () => {
    expect(
      isLiveChatWaitElapsed(
        1_000,
        { enabled: true, timeoutMinutes: 5, slaMinutes: 5 },
        1_000 + 4 * 60_000
      )
    ).toBe(false);
  });
});

describe('withLiveChatSlaOverdueMessage', () => {
  it('appends the overdue message once', () => {
    const first = withLiveChatSlaOverdueMessage([
      { role: 'user' as const, content: 'Need a human' }
    ]);
    const second = withLiveChatSlaOverdueMessage(first);
    expect(first).toHaveLength(2);
    expect(second).toBe(first);
    expect(first[1]?.content).toMatch(
      /No one from the team is actually available/
    );
  });
});

describe('buildVisitorHomeTickets', () => {
  it('lists open and resolved tickets with status labels', () => {
    const tickets = buildVisitorHomeTickets(
      [
        { sessionId: 's1', title: 'Need a refund' },
        { sessionId: 's2', title: 'Login broken' },
        { sessionId: 's3', title: 'Just chatting' }
      ],
      (sessionId) => {
        if (sessionId === 's1') {
          return {
            ticketId: 't1',
            ticketNumber: 2,
            createdAt: 1,
            status: 'OPEN',
            liveChatTimedOut: true,
            liveChat: { enabled: true }
          };
        }
        if (sessionId === 's2') {
          return {
            ticketId: 't2',
            ticketNumber: 3,
            createdAt: 1,
            status: 'RESOLVED',
            liveChat: { enabled: true }
          };
        }
        return null;
      }
    );

    expect(tickets).toEqual([
      {
        sessionId: 's1',
        ticketRef: '#00002',
        statusLabel: 'Open',
        title: 'Need a refund',
        detail: 'Need a refund'
      },
      {
        sessionId: 's2',
        ticketRef: '#00003',
        statusLabel: 'Resolved',
        title: 'Login broken',
        detail: 'The team marked this as resolved.\n\nRequest: Login broken'
      }
    ]);
  });
});

describe('shouldReplaceVisitorTranscript', () => {
  it('keeps a local transcript that already includes team-member replies', () => {
    expect(
      shouldReplaceVisitorTranscript(
        [{ role: 'user' }, { role: 'assistant' }, { role: 'human' }],
        [
          { role: 'user' },
          { role: 'assistant' },
          { role: 'assistant' },
          { role: 'assistant' }
        ]
      )
    ).toBe(false);
  });

  it('replaces when the remote transcript is longer and includes humans', () => {
    expect(
      shouldReplaceVisitorTranscript(
        [{ role: 'user' }, { role: 'assistant' }],
        [{ role: 'user' }, { role: 'assistant' }, { role: 'human' }]
      )
    ).toBe(true);
  });
});
