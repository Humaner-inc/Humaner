'use server';

import { returnValidationErrors } from 'next-safe-action';

import { actionClient } from '@/actions/safe-action';
import {
  grantAuthAccessUnlock,
  isAuthAccessGateEnabled,
  isValidAuthAccessCode
} from '@/lib/auth/access-code';
import { submitAuthAccessCodeSchema } from '@/schemas/auth/submit-auth-access-code-schema';

export const submitAuthAccessCode = actionClient
  .metadata({ actionName: 'submitAuthAccessCode' })
  .schema(submitAuthAccessCodeSchema)
  .action(async ({ parsedInput }) => {
    if (!isAuthAccessGateEnabled()) {
      return { unlocked: true as const };
    }

    if (!isValidAuthAccessCode(parsedInput.code)) {
      returnValidationErrors(submitAuthAccessCodeSchema, {
        code: {
          _errors: ['That code is not valid.']
        }
      });
    }

    await grantAuthAccessUnlock();
    return { unlocked: true as const };
  });
