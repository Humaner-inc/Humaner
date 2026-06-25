import { Role } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { role: true }
  });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user.role === Role.ADMIN;
}

export async function isMember(userId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { role: true }
  });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user.role === Role.MEMBER;
}
