import { describe, expect, it } from 'vitest';

import {
  CONNECTOR_TOOL_INTEGRATION,
  connectorActivationError
} from '@/lib/inbox/companion-rights';
import { WORKSPACE_TOOL_NAMES } from '@/lib/workspace-api/catalog';

describe('connectorActivationError', () => {
  it('lets mailbox tools through — they are not connector tools', () => {
    expect(connectorActivationError('list_mail_threads', [])).toBeNull();
    expect(connectorActivationError('send_mail', [])).toBeNull();
  });

  it('lets a connector tool run once its app is activated', () => {
    expect(
      connectorActivationError('create_linear_issue', ['linear'])
    ).toBeNull();
    expect(
      connectorActivationError('search_notion_pages', ['github', 'notion'])
    ).toBeNull();
  });

  it('refuses a connector tool and names where to activate it', () => {
    expect(connectorActivationError('create_linear_issue', ['github'])).toBe(
      'linear is not connected. Activate it in Workspace Settings → Connect.'
    );
    expect(connectorActivationError('list_stripe_invoices', [])).toBe(
      'stripe is not connected. Activate it in Workspace Settings → Connect.'
    );
  });

  it('gates every connector tool in the catalog', () => {
    const connectorTools = WORKSPACE_TOOL_NAMES.filter((name) =>
      /linear|github|stripe|notion/.test(name)
    );

    expect(connectorTools.length).toBeGreaterThan(0);
    for (const name of connectorTools) {
      expect(CONNECTOR_TOOL_INTEGRATION[name]).toBeDefined();
      expect(connectorActivationError(name, [])).toContain('is not connected');
    }
  });
});
