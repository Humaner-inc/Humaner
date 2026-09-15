'use server';

import { revalidatePath } from 'next/cache';
import { MailMessageDirection, MailThreadFolder } from '@prisma/client';
import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import {
  mailThreadAccessWhere,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import { extractMailAddress } from '@/lib/inbox/mail-thread-folder';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';

function isMailboxAddress(value: string): boolean {
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
}

function revalidateBlockPaths(): void {
  revalidatePath(Routes.InboxAll);
  revalidatePath(Routes.InboxAssigned);
  revalidatePath(Routes.InboxArchive);
  revalidatePath(Routes.InboxSent);
  revalidatePath(Routes.InboxSpam);
  revalidatePath(Routes.InboxTrash);
  revalidatePath(Routes.InboxSettings);
}

async function moveSenderThreadsToSpam(
  organizationId: string,
  email: string
): Promise<number> {
  const candidates = await prisma.mailThread.findMany({
    where: {
      organizationId,
      folder: { not: MailThreadFolder.TRASH },
      messages: {
        some: {
          direction: MailMessageDirection.INBOUND,
          fromAddress: { contains: email, mode: 'insensitive' }
        }
      }
    },
    select: {
      id: true,
      messages: {
        where: { direction: MailMessageDirection.INBOUND },
        orderBy: { sentAt: 'asc' },
        take: 1,
        select: { fromAddress: true }
      }
    }
  });

  const threadIds = candidates
    .filter(
      (thread) =>
        extractMailAddress(thread.messages[0]?.fromAddress ?? '') === email
    )
    .map((thread) => thread.id);

  if (threadIds.length === 0) return 0;

  await prisma.mailThread.updateMany({
    where: { id: { in: threadIds }, organizationId },
    data: { folder: MailThreadFolder.SPAM, archivedAt: null }
  });

  return threadIds.length;
}

export const blockMailSender = authActionClient
  .metadata({ actionName: 'blockMailSender' })
  .schema(
    z.object({
      threadId: z.string().uuid().optional(),
      email: z.string().trim().max(255).optional()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    let email = parsedInput.email ? extractMailAddress(parsedInput.email) : '';

    if (!email && parsedInput.threadId) {
      const scope = await resolveMailAliasScope({
        userId: session.user.id,
        organizationId
      });
      const thread = await prisma.mailThread.findFirst({
        where: {
          id: parsedInput.threadId,
          ...mailThreadAccessWhere({
            organizationId,
            userId: session.user.id,
            scope
          })
        },
        select: {
          messages: {
            where: { direction: MailMessageDirection.INBOUND },
            orderBy: { sentAt: 'asc' },
            take: 1,
            select: { fromAddress: true }
          }
        }
      });
      if (!thread) throw new NotFoundError('Thread not found');
      email = extractMailAddress(thread.messages[0]?.fromAddress ?? '');
    }

    if (!email || !isMailboxAddress(email)) {
      throw new PreConditionError('Enter a valid email address to block');
    }

    await prisma.mailBlockedSender.upsert({
      where: {
        organizationId_email: {
          organizationId,
          email
        }
      },
      create: {
        id: crypto.randomUUID(),
        organizationId,
        email
      },
      update: {}
    });

    const moved = await moveSenderThreadsToSpam(organizationId, email);
    revalidateBlockPaths();
    return { success: true, email, moved };
  });

export const unblockMailSender = authActionClient
  .metadata({ actionName: 'unblockMailSender' })
  .schema(z.object({ email: z.string().trim().max(255) }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const email = extractMailAddress(parsedInput.email);
    await prisma.mailBlockedSender.deleteMany({
      where: { organizationId, email }
    });

    revalidateBlockPaths();
    return { success: true };
  });
