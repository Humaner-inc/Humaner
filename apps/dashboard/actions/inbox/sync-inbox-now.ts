'use server';

import { revalidatePath } from 'next/cache';
import { syncImapMailboxes } from '@/services/inbox/sync-imap-mailboxes';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';
import { syncGmailMailboxes } from '@/lib/inbox/gmail-bridge';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import {
  PreConditionError,
  RateLimitExceededError
} from '@/lib/validation/exceptions';

/** Allow ~10s auto-detect polls plus manual sync without false rate limits. */
const SYNC_RATE_LIMIT_PER_MINUTE = 30;
const syncInboxLimiter = rateLimit({ intervalInMs: 60 * 1000 });

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
        60
      );
    } catch {
      // Fall back to the local limiter if Redis is temporarily unavailable.
    }

    const locallyRateLimited =
      distributedAttempts === 0 &&
      syncInboxLimiter.check(
        SYNC_RATE_LIMIT_PER_MINUTE + 1,
        `mailbox-sync:${organizationId}`
      ).isRateLimited;
    if (
      distributedAttempts > SYNC_RATE_LIMIT_PER_MINUTE ||
      locallyRateLimited
    ) {
      throw new RateLimitExceededError();
    }

    const [imap, gmail] = await Promise.all([
      syncImapMailboxes({
        organizationId,
        actorId: session.user.id,
        actorName: session.user.name
      }),
      isOssDeployment()
        ? Promise.resolve({ connections: 0, messages: 0, errors: 0 })
        : // Inbox-first: keep auto-detect / Sync snappy. Spam/sent/etc. catch up on cron.
          syncGmailMailboxes({
            organizationId,
            inboxOnly: true,
            priority: 'user'
          })
    ]);
    const result = {
      connections: imap.connections + gmail.connections,
      messages: imap.messages + gmail.messages,
      errors: imap.errors + gmail.errors
    };

    revalidatePath(Routes.InboxAll);
    revalidatePath(Routes.InboxAssigned);
    revalidatePath(Routes.InboxArchive);
    revalidatePath(Routes.InboxSent);
    revalidatePath(Routes.InboxSpam);
    revalidatePath(Routes.InboxTrash);
    revalidatePath(Routes.InboxDrafts);

    return result;
  });
