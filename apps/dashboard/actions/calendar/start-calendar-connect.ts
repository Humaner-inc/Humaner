'use server';

import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { PreConditionError } from '@/lib/validation/exceptions';

const startCalendarConnectSchema = z.object({
  provider: z.enum(['GOOGLE', 'CALENDLY', 'OUTLOOK'])
});

/** Public projection. Google, Outlook, and Calendly OAuth stay private. */
export const startCalendarConnect = pageActionClient('calendar')
  .metadata({ actionName: 'startCalendarConnect' })
  .schema(startCalendarConnectSchema)
  .action(async (): Promise<{ url: string }> => {
    throw new PreConditionError(
      'External calendar providers are not available on Self-Host.'
    );
  });
