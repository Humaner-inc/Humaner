'use server';

import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import { prisma } from '@/lib/db/prisma';

export const dismissInboxConnectPrompt = authActionClient
  .metadata({ actionName: 'dismissInboxConnectPrompt' })
  .schema(z.object({}))
  .action(async ({ ctx: { session } }) => {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { inboxConnectPromptPending: false }
    });
  });
