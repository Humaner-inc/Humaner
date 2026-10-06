'use server';

import { revalidatePath } from 'next/cache';
import { MailProvider } from '@prisma/client';
import { z } from 'zod';

import { ownerActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { prisma } from '@/lib/db/prisma';
import { stopGmailWatch } from '@/lib/inbox/gmail/watch';
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
        provider: true,
        aliases: { select: { id: true, address: true } },
        _count: { select: { aliases: true } }
      }
    });

    if (!connection) {
      throw new NotFoundError('Mailbox connection not found');
    }

    if (connection.provider === MailProvider.GMAIL) {
      await stopGmailWatch(connection.id).catch((error) => {
        console.error('[gmail-watch] stop failed', connection.id, error);
      });
    }

    // Cascades: aliases → threads → messages / notes / tags / members.
    await prisma.mailboxConnection.delete({
      where: { id: connection.id }
    });

    for (const alias of connection.aliases) {
      await recordAuditEvent({
        organizationId,
        eventType: 'mailbox.alias_removed',
        actorId: session.user.id,
        actorEmail: session.user.email,
        resourceType: 'mail_alias',
        resourceId: alias.id,
        before: { address: alias.address, connectionId: connection.id }
      });
    }

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
