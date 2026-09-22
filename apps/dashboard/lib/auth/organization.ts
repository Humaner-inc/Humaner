import {
  InvitationStatus,
  Role,
  WorkspaceRole,
  type Prisma
} from '@prisma/client';
import { v4 } from 'uuid';

import { createDefaultBusinessHours } from '@/lib/auth/default-business-hours';
import { APP_ASSIGNABLE_ROLE } from '@/lib/auth/roles';
import { createOrganizationMembership } from '@/lib/auth/workspace-membership';
import { Tier } from '@/lib/billing/tier';
import { prisma } from '@/lib/db/prisma';
import {
  deleteChangeEmailRequestsByEmail,
  deleteResetPasswordRequestsByEmail,
  expireVerificationTokensForEmail
} from '@/lib/db/unique-mutations';
import { matchLocale } from '@/lib/i18n/match-locale';
import { PreConditionError } from '@/lib/validation/exceptions';

async function acceptPendingInvitation(
  tx: Prisma.TransactionClient,
  input: { invitationId: string; organizationId: string }
): Promise<void> {
  const invitation = await tx.invitation.findUnique({
    where: { id: input.invitationId },
    select: { id: true, organizationId: true, status: true }
  });
  if (
    !invitation ||
    invitation.organizationId !== input.organizationId ||
    invitation.status !== InvitationStatus.PENDING
  ) {
    throw new PreConditionError('Invitation is no longer pending');
  }
  await tx.invitation.update({
    where: { id: invitation.id },
    data: { status: InvitationStatus.ACCEPTED }
  });
}

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

  await prisma.$transaction(async (tx) => {
    await tx.organization.create({
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
    });
    await tx.user.update({
      where: { id: input.userId },
      data: {
        organizationId,
        workspaceRole: WorkspaceRole.OWNER,
        tier: Tier.Free
      }
    });
    await deleteChangeEmailRequestsByEmail(tx, input.normalizedEmail);
    await deleteResetPasswordRequestsByEmail(tx, input.normalizedEmail);
  });

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
  timeZone?: string | null;
  allowedAliasIds?: string[];
}): Promise<void> {
  let createdUserId: string | null = null;
  await prisma.$transaction(async (tx) => {
    await acceptPendingInvitation(tx, {
      invitationId: input.invitationId,
      organizationId: input.organizationId
    });
    await expireVerificationTokensForEmail(tx, input.normalizedEmail);
    await deleteChangeEmailRequestsByEmail(tx, input.normalizedEmail);
    await deleteResetPasswordRequestsByEmail(tx, input.normalizedEmail);

    const createdUser = await tx.user.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: input.normalizedEmail,
        password: input.hashedPassword,
        role: APP_ASSIGNABLE_ROLE,
        workspaceRole: WorkspaceRole.TEAMMATE,
        allowedPages: input.allowedPages,
        timeZone: input.timeZone ?? null,
        locale: 'en-US',
        emailVerified: new Date(),
        completedOnboarding: ONBOARDING_COMPLETE
      },
      select: {
        id: true
      }
    });
    createdUserId = createdUser.id;

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

  if (createdUserId) {
    const { applyInvitationGrants } = await import(
      '@/lib/inbox/apply-invitation-grants'
    );
    await applyInvitationGrants({
      userId: createdUserId,
      organizationId: input.organizationId,
      allowedPages: input.allowedPages,
      timeZone: input.timeZone,
      allowedAliasIds: input.allowedAliasIds
    });
  }
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
  timeZone?: string | null;
  allowedAliasIds?: string[];
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await acceptPendingInvitation(tx, {
      invitationId: input.invitationId,
      organizationId: input.organizationId
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

  const { applyInvitationGrants } = await import(
    '@/lib/inbox/apply-invitation-grants'
  );
  await applyInvitationGrants({
    userId: input.userId,
    organizationId: input.organizationId,
    allowedPages: input.allowedPages,
    timeZone: input.timeZone,
    allowedAliasIds: input.allowedAliasIds
  });
}
