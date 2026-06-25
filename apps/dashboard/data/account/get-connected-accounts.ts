import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { providers } from '@/lib/auth/providers';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type { ConnectedAccountDto } from '@/types/dtos/connected-account-dto';

export async function getConnectedAccounts(): Promise<ConnectedAccountDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const linked = await prisma.account.findMany({
    where: {
      OR: [{ type: 'oauth' }, { type: 'oidc' }],
      user: { id: session.user.id }
    },
    select: { provider: true }
  });
  const linkedIds = linked.map((a) => a.provider);

  const connectedAccounts: ConnectedAccountDto[] = providers
    .filter((p) => p.type === 'oauth' || p.type === 'oidc')
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      linked: linkedIds.includes(p.id)
    }));

  return connectedAccounts;
}
