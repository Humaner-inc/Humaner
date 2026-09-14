/**
 * Mail + task + calendar tools. Companion, MCP, and REST share these handlers
 * so mailbox behaviour (alias send policy, org scoping) cannot drift between
 * the in-app agent and external ones.
 */
export const WORKSPACE_TOOL_NAMES = [
  'list_mail_threads',
  'read_mail_thread',
  'search_mail_threads',
  'suggest_mail_reply',
  'send_mail',
  'assign_mail_thread',
  'tag_mail_thread',
  'add_mail_thread_note',
  'list_tasks',
  'create_task',
  'create_task_from_mail_thread',
  'list_calendar_events',
  'create_calendar_event'
] as const;

export type WorkspaceToolName = (typeof WORKSPACE_TOOL_NAMES)[number];

export type WorkspaceToolDefinition = {
  name: WorkspaceToolName;
  description: string;
  inputSchema: Record<string, unknown>;
};

export function resolveWorkspaceToolName(
  value: string
): WorkspaceToolName | null {
  return WORKSPACE_TOOL_NAMES.includes(value as WorkspaceToolName)
    ? (value as WorkspaceToolName)
    : null;
}

export const WORKSPACE_TOOLS: WorkspaceToolDefinition[] = [
  {
    name: 'list_mail_threads',
    description:
      'List recent mailbox threads in this workspace. Filter by unread, status, or mailbox.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        unreadOnly: { type: 'boolean' },
        status: { type: 'string', enum: ['OPEN', 'PENDING', 'RESOLVED'] },
        limit: { type: 'integer', minimum: 1, maximum: 100 }
      }
    }
  },
  {
    name: 'read_mail_thread',
    description: 'Read one thread: messages, notes, assignee, and linked task.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        threadId: { type: 'string', format: 'uuid' }
      },
      required: ['threadId']
    }
  },
  {
    name: 'search_mail_threads',
    description: 'Search threads by subject or message text.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: { type: 'string', minLength: 1, maxLength: 200 },
        limit: { type: 'integer', minimum: 1, maximum: 50 }
      },
      required: ['query']
    }
  },
  {
    name: 'suggest_mail_reply',
    description:
      'Draft reply suggestions for a thread. Does not send. Same suggest-mail-replies path as the inbox.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        threadId: { type: 'string', format: 'uuid' }
      },
      required: ['threadId']
    }
  },
  {
    name: 'send_mail',
    description:
      'Send mail. Reply when threadId is set. Compose a new email when to, subject, and body are set (no thread required). Workspace Companion send must be on. If several aliases or inboxes exist, omit aliasId first — the tool returns them so you can ask which one with ##FORK## buttons, then call again with aliasId or from.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        threadId: { type: 'string', format: 'uuid' },
        to: {
          type: 'string',
          description: 'Recipient for a new email. Required when composing.'
        },
        subject: {
          type: 'string',
          description: 'Subject for a new email. Required when composing.'
        },
        body: { type: 'string', minLength: 1, maxLength: 8000 },
        aliasId: {
          type: 'string',
          format: 'uuid',
          description: 'Mailbox alias to send a new email from.'
        },
        from: {
          type: 'string',
          description:
            'Alias address to send a new email from, if aliasId is unknown.'
        }
      },
      required: ['body']
    }
  },
  {
    name: 'assign_mail_thread',
    description:
      'Assign a thread to a teammate, Companion, or unassign it. Omit assigneeId to pick the least-loaded matching team profile from the thread (inbox, Stripe, GitHub, Linear). Pass topics to override. Pass assigneeId null to unassign.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        threadId: { type: 'string', format: 'uuid' },
        assigneeId: {
          type: 'string',
          description:
            'User UUID, "companion", or null to unassign. Omit when using topics.'
        },
        topics: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Skills to match on team profiles: inbox, billing, stripe, github, linear, and so on.'
        }
      },
      required: ['threadId']
    }
  },
  {
    name: 'tag_mail_thread',
    description: 'Apply or clear a mailbox tag on a thread.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        threadId: { type: 'string', format: 'uuid' },
        tagId: { type: 'string', format: 'uuid' }
      },
      required: ['threadId']
    }
  },
  {
    name: 'add_mail_thread_note',
    description:
      'Add an internal human note. Never sent to the customer. Companion must not use this.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        threadId: { type: 'string', format: 'uuid' },
        body: { type: 'string', minLength: 1, maxLength: 8000 }
      },
      required: ['threadId', 'body']
    }
  },
  {
    name: 'list_tasks',
    description:
      'List workspace tasks. Tasks are the work items behind mail threads.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        status: {
          type: 'string',
          enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
        },
        limit: { type: 'integer', minimum: 1, maximum: 50 }
      }
    }
  },
  {
    name: 'create_task',
    description:
      'Create a standalone workspace task. Use create_task_from_mail_thread when the work comes from a thread.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        subject: { type: 'string', minLength: 1, maxLength: 255 },
        summary: { type: 'string', maxLength: 4000 },
        urgency: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        },
        assigneeId: { type: 'string', format: 'uuid' },
        topics: {
          type: 'array',
          items: { type: 'string' },
          description:
            'When assigneeId is omitted, pick a teammate from profiles. Infer stripe, github, linear, billing, or inbox from the subject if topics are omitted.'
        }
      },
      required: ['subject']
    }
  },
  {
    name: 'create_task_from_mail_thread',
    description:
      'Turn a mail thread into a task, carrying the transcript. Returns the existing task when the thread already has one.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        threadId: { type: 'string', format: 'uuid' },
        assigneeId: { type: 'string', format: 'uuid' },
        topics: {
          type: 'array',
          items: { type: 'string' },
          description:
            'When assigneeId is omitted, pick a teammate from profiles. Infer skills from the thread (inbox, Stripe, GitHub, Linear) if topics are omitted.'
        }
      },
      required: ['threadId']
    }
  },
  {
    name: 'list_calendar_events',
    description: 'List hosted calendar events for a week (Monday start).',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        weekStart: { type: 'string' }
      }
    }
  },
  {
    name: 'create_calendar_event',
    description:
      'Create a hosted calendar event now. Pass startsAt as ISO, or when as a phrase like "this Saturday at 2pm".',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 255 },
        startsAt: { type: 'string' },
        when: { type: 'string' },
        endsAt: { type: 'string' },
        description: { type: 'string', maxLength: 8000 }
      },
      required: ['title']
    }
  }
];
