import { createHash } from 'node:crypto';
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser
} from '@auth/core/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';

import {
  authCacheTtlSeconds,
  probeAuthCache,
  storeAuthCache
} from '@/lib/auth/auth-cache';
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

// Only what the session needs. The raw user row has password hashes and MFA
// material, which must never be copied into Redis.
type CachedSession = {
  session: { sessionToken: string; userId: string; expires: string };
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    emailVerified: string | null;
    organizationId: string | null;
  };
};

function sessionCacheKey(sessionToken: string): string {
  return `session:${createHash('sha256').update(sessionToken).digest('hex')}`;
}

function toCached(found: {
  session: AdapterSession;
  user: AdapterUser;
}): CachedSession {
  return {
    session: {
      sessionToken: found.session.sessionToken,
      userId: found.session.userId,
      expires: found.session.expires.toISOString()
    },
    user: {
      id: found.user.id,
      name: found.user.name ?? null,
      email: found.user.email,
      image: found.user.image ?? null,
      emailVerified: found.user.emailVerified?.toISOString() ?? null,
      organizationId: found.user.organizationId ?? null
    }
  };
}

function fromCached(cached: CachedSession): {
  session: AdapterSession;
  user: AdapterUser;
} {
  return {
    session: {
      sessionToken: cached.session.sessionToken,
      userId: cached.session.userId,
      expires: new Date(cached.session.expires)
    },
    user: {
      ...cached.user,
      emailVerified: cached.user.emailVerified
        ? new Date(cached.user.emailVerified)
        : null
    }
  };
}

// this auth.js adapter has no updateAccount, so plaintext rows are rewritten on read
export const adapter = Object.freeze({
  ...base,
  async getSessionAndUser(sessionToken: string) {
    if (authCacheTtlSeconds() === 0) {
      return base.getSessionAndUser!(sessionToken);
    }
    const key = sessionCacheKey(sessionToken);
    const probe = await probeAuthCache<CachedSession>(key);
    if (probe.value && new Date(probe.value.session.expires) > new Date()) {
      return fromCached(probe.value);
    }
    const found = await base.getSessionAndUser!(sessionToken);
    if (found) await storeAuthCache(key, toCached(found), probe.epoch);
    return found;
  },
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
