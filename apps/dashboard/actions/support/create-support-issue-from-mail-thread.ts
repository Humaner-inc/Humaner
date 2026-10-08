'use server';

import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import { PreConditionError } from '@/lib/validation/exceptions';

// Self-Host: Utilities → Support is Cloud-only.
export const createSupportIssueFromMailThreadAction = authActionClient
  .metadata({ actionName: 'createSupportIssueFromMailThread' })
  .schema(z.object({ threadId: z.string().uuid() }))
  .action(
    async (): Promise<{
      id: string;
      ticketNumber: number;
      existing: boolean;
    }> => {
      throw new PreConditionError('Support is Cloud-only.');
    }
  );
