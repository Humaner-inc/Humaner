import { describe, expect, it } from 'vitest';

import { countUnreadTeamActivity } from '@/lib/team/team-unread';

const lastSeenAt = '2026-09-12T10:00:00.000Z';

describe('countUnreadTeamActivity', () => {
  it('counts team messages from others after last seen', () => {
    expect(
      countUnreadTeamActivity({
        userId: 'me',
        userName: 'Alex',
        lastSeenAt,
        messages: [
          {
            authorId: 'sam',
            createdAt: '2026-09-12T11:00:00.000Z'
          },
          {
            authorId: 'me',
            createdAt: '2026-09-12T11:30:00.000Z'
          }
        ],
        notes: []
      })
    ).toBe(1);
  });

  it('counts only notes that mention the current user', () => {
    expect(
      countUnreadTeamActivity({
        userId: 'me',
        userName: 'Alex',
        lastSeenAt,
        messages: [],
        notes: [
          {
            authorId: 'sam',
            createdAt: '2026-09-12T11:00:00.000Z',
            body: 'Hey @Alex can you take this?'
          },
          {
            authorId: 'sam',
            createdAt: '2026-09-12T11:00:00.000Z',
            body: 'Internal note, no mention'
          }
        ]
      })
    ).toBe(1);
  });

  it('counts recent team messages and all mention notes before a last-seen timestamp', () => {
    expect(
      countUnreadTeamActivity({
        userId: 'me',
        userName: 'Alex',
        lastSeenAt: null,
        now: new Date('2026-09-12T12:00:00.000Z').getTime(),
        messages: [
          { authorId: 'sam', createdAt: '2026-09-12T11:00:00.000Z' },
          { authorId: 'sam', createdAt: '2026-09-10T11:00:00.000Z' }
        ],
        notes: [
          {
            authorId: 'sam',
            createdAt: '2026-09-01T11:00:00.000Z',
            body: 'Hey @Alex older mention'
          }
        ]
      })
    ).toBe(2);
  });
});
