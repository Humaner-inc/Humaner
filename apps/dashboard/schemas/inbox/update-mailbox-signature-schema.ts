import { z } from 'zod';

import { FileUploadAction } from '@/types/file-upload-action';

export const updateMailboxSignatureSchema = z.object({
  connectionId: z.string().uuid(),
  signatureText: z
    .string()
    .max(4000, 'Signature must be 4000 characters or fewer.')
    .optional(),
  iconAction: z.nativeEnum(FileUploadAction).default(FileUploadAction.None),
  icon: z.string().optional().or(z.literal(''))
});

export type UpdateMailboxSignatureSchema = z.infer<
  typeof updateMailboxSignatureSchema
>;
