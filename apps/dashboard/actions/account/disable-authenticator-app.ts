'use server';

import { revalidateTag } from 'next/cache';
import { returnValidationErrors } from 'next-safe-action';
import { authenticator } from 'otplib';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { symmetricDecrypt } from '@/lib/auth/encryption';
import { prisma } from '@/lib/db/prisma';
import { PreConditionError } from '@/lib/validation/exceptions';
import { disableAuthenticatorAppSchema } from '@/schemas/account/disable-authenticator-app-schema';

export const disableAuthenticatorApp = authActionClient
  .metadata({ actionName: 'disableAuthenticatorApp' })
  .schema(disableAuthenticatorAppSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    if (!process.env.AUTH_SECRET) {
      throw new PreConditionError(
        'Missing encryption key; cannot proceed disabling authenticator app'
      );
    }

    const authenticatorApp = await prisma.authenticatorApp.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        secret: true
      }
    });
    if (!authenticatorApp) {
      throw new PreConditionError('Authenticator app is not enabled');
    }

    const secret = symmetricDecrypt(
      authenticatorApp.secret,
      process.env.AUTH_SECRET
    );
    if (secret.length !== 32) {
      throw new PreConditionError(
        'Authenticator app secret could not be verified'
      );
    }

    const isValidToken = authenticator.check(parsedInput.totpCode, secret);
    if (!isValidToken) {
      return returnValidationErrors(disableAuthenticatorAppSchema, {
        totpCode: {
          _errors: ['The entered code is not valid.']
        }
      });
    }

    await prisma.authenticatorApp.delete({
      where: { id: authenticatorApp.id }
    });

    revalidateTag(
      Caching.createUserTag(
        UserCacheKey.MultiFactorAuthentication,
        session.user.id
      )
    );
  });
