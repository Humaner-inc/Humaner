'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import {
  aliasIdFilter,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import { sendMailThreadReply } from '@/lib/inbox/send-mail-thread-reply';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import {
  NotFoundError,
  PreConditionError,
  RateLimitExceededError,
  ValidationError
} from '@/lib/validation/exceptions';
import { replyMailThreadSchema } from '@/schemas/inbox/reply-mail-schema';

const replyLimiter = rateLimit({ intervalInMs: 15 * 60 * 1000 });

export const replyMailThread = pageActionClient('inbox')
  .metadata({ actionName: 'replyMailThread' })
  .schema(replyMailThreadSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }

    let distributedAttempts = 0;
    try {
      distributedAttempts = await incrementRateLimit(
        `rate-limit:mailbox-reply:${organizationId}`,
        15 * 60
      );
    } catch {
      // Fall back to the local limiter if Redis is temporarily unavailable.
    }

    const locallyRateLimited =
      distributedAttempts === 0 &&
      replyLimiter.check(30, `mailbox-reply:${session.user.id}`).isRateLimited;
    if (distributedAttempts > 40 || locallyRateLimited) {
      throw new RateLimitExceededError();
    }

    const scope = await resolveMailAliasScope({
      userId: session.user.id,
      organizationId
    });
    const scopedAliasIds = aliasIdFilter(scope);
    if (scope.type === 'ids' && scope.aliasIds.length === 0) {
      throw new NotFoundError('Thread not found');
    }

    const thread = await prisma.mailThread.findFirst({
      where: {
        id: parsedInput.threadId,
        organizationId,
        ...(scopedAliasIds ? { aliasId: scopedAliasIds } : {})
      },
      select: { id: true, aliasId: true }
    });

    if (!thread) {
      throw new ValidationError('Thread not found');
    }

    if (
      parsedInput.aliasId &&
      parsedInput.aliasId !== thread.aliasId &&
      scope.type === 'ids' &&
      !scope.aliasIds.includes(parsedInput.aliasId)
    ) {
      throw new ValidationError('That alias is not on this mailbox.');
    }

    let messageId: string;
    try {
      const sent = await sendMailThreadReply({
        threadId: thread.id,
        organizationId,
        body: parsedInput.body,
        ...(parsedInput.attachments?.length
          ? { attachments: parsedInput.attachments }
          : {}),
        aliasId: parsedInput.aliasId
      });
      messageId = sent.messageId;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      const detail =
        error instanceof Error && error.message
          ? error.message
          : 'Check mailbox settings and try again.';
      throw new ValidationError(`Could not send this reply. ${detail}`);
    }

    revalidatePath(Routes.InboxAll);
    revalidatePath(Routes.InboxAssigned);
    revalidatePath(inboxThreadRoute(thread.id));

    return { messageId };
  });
