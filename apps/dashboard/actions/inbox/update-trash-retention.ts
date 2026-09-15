'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { writeTrashRetention } from '@/data/inbox/trash-retention';
import { PreConditionError } from '@/lib/validation/exceptions';

export const updateTrashRetention = pageActionClient('inbox')
  .metadata({ actionName: 'updateTrashRetention' })
  .schema(
    z.object({
      retention: z.enum(['WEEK', 'MONTH', 'THREE_MONTHS'])
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }
    await writeTrashRetention(organizationId, parsedInput.retention);

    revalidatePath(Routes.InboxTrash);
    revalidatePath(Routes.InboxSettings);
    return { retention: parsedInput.retention };
  });
