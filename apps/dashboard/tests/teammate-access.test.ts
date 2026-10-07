import { Role, WorkspaceRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  ADMIN_PAGE_ACCESS,
  MEMBER_PAGE_ACCESS,
  pagesForTeammateAccess,
  resolvePathAccess,
  resolveTeammateAccessLevel,
  storedAllowedAliasIds
} from '@/constants/dashboard-pages';
import { Routes } from '@/constants/routes';

describe('teammate access', () => {
  it('treats team, settings, and integrations as admin', () => {
    expect(resolveTeammateAccessLevel(['overview', 'inbox'])).toBe('admin');
    expect(resolveTeammateAccessLevel(['settings'])).toBe('admin');
    expect(resolveTeammateAccessLevel(ADMIN_PAGE_ACCESS)).toBe('admin');
  });

  it('treats mailbox-only pages as member', () => {
    expect(resolveTeammateAccessLevel(MEMBER_PAGE_ACCESS)).toBe('member');
    expect(resolveTeammateAccessLevel(['inbox', 'tasks', 'calendar'])).toBe(
      'member'
    );
  });

  it('maps admin and member to the matching page sets', () => {
    expect(pagesForTeammateAccess('admin')).toEqual(ADMIN_PAGE_ACCESS);
    expect(pagesForTeammateAccess('member')).toEqual(MEMBER_PAGE_ACCESS);
    expect(pagesForTeammateAccess('member')).not.toContain('overview');
    expect(pagesForTeammateAccess('member')).not.toContain('settings');
  });

  it('stores no alias ids for admins or full inbox access', () => {
    expect(
      storedAllowedAliasIds({
        pages: ADMIN_PAGE_ACCESS,
        selectedAliasIds: ['a'],
        channelIds: ['a', 'b']
      })
    ).toEqual([]);
    expect(
      storedAllowedAliasIds({
        pages: MEMBER_PAGE_ACCESS,
        selectedAliasIds: ['a', 'b'],
        channelIds: ['a', 'b']
      })
    ).toEqual([]);
  });

  it('stores a subset of inboxes for members', () => {
    expect(
      storedAllowedAliasIds({
        pages: MEMBER_PAGE_ACCESS,
        selectedAliasIds: ['b'],
        channelIds: ['a', 'b']
      })
    ).toEqual(['b']);
  });

  it('gates providers and inbox settings to workspace admins', () => {
    expect(resolvePathAccess(Routes.InboxProviders)).toEqual({
      type: 'workspace-admin'
    });
    expect(resolvePathAccess(Routes.InboxSettings)).toEqual({
      type: 'workspace-admin'
    });
    expect(resolvePathAccess(Routes.OrganizationWorkspace)).toEqual({
      type: 'workspace-admin'
    });
    expect(resolvePathAccess(Routes.InboxAll).type).toBe('page');
  });

  it('gates Outbound, Support, and Workflow to platform admins only', () => {
    expect(resolvePathAccess(Routes.Outbound)).toEqual({
      type: 'platform-admin'
    });
    expect(resolvePathAccess(Routes.Support)).toEqual({
      type: 'platform-admin'
    });
    expect(resolvePathAccess(Routes.Workflow)).toEqual({
      type: 'platform-admin'
    });
    expect(resolvePathAccess(Routes.DeskHuman).type).toBe('page');
    expect(pagesForTeammateAccess('member')).not.toContain('support');
    expect(pagesForTeammateAccess('member')).not.toContain('workflow');
    expect(pagesForTeammateAccess('admin')).not.toContain('support');
    expect(pagesForTeammateAccess('admin')).not.toContain('workflow');
  });
});

describe('platform admin path gate', () => {
  it('denies workspace owners platform-admin routes', async () => {
    const { canAccessPathname } = await import('@/lib/auth/workspace-access');
    const owner = {
      role: Role.MEMBER,
      workspaceRole: WorkspaceRole.OWNER,
      allowedPages: [] as string[]
    };
    expect(canAccessPathname(owner, Routes.Support)).toBe(false);
    expect(canAccessPathname(owner, Routes.Workflow)).toBe(false);
    expect(canAccessPathname(owner, Routes.Outbound)).toBe(false);
  });
});
