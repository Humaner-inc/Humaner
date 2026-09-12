import { describe, expect, it } from 'vitest';

import {
  filterMentionMembers,
  insertMention,
  mentionQueryAt,
  resolveMentionedUserIds
} from '@/lib/inbox/mentions';

const members = [
  { id: '1', name: 'Alexandre Neyret' },
  { id: '2', name: 'Sarah Chen' },
  { id: '3', name: 'Sam' }
];

describe('mentions', () => {
  it('detects an @ query at the caret', () => {
    expect(mentionQueryAt('Hey @Sar', 8)).toEqual({ start: 4, query: 'Sar' });
    expect(mentionQueryAt('Hey@Sar', 7)).toBeNull();
  });

  it('inserts a full teammate name', () => {
    const next = insertMention('Hey @Sar', 8, 'Sarah Chen');
    expect(next.value).toBe('Hey @Sarah Chen ');
  });

  it('filters teammates by first name', () => {
    expect(filterMentionMembers(members, 'sar').map((m) => m.id)).toEqual([
      '2'
    ]);
  });

  it('resolves @full name and @first name', () => {
    expect(resolveMentionedUserIds('Hey @Sarah check this', members)).toEqual([
      '2'
    ]);
    expect(resolveMentionedUserIds('Hey @Alexandre Neyret', members)).toEqual([
      '1'
    ]);
    expect(resolveMentionedUserIds('cc @Sam', members)).toEqual(['3']);
  });
});
