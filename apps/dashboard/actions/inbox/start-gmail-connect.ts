'use server';

import { z } from 'zod';

import { ownerActionClient } from '@/actions/safe-action';
import { PreConditionError } from '@/lib/validation/exceptions';

const startGmailConnectSchema = z.object({
  providerId: z.enum(['gmail', 'google-workspace']).optional(),
  returnTo: z.enum(['onboarding', 'providers']).optional(),
  reconnect: z.boolean().optional()
});

/** Public projection. Gmail OAuth stays in the private monorepo. */
export const startGmailConnect = ownerActionClient
  .metadata({ actionName: 'startGmailConnect' })
  .schema(startGmailConnectSchema)
  .action(
    async (): Promise<
      | { url: string; needsMailbox?: undefined; canApplyToBill?: undefined }
      | { needsMailbox: true; canApplyToBill: boolean; url?: undefined }
    > => {
      throw new PreConditionError(
        'Google mail OAuth is not available on Self-Host. Connect IMAP instead.'
      );
    }
  );
