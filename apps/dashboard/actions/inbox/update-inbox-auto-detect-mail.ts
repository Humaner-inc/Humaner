'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { writeInboxAutoDetectMail } from '@/data/inbox/inbox-auto-detect-mail';
import { requireWorkspaceOwner } from '@/lib/auth/workspace-permissions';
import { PreConditionError } from '@/lib/validation/exceptions';

export const updateInboxAutoDetectMail = pageActionClient('inbox')
  .metadata({ actionName: 'updateInboxAutoDetectMail' })
  .schema(z.object({ enabled: z.boolean() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }
    await requireWorkspaceOwner(session.user.id, organizationId);
    await writeInboxAutoDetectMail(organizationId, parsedInput.enabled);

    revalidatePath(Routes.InboxSettings);
    revalidatePath(Routes.OrganizationWorkspace);
    revalidatePath(Routes.InboxAll);
    return { enabled: parsedInput.enabled };
  });
