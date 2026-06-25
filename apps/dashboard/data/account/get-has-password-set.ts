import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';

export async function getHasPasswordSet(): Promise<boolean> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const user = await prisma.user.findFirst({
    where: { id: session.user.id },
    select: { password: true }
  });
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  return !!user.password;
}
