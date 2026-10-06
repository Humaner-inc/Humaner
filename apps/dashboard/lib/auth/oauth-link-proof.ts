import 'server-only';

import { randomBytes } from 'crypto';
import { addMinutes } from 'date-fns';

import { symmetricDecrypt, symmetricEncrypt } from '@/lib/auth/encryption';
import { prisma } from '@/lib/db/prisma';

const PREFIX = 'oauth-link:';
const TTL_MINUTES = 10;

export type OAuthLinkPayload = {
  userId: string;
  provider: string;
  providerAccountId: string;
  type: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
};

function proofIdentifier(proofId: string): string {
  return `${PREFIX}${proofId}`;
}

export function isOAuthLinkProofId(proofId: string): boolean {
  return /^[a-f0-9]{48}$/.test(proofId);
}

export async function stashOAuthLinkProof(
  payload: OAuthLinkPayload
): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is required to store an OAuth link proof.');
  }

  const proofId = randomBytes(24).toString('hex');
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: { startsWith: PREFIX },
      expires: { lt: new Date() }
    }
  });
  await prisma.verificationToken.create({
    data: {
      identifier: proofIdentifier(proofId),
      token: symmetricEncrypt(JSON.stringify(payload), secret),
      expires: addMinutes(new Date(), TTL_MINUTES)
    }
  });
  return proofId;
}

export async function readOAuthLinkProof(
  proofId: string
): Promise<OAuthLinkPayload | null> {
  if (!isOAuthLinkProofId(proofId) || !process.env.AUTH_SECRET) {
    return null;
  }

  const row = await prisma.verificationToken.findFirst({
    where: { identifier: proofIdentifier(proofId) }
  });
  if (!row) {
    return null;
  }
  if (row.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: proofIdentifier(proofId) }
    });
    return null;
  }

  try {
    const parsed = JSON.parse(
      symmetricDecrypt(row.token, process.env.AUTH_SECRET)
    ) as OAuthLinkPayload;
    if (!parsed.userId || !parsed.provider || !parsed.providerAccountId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function consumeOAuthLinkProof(proofId: string): Promise<void> {
  if (!isOAuthLinkProofId(proofId)) {
    return;
  }
  await prisma.verificationToken.deleteMany({
    where: { identifier: proofIdentifier(proofId) }
  });
}
