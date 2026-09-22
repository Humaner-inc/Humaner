'use server';

import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { listThreadConnectorLinks } from '@/lib/connectors/events';
import { executeWorkspaceTool } from '@/lib/workspace-api/execute-tools';

const threadIssueSchema = z.object({
  threadId: z.string().uuid(),
  title: z.string().max(255).optional(),
  issueId: z.string().min(1).optional(),
  teamId: z.string().optional()
});

async function actorContext(userId: string, organizationId: string) {
  return {
    organizationId,
    apiKeyId: null,
    actorUserId: userId,
    allowSend: false
  };
}

export const createLinearFromThread = pageActionClient('inbox')
  .metadata({ actionName: 'createLinearFromThread' })
  .schema(threadIssueSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) return { ok: false as const, error: 'No workspace.' };

    const result = await executeWorkspaceTool(
      'create_linear_issue',
      {
        threadId: parsedInput.threadId,
        title: parsedInput.title,
        teamId: parsedInput.teamId
      },
      await actorContext(session.user.id, organizationId)
    );
    return result.ok
      ? { ok: true as const, data: result.data }
      : {
          ok: false as const,
          error: result.error ?? 'Could not create issue.'
        };
  });

export const linkLinearToThread = pageActionClient('inbox')
  .metadata({ actionName: 'linkLinearToThread' })
  .schema(threadIssueSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) return { ok: false as const, error: 'No workspace.' };
    if (!parsedInput.issueId) {
      return { ok: false as const, error: 'Issue identifier is required.' };
    }

    const result = await executeWorkspaceTool(
      'link_linear_issue',
      { threadId: parsedInput.threadId, issueId: parsedInput.issueId },
      await actorContext(session.user.id, organizationId)
    );
    return result.ok
      ? { ok: true as const, data: result.data }
      : { ok: false as const, error: result.error ?? 'Could not link issue.' };
  });

export const listThreadLinearLinks = pageActionClient('inbox')
  .metadata({ actionName: 'listThreadLinearLinks' })
  .schema(z.object({ threadId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) return { links: [] };

    const links = await listThreadConnectorLinks(
      organizationId,
      parsedInput.threadId,
      'linear'
    );
    return { links };
  });
