'use server';

import { revalidatePath } from 'next/cache';
import { syncGmailMailboxes } from '@/services/inbox/sync-gmail-mailboxes';
import { syncImapMailboxes } from '@/services/inbox/sync-imap-mailboxes';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import {
  PreConditionError,
  RateLimitExceededError
} from '@/lib/validation/exceptions';

const syncInboxLimiter = rateLimit({ intervalInMs: 5 * 60 * 1000 });

export const syncInboxNow = pageActionClient('inbox')
  .metadata({ actionName: 'syncInboxNow' })
  .schema(z.object({}))
  .action(async ({ ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }

    let distributedAttempts = 0;
    try {
      distributedAttempts = await incrementRateLimit(
        `rate-limit:mailbox-sync:${organizationId}`,
        5 * 60
      );
    } catch {
      // Fall back to the local limiter if Redis is temporarily unavailable.
    }

    const locallyRateLimited =
      distributedAttempts === 0 &&
      syncInboxLimiter.check(2, `mailbox-sync:${organizationId}`).isRateLimited;
    if (distributedAttempts > 2 || locallyRateLimited) {
      throw new RateLimitExceededError();
    }

    const [imap, gmail] = await Promise.all([
      syncImapMailboxes({
        organizationId,
        actorId: session.user.id,
        actorName: session.user.name
      }),
      syncGmailMailboxes({ organizationId })
    ]);
    const result = {
      connections: imap.connections + gmail.connections,
      messages: imap.messages + gmail.messages,
      errors: imap.errors + gmail.errors
    };

    revalidatePath(Routes.InboxAll);
    revalidatePath(Routes.InboxAssigned);

    return result;
  });
