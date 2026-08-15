import { describe, expect, it } from 'vitest';

import { hasReachedAgentLimit } from '@/lib/billing/plan-limits';

const plan = (agents: number) =>
  ({ agents, name: 'Test' }) as Parameters<typeof hasReachedAgentLimit>[1];

describe('hasReachedAgentLimit', () => {
  it('blocks once live agents reach the plan allowance', () => {
    expect(hasReachedAgentLimit(1, plan(1), false)).toBe(true);
    expect(hasReachedAgentLimit(0, plan(1), false)).toBe(false);
  });

  // The count is only a lower bound under concurrency, so the comparison has to
  // stay `>=`; `>` would let a parallel create push a plan one agent over.
  it('blocks when the count has already exceeded the allowance', () => {
    expect(hasReachedAgentLimit(3, plan(2), false)).toBe(true);
  });

  it('never blocks when limits are bypassed', () => {
    expect(hasReachedAgentLimit(99, plan(1), true)).toBe(false);
  });
});
