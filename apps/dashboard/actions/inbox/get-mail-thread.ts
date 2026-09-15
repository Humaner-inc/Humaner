'use server';

import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import {
  getMailMessageBodies,
  getMailThread
} from '@/data/inbox/get-mail-threads';
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

export const fetchMailMessageBodies = authActionClient
  .metadata({ actionName: 'fetchMailMessageBodies' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      messageIds: z.array(z.string().uuid()).min(1).max(20)
    })
  )
  .action(async ({ parsedInput }) => {
    return getMailMessageBodies(parsedInput.threadId, parsedInput.messageIds);
  });
