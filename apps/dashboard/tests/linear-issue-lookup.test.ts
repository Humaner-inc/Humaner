import { describe, expect, it } from 'vitest';

import { findLinearIssueMatch } from '@/lib/connectors/linear-issue-lookup';

const issues = [
  { id: 'aaa-111', identifier: 'ENG-12', title: 'Wrong hit' },
  { id: 'bbb-222', identifier: 'ENG-123', title: 'Correct' }
];

describe('findLinearIssueMatch', () => {
  it('matches a Linear identifier without taking the first search hit', () => {
    expect(findLinearIssueMatch('ENG-123', issues)?.identifier).toBe('ENG-123');
    expect(findLinearIssueMatch('eng-123', issues)?.title).toBe('Correct');
  });

  it('matches a Linear UUID', () => {
    expect(findLinearIssueMatch('bbb-222', issues)?.identifier).toBe('ENG-123');
  });

  it('returns null when nothing matches', () => {
    expect(findLinearIssueMatch('ENG-999', issues)).toBeNull();
    expect(findLinearIssueMatch('', issues)).toBeNull();
  });
});
