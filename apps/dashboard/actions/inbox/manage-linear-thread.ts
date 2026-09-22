'use server';

import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { readCompanionWorkspaceRights } from '@/data/inbox/companion-rights';
import { listThreadConnectorLinks } from '@/lib/connectors/events';
import type { CompanionIntegrationId } from '@/lib/inbox/companion-rights';
import { getConnectAccessToken } from '@/lib/vercel-connect/client';
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

export const getMailThreadTaskMenu = pageActionClient('inbox')
  .metadata({ actionName: 'getMailThreadTaskMenu' })
  .schema(z.object({ threadId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return { integrations: [], linearLinks: [] };
    }

    const { integrations: stored } =
      await readCompanionWorkspaceRights(organizationId);
    const extras = (
      await Promise.all(
        (['linear', 'github'] as const)
          .filter((id) => !stored.includes(id))
          .map(async (id) => {
            const grant = await getConnectAccessToken(organizationId, id);
            return grant.ok ? id : null;
          })
      )
    ).filter((id): id is 'linear' | 'github' => id != null);
    const integrations: CompanionIntegrationId[] = [...stored, ...extras];
    const linearLinks = integrations.includes('linear')
      ? await listThreadConnectorLinks(
          organizationId,
          parsedInput.threadId,
          'linear'
        )
      : [];

    return { integrations, linearLinks };
  });

export const listLinearIssuesForInbox = pageActionClient('inbox')
  .metadata({ actionName: 'listLinearIssuesForInbox' })
  .schema(
    z.object({
      query: z.string().max(200).optional()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) return { ok: false as const, error: 'No workspace.' };

    const result = await executeWorkspaceTool(
      'list_linear_issues',
      { query: parsedInput.query, limit: 12 },
      await actorContext(session.user.id, organizationId)
    );
    if (!result.ok) {
      return {
        ok: false as const,
        error: result.error ?? 'Could not list Linear issues.'
      };
    }

    const data = result.data as {
      issues?: Array<{
        id: string;
        identifier: string;
        title: string;
        url?: string | null;
        state?: string | null;
      }>;
      teams?: Array<{ id: string; name: string; key: string }>;
    };

    return {
      ok: true as const,
      issues: data.issues ?? [],
      teams: data.teams ?? []
    };
  });

export const createGithubFromThread = pageActionClient('inbox')
  .metadata({ actionName: 'createGithubFromThread' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      title: z.string().max(255).optional(),
      owner: z.string().optional(),
      repo: z.string().optional()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) return { ok: false as const, error: 'No workspace.' };

    const result = await executeWorkspaceTool(
      'create_github_issue',
      {
        title: parsedInput.title,
        owner: parsedInput.owner,
        repo: parsedInput.repo
      },
      await actorContext(session.user.id, organizationId)
    );
    return result.ok
      ? { ok: true as const, data: result.data }
      : {
          ok: false as const,
          error: result.error ?? 'Could not create GitHub issue.'
        };
  });
