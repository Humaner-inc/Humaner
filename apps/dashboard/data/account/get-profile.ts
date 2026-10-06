import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { WorkspaceRole } from '@prisma/client';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  UserCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export async function getProfile(): Promise<ProfileDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const userFromDb = await prisma.user.findFirst({
        where: { id: session.user.id },
        select: {
          id: true,
          image: true,
          name: true,
          email: true,
          role: true,
          locale: true,
          timeZone: true,
          organizationId: true,
          organizationMemberships: {
            select: {
              organizationId: true,
              workspaceRole: true,
              allowedPages: true
            }
          }
        }
      });
      if (!userFromDb) {
        throw new NotFoundError('User not found');
      }

      const membership = userFromDb.organizationMemberships.find(
        (row) => row.organizationId === userFromDb.organizationId
      );

      const response: ProfileDto = {
        id: userFromDb.id,
        image: userFromDb.image ?? undefined,
        name: userFromDb.name,
        email: userFromDb.email ?? undefined,
        role: userFromDb.role,
        workspaceRole: membership?.workspaceRole ?? WorkspaceRole.TEAMMATE,
        allowedPages: membership?.allowedPages ?? [],
        locale: userFromDb.locale,
        timeZone: userFromDb.timeZone
      };

      return response;
    },
    Caching.createUserKeyParts(
      UserCacheKey.Profile,
      session.user.id,
      session.user.organizationId ?? 'none'
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createUserTag(UserCacheKey.Profile, session.user.id),
        Caching.createUserTag(UserCacheKey.PersonalDetails, session.user.id),
        Caching.createUserTag(UserCacheKey.Preferences, session.user.id)
      ]
    }
  )();
}
