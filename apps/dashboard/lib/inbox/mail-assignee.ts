import 'server-only';

import type { MailAssigneeKind } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import {
  COMPANION_ASSIGNEE,
  type MailAssigneeInput
} from '@/lib/inbox/mail-assignee-shared';

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
    select: { companionPolicy: true }
  });
  if (!alias) return;
  if (alias.companionPolicy !== 'ASSIGN' && alias.companionPolicy !== 'SEND') {
    return;
  }

  await prisma.mailThread.updateMany({
    where: {
      id: input.threadId,
      organizationId: input.organizationId,
      assigneeKind: 'UNASSIGNED',
      assigneeId: null
    },
    data: {
      assigneeKind: 'COMPANION',
      assigneeId: null
    }
  });
}
