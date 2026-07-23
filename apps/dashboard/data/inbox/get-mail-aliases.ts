import 'server-only';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export type MailAliasListItem = {
  id: string;
  address: string;
  displayName: string | null;
  enabled: boolean;
  connectionEmail: string;
  provider: string;
  memberCount: number;
};

export async function getMailAliases(): Promise<MailAliasListItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) return [];

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
      connection: {
        select: { email: true, provider: true }
      },
      _count: { select: { members: true } }
    }
  });

  return aliases.map((alias) => ({
    id: alias.id,
    address: alias.address,
    displayName: alias.displayName,
    enabled: alias.enabled,
    connectionEmail: alias.connection.email,
    provider: alias.connection.provider,
    memberCount: alias._count.members
  }));
}
