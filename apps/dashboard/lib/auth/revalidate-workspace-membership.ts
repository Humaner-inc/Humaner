import 'server-only';

import { revalidateTag } from 'next/cache';

import { Caching, OrganizationCacheKey, UserCacheKey } from '@/data/caching';

/** Bust org directory + invitee profile caches after membership changes. */
export function revalidateWorkspaceMembership(input: {
  organizationId: string;
  userId?: string;
}): void {
  revalidateTag(
    Caching.createOrganizationTag(
      OrganizationCacheKey.Members,
      input.organizationId
    ),
    'max'
  );
  revalidateTag(
    Caching.createOrganizationTag(
      OrganizationCacheKey.Invitations,
      input.organizationId
    ),
    'max'
  );

  if (input.userId) {
    revalidateTag(
      Caching.createUserTag(UserCacheKey.Profile, input.userId),
      'max'
    );
    revalidateTag(
      Caching.createUserTag(UserCacheKey.OnboardingData, input.userId),
      'max'
    );
    revalidateTag(
      Caching.createUserTag(UserCacheKey.PersonalDetails, input.userId),
      'max'
    );
  }
}
