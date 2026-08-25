import 'server-only';

import { createHash, randomBytes } from 'crypto';
import { isBefore } from 'date-fns';

import {
  API_KEY_LEGACY_LENGTH,
  API_KEY_LEGACY_PREFIX,
  API_KEY_LENGTH,
  API_KEY_PREFIX,
  API_KEY_RANDOM_SIZE
} from '@/lib/auth/api-key-constants';
import { prisma } from '@/lib/db/prisma';
import { isString } from '@/lib/validation/is-string';

export {
  API_KEY_LEGACY_LENGTH,
  API_KEY_LEGACY_PREFIX,
  API_KEY_LENGTH,
  API_KEY_PREFIX,
  API_KEY_RANDOM_SIZE,
  API_KEY_SNIPPET_PLACEHOLDER
} from '@/lib/auth/api-key-constants';

export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${randomBytes(API_KEY_RANDOM_SIZE).toString('hex')}`;
}

export function isApiKeyFormat(token: string): boolean {
  if (!isString(token)) {
    return false;
  }
  if (token.startsWith(API_KEY_PREFIX)) {
    return token.length === API_KEY_LENGTH;
  }
  if (token.startsWith(API_KEY_LEGACY_PREFIX)) {
    return token.length === API_KEY_LEGACY_LENGTH;
  }
  return false;
}

export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

type ErrorResult = {
  success: false;
  errorMessage: string;
};

type SuccessResult = {
  success: true;
  id: string;
  organizationId: string;
  scopes: string[];
};

export async function verifyApiKey(token: string) {
  if (!token) {
    return {
      success: false,
      errorMessage: 'Missing API key'
    } as ErrorResult;
  }
  if (!isApiKeyFormat(token)) {
    return {
      success: false,
      errorMessage: 'Malformed API key'
    } as ErrorResult;
  }
  const apiKey = await prisma.apiKey.findFirst({
    where: { hashedKey: hashApiKey(token) },
    select: {
      id: true,
      expiresAt: true,
      organizationId: true,
      scopes: true
    }
  });
  if (!apiKey) {
    return {
      success: false,
      errorMessage: 'API key not found or expired'
    } as ErrorResult;
  }
  const now = new Date();
  if (!!apiKey.expiresAt && isBefore(apiKey.expiresAt, now)) {
    return {
      success: false,
      errorMessage: 'API key not found or expired'
    } as ErrorResult;
  }
  void prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: now },
      select: { id: true }
    })
    .catch(() => {});
  return {
    success: true,
    id: apiKey.id,
    organizationId: apiKey.organizationId,
    scopes: apiKey.scopes
  } as SuccessResult;
}
