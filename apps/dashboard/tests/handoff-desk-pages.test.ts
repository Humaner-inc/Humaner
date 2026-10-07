import { Role, WorkspaceRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  HANDOFF_DESK_PAGE_KEYS,
  sharesHandoffDeskAccess
} from '@/constants/handoff-desk-pages';
import { canAccessPageKey } from '@/lib/auth/require-workspace-access';

describe('handoff desk page access', () => {
  it('keeps desk and human-desk interchangeable without support', () => {
    expect(HANDOFF_DESK_PAGE_KEYS).toEqual(['desk', 'human-desk']);
    expect(sharesHandoffDeskAccess(['human-desk'], 'desk')).toBe(true);
    expect(sharesHandoffDeskAccess(['desk'], 'human-desk')).toBe(true);
    expect(sharesHandoffDeskAccess(['support'], 'desk')).toBe(false);
    expect(sharesHandoffDeskAccess(['inbox'], 'desk')).toBe(false);
  });

  it('does not elevate desk access from a support page grant', () => {
    expect(
      canAccessPageKey(
        {
          role: Role.USER,
          workspaceRole: WorkspaceRole.TEAMMATE,
          allowedPages: ['support']
        },
        'desk'
      )
    ).toBe(false);
  });

  it('denies support/workflow page keys to workspace owners', () => {
    const owner = {
      role: Role.USER,
      workspaceRole: WorkspaceRole.OWNER,
      allowedPages: [] as string[]
    };
    expect(canAccessPageKey(owner, 'support')).toBe(false);
    expect(canAccessPageKey(owner, 'workflow')).toBe(false);
    expect(canAccessPageKey(owner, 'desk')).toBe(true);
  });

  it('still allows platform admins everywhere', () => {
    expect(
      canAccessPageKey(
        {
          role: Role.ADMIN,
          workspaceRole: WorkspaceRole.TEAMMATE,
          allowedPages: []
        },
        'desk'
      )
    ).toBe(true);
    expect(
      canAccessPageKey(
        {
          role: Role.ADMIN,
          workspaceRole: WorkspaceRole.TEAMMATE,
          allowedPages: []
        },
        'support'
      )
    ).toBe(true);
  });
});
