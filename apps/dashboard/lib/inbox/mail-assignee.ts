import 'server-only';

import {
  MailMessageDirection,
  Prisma,
  type MailAssigneeKind
} from '@prisma/client';

import { workspaceAllowsCompanionAction } from '@/data/inbox/companion-rights';
import { prisma } from '@/lib/db/prisma';
import { isPrismaSerializationFailure } from '@/lib/db/unique-mutations';
import { isOssDeployment } from '@/lib/deployment-mode';
import {
  COMPANION_ASSIGNEE,
  type MailAssigneeInput
} from '@/lib/inbox/mail-assignee-shared';
import { resolveProfileAssignee } from '@/lib/team/resolve-profile-assignee';
import { inferRoutingTopics } from '@/lib/team/routing-topics';

export { COMPANION_ASSIGNEE, type MailAssigneeInput };

export type MailAssigneeState = {
  assigneeKind: MailAssigneeKind;
  assigneeId: string | null;
};

export function parseMailAssigneeInput(
  assigneeId: MailAssigneeInput
): MailAssigneeState {
  if (assigneeId === COMPANION_ASSIGNEE) {
    return { assigneeKind: 'COMPANION', assigneeId: null };
  }
  if (!assigneeId) {
    return { assigneeKind: 'UNASSIGNED', assigneeId: null };
  }
  return { assigneeKind: 'HUMAN', assigneeId };
}

export function mailAssigneeLabel(input: {
  assigneeKind?: MailAssigneeKind | string | null;
  assigneeName?: string | null;
}): string | null {
  if (input.assigneeKind === 'COMPANION') {
    // Same assignee slot MCP and REST use. Cloud calls it Companion; Self-Host
    // is the customer's own agent on the workspace API.
    return isOssDeployment() ? 'Agent' : 'Companion';
  }
  return input.assigneeName ?? null;
}

export async function applyMailThreadAssignee(input: {
  threadId: string;
  organizationId: string;
  assignee: MailAssigneeInput;
  expected?: MailAssigneeState;
}): Promise<{ ok: true } | { ok: false; reason: 'conflict' | 'not_found' }> {
  const next = parseMailAssigneeInput(input.assignee);

  if (next.assigneeKind === 'HUMAN' && next.assigneeId) {
    const member = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: next.assigneeId,
          organizationId: input.organizationId
        }
      },
      select: { id: true }
    });
    if (!member) {
      return { ok: false, reason: 'not_found' };
    }
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const current = await tx.mailThread.findUnique({
          where: { id: input.threadId },
          select: {
            organizationId: true,
            assigneeKind: true,
            assigneeId: true
          }
        });
        if (!current || current.organizationId !== input.organizationId) {
          return { ok: false as const, reason: 'not_found' as const };
        }

        const expected = input.expected ?? current;
        if (
          current.assigneeKind !== expected.assigneeKind ||
          current.assigneeId !== expected.assigneeId
        ) {
          return { ok: false as const, reason: 'conflict' as const };
        }

        await tx.mailThread.update({
          where: { id: input.threadId },
          data: {
            assigneeKind: next.assigneeKind,
            assigneeId: next.assigneeId
          }
        });
        return { ok: true as const };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (isPrismaSerializationFailure(error)) {
      return { ok: false, reason: 'conflict' };
    }
    throw error;
  }
}

export async function applyCompanionAliasPolicyOnInbound(input: {
  organizationId: string;
  threadId: string;
  aliasId: string;
}): Promise<void> {
  const alias = await prisma.mailAlias.findFirst({
    where: { id: input.aliasId, organizationId: input.organizationId },
    select: { id: true }
  });
  if (!alias) return;

  const allowed = await workspaceAllowsCompanionAction(
    input.organizationId,
    'ASSIGN'
  );
  if (!allowed) return;

  const thread = await prisma.mailThread.findUnique({
    where: { id: input.threadId },
    select: {
      organizationId: true,
      assigneeKind: true,
      assigneeId: true,
      subject: true,
      messages: {
        where: { direction: MailMessageDirection.INBOUND },
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { fromAddress: true, bodyText: true }
      }
    }
  });
  if (
    !thread ||
    thread.organizationId !== input.organizationId ||
    thread.assigneeKind !== 'UNASSIGNED' ||
    thread.assigneeId !== null
  ) {
    return;
  }

  const inbound = thread.messages[0];
  const inferred = inferRoutingTopics({
    subject: thread.subject,
    body: inbound?.bodyText,
    fromAddress: inbound?.fromAddress
  });
  const teammateId = await resolveProfileAssignee(
    input.organizationId,
    inferred.length > 0 ? inferred : ['inbox']
  );

  await prisma.$transaction(
    async (tx) => {
      const current = await tx.mailThread.findUnique({
        where: { id: input.threadId },
        select: {
          organizationId: true,
          assigneeKind: true,
          assigneeId: true
        }
      });
      if (
        !current ||
        current.organizationId !== input.organizationId ||
        current.assigneeKind !== 'UNASSIGNED' ||
        current.assigneeId !== null
      ) {
        return;
      }
      await tx.mailThread.update({
        where: { id: input.threadId },
        data: teammateId
          ? { assigneeKind: 'HUMAN', assigneeId: teammateId }
          : { assigneeKind: 'COMPANION', assigneeId: null }
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
