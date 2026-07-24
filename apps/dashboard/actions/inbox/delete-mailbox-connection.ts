'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { ownerActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';

export const deleteMailboxConnection = ownerActionClient
  .metadata({ actionName: 'deleteMailboxConnection' })
  .schema(z.object({ connectionId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }

    const connection = await prisma.mailboxConnection.findFirst({
      where: {
        id: parsedInput.connectionId,
        organizationId
      },
      select: {
        id: true,
        email: true,
        _count: { select: { aliases: true } }
      }
    });

    if (!connection) {
      throw new NotFoundError('Mailbox connection not found');
    }

    // Cascades: aliases → threads → messages / notes / tags / members.
    await prisma.mailboxConnection.delete({
      where: { id: connection.id }
    });

    await recordAuditEvent({
      organizationId,
      eventType: 'mailbox.disconnected',
      actorId: session.user.id,
      actorEmail: session.user.email,
      resourceType: 'mailbox_connection',
      resourceId: connection.id,
      before: {
        email: connection.email,
        aliasCount: connection._count.aliases
      }
    });

    revalidatePath(Routes.Inbox);
    revalidatePath(Routes.InboxAll);
    revalidatePath(Routes.InboxAssigned);
    revalidatePath(Routes.InboxArchive);
    revalidatePath(Routes.InboxAliases);
    revalidatePath(Routes.InboxProviders);

    return {
      success: true,
      email: connection.email,
      aliasCount: connection._count.aliases
    };
  });
