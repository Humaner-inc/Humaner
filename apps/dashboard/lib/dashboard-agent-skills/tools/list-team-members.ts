import 'server-only';

import { InvitationStatus } from '@prisma/client';

import { Routes } from '@/constants/routes';
import { readCompanionWorkspaceRights } from '@/data/inbox/companion-rights';
import { prisma } from '@/lib/db/prisma';
import { loadTeamProfileRefs } from '@/lib/team/load-team-profile-refs';

import type { DashboardAgentTool } from '../types';

export const listTeamMembersTool: DashboardAgentTool = {
  id: 'list_team_members',
  name: 'list_team_members',
  kind: 'read',
  description:
    'List workspace members, team profiles (skills, load), and pending invitations. Use profiles to assign inbox or integration work.',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  execute: async (_input, context) => {
    const [memberships, invitations, profiles, load, rights] =
      await Promise.all([
        prisma.organizationMembership.findMany({
          where: { organizationId: context.organizationId },
          select: {
            workspaceRole: true,
            allowedPages: true,
            user: {
              select: {
                id: true,
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
        }),
        prisma.teamMemberProfile.findMany({
          where: { organizationId: context.organizationId },
          select: {
            userId: true,
            role: true,
            knowledgeAreas: true,
            maxConcurrent: true
          }
        }),
        loadTeamProfileRefs(context.organizationId),
        readCompanionWorkspaceRights(context.organizationId)
      ]);

    const loadByUser = new Map(
      load.map((profile) => [profile.userId, profile])
    );
    const profileByUser = new Map(
      profiles.map((profile) => [profile.userId, profile])
    );

    return JSON.stringify({
      memberCount: memberships.length,
      pendingInviteCount: invitations.length,
      companionActions: rights.actions,
      integrations: rights.integrations,
      members: memberships.map((membership) => {
        const profile = profileByUser.get(membership.user.id);
        const capacity = loadByUser.get(membership.user.id);
        return {
          id: membership.user.id,
          name: membership.user.name,
          email: membership.user.email,
          workspaceRole: membership.workspaceRole,
          allowedPages: membership.allowedPages,
          profile: profile
            ? {
                role: profile.role,
                knowledgeAreas: profile.knowledgeAreas,
                assigned: capacity?.currentTickets ?? 0,
                maxConcurrent: profile.maxConcurrent
              }
            : null
        };
      }),
      pendingInvitations: invitations.map((invite) => ({
        email: invite.email,
        allowedPages: invite.allowedPages,
        lastSentAt: invite.lastSentAt
      })),
      membersPath: Routes.Members
    });
  }
};
