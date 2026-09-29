'use server';

import { pageActionClient } from '@/actions/safe-action';
import { resolveMailAliasScope } from '@/lib/inbox/mail-alias-scope';
import { saveMailboxDraft } from '@/lib/inbox/save-mailbox-draft';
import {
  NotFoundError,
  PreConditionError,
  ValidationError
} from '@/lib/validation/exceptions';
import { saveMailDraftSchema } from '@/schemas/inbox/save-mail-draft-schema';

export const saveMailDraft = pageActionClient('inbox')
  .metadata({ actionName: 'saveMailDraft' })
  .schema(saveMailDraftSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new PreConditionError('No active organization');
    }

    const scope = await resolveMailAliasScope({
      userId: session.user.id,
      organizationId
    });
    if (
      scope.type === 'ids' &&
      (scope.aliasIds.length === 0 ||
        !scope.aliasIds.includes(parsedInput.aliasId))
    ) {
      throw new NotFoundError('Alias not found');
    }

    try {
      return await saveMailboxDraft({
        organizationId,
        actorUserId: session.user.id,
        aliasId: parsedInput.aliasId,
        to: parsedInput.to,
        subject: parsedInput.subject,
        body: parsedInput.body,
        ...(parsedInput.bodyHtml ? { bodyHtml: parsedInput.bodyHtml } : {}),
        ...(parsedInput.draftThreadId
          ? { draftThreadId: parsedInput.draftThreadId }
          : {})
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not save this draft.';
      if (message === 'Alias not found') {
        throw new ValidationError('Alias not found');
      }
      throw new ValidationError(message);
    }
  });
