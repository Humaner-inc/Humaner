import { InvitationStatus, Role, WorkspaceRole } from '@prisma/client';
import { v4 } from 'uuid';

import { createDefaultBusinessHours } from '@/lib/auth/default-business-hours';
import { APP_ASSIGNABLE_ROLE } from '@/lib/auth/roles';
import { createOrganizationMembership } from '@/lib/auth/workspace-membership';
import { Tier } from '@/lib/billing/tier';
import { prisma } from '@/lib/db/prisma';
import { matchLocale } from '@/lib/i18n/match-locale';

/** Self-Host has no Cloud onboarding wizard — first-run is complete. */
const ONBOARDING_COMPLETE = true;

/** Account without a workspace — team members join or request access later. */
export async function createUserWithoutOrganization(input: {
  name: string;
  email: string;
  hashedPassword: string;
  locale?: string;
}): Promise<string> {
  const locale = matchLocale(input.locale);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: input.hashedPassword,
      role: APP_ASSIGNABLE_ROLE,
      workspaceRole: WorkspaceRole.TEAMMATE,
      locale,
      completedOnboarding: ONBOARDING_COMPLETE,
      organizationId: null,
      tier: Tier.Free
    },
    select: { id: true }
  });
  return user.id;
}

export async function createUserWithOrganization(input: {
  name: string;
  email: string;
  hashedPassword: string;
  locale?: string;
}): Promise<string> {
  const organizationId = v4();
  const initialName = 'My Organization';
  const locale = matchLocale(input.locale);

  await prisma.organization.create({
    data: {
      id: organizationId,
      name: initialName,
      completedOnboarding: ONBOARDING_COMPLETE,
      tier: Tier.Free,
      businessHours: createDefaultBusinessHours(),
      users: {
        create: {
          name: input.name,
          email: input.email,
          password: input.hashedPassword,
          role: APP_ASSIGNABLE_ROLE,
          workspaceRole: WorkspaceRole.OWNER,
          tier: Tier.Free,
          locale,
          completedOnboarding: ONBOARDING_COMPLETE
        }
      }
    },
    select: {
      id: true,
      users: { select: { id: true }, take: 1 }
    }
  });

  const createdUser = await prisma.user.findFirst({
    where: { email: input.email },
    select: { id: true }
  });
  if (createdUser) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { ownerId: createdUser.id }
    });

    await createOrganizationMembership({
      userId: createdUser.id,
      organizationId,
      workspaceRole: WorkspaceRole.OWNER
    });
  }

  const { recordAuditEvent } = await import('@/lib/audit/record-audit-event');
  await recordAuditEvent({
    organizationId,
    eventType: 'org.created',
    actorId: createdUser?.id ?? null,
    resourceType: 'organization',
    resourceId: organizationId,
    after: { name: initialName },
    captureIp: false
  });
  await recordAuditEvent({
    organizationId,
    eventType: 'workspace.created',
    actorId: createdUser?.id ?? null,
    resourceType: 'organization',
    resourceId: organizationId,
    after: { name: initialName },
    captureIp: false
  });

  return organizationId;
}

export async function createOrganizationAndConnectUser(input: {
  userId: string;
  normalizedEmail: string;
}): Promise<string> {
  const organizationId = v4();
  const initialName = 'My Organization';

  await prisma.$transaction([
    prisma.organization.create({
      data: {
        id: organizationId,
        name: initialName,
        ownerId: input.userId,
        completedOnboarding: ONBOARDING_COMPLETE,
        tier: Tier.Free,
        businessHours: createDefaultBusinessHours(),
        users: {
          connect: {
            id: input.userId
          }
        }
      },
      select: {
        id: true
      }
    }),
    prisma.user.update({
      where: { id: input.userId },
      data: {
        organizationId,
        workspaceRole: WorkspaceRole.OWNER,
        tier: Tier.Free
      }
    }),
    prisma.changeEmailRequest.deleteMany({
      where: { email: input.normalizedEmail }
    }),
    prisma.resetPasswordRequest.deleteMany({
      where: { email: input.normalizedEmail }
    })
  ]);

  await createOrganizationMembership({
    userId: input.userId,
    organizationId,
    workspaceRole: WorkspaceRole.OWNER
  });

  const { recordAuditEvent } = await import('@/lib/audit/record-audit-event');
  await recordAuditEvent({
    organizationId,
    eventType: 'org.created',
    actorId: input.userId,
    actorEmail: input.normalizedEmail,
    resourceType: 'organization',
    resourceId: organizationId,
    after: { name: initialName },
    captureIp: false
  });
  await recordAuditEvent({
    organizationId,
    eventType: 'workspace.created',
    actorId: input.userId,
    actorEmail: input.normalizedEmail,
    resourceType: 'organization',
    resourceId: organizationId,
    after: { name: initialName },
    captureIp: false
  });

  return organizationId;
}

export async function joinOrganization(input: {
  invitationId: string;
  organizationId: string;
  name: string;
  normalizedEmail: string;
  hashedPassword: string;
  role: Role;
  allowedPages: string[];
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.invitation.updateMany({
      where: { id: input.invitationId },
      data: { status: InvitationStatus.ACCEPTED }
    });
    await tx.verificationToken.updateMany({
      where: { identifier: input.normalizedEmail },
      data: { expires: new Date(+0) }
    });
    await tx.changeEmailRequest.deleteMany({
      where: { email: input.normalizedEmail }
    });
    await tx.resetPasswordRequest.deleteMany({
      where: { email: input.normalizedEmail }
    });

    const createdUser = await tx.user.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: input.normalizedEmail,
        password: input.hashedPassword,
        role: APP_ASSIGNABLE_ROLE,
        workspaceRole: WorkspaceRole.TEAMMATE,
        allowedPages: input.allowedPages,
        locale: 'en-US',
        emailVerified: new Date(),
        completedOnboarding: ONBOARDING_COMPLETE
      },
      select: {
        id: true
      }
    });

    await tx.organizationMembership.upsert({
      where: {
        userId_organizationId: {
          userId: createdUser.id,
          organizationId: input.organizationId
        }
      },
      create: {
        userId: createdUser.id,
        organizationId: input.organizationId,
        workspaceRole: WorkspaceRole.TEAMMATE,
        allowedPages: input.allowedPages
      },
      update: {
        workspaceRole: WorkspaceRole.TEAMMATE,
        allowedPages: input.allowedPages
      }
    });
  });
}

/**
 * Adds an existing Humaner account to a workspace via invitation.
 * Creates/updates membership and switches their active workspace.
 */
export async function acceptInvitationForExistingUser(input: {
  invitationId: string;
  userId: string;
  organizationId: string;
  allowedPages: string[];
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.invitation.updateMany({
      where: { id: input.invitationId },
      data: { status: InvitationStatus.ACCEPTED }
    });

    await tx.organizationMembership.upsert({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId: input.organizationId
        }
      },
      create: {
        userId: input.userId,
        organizationId: input.organizationId,
        workspaceRole: WorkspaceRole.TEAMMATE,
        allowedPages: input.allowedPages
      },
      update: {
        workspaceRole: WorkspaceRole.TEAMMATE,
        allowedPages: input.allowedPages
      }
    });

    await tx.user.update({
      where: { id: input.userId },
      data: {
        organizationId: input.organizationId,
        workspaceRole: WorkspaceRole.TEAMMATE,
        allowedPages: input.allowedPages
      }
    });
  });
}
