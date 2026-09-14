import { describe, expect, it } from 'vitest';

import {
  resolveWorkspaceToolName,
  WORKSPACE_TOOL_NAMES
} from '@/lib/workspace-api/catalog';

describe('Workspace mailbox catalog', () => {
  it('exposes mail, task, and calendar tools for Companion, MCP, and REST', () => {
    expect(WORKSPACE_TOOL_NAMES).toEqual(
      expect.arrayContaining([
        'list_mail_threads',
        'list_mail_aliases',
        'suggest_mail_reply',
        'send_mail',
        'list_team_members',
        'list_connectors',
        'list_linear_issues',
        'create_github_issue',
        'list_stripe_invoices',
        'search_notion_pages',
        'request_teammate',
        'list_tasks',
        'create_task',
        'create_task_from_mail_thread',
        'list_calendar_events'
      ])
    );
    expect(resolveWorkspaceToolName('create_task_from_mail_thread')).toBe(
      'create_task_from_mail_thread'
    );
    expect(resolveWorkspaceToolName('create_ticket')).toBeNull();
  });
});
