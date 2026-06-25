'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { PreConditionError } from '@/lib/validation/exceptions';

export const disableAuthenticatorApp = authActionClient
  .metadata({ actionName: 'disableAuthenticatorApp' })
  .action(async ({ ctx: { session } }) => {
    const count = await prisma.authenticatorApp.count({
      where: { userId: session.user.id }
    });
    if (count < 1) {
      throw new PreConditionError('Authenticator app is not enabled');
    }

    await prisma.authenticatorApp.deleteMany({
      where: { userId: session.user.id }
    });

    revalidateTag(
      Caching.createUserTag(
        UserCacheKey.MultiFactorAuthentication,
        session.user.id
      )
    );
  });
