import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { normalizeTier } from '@/lib/billing/tier';
import { prisma } from '@/lib/db/prisma';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';

/**
 * Self-Host (OSS) twin of `data/billing/get-sidebar-message-usage.ts`.
 *
 * Self-Host is unmetered — no message quota, no Polar/Redis metering. The shell
 * resolves this to an empty usage value behind `isOssDeployment()`; the twin
 * still returns a truthful DTO (0 used, 0 included) so any direct caller renders
 * "unmetered". josh renames it onto `get-sidebar-message-usage.ts`.
 */
export const getSidebarMessageUsage = cache(
  async (): Promise<SidebarMessageUsageDto> => {
    const session = await dedupedAuth();
    if (!checkSession(session)) {
      redirect(getLoginRedirect());
    }

    const organization = await prisma.organization.findFirst({
      where: { id: session.user.organizationId },
      select: { tier: true }
    });

    return {
      messagesUsed: 0,
      includedMessages: 0,
      creditsUsedCents: 0,
      creditsIncludedCents: 0,
      creditsRemainingCents: 0,
      billingModel: 'subscription',
      tier: normalizeTier(organization?.tier ?? 'free'),
      operatorOwnedQuota: false
    };
  }
);
