'use server';

import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import { getMailThread } from '@/data/inbox/get-mail-threads';
import { NotFoundError } from '@/lib/validation/exceptions';

export const fetchMailThread = authActionClient
  .metadata({ actionName: 'fetchMailThread' })
  .schema(
    z.object({
      threadId: z.string().uuid()
    })
  )
  .action(async ({ parsedInput }) => {
    const thread = await getMailThread(parsedInput.threadId);
    if (!thread) {
      throw new NotFoundError('Thread not found');
    }
    return thread;
  });
