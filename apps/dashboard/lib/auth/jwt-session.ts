import 'server-only';

import type { JWT, JWTEncodeParams } from 'next-auth/jwt';

import { prisma } from '@/lib/db/prisma';

/**
 * Cookie value for Credentials + database sessions must be the opaque DB
 * session token (UUID). A signed JWT poisons auth() and leaves chunked
 * leftovers that break later logins.
 *
 * Critical: never return `''` when a live DB session exists — Auth.js
 * `SessionStore.chunk('')` clears all session cookies, which is what stuck
 * Google/GitHub/email users on `/auth/login?callbackUrl=/onboarding`.
 */
export async function encodeDatabaseSessionToken(
  arg: JWTEncodeParams<JWT>
): Promise<string> {
  const fromToken = arg.token?.sessionId;
  if (typeof fromToken === 'string' && fromToken.length > 0) {
    return fromToken;
  }

  const userId =
    (typeof arg.token?.sub === 'string' && arg.token.sub) ||
    (typeof arg.token?.id === 'string' ? arg.token.id : undefined);

  if (userId) {
    const session = await prisma.session.findFirst({
      where: {
        userId,
        expires: { gt: new Date() }
      },
      orderBy: { expires: 'desc' },
      select: { sessionToken: true }
    });
    if (session?.sessionToken) {
      return session.sessionToken;
    }
  }

  // MFA challenge / no session yet — clear is correct (no live DB session).
  return '';
}
