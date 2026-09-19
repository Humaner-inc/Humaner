'use server';

import { pageActionClient } from '@/actions/safe-action';
import { composeMailboxMail } from '@/lib/inbox/compose-mailbox-mail';
import { resolveMailAliasScope } from '@/lib/inbox/mail-alias-scope';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import {
  NotFoundError,
  PreConditionError,
  RateLimitExceededError,
  ValidationError
} from '@/lib/validation/exceptions';
import { composeMailSchema } from '@/schemas/inbox/compose-mail-schema';

const composeLimiter = rateLimit({ intervalInMs: 15 * 60 * 1000 });

export const composeMail = pageActionClient('inbox')
  .metadata({ actionName: 'composeMail' })
  .schema(composeMailSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }

    let distributedAttempts = 0;
    try {
      distributedAttempts = await incrementRateLimit(
        `rate-limit:mailbox-compose:${organizationId}`,
        15 * 60
      );
    } catch {
      // Fall back to the local limiter if Redis is temporarily unavailable.
    }

    const locallyRateLimited =
      distributedAttempts === 0 &&
      composeLimiter.check(30, `mailbox-compose:${session.user.id}`)
        .isRateLimited;
    if (distributedAttempts > 40 || locallyRateLimited) {
      throw new RateLimitExceededError();
    }

    const scope = await resolveMailAliasScope({
      userId: session.user.id,
      organizationId
    });
    if (
      scope.type === 'ids' &&
      (scope.aliasIds.length === 0 ||
        !scope.aliasIds.includes(parsedInput.aliasId))
    ) {
      throw new NotFoundError('Alias not found');
    }

    try {
      return await composeMailboxMail({
        organizationId,
        actorUserId: session.user.id,
        aliasId: parsedInput.aliasId,
        to: parsedInput.to,
        subject: parsedInput.subject,
        body: parsedInput.body,
        ...(parsedInput.attachments?.length
          ? { attachments: parsedInput.attachments }
          : {}),
        ...(parsedInput.draftThreadId
          ? { draftThreadId: parsedInput.draftThreadId }
          : {})
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not send this email.';
      if (message === 'Alias not found') {
        throw new ValidationError('Alias not found');
      }
      throw new ValidationError(message);
    }
  });
