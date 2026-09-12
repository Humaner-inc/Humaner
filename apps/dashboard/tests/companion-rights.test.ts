import { describe, expect, it } from 'vitest';

import {
  companionAllows,
  deriveCompanionActionsFromAliases,
  expandAliasPolicy,
  normalizeCompanionActions,
  normalizeCompanionIntegrations
} from '@/lib/inbox/companion-rights';

describe('companion workspace rights', () => {
  it('normalizes and preserves action order', () => {
    expect(
      normalizeCompanionActions(['SEND', 'draft', 'ASSIGN', 'DRAFT'])
    ).toEqual(['DRAFT', 'ASSIGN', 'SEND']);
    expect(normalizeCompanionActions([])).toEqual([]);
  });

  it('expands a legacy exclusive alias policy', () => {
    expect(expandAliasPolicy('DRAFT')).toEqual(['DRAFT']);
    expect(expandAliasPolicy('ASSIGN')).toEqual(['DRAFT', 'ASSIGN']);
    expect(expandAliasPolicy('SEND')).toEqual(['DRAFT', 'ASSIGN', 'SEND']);
  });

  it('derives workspace rights from mixed aliases', () => {
    expect(deriveCompanionActionsFromAliases(['DRAFT', 'ASSIGN'])).toEqual([
      'DRAFT',
      'ASSIGN'
    ]);
    expect(deriveCompanionActionsFromAliases([])).toEqual(['DRAFT']);
  });

  it('checks individual rights independently', () => {
    expect(companionAllows(['DRAFT', 'SEND'], 'SEND')).toBe(true);
    expect(companionAllows(['DRAFT', 'SEND'], 'ASSIGN')).toBe(false);
  });

  it('keeps only Linear, Stripe, and GitHub', () => {
    expect(
      normalizeCompanionIntegrations(['notion', 'github', 'stripe', 'linear'])
    ).toEqual(['linear', 'stripe', 'github']);
  });
});
