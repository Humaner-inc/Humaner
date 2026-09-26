import 'server-only';

import { dedupedAuth } from '@/lib/auth';
import { userCanAccessDashboardPage } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getMailProviderById } from '@/lib/inbox/mail-providers';

export type MailAliasListItem = {
  id: string;
  address: string;
  displayName: string | null;
  enabled: boolean;
  companionPolicy: 'DRAFT' | 'ASSIGN' | 'SEND';
  connectionEmail: string;
  provider: string;
  providerName: string;
  providerPresetId: string | null;
  logoDomain: string;
  memberCount: number;
};

export async function getMailAliases(): Promise<MailAliasListItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) return [];

  if (!(await userCanAccessDashboardPage(session.user.id, 'inbox'))) {
    return [];
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) return [];

  const aliases = await prisma.mailAlias.findMany({
    where: { organizationId },
    orderBy: { address: 'asc' },
    select: {
      id: true,
      address: true,
      displayName: true,
      enabled: true,
      companionPolicy: true,
      connection: {
        select: {
          email: true,
          provider: true,
          providerPresetId: true
        }
      },
      _count: { select: { members: true } }
    }
  });

  return aliases.map((alias) => {
    const preset = alias.connection.providerPresetId
      ? getMailProviderById(alias.connection.providerPresetId)
      : undefined;

    return {
      id: alias.id,
      address: alias.address,
      displayName: alias.displayName,
      enabled: alias.enabled,
      companionPolicy: alias.companionPolicy,
      connectionEmail: alias.connection.email,
      provider: alias.connection.provider,
      providerName: preset?.name ?? alias.connection.provider,
      providerPresetId: alias.connection.providerPresetId,
      logoDomain: preset?.logoDomain ?? 'humaner.io',
      memberCount: alias._count.members
    };
  });
}
