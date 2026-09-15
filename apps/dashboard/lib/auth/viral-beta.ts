import 'server-only';

import { cookies } from 'next/headers';
import { getPlanCapabilities } from '@humaner/shared/plans';
import { getDefaultIncludedMessagesForTier } from '@humaner/shared/pricing-volume';
import { WorkspaceRole } from '@prisma/client';

import { resolveAuthAccessCode } from '@/lib/auth/access-code-constants';
import { AuthCookies } from '@/lib/auth/cookies';
import {
  generateViralBetaAccessCode,
  isViralBetaActive,
  isViralBetaCodeFormat,
  VIRAL_BETA_INBOX_FREE_UNTIL,
  VIRAL_BETA_SHARE_CODE_COUNT
} from '@/lib/auth/viral-beta-constants';
import { syncAccountTierWithin } from '@/lib/billing/billing';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';

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
    const updated = await prisma.viralBetaAccessCode.updateMany({
      where: { code, redeemedAt: null },
      data: { redeemedAt: new Date() }
    });
    return updated.count === 1;
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

  await prisma.viralBetaAccessCode.updateMany({
    where: { code, redeemedAt: { not: null }, redeemedByOwnerId: null },
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
      workspaceRole: true,
      viralBetaExpiresAt: true
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

  if (!owner.viralBetaExpiresAt) {
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

export async function expireViralBetaIfNeeded(
  ownerId: string,
  now: Date = new Date()
): Promise<boolean> {
  if (isOssDeployment()) {
    return false;
  }

  const owner = await prisma.user.findFirst({
    where: { id: ownerId },
    select: {
      id: true,
      tier: true,
      billingModel: true,
      viralBetaExpiresAt: true,
      frontierBetaEnabled: true,
      creditBalanceCents: true,
      starterCreditGrantedAt: true,
      polarCustomerId: true
    }
  });
  if (!owner) {
    throw new NotFoundError('Account not found');
  }
  if (!owner.viralBetaExpiresAt) {
    return false;
  }
  if (isViralBetaActive(owner.viralBetaExpiresAt, now)) {
    return false;
  }
  if (owner.billingModel === 'subscription' || owner.tier !== 'classic') {
    return false;
  }

  const includedMessages = getDefaultIncludedMessagesForTier('free');
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: owner.id },
      data: {
        tier: 'free',
        includedMessages
      }
    });
    await syncAccountTierWithin(tx, owner.id, {
      tier: 'free',
      messages: includedMessages,
      frontierBetaEnabled: owner.frontierBetaEnabled,
      billingModel: owner.billingModel,
      creditBalanceCents: owner.creditBalanceCents,
      starterCreditGrantedAt: owner.starterCreditGrantedAt,
      polarCustomerId: owner.polarCustomerId,
      capabilities: getPlanCapabilities('free')
    });
  });

  return true;
}

export async function expireDueViralBetaOwners(
  now: Date = new Date()
): Promise<number> {
  if (isOssDeployment()) {
    return 0;
  }

  const owners = await prisma.user.findMany({
    where: {
      viralBetaExpiresAt: { lte: now },
      tier: 'classic',
      billingModel: 'credits'
    },
    select: { id: true },
    take: 200
  });

  let expired = 0;
  for (const owner of owners) {
    if (await expireViralBetaIfNeeded(owner.id, now)) {
      expired += 1;
    }
  }
  return expired;
}

export function viralBetaInboxExpiresAt(): Date {
  return VIRAL_BETA_INBOX_FREE_UNTIL;
}
