import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  UserCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type { MultiFactorAuthenticationDto } from '@/types/dtos/multi-factor-authentication-dto';

export async function getMultiFactorAuthentication(): Promise<MultiFactorAuthenticationDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const authenticatorApp = await prisma.authenticatorApp.findFirst({
        where: { userId: session.user.id },
        select: {
          id: true,
          accountName: true,
          issuer: true,
          createdAt: true
        }
      });
      const response: MultiFactorAuthenticationDto = {
        authenticatorApp: authenticatorApp ?? undefined
      };

      return response;
    },
    Caching.createUserKeyParts(
      UserCacheKey.MultiFactorAuthentication,
      session.user.id
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createUserTag(
          UserCacheKey.MultiFactorAuthentication,
          session.user.id
        )
      ]
    }
  )();
}
