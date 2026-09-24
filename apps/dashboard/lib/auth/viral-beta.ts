import 'server-only';

import { cookies } from 'next/headers';
import { WorkspaceRole } from '@prisma/client';

import { resolveAuthAccessCode } from '@/lib/auth/access-code-constants';
import { AuthCookies } from '@/lib/auth/cookies';
import {
  generateViralBetaAccessCode,
  isViralBetaCodeFormat,
  VIRAL_BETA_INBOX_FREE_UNTIL,
  VIRAL_BETA_SHARE_CODE_COUNT
} from '@/lib/auth/viral-beta-constants';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { PreConditionError } from '@/lib/validation/exceptions';

export { generateViralBetaAccessCode } from '@/lib/auth/viral-beta-constants';

function isGenesisCode(code: string, genesis: string): boolean {
  return code === genesis;
}

export async function consumeUnusedViralBetaAccessCode(
  raw: string,
  genesis: string
): Promise<boolean> {
  const code = raw.trim();
  if (!isViralBetaCodeFormat(code) || isGenesisCode(code, genesis)) {
    return false;
  }

  try {
    const existing = await prisma.viralBetaAccessCode.findUnique({
      where: { code },
      select: { id: true, redeemedAt: true }
    });
    if (!existing || existing.redeemedAt) {
      return false;
    }
    await prisma.viralBetaAccessCode.update({
      where: { id: existing.id },
      data: { redeemedAt: new Date() }
    });
    return true;
  } catch {
    return false;
  }
}

export async function rememberSubmittedAccessCode(code: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AuthCookies.AuthAccessCode, code, {
    httpOnly: true,
    secure: AuthCookies.isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    ...(AuthCookies.domain ? { domain: AuthCookies.domain } : {})
  });
}

export async function attachViralBetaRedemption(
  ownerId: string
): Promise<void> {
  if (isOssDeployment()) {
    return;
  }

  const cookieStore = await cookies();
  const code = cookieStore.get(AuthCookies.AuthAccessCode)?.value?.trim();
  if (!code || !isViralBetaCodeFormat(code)) {
    return;
  }

  const existing = await prisma.viralBetaAccessCode.findUnique({
    where: { code },
    select: { id: true, redeemedAt: true, redeemedByOwnerId: true }
  });
  if (!existing || !existing.redeemedAt || existing.redeemedByOwnerId) {
    return;
  }
  await prisma.viralBetaAccessCode.update({
    where: { id: existing.id },
    data: { redeemedByOwnerId: ownerId }
  });
}

export async function issueViralBetaShareCodesForOwner(
  ownerId: string
): Promise<string[]> {
  if (isOssDeployment()) {
    return [];
  }

  const owner = await prisma.user.findFirst({
    where: { id: ownerId },
    select: {
      id: true,
      workspaceRole: true
    }
  });
  if (!owner || owner.workspaceRole !== WorkspaceRole.OWNER) {
    throw new PreConditionError(
      'Only workspace owners can share access codes.'
    );
  }

  const existing = await prisma.viralBetaAccessCode.findMany({
    where: { issuedByOwnerId: ownerId },
    select: { code: true },
    orderBy: { createdAt: 'asc' },
    take: VIRAL_BETA_SHARE_CODE_COUNT
  });
  if (existing.length >= VIRAL_BETA_SHARE_CODE_COUNT) {
    return existing.map((row) => row.code);
  }

  const needed = VIRAL_BETA_SHARE_CODE_COUNT - existing.length;
  const genesis = resolveAuthAccessCode();
  const created: string[] = [];

  for (let i = 0; i < needed; i += 1) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = generateViralBetaAccessCode();
      if (code === genesis) {
        continue;
      }
      try {
        await prisma.viralBetaAccessCode.create({
          data: { issuedByOwnerId: ownerId, code }
        });
        created.push(code);
        break;
      } catch (error) {
        const prismaCode =
          typeof error === 'object' && error && 'code' in error
            ? String((error as { code?: string }).code)
            : '';
        if (prismaCode !== 'P2002') {
          throw error;
        }
      }
    }
  }

  return [...existing.map((row) => row.code), ...created];
}

export function viralBetaInboxExpiresAt(): Date {
  return VIRAL_BETA_INBOX_FREE_UNTIL;
}
