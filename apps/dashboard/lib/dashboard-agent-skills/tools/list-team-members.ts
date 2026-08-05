import 'server-only';

import { InvitationStatus } from '@prisma/client';

import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';

import type { DashboardAgentTool } from '../types';

export const listTeamMembersTool: DashboardAgentTool = {
  id: 'list_team_members',
  name: 'list_team_members',
  kind: 'read',
  description:
    'List workspace members and pending invitations with roles and page access.',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  requiredPages: ['settings'],
  execute: async (_input, context) => {
    const [memberships, invitations] = await Promise.all([
      prisma.organizationMembership.findMany({
        where: { organizationId: context.organizationId },
        select: {
          workspaceRole: true,
          allowedPages: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { user: { name: 'asc' } }
      }),
      prisma.invitation.findMany({
        where: {
          organizationId: context.organizationId,
          status: InvitationStatus.PENDING
        },
        select: {
          email: true,
          allowedPages: true,
          lastSentAt: true
        },
        orderBy: { email: 'asc' }
      })
    ]);

    return JSON.stringify({
      memberCount: memberships.length,
      pendingInviteCount: invitations.length,
      members: memberships.map((membership) => ({
        name: membership.user.name,
        email: membership.user.email,
        workspaceRole: membership.workspaceRole,
        allowedPages: membership.allowedPages
      })),
      pendingInvitations: invitations.map((invite) => ({
        email: invite.email,
        allowedPages: invite.allowedPages,
        lastSentAt: invite.lastSentAt
      })),
      membersPath: Routes.Members
    });
  }
};
