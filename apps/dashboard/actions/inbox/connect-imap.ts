'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { syncImapMailboxes } from '@/services/inbox/sync-imap-mailboxes';
import { MailProvider, Prisma } from '@prisma/client';

import { ownerActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { prisma } from '@/lib/db/prisma';
import {
  buildValidatedMailEndpoints,
  normalizeMailboxAddress
} from '@/lib/inbox/build-mail-endpoints';
import { getMailboxAliasLimit } from '@/lib/inbox/plan';
import { testImapAndSmtp } from '@/lib/inbox/test-imap-smtp';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import { encryptSensitiveField } from '@/lib/security/sensitive-fields';
import {
  PreConditionError,
  ValidationError
} from '@/lib/validation/exceptions';
import { connectImapSchema } from '@/schemas/inbox/connect-imap-schema';

const connectMailboxLimiter = rateLimit({ intervalInMs: 15 * 60 * 1000 });

export const connectImap = ownerActionClient
  .metadata({ actionName: 'connectImap' })
  .schema(connectImapSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }

    let distributedAttempts = 0;
    try {
      distributedAttempts = await incrementRateLimit(
        `rate-limit:mailbox-connect:${organizationId}`,
        15 * 60
      );
    } catch {
      // Fall back to the local limiter if Redis is temporarily unavailable.
    }

    const locallyRateLimited =
      distributedAttempts === 0 &&
      connectMailboxLimiter.check(12, `mailbox-connect:${session.user.id}`)
        .isRateLimited;
    if (distributedAttempts > 12 || locallyRateLimited) {
      throw new ValidationError(
        'Too many connection attempts. Wait a few minutes and try again.'
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        tier: true,
        _count: { select: { mailAliases: true } }
      }
    });

    if (!organization) {
      throw new PreConditionError('Organization not found');
    }

    const aliasLimit = getMailboxAliasLimit(organization.tier);
    if (aliasLimit <= 0) {
      throw new PreConditionError(
        'Collaborative mailbox requires Classic or higher'
      );
    }

    const { primary, endpoints } =
      await buildValidatedMailEndpoints(parsedInput);
    const selectedAliases = [
      ...new Set(
        parsedInput.aliases.map(normalizeMailboxAddress).filter(Boolean)
      )
    ];

    if (!selectedAliases.includes(primary)) {
      throw new ValidationError(
        'The login email must stay selected as an alias.'
      );
    }

    const uniqueAliases = [...new Set([primary, ...selectedAliases])];
    const primaryDomain = primary.slice(primary.lastIndexOf('@') + 1);

    if (
      uniqueAliases.some(
        (address) =>
          address.slice(address.lastIndexOf('@') + 1) !== primaryDomain
      )
    ) {
      throw new ValidationError(
        'All aliases must use the same domain as the connected mailbox.'
      );
    }

    const remaining = aliasLimit - organization._count.mailAliases;
    if (uniqueAliases.length > remaining) {
      throw new ValidationError(
        `This plan allows ${aliasLimit} alias${aliasLimit === 1 ? '' : 'es'}. You can add ${Math.max(0, remaining)} more.`
      );
    }

    const [existingConnection, existingAliases] = await Promise.all([
      prisma.mailboxConnection.findFirst({
        where: { organizationId, email: primary },
        select: { email: true }
      }),
      prisma.mailAlias.findMany({
        where: {
          organizationId,
          address: { in: uniqueAliases }
        },
        select: { address: true }
      })
    ]);

    if (existingConnection) {
      throw new ValidationError(
        `${existingConnection.email} is already connected to this workspace.`
      );
    }

    if (existingAliases.length > 0) {
      throw new ValidationError(
        `${existingAliases[0].address} is already connected to this workspace.`
      );
    }

    try {
      await testImapAndSmtp(endpoints);
    } catch {
      await recordAuditEvent({
        organizationId,
        eventType: 'mailbox.connection_failed',
        actorId: session.user.id,
        actorEmail: session.user.email,
        resourceType: 'mailbox',
        metadata: { email: primary, provider: 'imap' }
      });
      throw new ValidationError(
        'Could not authenticate with these IMAP/SMTP settings. Check the credentials and try again.'
      );
    }

    const enc = (value: string): string => {
      const encrypted = encryptSensitiveField(value);
      if (!encrypted) {
        throw new PreConditionError('Failed to encrypt mailbox credentials');
      }
      return encrypted;
    };

    let connection: { id: string };
    try {
      connection = await prisma.$transaction(
        async (tx) => {
          const currentAliasCount = await tx.mailAlias.count({
            where: { organizationId }
          });

          if (currentAliasCount + uniqueAliases.length > aliasLimit) {
            throw new ValidationError(
              `This plan allows ${aliasLimit} alias${aliasLimit === 1 ? '' : 'es'}.`
            );
          }

          const created = await tx.mailboxConnection.create({
            data: {
              organizationId,
              provider: MailProvider.IMAP,
              providerPresetId: parsedInput.providerId.slice(0, 64),
              email: primary,
              imapHost: enc(endpoints.imapServername),
              imapPort: endpoints.imapPort,
              imapUser: enc(primary),
              imapPassword: enc(parsedInput.password),
              imapTls: endpoints.imapTls,
              smtpHost: enc(endpoints.smtpServername),
              smtpPort: endpoints.smtpPort,
              smtpUser: enc(parsedInput.smtpUser?.trim() || primary),
              smtpPassword: enc(
                parsedInput.smtpPassword || parsedInput.password
              ),
              smtpTls: endpoints.smtpTls
            }
          });

          await tx.mailAlias.createMany({
            data: uniqueAliases.map((address) => ({
              organizationId,
              connectionId: created.id,
              address,
              enabled: true
            }))
          });

          const aliases = await tx.mailAlias.findMany({
            where: { connectionId: created.id },
            select: { id: true }
          });

          if (aliases.length > 0) {
            await tx.mailAliasMember.createMany({
              data: aliases.map((alias) => ({
                aliasId: alias.id,
                userId: session.user.id
              })),
              skipDuplicates: true
            });
          }

          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (
        error instanceof ValidationError ||
        (error instanceof Error && error.name === 'ValidationError')
      ) {
        throw error instanceof ValidationError
          ? error
          : new ValidationError(error.message);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
      ) {
        throw new ValidationError(
          error.code === 'P2002'
            ? 'That mailbox or alias is already connected to this workspace.'
            : 'Mailbox settings changed during setup. Please try again.'
        );
      }
      throw error;
    }

    revalidatePath(Routes.Inbox);
    revalidatePath(Routes.InboxAll);
    revalidatePath(Routes.InboxAliases);
    revalidatePath(Routes.InboxProviders);

    await recordAuditEvent({
      organizationId,
      eventType: 'mailbox.connected',
      actorId: session.user.id,
      actorEmail: session.user.email,
      resourceType: 'mailbox_connection',
      resourceId: connection.id,
      after: {
        email: primary,
        provider: 'imap',
        aliasCount: uniqueAliases.length
      }
    });

    after(async () => {
      await syncImapMailboxes({ connectionId: connection.id });
      revalidatePath(Routes.InboxAll);
    });

    return { connectionId: connection.id, aliasCount: uniqueAliases.length };
  });
