import { describe, expect, it } from 'vitest';

import { resolveLockedWorkspaceFeature } from '@/lib/billing/plan-feature-lock';

const FREE = {
  tasks: false,
  resources: false,
  mcp: false,
  copilot: false
};

const PAID = {
  tasks: true,
  resources: true,
  mcp: true,
  copilot: true
};

describe('resolveLockedWorkspaceFeature', () => {
  it('locks paid-only surfaces on the free lookaround', () => {
    expect(resolveLockedWorkspaceFeature('/organization/tasks', FREE)).toBe(
      'tasks'
    );
    expect(resolveLockedWorkspaceFeature('/organization/resources', FREE)).toBe(
      'resources'
    );
    expect(
      resolveLockedWorkspaceFeature('/settings/organization/developers', FREE)
    ).toBe('mcp');
    expect(resolveLockedWorkspaceFeature('/knowledge', FREE)).toBe('companion');
  });

  it('leaves inbox and calendar open', () => {
    expect(resolveLockedWorkspaceFeature('/inbox/all', FREE)).toBeNull();
    expect(resolveLockedWorkspaceFeature('/calendar', FREE)).toBeNull();
  });

  it('does not lock paid workspaces', () => {
    expect(
      resolveLockedWorkspaceFeature('/organization/tasks', PAID)
    ).toBeNull();
  });
});
