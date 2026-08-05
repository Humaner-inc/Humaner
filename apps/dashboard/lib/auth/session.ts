import { randomUUID } from 'crypto';
import { addSeconds } from 'date-fns';
import { type NextAuthConfig, type Session } from 'next-auth';
import { validate as uuidValidate } from 'uuid';

import { isDefined, type IsDefinedGuard } from '@/lib/validation/is-defined';
import { isString } from '@/lib/validation/is-string';
import type { Maybe } from '@/types/maybe';

/** Signed-in user with identity fields; organization may be absent. */
export function checkAuthenticatedSession(
  session: Maybe<Session>
): session is IsDefinedGuard<
  Session & {
    user: IsDefinedGuard<Session['user']> & {
      id: string;
      email: string;
      name: string;
    };
  }
> {
  return (
    isDefined(session) &&
    isDefined(session.user) &&
    isDefined(session.user.id) &&
    uuidValidate(session.user.id) &&
    isDefined(session.user.email) &&
    isString(session.user.email) &&
    isDefined(session.user.name) &&
    isString(session.user.name)
  );
}

/** Authenticated user with an active workspace selected. */
export function checkSession(
  session: Maybe<Session>
): session is IsDefinedGuard<
  Session & {
    user: IsDefinedGuard<Session['user']> & {
      id: string;
      email: string;
      name: string;
      organizationId: string;
    };
  }
> {
  return (
    checkAuthenticatedSession(session) &&
    isDefined(session.user.organizationId) &&
    uuidValidate(session.user.organizationId)
  );
}

export function generateSessionToken(): string {
  return randomUUID();
}

export function getSessionExpiryFromNow(): Date {
  return addSeconds(Date.now(), session.maxAge);
}

export const session = {
  strategy: 'database',
  maxAge: 60 * 60 * 24 * 30, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
  generateSessionToken
} satisfies NextAuthConfig['session'];
