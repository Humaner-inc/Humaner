'use server';

import { ownerActionClient } from '@/actions/safe-action';
import { buildValidatedMailEndpoints } from '@/lib/inbox/build-mail-endpoints';
import { discoverMailboxAliases } from '@/lib/inbox/discover-mailbox-aliases';
import { testImapAndSmtp } from '@/lib/inbox/test-imap-smtp';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import {
  PreConditionError,
  RateLimitExceededError,
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
        `rate-limit:mailbox-connect:${organizationId}`,
        15 * 60
      );
    } catch {
      // Fall back to the local limiter if Redis is temporarily unavailable.
    }

    const locallyRateLimited =
      distributedAttempts === 0 &&
      discoverMailboxLimiter.check(6, `mailbox-discover:${session.user.id}`)
        .isRateLimited;
    if (distributedAttempts > 5 || locallyRateLimited) {
      throw new RateLimitExceededError();
    }

    const { primary, endpoints } =
      await buildValidatedMailEndpoints(parsedInput);

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
