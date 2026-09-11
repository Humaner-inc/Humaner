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
        'suggest_mail_reply',
        'send_mail',
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
