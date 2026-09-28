import { describe, expect, it } from 'vitest';

import { Routes } from '@/constants/routes';
import { resolveDashboardPageTitle } from '@/lib/metadata/resolve-dashboard-page-title';

describe('resolveDashboardPageTitle', () => {
  it('maps inbox routes to Inbox (not Organization)', () => {
    expect(resolveDashboardPageTitle(Routes.InboxAll)).toBe('Inbox');
    expect(resolveDashboardPageTitle('/dashboard/inbox/all')).toBe('Inbox');
  });

  it('maps common workspace routes', () => {
    expect(resolveDashboardPageTitle(Routes.Calendar)).toBe('Calendar');
    expect(resolveDashboardPageTitle(Routes.Tasks)).toBe('Tasks');
    expect(resolveDashboardPageTitle('/tasks')).toBe('Tasks');
    expect(resolveDashboardPageTitle(Routes.Contacts)).toBe('Contacts');
    expect(resolveDashboardPageTitle(Routes.Overview)).toBe('Overview');
    expect(resolveDashboardPageTitle(Routes.Home)).toBe('Organization');
    expect(resolveDashboardPageTitle(Routes.Billing)).toBe('Billing');
    expect(resolveDashboardPageTitle(Routes.Members)).toBe('Team members');
    expect(resolveDashboardPageTitle(Routes.Developers)).toBe('MCP');
  });

  it('maps agent tab paths', () => {
    expect(resolveDashboardPageTitle('/agents/abc/persona')).toBe('Persona');
    expect(resolveDashboardPageTitle('/agents/abc/knowledge')).toBe(
      'Knowledge'
    );
  });
});
