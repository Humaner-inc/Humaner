'use server';

import crypto from 'crypto';
import { revalidateTag } from 'next/cache';
import { returnValidationErrors } from 'next-safe-action';
import { authenticator } from 'otplib';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { symmetricEncrypt } from '@/lib/auth/encryption';
import { prisma } from '@/lib/db/prisma';
import { PreConditionError } from '@/lib/validation/exceptions';
import { enableAuthenticatorAppSchema } from '@/schemas/account/enable-authenticator-app-schema';

export const enableAuthenticatorApp = authActionClient
  .metadata({ actionName: 'enableAuthenticatorApp' })
  .schema(enableAuthenticatorAppSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const isValidToken = authenticator.check(
      parsedInput.totpCode,
      parsedInput.secret
    );
    if (isValidToken) {
      const count = await prisma.authenticatorApp.count({
        where: { userId: session.user.id }
      });
      if (count > 0) {
        throw new PreConditionError('Authenticator app is already enabled');
      }

      if (!process.env.AUTH_SECRET) {
        throw new PreConditionError(
          'Missing encryption key; cannot proceed enabling authenticator app'
        );
      }

      const recoveryCodes = Array.from(Array(10), () =>
        crypto.randomBytes(5).toString('hex')
      );

      await prisma.authenticatorApp.create({
        data: {
          userId: session.user.id,
          accountName: parsedInput.accountName,
          issuer: parsedInput.issuer,
          secret: symmetricEncrypt(parsedInput.secret, process.env.AUTH_SECRET),
          recoveryCodes: symmetricEncrypt(
            JSON.stringify(recoveryCodes),
            process.env.AUTH_SECRET
          )
        },
        select: {
          id: true // SELECT NONE
        }
      });

      revalidateTag(
        Caching.createUserTag(
          UserCacheKey.MultiFactorAuthentication,
          session.user.id
        )
      );

      return { recoveryCodes };
    } else {
      return returnValidationErrors(enableAuthenticatorAppSchema, {
        totpCode: {
          _errors: ['The entered code is not valid.']
        }
      });
    }
  });
