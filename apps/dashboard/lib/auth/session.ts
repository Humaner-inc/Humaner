import { randomUUID } from 'crypto';
import { addSeconds } from 'date-fns';
import { type NextAuthConfig, type Session } from 'next-auth';
import { validate as uuidValidate } from 'uuid';

import { isDefined, type IsDefinedGuard } from '@/lib/validation/is-defined';
import { isString } from '@/lib/validation/is-string';
import type { Maybe } from '@/types/maybe';

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
    // Session
    isDefined(session) &&
    // Session.User
    isDefined(session.user) &&
    // Session.User.Id
    isDefined(session.user.id) &&
    uuidValidate(session.user.id) &&
    // Session.User.Email
    isDefined(session.user.email) &&
    isString(session.user.email) &&
    // Session.User.Name
    isDefined(session.user.name) &&
    isString(session.user.name) &&
    // Session.User.OrganizationId
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
