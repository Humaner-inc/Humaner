import type { Adapter, AdapterAccount } from '@auth/core/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { prisma } from '@/lib/db/prisma';
import {
  decryptSensitiveField,
  encryptSensitiveField,
  sensitiveFieldNeedsRewrite
} from '@/lib/security/sensitive-fields';

const base = PrismaAdapter(prisma);

function encryptAccountTokens(account: AdapterAccount): AdapterAccount {
  return {
    ...account,
    access_token: encryptSensitiveField(account.access_token) ?? undefined,
    refresh_token: encryptSensitiveField(account.refresh_token) ?? undefined,
    id_token: encryptSensitiveField(account.id_token) ?? undefined
  };
}

function decryptAccountTokens(
  account: AdapterAccount | null
): AdapterAccount | null {
  if (!account) {
    return null;
  }
  return {
    ...account,
    access_token: decryptSensitiveField(account.access_token) ?? undefined,
    refresh_token: decryptSensitiveField(account.refresh_token) ?? undefined,
    id_token: decryptSensitiveField(account.id_token) ?? undefined
  };
}

// Prisma adapter with AES-GCM encryption for OAuth tokens at rest.

async function rewriteAccountTokens(
  providerAccountId: string,
  provider: string,
  account: AdapterAccount
): Promise<void> {
  await prisma.account.update({
    where: {
      provider_providerAccountId: { provider, providerAccountId }
    },
    data: {
      access_token: encryptSensitiveField(account.access_token),
      refresh_token: encryptSensitiveField(account.refresh_token),
      id_token: encryptSensitiveField(account.id_token)
    }
  });
}

// this auth.js adapter has no updateAccount, so plaintext rows are rewritten on read
export const adapter = Object.freeze({
  ...base,
  async linkAccount(account: AdapterAccount): Promise<void> {
    await base.linkAccount!(encryptAccountTokens(account));
  },
  async getAccount(
    providerAccountId: string,
    provider: string
  ): Promise<AdapterAccount | null> {
    const account = await base.getAccount!(providerAccountId, provider);
    const decrypted = decryptAccountTokens(account);
    if (
      account &&
      decrypted &&
      (sensitiveFieldNeedsRewrite(account.access_token) ||
        sensitiveFieldNeedsRewrite(account.refresh_token) ||
        sensitiveFieldNeedsRewrite(account.id_token))
    ) {
      await rewriteAccountTokens(providerAccountId, provider, decrypted);
    }
    return decrypted;
  }
}) satisfies Adapter;
