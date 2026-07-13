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
    const [members, invitations] = await Promise.all([
      prisma.user.findMany({
        where: { organizationId: context.organizationId },
        select: {
          name: true,
          email: true,
          workspaceRole: true,
          allowedPages: true
        },
        orderBy: { name: 'asc' }
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
      memberCount: members.length,
      pendingInviteCount: invitations.length,
      members: members.map((member) => ({
        name: member.name,
        email: member.email,
        workspaceRole: member.workspaceRole,
        allowedPages: member.allowedPages
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
