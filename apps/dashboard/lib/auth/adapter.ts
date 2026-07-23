import type { Adapter, AdapterAccount } from '@auth/core/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { prisma } from '@/lib/db/prisma';
import {
  decryptSensitiveField,
  encryptSensitiveField
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
    return decryptAccountTokens(account);
  }
}) satisfies Adapter;
