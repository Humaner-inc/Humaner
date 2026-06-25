'use server';

import { cookies } from 'next/headers';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signOut } from '@/lib/auth';
import { AuthCookies } from '@/lib/auth/cookies';
import { prisma } from '@/lib/db/prisma';
import { signOutSessionSchema } from '@/schemas/account/sign-out-session-schema';

export const signOutSession = authActionClient
  .metadata({ actionName: 'signOutSession' })
  .schema(signOutSessionSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const sessionFromDb = await prisma.session.findFirst({
      where: {
        userId: session.user.id,
        id: parsedInput.id
      },
      select: { sessionToken: true }
    });

    if (sessionFromDb) {
      const cookieStore = await cookies();
      const currentSessionToken =
        cookieStore.get(AuthCookies.SessionToken)?.value ?? '';
      if (
        currentSessionToken &&
        sessionFromDb.sessionToken === currentSessionToken
      ) {
        return await signOut({
          redirect: true,
          redirectTo: Routes.Logout
        });
      } else {
        await prisma.session.deleteMany({
          where: {
            userId: session.user.id,
            id: parsedInput.id
          }
        });
      }
    }
  });
