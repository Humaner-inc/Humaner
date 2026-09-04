import 'server-only';

import { WorkspaceRole } from '@prisma/client';
import { v4 } from 'uuid';

import { createDefaultBusinessHours } from '@/lib/auth/default-business-hours';
import { prisma } from '@/lib/db/prisma';
import { extractWebsiteMetadata } from '@/lib/urls/extract-website-metadata';
import { getBusinessLogoUrl } from '@/lib/urls/get-business-logo-url';
import { ForbiddenError, NotFoundError } from '@/lib/validation/exceptions';

export type UserWorkspaceSummary = {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  isActive: boolean;
};

export async function getUserWorkspaces(
  userId: string,
  activeOrganizationId: string
): Promise<UserWorkspaceSummary[]> {
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId },
    select: {
      organization: {
        select: {
          id: true,
          name: true,
          website: true,
          logoUrl: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    website: membership.organization.website,
    logoUrl: membership.organization.logoUrl,
    isActive: membership.organization.id === activeOrganizationId
  }));
}

/**
 * Creates an additional workspace for a user who already has an account.
 * Self-Host has no Polar customer to share — the new workspace inherits the
 * account tier only.
 */
export async function createWorkspaceForUser(input: {
  userId: string;
  email: string;
  website: string;
}): Promise<string> {
  const organizationId = v4();
  let organizationName = 'New workspace';
  let logoUrl: string | undefined;

  try {
    const metadata = await extractWebsiteMetadata(input.website);
    if (metadata?.businessName) {
      organizationName = metadata.businessName;
    }
    logoUrl =
      getBusinessLogoUrl(input.website, {
        faviconUrl: metadata?.faviconUrl
      }) ?? undefined;
  } catch {
    logoUrl = getBusinessLogoUrl(input.website) ?? undefined;
  }

  const account = await prisma.user.findFirst({
    where: { id: input.userId },
    select: { tier: true }
  });

  const accountTier = account?.tier ?? 'free';

  await prisma.$transaction(async (tx) => {
    await tx.organization.create({
      data: {
        id: organizationId,
        name: organizationName,
        website: input.website,
        logoUrl,
        ownerId: input.userId,
        completedOnboarding: true,
        tier: accountTier,
        businessHours: createDefaultBusinessHours()
      }
    });

    await tx.organizationMembership.create({
      data: {
        userId: input.userId,
        organizationId,
        workspaceRole: WorkspaceRole.OWNER,
        allowedPages: []
      }
    });

    await tx.user.update({
      where: { id: input.userId },
      data: {
        organizationId,
        workspaceRole: WorkspaceRole.OWNER,
        allowedPages: [],
        completedOnboarding: true
      }
    });
  });

  return organizationId;
}

export async function switchUserWorkspace(input: {
  userId: string;
  organizationId: string;
}): Promise<void> {
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      userId: input.userId,
      organizationId: input.organizationId
    },
    select: {
      workspaceRole: true,
      allowedPages: true
    }
  });

  if (!membership) {
    throw new ForbiddenError('You do not have access to this workspace');
  }

  const organization = await prisma.organization.findFirst({
    where: { id: input.organizationId },
    select: { id: true }
  });
  if (!organization) {
    throw new NotFoundError('Workspace not found');
  }

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      organizationId: input.organizationId,
      workspaceRole: membership.workspaceRole,
      allowedPages: membership.allowedPages
    }
  });
}

export async function createOrganizationMembership(input: {
  userId: string;
  organizationId: string;
  workspaceRole: WorkspaceRole;
  allowedPages?: string[];
}): Promise<void> {
  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId: input.userId,
        organizationId: input.organizationId
      }
    },
    create: {
      userId: input.userId,
      organizationId: input.organizationId,
      workspaceRole: input.workspaceRole,
      allowedPages: input.allowedPages ?? []
    },
    update: {
      workspaceRole: input.workspaceRole,
      allowedPages: input.allowedPages ?? []
    }
  });
}
