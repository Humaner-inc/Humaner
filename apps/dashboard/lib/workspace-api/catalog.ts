/**
 * Mail + calendar tools. REST and MCP share these handlers.
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
      'Reply on a thread. Requires the alias Companion policy to be send, or a human actor.',
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
    name: 'assign_mail_thread',
    description: 'Assign a thread to a teammate, Companion, or unassign it.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        threadId: { type: 'string', format: 'uuid' },
        assigneeId: {
          type: 'string',
          description: 'User UUID, "companion", or null to unassign.'
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
    description: 'Create a hosted calendar event.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 255 },
        startsAt: { type: 'string' },
        endsAt: { type: 'string' },
        description: { type: 'string', maxLength: 8000 }
      },
      required: ['title', 'startsAt']
    }
  }
];
