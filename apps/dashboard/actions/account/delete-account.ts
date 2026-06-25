'use server';

import { authActionClient } from '@/actions/safe-action';
import { deleteUserAccount } from '@/lib/data-retention/delete-user';
import { PreConditionError } from '@/lib/validation/exceptions';
import { deleteAccountSchema } from '@/schemas/account/delete-account-schema';

export const deleteAccount = authActionClient
  .metadata({ actionName: 'deleteAccount' })
  .schema(deleteAccountSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    if (!parsedInput.statement) {
      throw new PreConditionError('Confirmation is required.');
    }

    if (!session.user.email) {
      throw new PreConditionError('Email is missing.');
    }

    await deleteUserAccount({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      email: session.user.email
    });
  });
