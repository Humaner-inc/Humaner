import 'server-only';

import { MailMessageDirection, type MailAssigneeKind } from '@prisma/client';

import { workspaceAllowsCompanionAction } from '@/data/inbox/companion-rights';
import { prisma } from '@/lib/db/prisma';
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
    return 'Companion';
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

  const current = await prisma.mailThread.findFirst({
    where: { id: input.threadId, organizationId: input.organizationId },
    select: { assigneeKind: true, assigneeId: true }
  });
  if (!current) {
    return { ok: false, reason: 'not_found' };
  }

  const expected = input.expected ?? current;
  const updated = await prisma.mailThread.updateMany({
    where: {
      id: input.threadId,
      organizationId: input.organizationId,
      assigneeKind: expected.assigneeKind,
      assigneeId: expected.assigneeId
    },
    data: {
      assigneeKind: next.assigneeKind,
      assigneeId: next.assigneeId
    }
  });

  if (updated.count === 0) {
    return { ok: false, reason: 'conflict' };
  }
  return { ok: true };
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

  const thread = await prisma.mailThread.findFirst({
    where: {
      id: input.threadId,
      organizationId: input.organizationId,
      assigneeKind: 'UNASSIGNED',
      assigneeId: null
    },
    select: {
      subject: true,
      messages: {
        where: { direction: MailMessageDirection.INBOUND },
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { fromAddress: true, bodyText: true }
      }
    }
  });
  if (!thread) return;

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

  await prisma.mailThread.updateMany({
    where: {
      id: input.threadId,
      organizationId: input.organizationId,
      assigneeKind: 'UNASSIGNED',
      assigneeId: null
    },
    data: teammateId
      ? { assigneeKind: 'HUMAN', assigneeId: teammateId }
      : { assigneeKind: 'COMPANION', assigneeId: null }
  });
}
