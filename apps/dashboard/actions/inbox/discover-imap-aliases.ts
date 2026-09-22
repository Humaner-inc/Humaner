'use server';

import { ownerActionClient } from '@/actions/safe-action';
import { prisma } from '@/lib/db/prisma';
import { buildValidatedMailEndpoints } from '@/lib/inbox/build-mail-endpoints';
import { discoverMailboxAliases } from '@/lib/inbox/discover-mailbox-aliases';
import {
  mailboxConnectQuotaFromOrg,
  orgWithGrantedAddOns,
  resolveNewMailboxSlot
} from '@/lib/inbox/mailbox-connect-quota';
import { testImapAndSmtp } from '@/lib/inbox/test-imap-smtp';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import {
  PreConditionError,
  ValidationError
} from '@/lib/validation/exceptions';
import { discoverImapAliasesSchema } from '@/schemas/inbox/connect-imap-schema';

const discoverMailboxLimiter = rateLimit({ intervalInMs: 15 * 60 * 1000 });

export const discoverImapAliases = ownerActionClient
  .metadata({ actionName: 'discoverImapAliases' })
  .schema(discoverImapAliasesSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }

    let distributedAttempts = 0;
    try {
      distributedAttempts = await incrementRateLimit(
        `rate-limit:mailbox-discover:${organizationId}`,
        15 * 60
      );
    } catch {
      // Fall back to the local limiter if Redis is temporarily unavailable.
    }

    const locallyRateLimited =
      distributedAttempts === 0 &&
      discoverMailboxLimiter.check(12, `mailbox-discover:${session.user.id}`)
        .isRateLimited;
    if (distributedAttempts > 12 || locallyRateLimited) {
      throw new ValidationError(
        'Too many mailbox scans. Wait a few minutes and try again.'
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        tier: true,
        includedMessages: true,
        extraSeats: true,
        extraMailboxes: true,
        completedOnboarding: true,
        _count: { select: { mailboxConnections: true } }
      }
    });
    if (!organization) {
      throw new PreConditionError('Organization not found');
    }

    const { primary, endpoints } =
      await buildValidatedMailEndpoints(parsedInput);

    const existingConnection = await prisma.mailboxConnection.findFirst({
      where: { organizationId, email: primary },
      select: { id: true }
    });

    if (!existingConnection) {
      const decision = await resolveNewMailboxSlot({
        organizationId,
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        quota: mailboxConnectQuotaFromOrg(
          await orgWithGrantedAddOns(organizationId, organization)
        )
      });
      if (decision.kind === 'requiresInbox') {
        throw new PreConditionError('Connecting a mailbox requires Inbox.');
      }
      if (decision.kind === 'planFull') {
        throw new ValidationError(decision.message);
      }
      if (decision.kind === 'needsMailbox') {
        return {
          needsMailbox: true as const,
          canApplyToBill: decision.canApplyToBill
        };
      }
    }

    try {
      await testImapAndSmtp(endpoints);
    } catch {
      throw new ValidationError(
        'Could not authenticate with these IMAP/SMTP settings. Check the credentials and try again.'
      );
    }

    let aliases = [primary];
    try {
      aliases = await discoverMailboxAliases(endpoints);
    } catch {
      // Fall back to the login email when inbox scanning is unavailable.
    }

    return {
      primary,
      aliases
    };
  });
