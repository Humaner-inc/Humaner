import 'server-only';

import { cache } from 'react';
import { getEffectivePlan } from '@humaner/shared/plans';
import {
  MailConnectionStatus,
  WorkspaceRole,
  type MailProvider
} from '@prisma/client';

import { resolveTeammateAccessLevel } from '@/constants/dashboard-pages';
import { readInboxAutoSuggestReplies } from '@/data/inbox/inbox-auto-suggest';
import { readTrashRetention } from '@/data/inbox/trash-retention';
import { dedupedAuth } from '@/lib/auth';
import { userCanAccessDashboardPage } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { humanizeMailboxSyncError } from '@/lib/inbox/gmail-sync-errors';
import type { MailTrashRetentionValue } from '@/lib/inbox/mail-trash-retention';

export type MailConnectionAlert = {
  id: string;
  email: string;
  provider: MailProvider;
  status: Exclude<MailConnectionStatus, 'ACTIVE'>;
  lastError: string | null;
};

export type InboxOverview = {
  orgTier: string;
  mailboxAliasLimit: number;
  aliasCount: number;
  connectionCount: number;
  hasConnections: boolean;
  locked: boolean;
  canManageProviders: boolean;
  canApplyMailboxAddOn: boolean;
  autoSuggestReplies: boolean;
  trashRetention: MailTrashRetentionValue;
  connectionAlerts: MailConnectionAlert[];
};

export const getInboxOverview = cache(
  async (): Promise<InboxOverview | null> => {
    const session = await dedupedAuth();
    if (!checkSession(session)) return null;

    if (!(await userCanAccessDashboardPage(session.user.id, 'inbox'))) {
      return null;
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) return null;

    const [
      organization,
      membership,
      autoSuggestReplies,
      trashRetention,
      brokenConnections
    ] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          tier: true,
          includedMessages: true,
          extraSeats: true,
          extraMailboxes: true,
          _count: {
            select: {
              mailboxConnections: true,
              mailAliases: true
            }
          }
        }
      }),
      prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId: session.user.id,
            organizationId
          }
        },
        select: { workspaceRole: true, allowedPages: true }
      }),
      readInboxAutoSuggestReplies(organizationId),
      readTrashRetention(organizationId),
      prisma.mailboxConnection.findMany({
        where: {
          organizationId,
          status: { not: MailConnectionStatus.ACTIVE }
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
        select: {
          id: true,
          email: true,
          provider: true,
          status: true,
          lastError: true
        }
      })
    ]);

    if (!organization) return null;

    const mailboxInboxLimit = getEffectivePlan(
      organization.tier,
      organization.includedMessages,
      {
        extraSeats: organization.extraSeats,
        extraMailboxes: organization.extraMailboxes
      }
    ).mailboxAliases;

    const canManageProviders =
      membership?.workspaceRole === WorkspaceRole.OWNER ||
      resolveTeammateAccessLevel(membership?.allowedPages ?? []) === 'admin';

    return {
      orgTier: organization.tier,
      mailboxAliasLimit: mailboxInboxLimit,
      aliasCount: organization._count.mailAliases,
      connectionCount: organization._count.mailboxConnections,
      hasConnections: organization._count.mailboxConnections > 0,
      locked: false,
      canManageProviders,
      canApplyMailboxAddOn: false,
      autoSuggestReplies,
      trashRetention,
      connectionAlerts: brokenConnections.map((connection) => ({
        id: connection.id,
        email: connection.email,
        provider: connection.provider,
        status: connection.status as MailConnectionAlert['status'],
        lastError: canManageProviders
          ? humanizeMailboxSyncError(connection.lastError)
          : null
      }))
    };
  }
);
